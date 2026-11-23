// Connexion à Supabase côté serveur (pages, actions serveur, routes API).
// Il faut créer une nouvelle connexion à chaque requête.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./config";

export async function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase n'est pas configuré : remplis .env.local (voir .env.example).");
  }
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis une page : impossible d'écrire les cookies ici.
          // Ce n'est pas grave, src/proxy.ts s'en charge à chaque requête.
        }
      },
    },
  });
}
