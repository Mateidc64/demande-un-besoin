-- Alignement sur le cahier des charges (Google Doc).
-- À coller dans Supabase > SQL Editor > New query, puis "Run".
-- Ce fichier complète le précédent : ne pas ré-exécuter l'ancien.

-- ---------------------------------------------------------------------------
-- Offres : ajout de la « réponse écrite sous 24 h » (8 €)
-- ---------------------------------------------------------------------------
alter type public.offer_type add value if not exists 'question_ecrite';

-- Fourchette de durée : la réponse écrite n'a pas de durée d'appel (on stocke 0).
alter table public.offers drop constraint if exists offers_duration_minutes_check;
alter table public.offers add constraint offers_duration_minutes_check
  check (duration_minutes between 0 and 120);

-- ---------------------------------------------------------------------------
-- Réservations : statuts du cahier des charges
-- en attente → confirmée (payée et acceptée) → terminée, ou annulée / litige
-- ---------------------------------------------------------------------------
alter type public.booking_status rename value 'en_attente_paiement' to 'en_attente';
alter type public.booking_status rename value 'payee' to 'confirmee';
alter type public.booking_status rename value 'realisee' to 'terminee';
alter table public.bookings alter column status set default 'en_attente';

-- ---------------------------------------------------------------------------
-- Profils : nom de famille (privé : jamais renvoyé par la recherche)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists last_name text;
grant update (last_name) on public.profiles to authenticated;

-- Le nom de famille ne doit pas être lisible par tout le monde :
-- on retire la lecture publique de la table et on la remplace par une vue publique.
drop policy if exists "profils lisibles par tous" on public.profiles;
create policy "chacun lit son profil, admin lit tout" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create or replace view public.public_profiles
with (security_invoker = false) as
  select id, first_name, avatar_url, created_at from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Habitants : champs du cahier des charges
-- ---------------------------------------------------------------------------
alter table public.residents
  add column if not exists street_name text,            -- seul élément d'adresse affiché
  add column if not exists neighborhood text,           -- quartier
  add column if not exists city text,
  add column if not exists move_in_year smallint
    check (move_in_year between 1900 and 2100),         -- année d'emménagement
  add column if not exists housing_type text,           -- ex. appartement, maison
  add column if not exists not_agent_confirmed boolean not null default false;
  -- « Je ne suis pas l'agent, le vendeur ou le propriétaire du bien » (case obligatoire)

-- L'année d'emménagement remplace la date « habite depuis ».
alter table public.residents drop column if exists lived_since;

grant update (street_name, neighborhood, city, move_in_year, housing_type, not_agent_confirmed)
  on public.residents to authenticated;

-- La case « je ne suis pas l'agent… » doit être cochée pour créer sa fiche.
drop policy if exists "habitant crée sa fiche" on public.residents;
create policy "habitant crée sa fiche" on public.residents
  for insert with check (
    profile_id = auth.uid()
    and verification_status = 'en_attente'
    and not_agent_confirmed
  );

-- ---------------------------------------------------------------------------
-- Signalements
-- ---------------------------------------------------------------------------
create type public.report_status as enum ('ouvert', 'en_cours', 'traite');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id),
  target_id uuid references public.profiles (id),
  booking_id uuid references public.bookings (id),
  reason text not null,
  status public.report_status not null default 'ouvert',
  created_at timestamptz not null default now(),
  check (target_id is not null or booking_id is not null)
);

alter table public.reports enable row level security;

create policy "auteur voit ses signalements, admin tout" on public.reports
  for select using (author_id = auth.uid() or public.is_admin());

create policy "tout compte peut signaler" on public.reports
  for insert with check (author_id = auth.uid() and status = 'ouvert');

create policy "admin traite les signalements" on public.reports
  for update using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Recherche : rayon de 300 m, même immeuble puis même rue d'abord.
-- Renvoie le nom de la rue et une distance arrondie à 50 m, jamais l'adresse exacte.
-- ---------------------------------------------------------------------------
drop function if exists public.search_residents(double precision, double precision, text, integer);

create or replace function public.search_residents(
  p_lat double precision,
  p_lng double precision,
  p_building_key text default null,
  p_street_name text default null,
  p_radius_m integer default 300
)
returns table (
  resident_id uuid,
  first_name text,
  avatar_url text,
  move_in_year smallint,
  housing_type text,
  bio text,
  street_name text,
  same_building boolean,
  same_street boolean,
  distance_m integer,
  average_rating numeric,
  review_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with point as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as g
  )
  select
    r.id,
    p.first_name,
    p.avatar_url,
    r.move_in_year,
    r.housing_type,
    r.bio,
    r.street_name,
    (p_building_key is not null and r.building_key = p_building_key) as same_building,
    (p_street_name is not null and lower(r.street_name) = lower(p_street_name)) as same_street,
    (round(extensions.st_distance(r.location, point.g) / 50) * 50)::integer as distance_m,
    (select round(avg(v.rating), 1) from public.reviews v where v.target_id = r.profile_id),
    (select count(*)::integer from public.reviews v where v.target_id = r.profile_id)
  from public.residents r
  join public.profiles p on p.id = r.profile_id
  cross join point
  where r.verification_status = 'verifie'
    and extensions.st_dwithin(r.location, point.g, least(greatest(p_radius_m, 50), 2000))
  order by same_building desc, same_street desc, distance_m asc
  limit 50;
$$;

grant execute on function public.search_residents(double precision, double precision, text, text, integer)
  to anon, authenticated;
