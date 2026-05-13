/**
 * Substitution de variables dans un texte.
 *   {name}  → display_name du destinataire (fallback email, sinon "")
 *   {email} → email du destinataire
 *
 * Les variables inconnues sont remplacées par une chaîne vide.
 * Utilisé uniquement pour les envois externes (email/SMS) — pas dans
 * le fil in-app où le même contenu est affiché à tous les destinataires.
 */
export interface VariableContext {
  name?: string | null;
  email?: string | null;
}

export function substituteVariables(text: string, ctx: VariableContext): string {
  if (!text) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    if (key === "name") return ctx.name?.trim() || ctx.email || "";
    if (key === "email") return ctx.email ?? "";
    return ""; // variable inconnue → vide pour éviter d'envoyer un placeholder visible
  });
}
