-- Étape 6 (recherche) : rendre les offres des habitants vérifiés lisibles par les chercheurs.
-- La règle précédente lisait la table residents, qui est privée : pour un chercheur, elle ne
-- trouvait donc jamais l'habitant et cachait toutes les offres. On passe par une petite fonction
-- qui ne répond que « oui / non » sans rien révéler d'autre.

create or replace function public.resident_is_verified(p_resident_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.residents r
    where r.id = p_resident_id and r.verification_status = 'verifie'
  );
$$;

grant execute on function public.resident_is_verified(uuid) to anon, authenticated;

drop policy if exists "offres actives des habitants vérifiés lisibles par tous" on public.offers;
create policy "offres des habitants vérifiés lisibles par tous" on public.offers
  for select using (
    public.resident_is_verified(resident_id)
    or exists (select 1 from public.residents r where r.id = resident_id and r.profile_id = auth.uid())
    or public.is_admin()
  );
