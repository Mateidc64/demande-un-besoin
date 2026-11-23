// Page /mes-offres (« Espace habitant ») : offres, prix, disponibilités et compte bancaire.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { OfferType } from "@/lib/offres";
import { createClient } from "@/lib/supabase/server";
import type { Slot } from "./actions";
import { AvailabilityForm } from "./availability-form";
import { OffersForm, type ExistingOffer } from "./offers-form";
import { connectStripe } from "./stripe-actions";

async function Content({ searchParams }: { searchParams: Promise<{ stripe?: string; detail?: string }> }) {
  const { stripe, detail } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");

  const { data: resident } = await supabase
    .from("residents")
    .select("id, verification_status, stripe_account_id, stripe_ready")
    .eq("profile_id", auth.user.id)
    .maybeSingle();

  if (!resident) {
    return (
      <p>
        Tu dois d&apos;abord{" "}
        <Link href="/devenir-habitant" className="font-medium text-lien underline">
          devenir habitant
        </Link>
        .
      </p>
    );
  }

  const [{ data: offers }, { data: availabilities }] = await Promise.all([
    supabase.from("offers").select("type, price_cents, active").eq("resident_id", resident.id),
    supabase
      .from("availabilities")
      .select("weekday, start_time, end_time")
      .eq("resident_id", resident.id)
      .order("weekday")
      .order("start_time"),
  ]);

  const existingOffers: ExistingOffer[] = (offers ?? []).map((o) => ({
    type: o.type as OfferType,
    price: o.price_cents / 100,
    active: o.active,
  }));
  // La base renvoie « 18:30:00 » : on garde « 18:30 ».
  const existingSlots: Slot[] = (availabilities ?? []).map((a) => ({
    weekday: a.weekday,
    start: String(a.start_time).slice(0, 5),
    end: String(a.end_time).slice(0, 5),
  }));

  return (
    <div className="flex flex-col gap-8">
      {resident.verification_status !== "verifie" && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Ton domicile n&apos;est pas encore vérifié : tu peux préparer tes offres, elles seront visibles dès la
          validation.
        </p>
      )}
      <section className="rounded-2xl border bg-white border-brume p-5">
        <h2 className="mb-1 text-lg font-semibold">Recevoir mes paiements</h2>
        {resident.stripe_ready ? (
          <p className="text-sm text-verifie">
            ✅ Ton compte bancaire est connecté. Tu reçois 80 % de chaque échange une fois qu&apos;il a eu lieu.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-ardoise">
              Pour être réservé et payé, connecte ton compte bancaire. Le formulaire est géré par Stripe, notre
              prestataire de paiement : nous ne voyons jamais ton IBAN.
            </p>
            {stripe === "erreur" && (
              <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                La connexion à Stripe a échoué. Message de Stripe : « {detail ?? "inconnu"} »
              </p>
            )}
            {stripe === "incomplet" && (
              <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                Il manque encore des informations chez Stripe. Clique à nouveau pour terminer.
              </p>
            )}
            <form action={connectStripe}>
              <button className="rounded-xl bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-survol">
                {resident.stripe_account_id ? "Terminer la connexion" : "Connecter mon compte bancaire"}
              </button>
            </form>
          </>
        )}
      </section>
      <section>
        <h2 className="mb-1 text-lg font-semibold">Mes offres</h2>
        <p className="mb-4 text-sm text-ardoise">
          Active les formats que tu proposes et choisis ton prix. La plateforme garde 20 %.
        </p>
        <OffersForm existing={existingOffers} />
      </section>
      <section>
        <h2 className="mb-1 text-lg font-semibold">Mes disponibilités</h2>
        <p className="mb-4 text-sm text-ardoise">
          Les créneaux où tu peux faire un appel, une balade ou une visite du soir, chaque semaine.
        </p>
        <AvailabilityForm existing={existingSlots} />
      </section>
    </div>
  );
}

export default function MesOffresPage({ searchParams }: PageProps<"/mes-offres">) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold">Espace habitant</h1>
      <nav className="mb-8 flex flex-wrap gap-4 text-sm">
        <span className="font-semibold text-verifie">Offres, créneaux et paiements</span>
        <Link href="/mes-reservations" className="text-ardoise underline hover:text-encre">
          Demandes reçues et gains
        </Link>
      </nav>
      <Suspense fallback={<p className="text-ardoise">Chargement…</p>}>
        <Content searchParams={searchParams as Promise<{ stripe?: string; detail?: string }>} />
      </Suspense>
    </main>
  );
}
