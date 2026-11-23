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
    // Stripe demande désormais l'API « Accounts v2 » pour les nouveaux comptes connectés.
    // Configuration « recipient » : l'habitant reçoit des virements de la plateforme.
    const account = await stripe.v2.core.accounts.create({
      contact_email: email ?? undefined,
      dashboard: "express",
      identity: { country: "fr", entity_type: "individual" },
      configuration: {
        recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } },
      },
      defaults: {
        currency: "eur",
        locales: ["fr-FR"],
        responsibilities: { fees_collector: "application", losses_collector: "application" },
      },
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
  const link = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        refresh_url: `${base}/stripe/retour?relancer=1`,
        return_url: `${base}/stripe/retour`,
      },
    },
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
