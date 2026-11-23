// Adresse /auth/callback : c'est ici que l'on revient après avoir cliqué sur le lien
// de confirmation reçu par e-mail, ou après la connexion avec Google.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/compte";
  // Sécurité : on ne redirige que vers une page de notre propre site.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/compte";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }

  const message = "Le lien a expiré ou n'est pas valide. Reconnecte-toi.";
  return NextResponse.redirect(`${origin}/connexion?erreur=${encodeURIComponent(message)}`);
}
