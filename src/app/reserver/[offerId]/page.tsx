// Page /reserver/[offerId] : réserver une offre d'un habitant.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OFFERS, type OfferType } from "@/lib/offres";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "./booking-form";

const UUID = /^[0-9a-f-]{36}$/i;

async function Content({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  if (!UUID.test(offerId)) notFound();

  const supabase = await createClient();
  const { data: offer } = await supabase
    .from("offers")
    .select("id, type, price_cents, resident_id, active")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer || !offer.active) notFound();

  const { data: profiles } = await supabase.rpc("public_resident_profile", { p_resident_id: offer.resident_id });
  const resident = (profiles as { first_name: string | null; street_name: string | null }[] | null)?.[0];
  if (!resident) notFound();

  const { data: auth } = await supabase.auth.getUser();
  const info = OFFERS[offer.type as OfferType];
  const isWritten = offer.type === "question_ecrite";

  const { data: slotRows } = isWritten
    ? { data: [] }
    : await supabase.rpc("available_slots", { p_offer_id: offer.id, p_days: 14 });
  const slots = ((slotRows ?? []) as { starts_at: string }[]).map((s) => s.starts_at);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border bg-white border-brume p-5">
        <p className="text-sm text-ardoise">
          Avec{" "}
          <Link href={`/habitant/${offer.resident_id}`} className="font-medium text-lien underline">
            {resident.first_name}
          </Link>{" "}
          · {resident.street_name}
        </p>
        <p className="mt-1 text-lg font-semibold">{info.label}</p>
        <p className="text-sm text-ardoise">{info.description}</p>
        <p className="mt-2 text-xl font-bold">{offer.price_cents / 100} €</p>
      </div>

      {auth.user ? (
        <BookingForm offerId={offer.id} isWritten={isWritten} slots={slots} />
      ) : (
        <p>
          Pour réserver,{" "}
          <Link href="/connexion" className="font-medium text-lien underline">
            connecte-toi ou crée un compte
          </Link>
          .
        </p>
      )}
    </div>
  );
}

export default function ReserverPage({ params }: PageProps<"/reserver/[offerId]">) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Réserver</h1>
      <Suspense fallback={<p className="text-ardoise">Chargement…</p>}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}
