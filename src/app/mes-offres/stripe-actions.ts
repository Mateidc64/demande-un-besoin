"use server";

// Connexion du compte bancaire de l'habitant via Stripe Connect Express.
// Stripe affiche son propre formulaire (identité, IBAN) : on ne voit jamais ces informations.
import { redirect } from "next/navigation";
import { refreshResidentStripe } from "@/lib/paiements";
import { getStripe, siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function connectStripe(): Promise<void> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");
  const { data: resident } = await supabase
    .from("residents")
    .select("id, stripe_account_id")
    .eq("profile_id", auth.user.id)
    .maybeSingle();
  if (!resident) redirect("/devenir-habitant");

  // Les erreurs de Stripe sont affichées sur /mes-offres au lieu de faire planter la page.
  let url: string;
  try {
    url = await onboardingLink(resident.id, resident.stripe_account_id as string | null, auth.user.email);
  } catch (e) {
    console.error("connectStripe", e);
    const message = e instanceof Error ? e.message : String(e);
    redirect(`/mes-offres?stripe=erreur&detail=${encodeURIComponent(message.slice(0, 300))}`);
  }
  redirect(url);
}

async function onboardingLink(residentId: string, existingAccount: string | null, email?: string | null) {
  const stripe = getStripe();
  let accountId = existingAccount;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: email ?? undefined,
      business_type: "individual",
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      metadata: { resident_id: residentId },
    });
    accountId = account.id;
    const { error } = await createAdminClient().rpc("set_resident_stripe", {
      p_resident_id: residentId,
      p_account_id: accountId,
      p_ready: false,
    });
    if (error) throw new Error(`Enregistrement du compte : ${error.message}`);
  }

  const base = await siteUrl();
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${base}/stripe/retour?relancer=1`,
    return_url: `${base}/stripe/retour`,
  });
  return link.url;
}

// Vérifie l'état du compte chez Stripe (au retour du formulaire Stripe).
export async function checkStripe() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data: resident } = await supabase
    .from("residents")
    .select("id, stripe_account_id")
    .eq("profile_id", auth.user.id)
    .maybeSingle();
  if (!resident?.stripe_account_id) return false;
  return refreshResidentStripe(resident.id, resident.stripe_account_id);
}
