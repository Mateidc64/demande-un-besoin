// Page /paiement/retour : Stripe y renvoie le chercheur après le paiement. On vérifie le paiement
// auprès de Stripe (sans attendre le webhook), puis on l'envoie sur « Mes réservations ».
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { recordCheckout } from "@/lib/paiements";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

async function Check({ searchParams }: { searchParams: Promise<{ session_id?: string }> }): Promise<null> {
  const { session_id } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");
  if (!session_id) redirect("/mes-reservations");

  let ok = false;
  try {
    const session = await getStripe().checkout.sessions.retrieve(session_id);
    ok = await recordCheckout(session);
  } catch (e) {
    console.error("paiement/retour", e);
  }
  redirect(ok ? "/mes-reservations?payee=1" : "/mes-reservations?paiement=verification");
  return null;
}

export default function PaiementRetourPage({ searchParams }: PageProps<"/paiement/retour">) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Suspense fallback={<p className="text-zinc-500">Vérification du paiement…</p>}>
        <Check searchParams={searchParams as Promise<{ session_id?: string }>} />
      </Suspense>
    </main>
  );
}
