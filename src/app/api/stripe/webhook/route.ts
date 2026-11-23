// Webhook Stripe : Stripe appelle cette adresse quand un paiement est terminé.
// La signature prouve que le message vient bien de Stripe (secret STRIPE_WEBHOOK_SECRET).
import { recordCheckout } from "@/lib/paiements";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Webhook non configuré", { status: 400 });

  const body = await request.text();
  let event;
  try {
    event = await getStripe().webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await recordCheckout(event.data.object);
  }
  return Response.json({ received: true });
}
