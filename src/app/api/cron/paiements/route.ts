// Tâche automatique (une fois par jour, voir vercel.json) : annule les demandes non payées, termine
// les échanges 48 h après le créneau et exécute les remboursements et versements en attente.
// Vercel l'appelle avec l'en-tête « Authorization: Bearer <CRON_SECRET> ».
import { runMoneyTasks } from "@/lib/paiements";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Non autorisé", { status: 401 });
  }
  const { error } = await createAdminClient().rpc("booking_maintenance");
  if (error) return new Response(error.message, { status: 500 });
  const result = await runMoneyTasks();
  return Response.json(result);
}
