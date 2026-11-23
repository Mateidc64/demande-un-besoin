// Le "proxy" s'exécute avant chaque page. Ici il sert seulement à garder
// la connexion Supabase de l'utilisateur à jour.
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Ignore les fichiers statiques (images, icônes…) pour aller plus vite.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
