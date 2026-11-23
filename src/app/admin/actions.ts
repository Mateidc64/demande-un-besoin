"use server";

// Décision de l'admin sur une demande d'habitant.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reviewResident(formData: FormData): Promise<void> {
  const residentId = String(formData.get("resident_id") ?? "");
  const approve = formData.get("decision") === "valider";
  const note = String(formData.get("note") ?? "").trim() || null;
  const proofPath = String(formData.get("proof_path") ?? "");

  const supabase = await createClient();

  // La fonction de la base vérifie elle-même que la personne connectée est admin.
  const { error } = await supabase.rpc("admin_review_resident", {
    p_resident_id: residentId,
    p_approve: approve,
    p_note: note,
  });
  if (error) throw new Error("Décision non enregistrée : " + error.message);

  // RGPD : une fois la décision prise, le justificatif est supprimé du stockage.
  if (proofPath) await supabase.storage.from("justificatifs").remove([proofPath]);

  revalidatePath("/admin");
}
