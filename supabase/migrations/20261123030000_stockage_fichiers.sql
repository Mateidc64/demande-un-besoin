-- Étape 3 (devenir habitant) : espaces de stockage des fichiers.
-- À coller dans Supabase > SQL Editor > New query, puis "Run".
--
-- Deux « buckets » (dossiers de stockage) :
-- - justificatifs : PRIVÉ. Chaque habitant range son fichier dans un dossier à son identifiant.
--   Seuls lui et l'admin peuvent le lire ; seul l'admin peut le supprimer (après validation).
-- - avatars : PUBLIC en lecture (les photos de profil sont affichées sur le site).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('justificatifs', 'justificatifs', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Justificatifs -----------------------------------------------------------------
create policy "habitant envoie son justificatif" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'justificatifs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "habitant et admin lisent les justificatifs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'justificatifs'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );

create policy "admin supprime les justificatifs" on storage.objects
  for delete to authenticated
  using (bucket_id = 'justificatifs' and public.is_admin());

-- Photos de profil ----------------------------------------------------------------
create policy "chacun envoie sa photo" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "chacun remplace sa photo" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "chacun supprime sa photo" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
