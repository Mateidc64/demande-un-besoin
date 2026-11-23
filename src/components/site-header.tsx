// Barre du haut du site : nom de l'app + lien « Se connecter » ou « Mon compte ».
import Link from "next/link";
import { Suspense } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function AccountLink() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims);
  return (
    <Link
      href={loggedIn ? "/compte" : "/connexion"}
      className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {loggedIn ? "Mon compte" : "Se connecter"}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <Link href="/" className="font-bold">
        Demande à un voisin
      </Link>
      <Suspense fallback={null}>
        <AccountLink />
      </Suspense>
    </header>
  );
}
