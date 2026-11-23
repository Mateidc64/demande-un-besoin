"use server";

// Actions serveur de la page /connexion : elles tournent sur le serveur, jamais dans le navigateur.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { translateAuthError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string };

// L'adresse du site (localhost en local, vercel.app en ligne) pour les liens de retour.
async function siteOrigin() {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Remplis ton e-mail et ton mot de passe." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translateAuthError(error.message) };

  redirect("/compte");
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!firstName || !email || !password) return { error: "Remplis tous les champs." };
  if (password.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Le prénom est recopié dans la table profiles automatiquement.
      data: { first_name: firstName },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/compte`,
    },
  });
  if (error) return { error: translateAuthError(error.message) };

  // Si la confirmation par e-mail est désactivée dans Supabase, on est déjà connecté.
  if (data.session) redirect("/compte");

  return {
    message: "Compte créé ! Clique sur le lien que tu viens de recevoir par e-mail pour le confirmer.",
  };
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback?next=/compte` },
  });
  if (error || !data.url) {
    redirect(`/connexion?erreur=${encodeURIComponent(translateAuthError(error?.message ?? ""))}`);
  }
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
