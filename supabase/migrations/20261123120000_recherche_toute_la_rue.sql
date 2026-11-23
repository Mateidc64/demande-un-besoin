-- Recherche par nom de rue (sans numéro) : on montre les habitants de TOUTE la rue, pas seulement
-- ceux à moins de 300 m du milieu de la rue (une avenue peut faire plusieurs kilomètres).
-- Recherche sans numéro = p_building_key vide et p_street_name rempli. On reste à moins de 5 km
-- pour ne pas mélanger deux rues du même nom dans des villes différentes.
-- Même signature qu'avant : simple remplacement, aucun DROP.
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
    (p_street_name is not null and lower(trim(r.street_name)) = lower(trim(p_street_name))) as same_street,
    (round(extensions.st_distance(r.location, point.g) / 50) * 50)::integer as distance_m,
    (select round(avg(v.rating), 1) from public.reviews v where v.target_id = r.profile_id),
    (select count(*)::integer from public.reviews v where v.target_id = r.profile_id)
  from public.residents r
  join public.profiles p on p.id = r.profile_id
  cross join point
  where r.verification_status = 'verifie'
    and (
      extensions.st_dwithin(r.location, point.g, least(greatest(p_radius_m, 50), 2000))
      or (
        p_building_key is null
        and p_street_name is not null
        and lower(trim(r.street_name)) = lower(trim(p_street_name))
        and extensions.st_dwithin(r.location, point.g, 5000)
      )
    )
  order by same_building desc, same_street desc, distance_m asc
  limit 50;
$$;
