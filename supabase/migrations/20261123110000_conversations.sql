-- Conversations entre un chercheur et un habitant, possibles AVANT toute réservation (comme BlaBlaCar).
-- Une seule conversation par couple chercheur + habitant : la même sert avant et après la réservation.
-- Les numéros de téléphone, e-mails et liens sont masqués automatiquement dans les messages,
-- pour que tout passe par le site (le contact de l'habitant est donné après une réservation acceptée).
--
-- Remplace la table `messages` de la migration précédente (vide en production) : elle n'est plus
-- utilisée et ses fonctions ne sont plus accessibles. Aucun DROP dans ce fichier.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  resident_id uuid not null references public.residents (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  email_message_at timestamptz,          -- dernier e-mail « nouveau message » (anti-spam)
  unique (seeker_id, resident_id)
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists conversation_messages_idx on public.conversation_messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

-- Lecture : les deux participants, et l'admin (litiges, signalements). Aucune écriture directe.
create policy "participants lisent la conversation" on public.conversations
  for select using (
    public.is_admin()
    or seeker_id = auth.uid()
    or exists (select 1 from public.residents r where r.id = resident_id and r.profile_id = auth.uid())
  );
create policy "participants lisent les messages de la conversation" on public.conversation_messages
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.conversations c
      join public.residents r on r.id = c.resident_id
      where c.id = conversation_id and (c.seeker_id = auth.uid() or r.profile_id = auth.uid())
    )
  );
revoke insert, update, delete on public.conversations from anon, authenticated;
revoke insert, update, delete on public.conversation_messages from anon, authenticated;

-- L'ancienne messagerie par réservation n'est plus utilisée.
revoke execute on function public.send_message(uuid, text) from authenticated;
revoke execute on function public.booking_conversation(uuid) from authenticated;

-- Masque e-mails, liens et numéros de téléphone (8 chiffres ou plus, séparés ou non par espaces, points, tirets ; pas les dates en « / »).
create or replace function public.mask_contacts(p_text text)
returns text
language sql immutable set search_path = ''
as $$
  select regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          p_text,
          '[A-Za-z0-9._%+-]+[[:space:]]*(@|\(at\)|\[at\])[[:space:]]*[A-Za-z0-9-]+([.][A-Za-z0-9-]+)*[.][A-Za-z]{2,}',
          '[masqué]', 'gi'),
        '(https?://|www[.])[^[:space:]]+', '[masqué]', 'gi'),
      '[A-Za-z0-9-]+[.](com|fr|net|org|io|be|ch|eu|me|co|info|biz|app|link|ly)([/?#][^[:space:]]*)?([^A-Za-z0-9]|$)',
      '[masqué]\3', 'gi'),
    '[+]?[0-9]([[:space:].()-]*[0-9]){7,}', '[masqué]', 'g');
$$;

