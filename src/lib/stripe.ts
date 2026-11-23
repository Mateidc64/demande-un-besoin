// Connexion à Stripe (uniquement côté serveur). La clé secrète vient des réglages de Vercel.
import "server-only";
import Stripe from "stripe";
import { headers } from "next/headers";

let client: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manque dans les réglages de Vercel.");
  if (!client) client = new Stripe(key);
  return client;
}

// Adresse du site (ex. https://demande-un-besoin.vercel.app), pour les liens de retour de Stripe.
export async function siteUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
