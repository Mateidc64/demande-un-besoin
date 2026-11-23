"use server";

// Actions de la page /compte. Chacune vérifie d'abord que la personne est bien connectée.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { translateAuthError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string };

async function getUserOrRedirect() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/connexion");
  return { supabase, user: data.user };
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await getUserOrRedirect();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  if (!firstName) return { error: "Le prénom est obligatoire." };

  const { error } = await supabase
    .from("profiles")
    .update({ first_name: firstName, last_name: lastName || null })
    .eq("id", user.id);
  if (error) return { error: "Impossible d'enregistrer. Réessaie." };

  revalidatePath("/compte");
  return { message: "Informations enregistrées." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await getUserOrRedirect();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  if (password !== confirm) return { error: "Les deux mots de passe ne sont pas identiques." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: translateAuthError(error.message) };
  return { message: "Mot de passe modifié." };
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await getUserOrRedirect();
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "SUPPRIMER") {
    return { error: "Écris SUPPRIMER pour confirmer." };
  }

  // Fonction de la base qui supprime le compte de la personne connectée (et seulement elle).
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    return {
      error:
        "Impossible de supprimer le compte pour l'instant (des réservations y sont peut-être liées). Écris-nous pour qu'on s'en occupe.",
    };
  }

  await supabase.auth.signOut();
  redirect("/?compte=supprime");
}
