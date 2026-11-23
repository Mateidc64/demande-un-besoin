// Page de vérification : /statut
// Elle dit si le site arrive à parler à la base de données Supabase.
import { connection } from "next/server";
import { Suspense } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function checkDatabase(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message: "Les clés Supabase ne sont pas encore renseignées (voir .env.example).",
    };
  }
  try {
    const supabase = await createClient();
    // Petite recherche "à vide" : ça marche seulement si les tables ont bien été créées.
    const { error } = await supabase.rpc("search_residents", { p_lat: 48.8566, p_lng: 2.3522 });
    if (error) {
      return {
        ok: false,
        message: `Connexion établie, mais les tables ne sont pas prêtes : ${error.message}`,
      };
    }
    return { ok: true, message: "La base de données est connectée et les tables sont prêtes." };
  } catch (e) {
    return { ok: false, message: `Impossible de joindre Supabase : ${(e as Error).message}` };
  }
}

// Le test se fait à chaque visite (pas une seule fois au moment de la construction du site).
async function DatabaseStatus() {
  await connection();
  const { ok, message } = await checkDatabase();
  return (
    <>
      <p className={`mt-6 text-lg font-semibold ${ok ? "text-emerald-600" : "text-red-600"}`}>
        {ok ? "✅ Tout fonctionne" : "❌ Pas encore prêt"}
      </p>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{message}</p>
    </>
  );
}

export default function StatutPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold">État du site</h1>
        <Suspense fallback={<p className="mt-6 text-zinc-500">Vérification en cours…</p>}>
          <DatabaseStatus />
        </Suspense>
      </div>
    </main>
  );
}
