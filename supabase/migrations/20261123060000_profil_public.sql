-- Étape 7 (profil public) : les infos publiques d'un habitant vérifié.
-- La table residents est privée : cette fonction renvoie uniquement ce qui peut être affiché
-- (jamais l'adresse exacte, le téléphone ni le nom de famille), et seulement si l'habitant est vérifié.
-- Pas de DROP dans ce fichier : il peut être exécuté plusieurs fois sans risque.

create or replace function public.public_resident_profile(p_resident_id uuid)
returns table (
  resident_id uuid,
  profile_id uuid,
  first_name text,
  avatar_url text,
  move_in_year smallint,
  housing_type text,
  bio text,
  street_name text,
  neighborhood text,
  city text,
  average_rating numeric,
  review_count integer,
  member_since timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.profile_id,
    p.first_name,
    p.avatar_url,
    r.move_in_year,
    r.housing_type,
    r.bio,
    r.street_name,
    r.neighborhood,
    r.city,
    (select round(avg(v.rating), 1) from public.reviews v where v.target_id = r.profile_id),
    (select count(*)::integer from public.reviews v where v.target_id = r.profile_id),
    p.created_at
  from public.residents r
  join public.profiles p on p.id = r.profile_id
  where r.id = p_resident_id
    and r.verification_status = 'verifie';
$$;

grant execute on function public.public_resident_profile(uuid) to anon, authenticated;

-- Les avis reçus par une personne, avec le prénom de l'auteur.
create or replace function public.reviews_for_profile(p_profile_id uuid)
returns table (rating smallint, comment text, created_at timestamptz, author_first_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select v.rating, v.comment, v.created_at, a.first_name
  from public.reviews v
  join public.profiles a on a.id = v.author_id
  where v.target_id = p_profile_id
  order by v.created_at desc
  limit 50;
$$;

grant execute on function public.reviews_for_profile(uuid) to anon, authenticated;
