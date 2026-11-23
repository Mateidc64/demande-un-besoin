// Page /espace-habitant : l'onglet « Habitant » du menu. Elle envoie au bon endroit :
// - pas encore habitant (ou demande en cours / refusée) : « Devenir habitant », qui montre l'état ;
// - habitant vérifié : directement l'espace habitant (offres, créneaux, paiements).
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function Route(): Promise<null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");
  const { data: resident } = await supabase
    .from("residents")
    .select("verification_status")
    .eq("profile_id", auth.user.id)
    .maybeSingle();
  redirect(resident?.verification_status === "verifie" ? "/mes-offres" : "/devenir-habitant");
  return null;
}

export default function EspaceHabitantPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Suspense fallback={<p className="text-ardoise">Chargement…</p>}>
        <Route />
      </Suspense>
    </main>
  );
}
