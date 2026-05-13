import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * Matcher: on exclut les ressources statiques et le callback OAuth
 * (qui doit pouvoir s'exécuter sans pré-redirection).
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff2?)$).*)",
  ],
};
