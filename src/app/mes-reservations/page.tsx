// Page /mes-reservations : mes demandes (chercheur) et les demandes reçues (tableau de bord habitant).
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { formatDateTime } from "@/lib/dates";
import { OFFERS, type OfferType } from "@/lib/offres";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking, confirmDone, payBooking, reportProblem, respondToBooking } from "./actions";

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
  paid: boolean;
  refunded: boolean;
  resident_paid: boolean;
  payment_open: boolean;
};

const STATUS: Record<Booking["status"], { label: string; className: string }> = {
  en_attente: { label: "En attente", className: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200" },
  confirmee: { label: "Confirmée", className: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
  terminee: { label: "Terminée", className: "bg-zinc-100 dark:bg-zinc-800" },
  annulee: { label: "Annulée", className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800" },
  litige: { label: "Litige", className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
};

function statusOf(b: Booking) {
  if (b.status === "en_attente" && !b.paid) return { label: "À payer", className: STATUS.en_attente.className };
  if (b.status === "en_attente") return { label: "En attente de réponse", className: STATUS.en_attente.className };
  return STATUS[b.status];
}

function moneyNote(b: Booking) {
  if (b.refunded) return "Remboursé en totalité.";
  if (b.status === "annulee" && b.paid && b.resident_paid) return "Annulée moins de 24 h avant : l'habitant a été payé.";
  if (b.my_role === "habitant" && b.status === "terminee") return b.resident_paid ? "Versement envoyé ✅" : "Versement en cours.";
  if (b.my_role === "habitant" && b.status === "litige") return "Un problème a été signalé : l'équipe regarde avant le versement.";
  return null;
}

// Heure actuelle, lue une seule fois par affichage de la page.
function currentTime() {
  return new Date().getTime();
}

const BUTTON = "rounded-lg px-4 py-2 text-sm";

function BookingCard({ b, now }: { b: Booking; now: number }) {
  const isWritten = b.offer_type === "question_ecrite";
  const status = statusOf(b);
  const isSeeker = b.my_role === "chercheur";
  const startsAt = new Date(b.starts_at).getTime();
  const isPast = startsAt <= now;
  const lessThan24h = startsAt - now < 24 * 3600 * 1000;
  const note = moneyNote(b);

  const canPay = isSeeker && b.payment_open;
  const canRespond = !isSeeker && b.status === "en_attente" && b.paid;
  const canConfirm = isSeeker && b.status === "confirmee" && isPast;
  const canCancel =
    (isSeeker && (b.status === "en_attente" || (b.status === "confirmee" && !isPast))) ||
    (!isSeeker && b.status === "confirmee");
  const cancelLabel =
    isSeeker && b.status === "confirmee" && lessThan24h ? "Annuler (non remboursé, moins de 24 h)" : "Annuler";

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
        {isSeeker ? (
          <>Prix : <strong>{b.amount_cents / 100} €</strong>{b.paid && " (payé)"}</>
        ) : (
          <>Tu recevras : <strong>{(b.amount_cents - b.commission_cents) / 100} €</strong></>
        )}
      </p>
      {note && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{note}</p>}
      {b.contact_info && (
        <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-950">
          📞 Contact de {b.other_first_name} : <strong>{b.contact_info}</strong>
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {canPay && (
          <form action={payBooking}>
            <input type="hidden" name="booking_id" value={b.booking_id} />
            <button className={`${BUTTON} bg-emerald-600 font-semibold text-white`}>Payer {b.amount_cents / 100} €</button>
          </form>
        )}
        {canRespond && (
          <form action={respondToBooking} className="flex gap-2">
            <input type="hidden" name="booking_id" value={b.booking_id} />
            <button name="decision" value="accepter" className={`${BUTTON} bg-emerald-600 font-semibold text-white`}>
              Accepter
            </button>
            <button name="decision" value="refuser" className={`${BUTTON} border border-zinc-300 dark:border-zinc-700`}>
              Refuser (le chercheur est remboursé)
            </button>
          </form>
        )}
        {canConfirm && (
          <>
            <form action={confirmDone}>
              <input type="hidden" name="booking_id" value={b.booking_id} />
              <button className={`${BUTTON} bg-emerald-600 font-semibold text-white`}>L&apos;échange a bien eu lieu</button>
            </form>
            <form action={reportProblem}>
              <input type="hidden" name="booking_id" value={b.booking_id} />
              <button className={`${BUTTON} border border-red-300 text-red-700 dark:border-red-800`}>
                Signaler un problème
              </button>
            </form>
          </>
        )}
        {canCancel && (
          <form action={cancelBooking}>
            <input type="hidden" name="booking_id" value={b.booking_id} />
            <button className={`${BUTTON} border border-red-300 text-red-700 dark:border-red-800`}>
              {isSeeker ? cancelLabel : "Annuler (le chercheur est remboursé)"}
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

async function Content({ searchParams }: { searchParams: Promise<{ payee?: string; paiement?: string }> }) {
  const { payee, paiement } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");

  const { data } = await supabase.rpc("bookings_overview");
  const now = currentTime();
  // Les demandes jamais payées (plus de 30 min) sont cachées : elles seront annulées automatiquement.
  const bookings = ((data ?? []) as Booking[]).filter(
    (b) => !(b.status === "en_attente" && !b.paid && !b.payment_open),
  );
  const asSeeker = bookings.filter((b) => b.my_role === "chercheur");
  const asResident = bookings.filter((b) => b.my_role === "habitant");
  const pendingForMe = asResident.filter((b) => b.status === "en_attente").length;
  const share = (b: Booking) => b.amount_cents - b.commission_cents;
  const earned = asResident.filter((b) => b.resident_paid).reduce((sum, b) => sum + share(b), 0);
  const upcoming = asResident
    .filter((b) => b.status === "confirmee" || (b.status === "terminee" && !b.resident_paid))
    .reduce((sum, b) => sum + share(b), 0);

  return (
    <div className="flex flex-col gap-10">
      {payee && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          Paiement reçu ✅ Ta demande est envoyée à l&apos;habitant. S&apos;il refuse, tu es remboursé en totalité.
        </p>
      )}
      {paiement === "annule" && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Paiement annulé. Tu peux payer dans les 30 minutes, sinon la demande est annulée.
        </p>
      )}
      {(paiement === "erreur" || paiement === "verification") && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {paiement === "erreur"
            ? "Le paiement n'a pas pu s'ouvrir. Réessaie dans un instant."
            : "Nous vérifions ton paiement : rafraîchis la page dans une minute."}
        </p>
      )}

      {asResident.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">Demandes reçues (habitant)</h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            {pendingForMe} en attente de ta réponse · Déjà versé : <strong>{earned / 100} €</strong> · À venir : <strong>{upcoming / 100} €</strong> ·{" "}
            <Link href="/mes-offres" className="text-emerald-700 underline">
              Modifier mes offres
            </Link>
          </p>
          <ul className="flex flex-col gap-4">
            {asResident.map((b) => (
              <BookingCard key={b.booking_id} b={b} now={now} />
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
              <BookingCard key={b.booking_id} b={b} now={now} />
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
        <Content searchParams={searchParams as Promise<{ payee?: string; paiement?: string }>} />
      </Suspense>
    </main>
  );
}
