-- Étape 9 : paiement Stripe (mode test).
-- Principe : le chercheur paie à la demande (Stripe Checkout). L'argent reste sur le compte de la
-- plateforme. Quand l'échange est confirmé (par le chercheur, ou 48 h après le créneau), le serveur
-- verse 80 % à l'habitant (virement Stripe Connect). Les remboursements suivent les règles du cahier
-- des charges. Le serveur fait les appels Stripe ; la base décide de ce qui est dû.
-- Aucun DROP dans ce fichier.

-- Habitant : compte Stripe prêt à recevoir des versements ?
alter table public.residents add column if not exists stripe_ready boolean not null default false;

-- Suivi de l'argent sur chaque réservation.
alter table public.bookings add column if not exists paid_at timestamptz;
alter table public.bookings add column if not exists stripe_charge_id text;
alter table public.bookings add column if not exists refund_due boolean not null default false;
alter table public.bookings add column if not exists stripe_refund_id text;
alter table public.bookings add column if not exists refunded_at timestamptz;
alter table public.bookings add column if not exists transfer_due boolean not null default false;
alter table public.bookings add column if not exists stripe_transfer_id text;
alter table public.bookings add column if not exists transferred_at timestamptz;
alter table public.bookings add column if not exists cancelled_at timestamptz;

