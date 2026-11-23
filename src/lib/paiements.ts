// Tout ce qui touche à l'argent : ouvrir un paiement, enregistrer un paiement reçu, et exécuter les
// remboursements et versements que la base a marqués comme dus.
import "server-only";
import type Stripe from "stripe";
import { OFFERS, type OfferType } from "@/lib/offres";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingEmails } from "@/lib/emails";
import { getStripe, siteUrl } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

// Ouvre une page de paiement Stripe pour une réservation (valable 30 minutes).
export async function createCheckout(
  booking: { id: string; amount_cents: number; offer_type: OfferType; seeker_email?: string | null },
  baseUrl: string,
) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: booking.seeker_email ?? undefined,
    client_reference_id: booking.id,
    metadata: { booking_id: booking.id },
    payment_intent_data: { transfer_group: booking.id, metadata: { booking_id: booking.id } },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: booking.amount_cents,
          product_data: { name: `Demande à un voisin : ${OFFERS[booking.offer_type].label}` },
        },
      },
    ],
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${baseUrl}/paiement/retour?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/mes-reservations?paiement=annule`,
  });
  return session.url;
}

// Page de paiement pour une réservation du chercheur connecté, encore à payer. null si impossible.
export async function checkoutUrlForSeeker(bookingId: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, amount_cents, status, paid_at, offers(type)")
    .eq("id", bookingId)
    .eq("seeker_id", auth.user.id)
    .maybeSingle();
  if (!booking || booking.status !== "en_attente" || booking.paid_at) return null;
  const offer = booking.offers as unknown as { type: OfferType } | null;
  try {
    return await createCheckout(
      {
        id: booking.id,
        amount_cents: booking.amount_cents,
        offer_type: offer?.type ?? "appel",
        seeker_email: auth.user.email,
      },
      await siteUrl(),
    );
  } catch (e) {
    console.error("createCheckout", e);
    return null;
  }
}

// Enregistre un paiement terminé (appelé par le webhook et par la page de retour : sans effet la
// deuxième fois).
export async function recordCheckout(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id ?? session.client_reference_id;
  if (!bookingId || session.payment_status !== "paid" || !session.payment_intent) return false;

  const stripe = getStripe();
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent.id;
  const pi = await stripe.paymentIntents.retrieve(piId);
  const charge = typeof pi.latest_charge === "string" ? pi.latest_charge : (pi.latest_charge?.id ?? null);

  const admin = createAdminClient();
  const { error } = await admin.rpc("record_booking_payment", {
    p_booking_id: bookingId,
    p_payment_intent: piId,
    p_charge: charge,
  });
  if (error) throw new Error(error.message);
  await runMoneyTasks();
  await sendBookingEmails(bookingId, "paye");
  return true;
}

type MoneyTask = {
  booking_id: string;
  kind: "remboursement" | "versement";
  payment_intent: string | null;
  charge: string | null;
  amount_cents: number;
  destination: string | null;
};

// Exécute les remboursements et versements dus. Les « clés d'idempotence » garantissent que Stripe ne
// fait jamais deux fois la même opération, même si cette fonction tourne deux fois en même temps.
export async function runMoneyTasks() {
  const admin = createAdminClient();
  const stripe = getStripe();
  const { data, error } = await admin.rpc("booking_money_tasks");
  if (error) throw new Error(error.message);

  const problems: string[] = [];
  for (const task of (data ?? []) as MoneyTask[]) {
    try {
      if (task.kind === "remboursement" && task.payment_intent) {
        const refund = await stripe.refunds.create(
          { payment_intent: task.payment_intent, metadata: { booking_id: task.booking_id } },
          { idempotencyKey: `remboursement-${task.booking_id}` },
        );
        await admin.rpc("record_refund", { p_booking_id: task.booking_id, p_refund_id: refund.id });
      } else if (task.kind === "versement" && task.destination) {
        const transfer = await stripe.transfers.create(
          {
            amount: task.amount_cents,
            currency: "eur",
            destination: task.destination,
            transfer_group: task.booking_id,
            ...(task.charge ? { source_transaction: task.charge } : {}),
            metadata: { booking_id: task.booking_id },
          },
          { idempotencyKey: `versement-${task.booking_id}` },
        );
        await admin.rpc("record_transfer", { p_booking_id: task.booking_id, p_transfer_id: transfer.id });
      }
    } catch (e) {
      // On réessaiera au prochain passage (tâche automatique quotidienne ou prochaine action).
      problems.push(`${task.kind} ${task.booking_id} : ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (problems.length) console.error("Paiements en attente :", problems);
  return { done: (data ?? []).length - problems.length, failed: problems.length };
}

// Version « sans risque » pour les actions des utilisateurs : si Stripe ou la clé manque, on ne bloque
// pas la page, la tâche quotidienne s'en chargera.
export async function tryRunMoneyTasks() {
  try {
    await runMoneyTasks();
  } catch (e) {
    console.error("runMoneyTasks", e);
  }
}

// Vérifie chez Stripe si le compte de l'habitant peut recevoir des versements.
export async function refreshResidentStripe(residentId: string, accountId: string) {
  const account = await getStripe().v2.core.accounts.retrieve(accountId, {
    include: ["configuration.recipient"],
  });
  const transfers = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers;
  const ready = transfers?.status === "active";
  await createAdminClient().rpc("set_resident_stripe", {
    p_resident_id: residentId,
    p_account_id: accountId,
    p_ready: ready,
  });
  return ready;
}
