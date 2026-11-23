"use server";

// Enregistrement des offres et des disponibilités de l'habitant connecté.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OFFER_TYPES, OFFERS, type OfferType } from "@/lib/offres";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { error?: string; message?: string };

async function getResident() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");
  const { data: resident } = await supabase
    .from("residents")
    .select("id")
    .eq("profile_id", auth.user.id)
    .maybeSingle();
  if (!resident) redirect("/devenir-habitant");
  return { supabase, residentId: resident.id as string };
}

export async function saveOffers(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, residentId } = await getResident();

  const rows = [];
  for (const type of OFFER_TYPES) {
    const offer = OFFERS[type as OfferType];
    const active = formData.get(`${type}_active`) === "on";
    const price = Number(String(formData.get(`${type}_price`) ?? "").replace(",", "."));
    if (active && (!Number.isFinite(price) || price < offer.minPrice || price > offer.maxPrice)) {
      return { error: `${offer.label} : le prix doit être entre ${offer.minPrice} € et ${offer.maxPrice} €.` };
    }
    rows.push({
      resident_id: residentId,
      type,
      duration_minutes: offer.durationMinutes,
      price_cents: Math.round((Number.isFinite(price) && price > 0 ? price : offer.defaultPrice) * 100),
      active,
    });
  }
  if (!rows.some((r) => r.active)) return { error: "Active au moins une offre." };

  const { error } = await supabase.from("offers").upsert(rows, { onConflict: "resident_id,type" });
  if (error) return { error: "Impossible d'enregistrer tes offres. Réessaie." };

  revalidatePath("/mes-offres");
  return { message: "Offres enregistrées ✅" };
}

export type Slot = { weekday: number; start: string; end: string };

export async function saveAvailabilities(slots: Slot[]): Promise<SaveState> {
  const { supabase, residentId } = await getResident();

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  for (const s of slots) {
    if (!Number.isInteger(s.weekday) || s.weekday < 1 || s.weekday > 7) return { error: "Jour invalide." };
    if (!timePattern.test(s.start) || !timePattern.test(s.end)) return { error: "Heure invalide." };
    if (s.end <= s.start) return { error: "L'heure de fin doit être après l'heure de début." };
  }
  if (slots.length > 30) return { error: "30 créneaux maximum." };

  // On remplace tous les créneaux par la nouvelle liste.
  const { error: deleteError } = await supabase.from("availabilities").delete().eq("resident_id", residentId);
  if (deleteError) return { error: "Impossible d'enregistrer tes disponibilités. Réessaie." };

  if (slots.length > 0) {
    const { error } = await supabase.from("availabilities").insert(
      slots.map((s) => ({ resident_id: residentId, weekday: s.weekday, start_time: s.start, end_time: s.end })),
    );
    if (error) return { error: "Impossible d'enregistrer tes disponibilités. Réessaie." };
  }

  revalidatePath("/mes-offres");
  return { message: "Disponibilités enregistrées ✅" };
}
