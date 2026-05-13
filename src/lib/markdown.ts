/**
 * Tiny markdown renderer — sans dépendance, sans HTML injection possible.
 *
 * Supporte :
 *   - **gras** → <strong>
 *   - *italique* → <em>
 *   - `code` → <code>
 *   - [texte](url) → lien
 *   - https://... → auto-lien
 *   - sauts de ligne préservés
 *
 * Tout le reste est echappé. Aucune balise HTML brute n'est interprétée.
 * Le résultat est une string HTML safe à passer à `dangerouslySetInnerHTML`.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return u.startsWith("http://") || u.startsWith("https://") || u.startsWith("mailto:");
}

export function renderMarkdown(input: string): string {
  if (!input) return "";

  // 1. Échappe TOUT en premier (anti-XSS).
  let s = escapeHtml(input);

  // 2. Liens explicites [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, text: string, url: string) => {
    if (!isSafeUrl(url)) return `[${text}](${url})`;
    const safeUrl = url.replace(/"/g, "%22");
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-brand-700 hover:underline">${text}</a>`;
  });

  // 3. Auto-lien des URLs (qui ne sont pas déjà dans un <a>)
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_match, prefix: string, url: string) => {
    const safeUrl = url.replace(/"/g, "%22");
    return `${prefix}<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-brand-700 hover:underline">${url}</a>`;
  });

  // 4. **gras**
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");

  // 5. *italique*
  s = s.replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, "<em>$1</em>");

  // 6. `code`
  s = s.replace(
    /`([^`\n]+)`/g,
    '<code class="rounded bg-neutral-100 px-1 py-0.5 text-[0.85em]">$1</code>',
  );

  // 7. Sauts de ligne → <br>
  s = s.replace(/\n/g, "<br>");

  return s;
}
