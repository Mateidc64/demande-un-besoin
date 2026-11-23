"use server";

// Envoi d'un message. La base vérifie que l'utilisateur participe bien à la conversation,
// et masque automatiquement numéros de téléphone, e-mails et liens.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendMessageEmail } from "@/lib/emails";
import { createClient } from "@/lib/supabase/server";

export type MessageState = { error?: string; sentAt?: number; masked?: boolean };

const ERRORS: Record<string, string> = {
  "Message vide": "Écris un message avant d'envoyer.",
  "Message trop long": "Message trop long (2 000 caractères maximum).",
  "Conversation indisponible": "Cette conversation n'est pas disponible.",
  "Connexion requise": "Connecte-toi pour envoyer un message.",
};

export async function sendMessage(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const conversationId = String(formData.get("conversation_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: ERRORS["Message vide"] };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: ERRORS["Connexion requise"] };

  const { data: stored, error } = await supabase.rpc("send_conversation_message", {
    p_conversation_id: conversationId,
    p_body: body,
  });
  if (error) {
    const known = Object.keys(ERRORS).find((k) => error.message.includes(k));
    return { error: known ? ERRORS[known] : "Le message n'a pas pu être envoyé. Réessaie." };
  }
  const saved = String(stored ?? body);
  await sendMessageEmail(conversationId, auth.user.id, saved);
  revalidatePath(`/messages/${conversationId}`);
  return { sentAt: new Date().getTime(), masked: saved.includes("[masqué]") && !body.includes("[masqué]") };
}

// « Poser une question » depuis le profil d'un habitant : ouvre (ou retrouve) la conversation.
export async function startConversation(formData: FormData): Promise<void> {
  const residentId = String(formData.get("resident_id") ?? "");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");

  const { data, error } = await supabase.rpc("start_conversation", { p_resident_id: residentId });
  if (error || !data) redirect(`/habitant/${residentId}`);
  redirect(`/messages/${data}`);
}
