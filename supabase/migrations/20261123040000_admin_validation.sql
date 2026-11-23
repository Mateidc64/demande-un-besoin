-- Étape 4 (admin) : valider ou refuser une demande d'habitant.
-- À coller dans Supabase > SQL Editor > New query, puis "Run".
--
-- Les habitants ne peuvent pas modifier leur statut de vérification eux-mêmes (voir les droits
-- sur la table residents). Cette fonction est le seul moyen de le changer, et elle vérifie
-- d'abord que la personne connectée est admin.

create or replace function public.admin_review_resident(
  p_resident_id uuid,
  p_approve boolean,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_status public.verification_status := case when p_approve then 'verifie' else 'refuse' end;
begin
  if not public.is_admin() then
    raise exception 'Réservé à l''admin';
  end if;

  update public.residents
  set verification_status = new_status
  where id = p_resident_id;

  if not found then
    raise exception 'Habitant introuvable';
  end if;

  -- Le fichier est supprimé du stockage juste après (par le site) : on ne garde que la décision.
  update public.proof_documents
  set status = new_status,
      admin_note = p_note,
      file_path = null
  where resident_id = p_resident_id
    and status = 'en_attente';
end;
$$;

revoke execute on function public.admin_review_resident(uuid, boolean, text) from public, anon;
grant execute on function public.admin_review_resident(uuid, boolean, text) to authenticated;

-- Pour l'admin : la liste des demandes en attente, avec prénom, nom et e-mail.
create or replace function public.admin_pending_residents()
returns table (
  resident_id uuid,
  first_name text,
  last_name text,
  email text,
  address_label text,
  move_in_year smallint,
  housing_type text,
  bio text,
  contact_info text,
  submitted_at timestamptz,
  proof_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    p.first_name,
    p.last_name,
    u.email::text,
    r.address_label,
    r.move_in_year,
    r.housing_type,
    r.bio,
    r.contact_info,
    r.created_at,
    (select d.file_path from public.proof_documents d
      where d.resident_id = r.id and d.status = 'en_attente'
      order by d.created_at desc limit 1)
  from public.residents r
  join public.profiles p on p.id = r.profile_id
  join auth.users u on u.id = r.profile_id
  where r.verification_status = 'en_attente'
    and public.is_admin()
  order by r.created_at;
$$;

revoke execute on function public.admin_pending_residents() from public, anon;
grant execute on function public.admin_pending_residents() to authenticated;
