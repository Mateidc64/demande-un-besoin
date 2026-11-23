-- Étape 2 : tables de base de « Demande à un voisin ».
-- À coller dans Supabase > SQL Editor > New query, puis cliquer sur "Run".
--
-- Principe de sécurité (RLS = « Row Level Security », règles d'accès ligne par ligne) :
-- chaque table est fermée par défaut, puis on ouvre seulement ce qui est nécessaire.
-- L'adresse exacte et le contact d'un habitant ne sont jamais lisibles par les autres.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Types (listes de valeurs autorisées)
-- ---------------------------------------------------------------------------
create type public.verification_status as enum ('en_attente', 'verifie', 'refuse');
create type public.offer_type as enum ('appel_express', 'appel', 'balade', 'visite_soir');
create type public.booking_status as enum ('en_attente_paiement', 'payee', 'realisee', 'annulee', 'litige');

-- ---------------------------------------------------------------------------
-- profiles : une ligne par compte (créée automatiquement à l'inscription)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  avatar_url text,
  is_seeker boolean not null default true,
  is_resident boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Vrai si la personne connectée est admin (sert dans les règles plus bas).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Crée le profil dès qu'un compte est créé.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name)
  values (new.id, new.raw_user_meta_data ->> 'first_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

-- Prénom et photo sont publics (affichés sur les profils d'habitants).
create policy "profils lisibles par tous" on public.profiles
  for select using (true);

create policy "chacun modifie son profil" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Personne ne peut se nommer admin lui-même : seules ces colonnes sont modifiables.
revoke update on public.profiles from anon, authenticated;
grant update (first_name, avatar_url, is_seeker, is_resident) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- residents : le profil « habitant » (privé : lisible par son propriétaire et l'admin)
-- ---------------------------------------------------------------------------
create table public.residents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  address_label text not null,           -- adresse complète, jamais affichée aux autres
  building_key text,                     -- identifiant de l'immeuble (API Adresse), pour « même immeuble »
  location extensions.geography(point, 4326) not null,
  lived_since date,
  bio text,
  contact_info text,                     -- téléphone ou lien visio, donné seulement après paiement
  verification_status public.verification_status not null default 'en_attente',
  stripe_account_id text,
  created_at timestamptz not null default now()
);

create index residents_location_idx on public.residents using gist (location);

alter table public.residents enable row level security;

create policy "habitant lit sa fiche, admin lit tout" on public.residents
  for select using (profile_id = auth.uid() or public.is_admin());

create policy "habitant crée sa fiche" on public.residents
  for insert with check (profile_id = auth.uid() and verification_status = 'en_attente');

create policy "habitant modifie sa fiche" on public.residents
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "admin modifie les fiches" on public.residents
  for update using (public.is_admin());

-- L'habitant ne peut pas se déclarer « vérifié » ni changer son compte Stripe lui-même.
revoke update on public.residents from anon, authenticated;
grant update (address_label, building_key, location, lived_since, bio, contact_info)
  on public.residents to authenticated;

-- ---------------------------------------------------------------------------
-- proof_documents : justificatifs de domicile (le fichier sera dans un stockage privé, étape 6)
-- ---------------------------------------------------------------------------
create table public.proof_documents (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.residents (id) on delete cascade,
  file_path text,
  status public.verification_status not null default 'en_attente',
  admin_note text,
  created_at timestamptz not null default now()
);

alter table public.proof_documents enable row level security;

create policy "habitant voit ses justificatifs, admin tout" on public.proof_documents
  for select using (
    public.is_admin()
    or exists (select 1 from public.residents r where r.id = resident_id and r.profile_id = auth.uid())
  );

create policy "habitant envoie un justificatif" on public.proof_documents
  for insert with check (
    status = 'en_attente'
    and exists (select 1 from public.residents r where r.id = resident_id and r.profile_id = auth.uid())
  );

create policy "admin valide les justificatifs" on public.proof_documents
  for update using (public.is_admin());

-- ---------------------------------------------------------------------------
-- offers : ce que propose l'habitant (appel, balade…) et à quel prix
-- ---------------------------------------------------------------------------
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.residents (id) on delete cascade,
  type public.offer_type not null,
  duration_minutes integer not null check (duration_minutes between 5 and 120),
  price_cents integer not null check (price_cents between 300 and 10000),  -- de 3 € à 100 €
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (resident_id, type)
);

alter table public.offers enable row level security;

create policy "offres actives des habitants vérifiés lisibles par tous" on public.offers
  for select using (
    exists (
      select 1 from public.residents r
      where r.id = resident_id
        and (r.verification_status = 'verifie' or r.profile_id = auth.uid() or public.is_admin())
    )
  );

create policy "habitant gère ses offres" on public.offers
  for all
  using (exists (select 1 from public.residents r where r.id = resident_id and r.profile_id = auth.uid()))
  with check (exists (select 1 from public.residents r where r.id = resident_id and r.profile_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- availabilities : disponibilités de la semaine (ex. mardi 19h-21h)
-- ---------------------------------------------------------------------------
create table public.availabilities (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.residents (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),  -- 1 = lundi, 7 = dimanche
  start_time time not null,
  end_time time not null check (end_time > start_time)
);

alter table public.availabilities enable row level security;

create policy "disponibilités lisibles par tous" on public.availabilities
  for select using (true);

create policy "habitant gère ses disponibilités" on public.availabilities
  for all
  using (exists (select 1 from public.residents r where r.id = resident_id and r.profile_id = auth.uid()))
  with check (exists (select 1 from public.residents r where r.id = resident_id and r.profile_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- bookings : réservations. Créées et mises à jour par le serveur avec Stripe (étape 10),
-- donc aucune écriture directe depuis le navigateur.
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id),
  seeker_id uuid not null references public.profiles (id),
  resident_id uuid not null references public.residents (id),
  starts_at timestamptz not null,
  target_address text not null,          -- l'adresse qui intéresse le chercheur
  status public.booking_status not null default 'en_attente_paiement',
  amount_cents integer not null check (amount_cents > 0),
  commission_cents integer not null check (commission_cents >= 0),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy "les deux participants voient la réservation" on public.bookings
  for select using (
    seeker_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.residents r where r.id = resident_id and r.profile_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- reviews : avis dans les deux sens, après un échange réalisé
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  target_id uuid not null references public.profiles (id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (booking_id, author_id)
);

alter table public.reviews enable row level security;

create policy "avis lisibles par tous" on public.reviews
  for select using (true);

-- On ne peut noter que l'autre participant d'un échange réalisé.
create policy "participant laisse un avis" on public.reviews
  for insert with check (
    author_id = auth.uid()
    and author_id <> target_id
    and exists (
      select 1
      from public.bookings b
      join public.residents r on r.id = b.resident_id
      where b.id = booking_id
        and b.status = 'realisee'
        and (
          (b.seeker_id = author_id and r.profile_id = target_id)
          or (r.profile_id = author_id and b.seeker_id = target_id)
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Recherche : habitants vérifiés autour d'une adresse, même immeuble en premier.
-- Ne renvoie jamais l'adresse exacte, seulement une distance arrondie à 50 m.
-- ---------------------------------------------------------------------------
create or replace function public.search_residents(
  p_lat double precision,
  p_lng double precision,
  p_building_key text default null,
  p_radius_m integer default 200
)
returns table (
  resident_id uuid,
  first_name text,
  avatar_url text,
  lived_since date,
  bio text,
  same_building boolean,
  distance_m integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    p.first_name,
    p.avatar_url,
    r.lived_since,
    r.bio,
    (p_building_key is not null and r.building_key = p_building_key) as same_building,
    (round(extensions.st_distance(
      r.location,
      extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography
    ) / 50) * 50)::integer as distance_m
  from public.residents r
  join public.profiles p on p.id = r.profile_id
  where r.verification_status = 'verifie'
    and extensions.st_dwithin(
      r.location,
      extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
      least(greatest(p_radius_m, 50), 2000)
    )
  order by same_building desc, distance_m asc
  limit 50;
$$;

grant execute on function public.search_residents(double precision, double precision, text, integer)
  to anon, authenticated;
