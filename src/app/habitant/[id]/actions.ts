"use server";

// Signalement d'un profil (faux voisin, agent immobilier, comportement inapproprié…).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ReportState = { error?: string; message?: string };

export async function reportProfile(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");

  const targetId = String(formData.get("target_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 10) return { error: "Explique en quelques mots (10 caractères minimum)." };
  if (reason.length > 1000) return { error: "1000 caractères maximum." };
  if (targetId === auth.user.id) return { error: "Tu ne peux pas te signaler toi-même." };

  const { error } = await supabase.from("reports").insert({ author_id: auth.user.id, target_id: targetId, reason });
  if (error) return { error: "Le signalement n'a pas pu être envoyé. Réessaie." };
  return { message: "Merci, ton signalement a bien été envoyé. Nous allons l'examiner." };
}
