-- Étape 2 (comptes) : permettre à chacun de supprimer son propre compte (RGPD).
-- À coller dans Supabase > SQL Editor > New query, puis "Run".

-- Signalements : si l'auteur supprime son compte, ses signalements partent avec ;
-- si la personne signalée supprime son compte, le signalement reste (sans la cible) pour l'admin.
alter table public.reports drop constraint if exists reports_check;
alter table public.reports drop constraint if exists reports_author_id_fkey;
alter table public.reports add constraint reports_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete cascade;
alter table public.reports drop constraint if exists reports_target_id_fkey;
alter table public.reports add constraint reports_target_id_fkey
  foreign key (target_id) references public.profiles (id) on delete set null;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Non connecté';
  end if;
  -- Supprime le compte : le profil, la fiche habitant, les offres et les disponibilités
  -- partent avec (« on delete cascade »). Si des réservations y sont liées, la suppression
  -- est refusée par la base et l'admin s'en occupe à la main.
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
