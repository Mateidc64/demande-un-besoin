"use server";

// Actions sur une réservation. La base vérifie qui a le droit de faire quoi et décide s'il faut
// rembourser le chercheur ou payer l'habitant ; ensuite on exécute ces opérations chez Stripe.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkoutUrlForSeeker, tryRunMoneyTasks } from "@/lib/paiements";
import { createClient } from "@/lib/supabase/server";

function bookingId(formData: FormData) {
  return String(formData.get("booking_id") ?? "");
}

async function callAndSettle(fn: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (!error) await tryRunMoneyTasks();
  revalidatePath("/mes-reservations");
}

export async function respondToBooking(formData: FormData): Promise<void> {
  await callAndSettle("respond_booking", {
    p_booking_id: bookingId(formData),
    p_accept: formData.get("decision") === "accepter",
  });
}

export async function cancelBooking(formData: FormData): Promise<void> {
  await callAndSettle("cancel_booking", { p_booking_id: bookingId(formData) });
}

export async function confirmDone(formData: FormData): Promise<void> {
  await callAndSettle("confirm_booking_done", { p_booking_id: bookingId(formData) });
}

export async function reportProblem(formData: FormData): Promise<void> {
  await callAndSettle("report_booking_problem", { p_booking_id: bookingId(formData) });
}

export async function payBooking(formData: FormData): Promise<void> {
  const url = await checkoutUrlForSeeker(bookingId(formData));
  redirect(url ?? "/mes-reservations?paiement=erreur");
}
