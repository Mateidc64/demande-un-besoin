// Connexion « administrateur » à Supabase, avec la clé service_role.
// Uniquement côté serveur (webhook Stripe, versements) : cette clé contourne les règles d'accès,
// elle ne doit jamais arriver dans le navigateur. Elle vient des réglages de Vercel.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manque dans les réglages de Vercel.");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
