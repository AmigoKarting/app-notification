/**
 * Variables d'environnement — lecture directe sans validation Zod
 * pour éviter les crashs au chargement du module.
 */

function clean(v: string | undefined): string {
  if (!v) return "";
  return v.charCodeAt(0) === 0xfeff ? v.slice(1) : v;
}

export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
};

export const serverEnv = {
  ...publicEnv,
  SUPABASE_SERVICE_ROLE_KEY: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
};
