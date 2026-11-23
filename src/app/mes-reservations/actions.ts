"use server";

// Réponse de l'habitant (accepter / refuser) et annulation, par le chercheur ou l'habitant.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function respondToBooking(formData: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("respond_booking", {
    p_booking_id: String(formData.get("booking_id") ?? ""),
    p_accept: formData.get("decision") === "accepter",
  });
  revalidatePath("/mes-reservations");
}

export async function cancelBooking(formData: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("cancel_booking", { p_booking_id: String(formData.get("booking_id") ?? "") });
  revalidatePath("/mes-reservations");
}
