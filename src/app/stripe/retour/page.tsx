// Page /stripe/retour : Stripe y renvoie l'habitant après le formulaire de compte bancaire.
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { checkStripe, connectStripe } from "@/app/mes-offres/stripe-actions";

async function Check({ searchParams }: { searchParams: Promise<{ relancer?: string }> }): Promise<null> {
  const { relancer } = await searchParams;
  // Le lien Stripe a expiré : on en crée un nouveau.
  if (relancer) await connectStripe();
  let ready = false;
  try {
    ready = await checkStripe();
  } catch (e) {
    console.error("stripe/retour", e);
  }
  redirect(ready ? "/mes-offres?stripe=ok" : "/mes-offres?stripe=incomplet");
  return null;
}

export default function StripeRetourPage({ searchParams }: PageProps<"/stripe/retour">) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Suspense fallback={<p className="text-zinc-500">Vérification du compte…</p>}>
        <Check searchParams={searchParams as Promise<{ relancer?: string }>} />
      </Suspense>
    </main>
  );
}
