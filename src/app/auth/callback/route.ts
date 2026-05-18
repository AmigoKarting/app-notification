import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/server";

const SAFE_REDIRECT = /^\/(?!\/)[A-Za-z0-9_\-./?=&%]*$/;

/**
 * Callback OAuth + confirmation d'email.
 * Échange le `code` PKCE contre une session puis redirige.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next = SAFE_REDIRECT.test(nextParam) ? nextParam : "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[AUTH CALLBACK] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[AUTH CALLBACK] crash:", msg);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(getServerDictionary().auth.unexpectedError)}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
