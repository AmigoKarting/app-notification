import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

const PROTECTED_PREFIXES = ["/dashboard", "/employees", "/reminders", "/feed", "/admin"];
const AUTH_PREFIXES = ["/login", "/register"];

const SAFE_REDIRECT = /^\/(?!\/)[A-Za-z0-9_\-./?=&%]*$/;

/**
 * Refresh la session Supabase à chaque requête (cookies HTTP-only) ET
 * applique les redirections d'accès. Doit être branché dans
 * src/middleware.ts via updateSession(request).
 */
export async function updateSession(request: NextRequest) {
  // Forward du pathname dans un header — utilisé par le layout (app)
  // pour appliquer la redirection des routes dev-only quand l'utilisateur
  // est employee.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: requestHeaders } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: requestHeaders } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // IMPORTANT: getUser() revalide le JWT côté Supabase — ne pas remplacer par getSession().
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
    // "/" laisse la homepage choisir selon le rôle (dev → /dashboard, employee → /feed)
    url.pathname = target && SAFE_REDIRECT.test(target) ? target : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
