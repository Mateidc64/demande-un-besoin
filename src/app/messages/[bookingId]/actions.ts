"use server";

// Envoi d'un message. La base vérifie que l'utilisateur participe bien à cette réservation payée.
import { revalidatePath } from "next/cache";
import { sendMessageEmail } from "@/lib/emails";
import { createClient } from "@/lib/supabase/server";

export type MessageState = { error?: string; sentAt?: number };

const ERRORS: Record<string, string> = {
  "Message vide": "Écris un message avant d'envoyer.",
  "Message trop long": "Message trop long (2 000 caractères maximum).",
  "Conversation indisponible": "Cette conversation n'est plus disponible.",
  "Connexion requise": "Connecte-toi pour envoyer un message.",
};

export async function sendMessage(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const bookingId = String(formData.get("booking_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: ERRORS["Message vide"] };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: ERRORS["Connexion requise"] };

  const { error } = await supabase.rpc("send_message", { p_booking_id: bookingId, p_body: body });
  if (error) {
    const known = Object.keys(ERRORS).find((k) => error.message.includes(k));
    return { error: known ? ERRORS[known] : "Le message n'a pas pu être envoyé. Réessaie." };
  }
  await sendMessageEmail(bookingId, auth.user.id, body);
  revalidatePath(`/messages/${bookingId}`);
  return { sentAt: new Date().getTime() };
}
