"use server";

// Envoi d'une demande de réservation (toutes les règles sont vérifiées par la base).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type BookingState = { error?: string };

const ERRORS: Record<string, string> = {
  "Offre indisponible": "Cette offre n'est plus disponible.",
  "Impossible de réserver sa propre offre": "Tu ne peux pas réserver ta propre offre.",
  "Adresse du bien manquante": "Indique l'adresse du logement qui t'intéresse.",
  "Questions manquantes": "Écris tes questions (10 caractères minimum).",
  "Créneau indisponible": "Ce créneau vient d'être pris. Choisis-en un autre.",
};

export async function requestBooking(_prev: BookingState, formData: FormData): Promise<BookingState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");

  const { error } = await supabase.rpc("create_booking", {
    p_offer_id: String(formData.get("offer_id") ?? ""),
    p_starts_at: String(formData.get("starts_at") ?? "") || null,
    p_target_address: String(formData.get("target_address") ?? ""),
    p_message: String(formData.get("message") ?? "") || null,
  });
  if (error) {
    const known = Object.keys(ERRORS).find((k) => error.message.includes(k));
    return { error: known ? ERRORS[known] : "La réservation n'a pas pu être envoyée. Réessaie." };
  }

  redirect("/mes-reservations?envoyee=1");
}
