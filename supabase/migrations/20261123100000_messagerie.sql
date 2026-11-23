-- Messagerie entre le chercheur et l'habitant, une conversation par réservation.
-- Possible seulement une fois la réservation payée, entre ses deux participants.
-- Pas de temps réel : la page se recharge régulièrement. Aucun DROP dans ce fichier.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists messages_booking_idx on public.messages (booking_id, created_at);

alter table public.messages enable row level security;

-- Lecture : les deux participants de la réservation, et l'admin (litiges).
create policy "participants lisent les messages" on public.messages
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.bookings b
      join public.residents r on r.id = b.resident_id
      where b.id = booking_id and (b.seeker_id = auth.uid() or r.profile_id = auth.uid())
    )
  );
-- Aucune écriture directe : on passe par send_message().
revoke insert, update, delete on public.messages from anon, authenticated;

-- Dernier e-mail « nouveau message » envoyé pour cette réservation (anti-spam).
alter table public.bookings add column if not exists email_message_at timestamptz;

-- Envoyer un message.
create or replace function public.send_message(p_booking_id uuid, p_body text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if coalesce(length(trim(p_body)), 0) = 0 then raise exception 'Message vide'; end if;
  if length(trim(p_body)) > 2000 then raise exception 'Message trop long'; end if;
  if not exists (
    select 1 from public.bookings b
    join public.residents r on r.id = b.resident_id
    where b.id = p_booking_id
      and b.paid_at is not null
      and b.status in ('en_attente', 'confirmee', 'terminee', 'litige')
      and (b.seeker_id = auth.uid() or r.profile_id = auth.uid())
  ) then
    raise exception 'Conversation indisponible';
  end if;
  insert into public.messages (booking_id, author_id, body)
  values (p_booking_id, auth.uid(), trim(p_body))
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.send_message(uuid, text) from public, anon;
grant execute on function public.send_message(uuid, text) to authenticated;

-- La conversation d'une réservation, avec l'en-tête (qui est l'autre, quelle offre).
create or replace function public.booking_conversation(p_booking_id uuid)
returns table (
  message_id uuid, mine boolean, author_first_name text, body text, created_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select m.id, m.author_id = auth.uid(), p.first_name, m.body, m.created_at
  from public.messages m
  join public.profiles p on p.id = m.author_id
  join public.bookings b on b.id = m.booking_id
  join public.residents r on r.id = b.resident_id
  where m.booking_id = p_booking_id
    and (b.seeker_id = auth.uid() or r.profile_id = auth.uid())
  order by m.created_at;
$$;

revoke execute on function public.booking_conversation(uuid) from public, anon;
grant execute on function public.booking_conversation(uuid) to authenticated;

-- Serveur seulement : faut-il prévenir l'autre par e-mail ? Vrai au plus une fois toutes les 30 min.
create or replace function public.claim_message_email(p_booking_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  update public.bookings set email_message_at = now()
  where id = p_booking_id
    and (email_message_at is null or email_message_at < now() - interval '30 minutes');
  return found;
end;
$$;

revoke execute on function public.claim_message_email(uuid) from public, anon, authenticated;
grant execute on function public.claim_message_email(uuid) to service_role;
