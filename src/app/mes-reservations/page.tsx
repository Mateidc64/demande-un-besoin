// Page /mes-reservations : mes demandes (chercheur) et les demandes reçues (tableau de bord habitant).
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { formatDateTime } from "@/lib/dates";
import { OFFERS, type OfferType } from "@/lib/offres";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking, respondToBooking } from "./actions";

type Booking = {
  booking_id: string;
  my_role: "chercheur" | "habitant";
  other_first_name: string | null;
  resident_id: string;
  offer_type: OfferType;
  duration_minutes: number;
  starts_at: string;
  target_address: string;
  message: string | null;
  status: "en_attente" | "confirmee" | "terminee" | "annulee" | "litige";
  amount_cents: number;
  commission_cents: number;
  contact_info: string | null;
};

const STATUS: Record<Booking["status"], { label: string; className: string }> = {
  en_attente: { label: "En attente", className: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200" },
  confirmee: { label: "Confirmée", className: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
  terminee: { label: "Terminée", className: "bg-zinc-100 dark:bg-zinc-800" },
  annulee: { label: "Annulée", className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800" },
  litige: { label: "Litige", className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
};

function BookingCard({ b }: { b: Booking }) {
  const isWritten = b.offer_type === "question_ecrite";
  const status = STATUS[b.status];
  const canCancel = b.status === "en_attente" || b.status === "confirmee";
  return (
    <li className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {OFFERS[b.offer_type].label} avec {b.other_first_name}
          </p>
          <p className="text-sm capitalize text-zinc-600 dark:text-zinc-400">
            {isWritten ? `Demandée le ${formatDateTime(b.starts_at)}` : formatDateTime(b.starts_at)}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
      </div>
      <p className="mt-2 text-sm">
        <span className="text-zinc-500">Logement :</span> {b.target_address}
      </p>
      {b.message && <p className="mt-1 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">« {b.message} »</p>}
      <p className="mt-2 text-sm">
        {b.my_role === "chercheur" ? (
          <>Prix : <strong>{b.amount_cents / 100} €</strong></>
        ) : (
          <>Tu recevras : <strong>{(b.amount_cents - b.commission_cents) / 100} €</strong></>
        )}
      </p>
      {b.contact_info && (
        <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-950">
          📞 Contact de {b.other_first_name} : <strong>{b.contact_info}</strong>
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {b.my_role === "habitant" && b.status === "en_attente" && (
          <form action={respondToBooking} className="flex gap-2">
            <input type="hidden" name="booking_id" value={b.booking_id} />
            <button name="decision" value="accepter" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              Accepter
            </button>
            <button name="decision" value="refuser" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
              Refuser
            </button>
          </form>
        )}
        {canCancel && !(b.my_role === "habitant" && b.status === "en_attente") && (
          <form action={cancelBooking}>
            <input type="hidden" name="booking_id" value={b.booking_id} />
            <button className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 dark:border-red-800">
              Annuler
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

async function Content({ searchParams }: { searchParams: Promise<{ envoyee?: string }> }) {
  const { envoyee } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");

  const { data } = await supabase.rpc("my_bookings");
  const bookings = (data ?? []) as Booking[];
  const asSeeker = bookings.filter((b) => b.my_role === "chercheur");
  const asResident = bookings.filter((b) => b.my_role === "habitant");
  const pendingForMe = asResident.filter((b) => b.status === "en_attente").length;
  const earnings = asResident
    .filter((b) => b.status === "confirmee" || b.status === "terminee")
    .reduce((sum, b) => sum + b.amount_cents - b.commission_cents, 0);

  return (
    <div className="flex flex-col gap-10">
      {envoyee && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          Ta demande a été envoyée ✅ L&apos;habitant va l&apos;accepter ou la refuser.
        </p>
      )}

      {asResident.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">Demandes reçues (habitant)</h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            {pendingForMe} en attente de ta réponse · Gains confirmés : <strong>{earnings / 100} €</strong> ·{" "}
            <Link href="/mes-offres" className="text-emerald-700 underline">
              Modifier mes offres
            </Link>
          </p>
          <ul className="flex flex-col gap-4">
            {asResident.map((b) => (
              <BookingCard key={b.booking_id} b={b} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Mes réservations (chercheur)</h2>
        {asSeeker.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Aucune réservation pour l&apos;instant.{" "}
            <Link href="/" className="text-emerald-700 underline">
              Chercher une adresse
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {asSeeker.map((b) => (
              <BookingCard key={b.booking_id} b={b} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function MesReservationsPage({ searchParams }: PageProps<"/mes-reservations">) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="mb-8 text-2xl font-bold">Mes réservations</h1>
      <Suspense fallback={<p className="text-zinc-500">Chargement…</p>}>
        <Content searchParams={searchParams as Promise<{ envoyee?: string }>} />
      </Suspense>
    </main>
  );
}
