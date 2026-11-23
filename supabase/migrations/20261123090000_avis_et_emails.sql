-- Étape 10 : avis dans les deux sens et e-mails automatiques.
-- Aucun DROP dans ce fichier.

-- Suivi des e-mails déjà envoyés (pour ne jamais envoyer deux fois le même).
alter table public.bookings add column if not exists email_paid_at timestamptz;
alter table public.bookings add column if not exists email_confirmed_at timestamptz;
alter table public.bookings add column if not exists email_cancelled_at timestamptz;
alter table public.bookings add column if not exists email_reminder_at timestamptz;
alter table public.bookings add column if not exists email_review_at timestamptz;

-- Laisser un avis : seulement sur un échange terminé, une fois, sur l'autre participant.
create or replace function public.leave_review(p_booking_id uuid, p_rating integer, p_comment text default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_target uuid;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'Note invalide'; end if;
  select case when b.seeker_id = auth.uid() then r.profile_id else b.seeker_id end
    into v_target
  from public.bookings b
  join public.residents r on r.id = b.resident_id
  where b.id = p_booking_id
    and b.status = 'terminee'
    and (b.seeker_id = auth.uid() or r.profile_id = auth.uid());
  if v_target is null then raise exception 'Échange introuvable ou pas encore terminé'; end if;
  if exists (select 1 from public.reviews v where v.booking_id = p_booking_id and v.author_id = auth.uid()) then
    raise exception 'Avis déjà laissé';
  end if;
  insert into public.reviews (booking_id, author_id, target_id, rating, comment)
  values (p_booking_id, auth.uid(), v_target, p_rating, nullif(left(trim(p_comment), 1000), ''));
end;
$$;

revoke execute on function public.leave_review(uuid, integer, text) from public, anon;
grant execute on function public.leave_review(uuid, integer, text) to authenticated;

-- Les réservations sur lesquelles j'ai déjà laissé un avis.
create or replace function public.my_reviewed_bookings()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select v.booking_id from public.reviews v where v.author_id = auth.uid();
$$;

revoke execute on function public.my_reviewed_bookings() from public, anon;
grant execute on function public.my_reviewed_bookings() to authenticated;

-- ---------------------------------------------------------------------------
-- Fonctions réservées au serveur (clé service_role) pour les e-mails.
-- ---------------------------------------------------------------------------

-- « Réserve » l'envoi d'un e-mail : renvoie vrai une seule fois par réservation et par type.
create or replace function public.claim_booking_email(p_booking_id uuid, p_kind text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_kind = 'paye' then
    update public.bookings set email_paid_at = now()
    where id = p_booking_id and email_paid_at is null and paid_at is not null and status = 'en_attente';
  elsif p_kind = 'confirme' then
    update public.bookings set email_confirmed_at = now()
    where id = p_booking_id and email_confirmed_at is null and status = 'confirmee';
  elsif p_kind = 'annule' then
    update public.bookings set email_cancelled_at = now()
    where id = p_booking_id and email_cancelled_at is null and status = 'annulee' and paid_at is not null;
  elsif p_kind = 'rappel' then
    update public.bookings set email_reminder_at = now()
    where id = p_booking_id and email_reminder_at is null and status = 'confirmee';
  elsif p_kind = 'avis' then
    update public.bookings set email_review_at = now()
    where id = p_booking_id and email_review_at is null and status = 'terminee';
  else
    raise exception 'Type d''e-mail inconnu';
  end if;
  return found;
end;
$$;

-- Ce qu'il faut pour écrire les e-mails d'une réservation.
create or replace function public.booking_email_info(p_booking_id uuid)
returns table (
  booking_id uuid, seeker_id uuid, seeker_first_name text, resident_profile_id uuid,
  resident_first_name text, offer_type public.offer_type, duration_minutes integer,
  starts_at timestamptz, target_address text, message text, status public.booking_status,
  amount_cents integer, commission_cents integer, contact_info text, refunded boolean
)
language sql stable security definer set search_path = ''
as $$
  select b.id, b.seeker_id, sp.first_name, r.profile_id, rp.first_name, o.type, o.duration_minutes,
         b.starts_at, b.target_address, b.message, b.status, b.amount_cents, b.commission_cents,
         r.contact_info, b.refund_due or b.refunded_at is not null
  from public.bookings b
  join public.offers o on o.id = b.offer_id
  join public.residents r on r.id = b.resident_id
  join public.profiles rp on rp.id = r.profile_id
  join public.profiles sp on sp.id = b.seeker_id
  where b.id = p_booking_id;
$$;

-- E-mails dus par la tâche quotidienne : rappels (rendez-vous dans les 36 h) et demandes d'avis.
create or replace function public.bookings_due_emails()
returns table (booking_id uuid, kind text)
language sql stable security definer set search_path = ''
as $$
  select b.id, 'rappel' from public.bookings b
  join public.offers o on o.id = b.offer_id
  where b.status = 'confirmee' and b.email_reminder_at is null and o.type <> 'question_ecrite'
    and b.starts_at between now() and now() + interval '36 hours'
  union all
  select b.id, 'avis' from public.bookings b
  where b.status = 'terminee' and b.email_review_at is null;
$$;

revoke execute on function public.claim_booking_email(uuid, text) from public, anon, authenticated;
revoke execute on function public.booking_email_info(uuid) from public, anon, authenticated;
revoke execute on function public.bookings_due_emails() from public, anon, authenticated;
grant execute on function public.claim_booking_email(uuid, text) to service_role;
grant execute on function public.booking_email_info(uuid) to service_role;
grant execute on function public.bookings_due_emails() to service_role;
