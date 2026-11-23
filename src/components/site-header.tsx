// Barre du haut du site : nom de l'app, « Habitant », « Mes réservations », « Se connecter » / « Mon compte ».
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function AccountLink() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims);
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* « Habitant » : devenir habitant, ou directement l'espace habitant si on est vérifié. */}
      <Link href="/espace-habitant" className="text-sm font-semibold text-nuit hover:underline">
        Habitant
      </Link>
      {loggedIn && (
        <Link href="/mes-reservations" className="text-sm font-semibold text-nuit hover:underline">
          Mes réservations
        </Link>
      )}
      <Link
        href={loggedIn ? "/compte" : "/connexion"}
        className="rounded-xl border-2 border-nuit px-4 py-2 text-sm font-bold text-nuit hover:bg-creme"
      >
        {loggedIn ? "Mon compte" : "Se connecter"}
      </Link>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-brume bg-white px-4 py-3 sm:px-6">
      <Link href="/" aria-label="Demande à un voisin, accueil">
        <Logo />
      </Link>
      <Suspense fallback={null}>
        <AccountLink />
      </Suspense>
    </header>
  );
}
