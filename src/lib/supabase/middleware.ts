import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/employees", "/reminders", "/feed", "/admin", "/settings", "/profile"];
const AUTH_PREFIXES = ["/login", "/register"];

const SAFE_REDIRECT = /^\/(?!\/)[A-Za-z0-9_\-./?=&%]*$/;

// Lecture directe des env vars — pas d'import de env.ts pour
// éviter tout crash au chargement du module.
function clean(v: string | undefined): string {
  if (!v) return "";
  return v.charCodeAt(0) === 0xfeff ? v.slice(1) : v;
}
const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Refresh la session Supabase à chaque requête (cookies HTTP-only) ET
 * applique les redirections d'accès. Doit être branché dans
 * src/middleware.ts via updateSession(request).
 */
export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // Si les variables d'environnement Supabase manquent, on laisse passer
  // la requête sans vérification d'auth — les gardes côté page s'en occupent.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[MIDDLEWARE] SUPABASE env vars missing — skipping auth check");
    return response;
  }

  try {
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({ request: { headers: requestHeaders } });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: "", ...options });
            response = NextResponse.next({ request: { headers: requestHeaders } });
            response.cookies.set({ name, value: "", ...options });
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname, search } = request.nextUrl;
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const isAuthRoute = AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone();
      const target = request.nextUrl.searchParams.get("redirect");
      url.pathname = target && SAFE_REDIRECT.test(target) ? target : "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  } catch (e) {
    console.error("[MIDDLEWARE] crash:", e instanceof Error ? e.message : e);
    // On laisse passer — les gardes côté page s'occuperont de l'auth.
  }

  return response;
}
