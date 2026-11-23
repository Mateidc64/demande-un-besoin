"use server";

// Enregistre la demande « devenir habitant ». Les fichiers (photo, justificatif) ont déjà été
// envoyés par le navigateur dans le stockage Supabase : on reçoit seulement leur emplacement.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HOUSING_TYPES } from "./constants";

export type ResidentApplication = {
  firstName: string;
  phone: string;
  avatarUrl: string | null;
  address: {
    label: string;
    id: string;
    street: string | null;
    city: string | null;
    district: string | null;
    lat: number;
    lng: number;
  };
  moveInYear: number;
  housingType: string;
  bio: string;
  notAgentConfirmed: boolean;
  proofPath: string;
};

export async function submitResidentApplication(
  application: ResidentApplication,
): Promise<{ error: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/connexion");

  // Vérifications (on ne fait jamais confiance au navigateur).
  const a = application;
  const currentYear = new Date().getFullYear();
  const phoneDigits = a.phone.replace(/\D/g, "");
  if (!a.firstName.trim()) return { error: "Le prénom est obligatoire." };
  if (phoneDigits.length < 10 || phoneDigits.length > 15) return { error: "Le numéro de téléphone n'est pas valide." };
  if (!a.address?.label || !Number.isFinite(a.address.lat) || !Number.isFinite(a.address.lng)) {
    return { error: "Choisis ton adresse dans la liste proposée." };
  }
  if (!Number.isInteger(a.moveInYear) || a.moveInYear < 1900 || a.moveInYear > currentYear) {
    return { error: "L'année d'emménagement n'est pas valide." };
  }
  if (!(HOUSING_TYPES as readonly string[]).includes(a.housingType)) return { error: "Choisis un type de logement." };
  if (a.bio.trim().length < 30) return { error: "Ta présentation doit faire au moins 30 caractères." };
  if (a.bio.length > 1000) return { error: "Ta présentation doit faire moins de 1000 caractères." };
  if (!a.notAgentConfirmed) return { error: "Tu dois cocher la case de confirmation." };
  if (!a.proofPath.startsWith(`${user.id}/`)) return { error: "Le justificatif n'a pas été envoyé correctement." };

  // 1. La fiche habitant (statut « en attente » par défaut).
  const { data: resident, error: residentError } = await supabase
    .from("residents")
    .insert({
      profile_id: user.id,
      address_label: a.address.label,
      building_key: a.address.id,
      street_name: a.address.street,
      city: a.address.city,
      neighborhood: a.address.district,
      location: `SRID=4326;POINT(${a.address.lng} ${a.address.lat})`,
      move_in_year: a.moveInYear,
      housing_type: a.housingType,
      bio: a.bio.trim(),
      contact_info: a.phone.trim(),
      not_agent_confirmed: true,
    })
    .select("id")
    .single();
  if (residentError || !resident) {
    if (residentError?.code === "23505") return { error: "Tu as déjà envoyé une demande." };
    return { error: "Impossible d'enregistrer ta demande. Réessaie." };
  }

  // 2. Le justificatif, que l'admin validera.
  const { error: proofError } = await supabase
    .from("proof_documents")
    .insert({ resident_id: resident.id, file_path: a.proofPath });
  if (proofError) return { error: "Ta fiche est créée mais le justificatif n'a pas été enregistré. Écris-nous." };

  // 3. Le profil : prénom, photo, et « je suis aussi habitant ».
  await supabase
    .from("profiles")
    .update({ first_name: a.firstName.trim(), avatar_url: a.avatarUrl, is_resident: true })
    .eq("id", user.id);

  redirect("/devenir-habitant");
}
