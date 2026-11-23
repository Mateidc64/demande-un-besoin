-- Étape 8 (réservation) : créneaux libres, création d'une demande, réponse de l'habitant, annulation.
-- Les réservations ne sont jamais écrites directement depuis le navigateur : tout passe par ces
-- fonctions, qui vérifient chaque règle. Les heures sont celles de Paris (Europe/Paris).
-- Pas de DROP : le fichier peut être exécuté plusieurs fois.

alter table public.bookings add column if not exists message text;      -- questions du chercheur
alter table public.bookings add column if not exists responded_at timestamptz;

-- Créneaux libres d'une offre sur les prochains jours (tranches de 30 min, au moins 2 h à l'avance).
create or replace function public.available_slots(p_offer_id uuid, p_days integer default 14)
returns table (starts_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with o as (
    select o.id, o.resident_id, o.duration_minutes
    from public.offers o
    where o.id = p_offer_id and o.active and public.resident_is_verified(o.resident_id)
      and o.type <> 'question_ecrite'
  ),
  days as (
    select d::date as day
    from generate_series(
      (now() at time zone 'Europe/Paris')::date,
      (now() at time zone 'Europe/Paris')::date + least(greatest(p_days, 1), 30),
      interval '1 day'
    ) d
  ),
  candidates as (
    select (t at time zone 'Europe/Paris') as starts_at, o.resident_id, o.duration_minutes
    from o
    join public.availabilities a on a.resident_id = o.resident_id
    join days on extract(isodow from days.day) = a.weekday
    cross join lateral generate_series(
      days.day + a.start_time,
      days.day + a.end_time - make_interval(mins => o.duration_minutes),
      interval '30 minutes'
    ) t
  )
  select c.starts_at
  from candidates c
  where c.starts_at > now() + interval '2 hours'
    and not exists (
      select 1 from public.bookings b
      join public.offers bo on bo.id = b.offer_id
      where b.resident_id = c.resident_id
        and b.status in ('en_attente', 'confirmee')
        and bo.type <> 'question_ecrite'
        and tstzrange(b.starts_at, b.starts_at + make_interval(mins => bo.duration_minutes))
            && tstzrange(c.starts_at, c.starts_at + make_interval(mins => c.duration_minutes))
    )
  order by c.starts_at;
$$;

grant execute on function public.available_slots(uuid, integer) to anon, authenticated;

-- Le chercheur envoie une demande de réservation. Renvoie l'identifiant de la réservation.
create or replace function public.create_booking(
  p_offer_id uuid,
  p_starts_at timestamptz,
  p_target_address text,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer record;
  v_resident_profile uuid;
  v_starts timestamptz;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;

  select o.* into v_offer from public.offers o
  where o.id = p_offer_id and o.active and public.resident_is_verified(o.resident_id);
  if not found then raise exception 'Offre indisponible'; end if;

  select r.profile_id into v_resident_profile from public.residents r where r.id = v_offer.resident_id;
  if v_resident_profile = auth.uid() then raise exception 'Impossible de réserver sa propre offre'; end if;

  if coalesce(length(trim(p_target_address)), 0) < 5 then raise exception 'Adresse du bien manquante'; end if;

  if v_offer.type = 'question_ecrite' then
    if coalesce(length(trim(p_message)), 0) < 10 then raise exception 'Questions manquantes'; end if;
    v_starts := now();
  else
    if not exists (select 1 from public.available_slots(p_offer_id) s where s.starts_at = p_starts_at) then
      raise exception 'Créneau indisponible';
    end if;
    v_starts := p_starts_at;
  end if;

  insert into public.bookings
    (offer_id, seeker_id, resident_id, starts_at, target_address, message, status, amount_cents, commission_cents)
  values
    (v_offer.id, auth.uid(), v_offer.resident_id, v_starts, trim(p_target_address), nullif(trim(p_message), ''),
     'en_attente', v_offer.price_cents, round(v_offer.price_cents * 0.2))
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.create_booking(uuid, timestamptz, text, text) from public, anon;
grant execute on function public.create_booking(uuid, timestamptz, text, text) to authenticated;

-- L'habitant accepte ou refuse une demande en attente.
-- (À l'étape 9, l'acceptation déclenchera le paiement ; pour l'instant elle confirme directement.)
create or replace function public.respond_booking(p_booking_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bookings b
  set status = case when p_accept then 'confirmee'::public.booking_status else 'annulee'::public.booking_status end,
      responded_at = now()
  where b.id = p_booking_id
    and b.status = 'en_attente'
    and exists (select 1 from public.residents r where r.id = b.resident_id and r.profile_id = auth.uid());
  if not found then raise exception 'Demande introuvable ou déjà traitée'; end if;
end;
$$;

revoke execute on function public.respond_booking(uuid, boolean) from public, anon;
grant execute on function public.respond_booking(uuid, boolean) to authenticated;

-- Le chercheur ou l'habitant annule une réservation en attente ou confirmée.
-- (Les règles de remboursement arrivent avec le paiement, à l'étape 9.)
create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bookings b
  set status = 'annulee'
  where b.id = p_booking_id
    and b.status in ('en_attente', 'confirmee')
    and (
      b.seeker_id = auth.uid()
      or exists (select 1 from public.residents r where r.id = b.resident_id and r.profile_id = auth.uid())
    );
  if not found then raise exception 'Réservation introuvable ou déjà terminée'; end if;
end;
$$;

revoke execute on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.cancel_booking(uuid) to authenticated;

-- Toutes les réservations de la personne connectée, côté chercheur et côté habitant,
-- avec le prénom de l'autre personne. Le contact n'est donné qu'une fois la réservation confirmée.
create or replace function public.my_bookings()
returns table (
  booking_id uuid,
  my_role text,               -- 'chercheur' ou 'habitant'
  other_first_name text,
  resident_id uuid,
  offer_type public.offer_type,
  duration_minutes integer,
  starts_at timestamptz,
  target_address text,
  message text,
  status public.booking_status,
  amount_cents integer,
  commission_cents integer,
  contact_info text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.id,
    case when b.seeker_id = auth.uid() then 'chercheur' else 'habitant' end,
    case when b.seeker_id = auth.uid() then rp.first_name else sp.first_name end,
    b.resident_id,
    o.type,
    o.duration_minutes,
    b.starts_at,
    b.target_address,
    b.message,
    b.status,
    b.amount_cents,
    b.commission_cents,
    case when b.seeker_id = auth.uid() and b.status = 'confirmee' then r.contact_info end,
    b.created_at
  from public.bookings b
  join public.offers o on o.id = b.offer_id
  join public.residents r on r.id = b.resident_id
  join public.profiles rp on rp.id = r.profile_id
  join public.profiles sp on sp.id = b.seeker_id
  where b.seeker_id = auth.uid() or r.profile_id = auth.uid()
  order by b.starts_at desc;
$$;

revoke execute on function public.my_bookings() from public, anon;
grant execute on function public.my_bookings() to authenticated;