-- Créneaux libres : une demande non payée ne bloque le créneau que 30 minutes.
create or replace function public.available_slots(p_offer_id uuid, p_days integer default 14)
returns table (starts_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  with o as (
    select o.id, o.resident_id, o.duration_minutes from public.offers o
    where o.id = p_offer_id and o.active and public.resident_is_verified(o.resident_id)
      and o.type <> 'question_ecrite'
  ),
  days as (
    select d::date as day from generate_series(
      (now() at time zone 'Europe/Paris')::date,
      (now() at time zone 'Europe/Paris')::date + least(greatest(p_days, 1), 30),
      interval '1 day') d
  ),
  candidates as (
    select (t at time zone 'Europe/Paris') as starts_at, o.resident_id, o.duration_minutes
    from o
    join public.availabilities a on a.resident_id = o.resident_id
    join days on extract(isodow from days.day) = a.weekday
    cross join lateral generate_series(
      days.day + a.start_time,
      days.day + a.end_time - make_interval(mins => o.duration_minutes),
      interval '30 minutes') t
  )
  select c.starts_at from candidates c
  where c.starts_at > now() + interval '2 hours'
    and not exists (
      select 1 from public.bookings b
      join public.offers bo on bo.id = b.offer_id
      where b.resident_id = c.resident_id
        and (b.status = 'confirmee'
             or (b.status = 'en_attente' and (b.paid_at is not null or b.created_at > now() - interval '30 minutes')))
        and bo.type <> 'question_ecrite'
        and tstzrange(b.starts_at, b.starts_at + make_interval(mins => bo.duration_minutes))
            && tstzrange(c.starts_at, c.starts_at + make_interval(mins => c.duration_minutes))
    )
  order by c.starts_at;
$$;

-- Demande : en plus des règles de l'étape 8, l'habitant doit pouvoir recevoir des versements.
create or replace function public.create_booking(p_offer_id uuid, p_starts_at timestamptz, p_target_address text, p_message text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_offer record;
  v_resident record;
  v_starts timestamptz;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  select o.* into v_offer from public.offers o
  where o.id = p_offer_id and o.active and public.resident_is_verified(o.resident_id);
  if not found then raise exception 'Offre indisponible'; end if;
  select r.profile_id, r.stripe_ready into v_resident from public.residents r where r.id = v_offer.resident_id;
  if v_resident.profile_id = auth.uid() then raise exception 'Impossible de réserver sa propre offre'; end if;
  if not v_resident.stripe_ready then raise exception 'Paiements pas encore activés'; end if;
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

-- Réponse de l'habitant : seulement sur une demande payée. Refus = remboursement total.
create or replace function public.respond_booking(p_booking_id uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.bookings b
  set status = case when p_accept then 'confirmee'::public.booking_status else 'annulee'::public.booking_status end,
      responded_at = now(),
      cancelled_at = case when p_accept then null else now() end,
      refund_due = not p_accept
  where b.id = p_booking_id
    and b.status = 'en_attente'
    and b.paid_at is not null
    and exists (select 1 from public.residents r where r.id = b.resident_id and r.profile_id = auth.uid());
  if not found then raise exception 'Demande introuvable ou déjà traitée'; end if;
end;
$$;

-- Annulation.
-- Habitant : remboursement total du chercheur.
-- Chercheur : remboursement total si la demande n'est pas encore acceptée ou si le créneau est à plus
-- de 24 h ; sinon pas de remboursement et l'habitant est payé.
create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_b record;
  v_is_seeker boolean;
  v_refund boolean;
begin
  select b.* into v_b from public.bookings b where b.id = p_booking_id for update;
  if not found or v_b.status not in ('en_attente', 'confirmee') then
    raise exception 'Réservation introuvable ou déjà terminée';
  end if;
  v_is_seeker := v_b.seeker_id = auth.uid();
  if not v_is_seeker and not exists (
    select 1 from public.residents r where r.id = v_b.resident_id and r.profile_id = auth.uid()
  ) then
    raise exception 'Réservation introuvable ou déjà terminée';
  end if;
  if not v_is_seeker and v_b.paid_at is null then
    raise exception 'Réservation introuvable ou déjà terminée';
  end if;

  v_refund := not v_is_seeker
    or v_b.status = 'en_attente'
    or v_b.starts_at > now() + interval '24 hours';

  update public.bookings b
  set status = 'annulee',
      cancelled_at = now(),
      refund_due = v_b.paid_at is not null and v_refund,
      transfer_due = v_b.paid_at is not null and not v_refund
  where b.id = p_booking_id;
end;
$$;

-- Le chercheur confirme que l'échange a eu lieu : l'habitant sera payé.
create or replace function public.confirm_booking_done(p_booking_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.bookings b
  set status = 'terminee', transfer_due = true
  where b.id = p_booking_id
    and b.seeker_id = auth.uid()
    and b.status = 'confirmee'
    and b.starts_at <= now();
  if not found then raise exception 'Réservation introuvable ou pas encore passée'; end if;
end;
$$;

-- Le chercheur signale un problème : l'argent est bloqué, l'admin tranche à la main.
create or replace function public.report_booking_problem(p_booking_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.bookings b
  set status = 'litige', transfer_due = false
  where b.id = p_booking_id
    and b.seeker_id = auth.uid()
    and b.status = 'confirmee';
  if not found then raise exception 'Réservation introuvable'; end if;
end;
$$;

revoke execute on function public.confirm_booking_done(uuid) from public, anon;
grant execute on function public.confirm_booking_done(uuid) to authenticated;
revoke execute on function public.report_booking_problem(uuid) from public, anon;
grant execute on function public.report_booking_problem(uuid) to authenticated;

-- Liste des réservations (remplace my_bookings, qui reste en base mais n'est plus utilisée).
-- L'habitant ne voit une demande qu'une fois payée. Le contact n'est donné qu'après paiement et
-- acceptation.
create or replace function public.bookings_overview()
returns table (
  booking_id uuid, my_role text, other_first_name text, resident_id uuid,
  offer_type public.offer_type, duration_minutes integer, starts_at timestamptz,
  target_address text, message text, status public.booking_status,
  amount_cents integer, commission_cents integer, contact_info text, created_at timestamptz,
  paid boolean, refunded boolean, resident_paid boolean, payment_open boolean
)
language sql stable security definer set search_path = ''
as $$
  select
    b.id,
    case when b.seeker_id = auth.uid() then 'chercheur' else 'habitant' end,
    case when b.seeker_id = auth.uid() then rp.first_name else sp.first_name end,
    b.resident_id, o.type, o.duration_minutes, b.starts_at, b.target_address, b.message,
    b.status, b.amount_cents, b.commission_cents,
    case when b.seeker_id = auth.uid() and b.paid_at is not null and b.status in ('confirmee', 'terminee')
      then r.contact_info end,
    b.created_at,
    b.paid_at is not null,
    b.refunded_at is not null,
    b.transferred_at is not null,
    b.status = 'en_attente' and b.paid_at is null and b.created_at > now() - interval '30 minutes'
  from public.bookings b
  join public.offers o on o.id = b.offer_id
  join public.residents r on r.id = b.resident_id
  join public.profiles rp on rp.id = r.profile_id
  join public.profiles sp on sp.id = b.seeker_id
  where b.seeker_id = auth.uid()
     or (r.profile_id = auth.uid() and b.paid_at is not null)
  order by b.starts_at desc;
$$;

revoke execute on function public.bookings_overview() from public, anon;
grant execute on function public.bookings_overview() to authenticated;

-- ---------------------------------------------------------------------------
-- Fonctions réservées au serveur (clé service_role), appelées après un échange avec Stripe.
-- ---------------------------------------------------------------------------

-- Paiement reçu (webhook ou retour de Stripe). Sans effet s'il est déjà enregistré. Si la demande a été
-- annulée entre-temps, le paiement est remboursé.
create or replace function public.record_booking_payment(p_booking_id uuid, p_payment_intent text, p_charge text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.bookings b
  set paid_at = now(),
      stripe_payment_intent_id = p_payment_intent,
      stripe_charge_id = p_charge,
      refund_due = b.status <> 'en_attente'
  where b.id = p_booking_id and b.paid_at is null;
end;
$$;

-- Entretien automatique : annule les demandes non payées après 30 min, termine les échanges 48 h
-- après le créneau (l'habitant sera payé).
create or replace function public.booking_maintenance()
returns void
language sql security definer set search_path = ''
as $$
  update public.bookings b
  set status = 'annulee', cancelled_at = now()
  where b.status = 'en_attente' and b.paid_at is null and b.created_at < now() - interval '30 minutes';

  update public.bookings b
  set status = 'terminee', transfer_due = true
  from public.offers o
  where o.id = b.offer_id
    and b.status = 'confirmee'
    and b.starts_at + make_interval(mins => o.duration_minutes) + interval '48 hours' < now();
$$;

-- Ce que le serveur doit faire chez Stripe : remboursements et versements en attente.
create or replace function public.booking_money_tasks()
returns table (
  booking_id uuid, kind text, payment_intent text, charge text,
  amount_cents integer, destination text
)
language sql stable security definer set search_path = ''
as $$
  select b.id, 'remboursement', b.stripe_payment_intent_id, b.stripe_charge_id, b.amount_cents, null::text
  from public.bookings b
  where b.refund_due and b.refunded_at is null and b.paid_at is not null
  union all
  select b.id, 'versement', b.stripe_payment_intent_id, b.stripe_charge_id,
         b.amount_cents - b.commission_cents, r.stripe_account_id
  from public.bookings b
  join public.residents r on r.id = b.resident_id
  where b.transfer_due and b.transferred_at is null and b.paid_at is not null
    and not b.refund_due and r.stripe_account_id is not null;
$$;

create or replace function public.record_refund(p_booking_id uuid, p_refund_id text)
returns void
language sql security definer set search_path = ''
as $$
  update public.bookings set stripe_refund_id = p_refund_id, refunded_at = now()
  where id = p_booking_id and refunded_at is null;
$$;

create or replace function public.record_transfer(p_booking_id uuid, p_transfer_id text)
returns void
language sql security definer set search_path = ''
as $$
  update public.bookings set stripe_transfer_id = p_transfer_id, transferred_at = now()
  where id = p_booking_id and transferred_at is null;
$$;

-- Compte Stripe de l'habitant (créé et vérifié par le serveur).
create or replace function public.set_resident_stripe(p_resident_id uuid, p_account_id text, p_ready boolean)
returns void
language sql security definer set search_path = ''
as $$
  update public.residents set stripe_account_id = p_account_id, stripe_ready = p_ready
  where id = p_resident_id;
$$;

revoke execute on function public.record_booking_payment(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.booking_maintenance() from public, anon, authenticated;
revoke execute on function public.booking_money_tasks() from public, anon, authenticated;
revoke execute on function public.record_refund(uuid, text) from public, anon, authenticated;
revoke execute on function public.record_transfer(uuid, text) from public, anon, authenticated;
revoke execute on function public.set_resident_stripe(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.record_booking_payment(uuid, text, text) to service_role;
grant execute on function public.booking_maintenance() to service_role;
grant execute on function public.booking_money_tasks() to service_role;
grant execute on function public.record_refund(uuid, text) to service_role;
grant execute on function public.record_transfer(uuid, text) to service_role;
grant execute on function public.set_resident_stripe(uuid, text, boolean) to service_role;
