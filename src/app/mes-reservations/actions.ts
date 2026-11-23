"use server";

// Actions sur une réservation. La base vérifie qui a le droit de faire quoi et décide s'il faut
// rembourser le chercheur ou payer l'habitant ; ensuite on exécute ces opérations chez Stripe.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendBookingEmails, type EmailKind } from "@/lib/emails";
import { checkoutUrlForSeeker, tryRunMoneyTasks } from "@/lib/paiements";
import { createClient } from "@/lib/supabase/server";

function bookingId(formData: FormData) {
  return String(formData.get("booking_id") ?? "");
}

async function callAndSettle(fn: string, args: Record<string, unknown>, email?: EmailKind) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (!error) {
    await tryRunMoneyTasks();
    if (email) await sendBookingEmails(String(args.p_booking_id), email);
  }
  revalidatePath("/mes-reservations");
}

export async function respondToBooking(formData: FormData): Promise<void> {
  const accept = formData.get("decision") === "accepter";
  await callAndSettle(
    "respond_booking",
    { p_booking_id: bookingId(formData), p_accept: accept },
    accept ? "confirme" : "annule",
  );
}

export async function cancelBooking(formData: FormData): Promise<void> {
  await callAndSettle("cancel_booking", { p_booking_id: bookingId(formData) }, "annule");
}

export async function confirmDone(formData: FormData): Promise<void> {
  await callAndSettle("confirm_booking_done", { p_booking_id: bookingId(formData) }, "avis");
}

export async function reportProblem(formData: FormData): Promise<void> {
  await callAndSettle("report_booking_problem", { p_booking_id: bookingId(formData) });
}

export async function payBooking(formData: FormData): Promise<void> {
  const url = await checkoutUrlForSeeker(bookingId(formData));
  redirect(url ?? "/mes-reservations?paiement=erreur");
}

export type ReviewState = { error?: string; done?: boolean };

export async function leaveReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const supabase = await createClient();
  const rating = Number(formData.get("rating"));
  if (!rating) return { error: "Choisis une note de 1 à 5 étoiles." };
  const { error } = await supabase.rpc("leave_review", {
    p_booking_id: bookingId(formData),
    p_rating: rating,
    p_comment: String(formData.get("comment") ?? "") || null,
  });
  if (error) {
    return { error: error.message.includes("déjà") ? "Tu as déjà laissé un avis." : "L'avis n'a pas pu être enregistré." };
  }
  revalidatePath("/mes-reservations");
  return { done: true };
}