-- Ouvre (ou retrouve) la conversation avec un habitant vérifié. Pour le chercheur.
create or replace function public.start_conversation(p_resident_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if not exists (
    select 1 from public.residents r
    where r.id = p_resident_id and r.verification_status = 'verifie' and r.profile_id <> auth.uid()
  ) then
    raise exception 'Habitant introuvable';
  end if;
  insert into public.conversations (seeker_id, resident_id)
  values (auth.uid(), p_resident_id)
  on conflict (seeker_id, resident_id) do nothing;
  select id into v_id from public.conversations where seeker_id = auth.uid() and resident_id = p_resident_id;
  return v_id;
end;
$$;

-- La conversation liée à une réservation payée (bouton « Messages » de Mes réservations).
create or replace function public.conversation_for_booking(p_booking_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_seeker uuid;
  v_resident uuid;
  v_id uuid;
begin
  select b.seeker_id, b.resident_id into v_seeker, v_resident
  from public.bookings b
  join public.residents r on r.id = b.resident_id
  where b.id = p_booking_id and b.paid_at is not null
    and (b.seeker_id = auth.uid() or r.profile_id = auth.uid());
  if v_seeker is null then return null; end if;
  insert into public.conversations (seeker_id, resident_id)
  values (v_seeker, v_resident)
  on conflict (seeker_id, resident_id) do nothing;
  select id into v_id from public.conversations where seeker_id = v_seeker and resident_id = v_resident;
  return v_id;
end;
$$;

-- Envoyer un message (masqué automatiquement). Renvoie le texte tel qu'il a été enregistré.
create or replace function public.send_conversation_message(p_conversation_id uuid, p_body text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_body text;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if coalesce(length(trim(p_body)), 0) = 0 then raise exception 'Message vide'; end if;
  if length(trim(p_body)) > 2000 then raise exception 'Message trop long'; end if;
  if not exists (
    select 1 from public.conversations c
    join public.residents r on r.id = c.resident_id
    where c.id = p_conversation_id and (c.seeker_id = auth.uid() or r.profile_id = auth.uid())
  ) then
    raise exception 'Conversation indisponible';
  end if;
  v_body := public.mask_contacts(trim(p_body));
  insert into public.conversation_messages (conversation_id, author_id, body)
  values (p_conversation_id, auth.uid(), v_body);
  update public.conversations set last_message_at = now() where id = p_conversation_id;
  return v_body;
end;
$$;

-- Mes conversations (boîte de réception), la plus récente d'abord.
create or replace function public.my_conversations()
returns table (
  conversation_id uuid, my_role text, other_first_name text, resident_id uuid,
  last_body text, last_mine boolean, last_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select c.id,
         case when c.seeker_id = auth.uid() then 'chercheur' else 'habitant' end,
         case when c.seeker_id = auth.uid() then rp.first_name else sp.first_name end,
         c.resident_id, m.body, m.author_id = auth.uid(), coalesce(m.created_at, c.created_at)
  from public.conversations c
  join public.residents r on r.id = c.resident_id
  join public.profiles rp on rp.id = r.profile_id
  join public.profiles sp on sp.id = c.seeker_id
  left join lateral (
    select cm.body, cm.author_id, cm.created_at from public.conversation_messages cm
    where cm.conversation_id = c.id order by cm.created_at desc limit 1
  ) m on true
  where (c.seeker_id = auth.uid() or r.profile_id = auth.uid())
    -- Une conversation ouverte mais encore vide n'apparaît que chez le chercheur qui l'a ouverte.
    and (m.body is not null or c.seeker_id = auth.uid())
  order by coalesce(m.created_at, c.created_at) desc;
$$;

-- Les messages d'une conversation, pour ses participants.
create or replace function public.conversation_messages_for(p_conversation_id uuid)
returns table (message_id uuid, mine boolean, author_first_name text, body text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select m.id, m.author_id = auth.uid(), p.first_name, m.body, m.created_at
  from public.conversation_messages m
  join public.profiles p on p.id = m.author_id
  join public.conversations c on c.id = m.conversation_id
  join public.residents r on r.id = c.resident_id
  where m.conversation_id = p_conversation_id
    and (c.seeker_id = auth.uid() or r.profile_id = auth.uid())
  order by m.created_at;
$$;

-- Serveur seulement : faut-il prévenir l'autre par e-mail ? Vrai au plus une fois toutes les 30 min.
create or replace function public.claim_conversation_email(p_conversation_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  update public.conversations set email_message_at = now()
  where id = p_conversation_id
    and (email_message_at is null or email_message_at < now() - interval '30 minutes');
  return found;
end;
$$;

-- Serveur seulement : qui sont les deux participants (pour l'e-mail).
create or replace function public.conversation_email_info(p_conversation_id uuid)
returns table (seeker_id uuid, seeker_first_name text, resident_profile_id uuid, resident_first_name text)
language sql stable security definer set search_path = ''
as $$
  select c.seeker_id, sp.first_name, r.profile_id, rp.first_name
  from public.conversations c
  join public.residents r on r.id = c.resident_id
  join public.profiles rp on rp.id = r.profile_id
  join public.profiles sp on sp.id = c.seeker_id
  where c.id = p_conversation_id;
$$;

revoke execute on function public.mask_contacts(text) from public, anon;
grant execute on function public.mask_contacts(text) to authenticated, service_role;

revoke execute on function public.start_conversation(uuid) from public, anon;
revoke execute on function public.conversation_for_booking(uuid) from public, anon;
revoke execute on function public.send_conversation_message(uuid, text) from public, anon;
revoke execute on function public.my_conversations() from public, anon;
revoke execute on function public.conversation_messages_for(uuid) from public, anon;
grant execute on function public.start_conversation(uuid) to authenticated;
grant execute on function public.conversation_for_booking(uuid) to authenticated;
grant execute on function public.send_conversation_message(uuid, text) to authenticated;
grant execute on function public.my_conversations() to authenticated;
grant execute on function public.conversation_messages_for(uuid) to authenticated;

revoke execute on function public.claim_conversation_email(uuid) from public, anon, authenticated;
revoke execute on function public.conversation_email_info(uuid) from public, anon, authenticated;
grant execute on function public.claim_conversation_email(uuid) to service_role;
grant execute on function public.conversation_email_info(uuid) to service_role;
