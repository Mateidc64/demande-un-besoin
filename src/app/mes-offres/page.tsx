// Page /mes-offres : l'habitant choisit ses offres, ses prix et ses disponibilités.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { OfferType } from "@/lib/offres";
import { createClient } from "@/lib/supabase/server";
import type { Slot } from "./actions";
import { AvailabilityForm } from "./availability-form";
import { OffersForm, type ExistingOffer } from "./offers-form";
import { connectStripe } from "./stripe-actions";

async function Content({ searchParams }: { searchParams: Promise<{ stripe?: string }> }) {
  const { stripe } = await searchParams;
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
        <Link href="/devenir-habitant" className="font-medium text-emerald-700 underline">
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
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Ton domicile n&apos;est pas encore vérifié : tu peux préparer tes offres, elles seront visibles dès la
          validation.
        </p>
      )}
      <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-1 text-lg font-semibold">Recevoir mes paiements</h2>
        {resident.stripe_ready ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            ✅ Ton compte bancaire est connecté. Tu reçois 80 % de chaque échange une fois qu&apos;il a eu lieu.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
              Pour être réservé et payé, connecte ton compte bancaire. Le formulaire est géré par Stripe, notre
              prestataire de paiement : nous ne voyons jamais ton IBAN.
            </p>
            {stripe === "incomplet" && (
              <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Il manque encore des informations chez Stripe. Clique à nouveau pour terminer.
              </p>
            )}
            <form action={connectStripe}>
              <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                {resident.stripe_account_id ? "Terminer la connexion" : "Connecter mon compte bancaire"}
              </button>
            </form>
          </>
        )}
      </section>
      <section>
        <h2 className="mb-1 text-lg font-semibold">Mes offres</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Active les formats que tu proposes et choisis ton prix. La plateforme garde 20 %.
        </p>
        <OffersForm existing={existingOffers} />
      </section>
      <section>
        <h2 className="mb-1 text-lg font-semibold">Mes disponibilités</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
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
      <h1 className="mb-8 text-2xl font-bold">Mes offres et disponibilités</h1>
      <Suspense fallback={<p className="text-zinc-500">Chargement…</p>}>
        <Content searchParams={searchParams as Promise<{ stripe?: string }>} />
      </Suspense>
    </main>
  );
}
