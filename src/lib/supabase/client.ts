// Connexion à Supabase depuis le navigateur (dans les composants "use client").
import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./config";

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase n'est pas configuré : remplis .env.local (voir .env.example).");
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
