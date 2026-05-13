/**
 * Hints compacts pour expliquer le markdown et les variables dans les
 * formulaires de notification/planification/template. Détails fermés par
 * défaut (n'encombre pas), expansible d'un clic.
 */
export function FormattingHelp() {
  return (
    <details className="text-xs text-neutral-500">
      <summary className="cursor-pointer select-none hover:text-neutral-700">
        💡 Mise en forme et variables disponibles
      </summary>
      <div className="mt-2 space-y-2 rounded-lg bg-neutral-50 p-3 leading-relaxed">
        <div>
          <p className="mb-1 font-medium text-neutral-700">Markdown</p>
          <ul className="space-y-0.5 font-mono text-[11px]">
            <li>
              <code>**gras**</code> → <strong>gras</strong>
            </li>
            <li>
              <code>*italique*</code> → <em>italique</em>
            </li>
            <li>
              <code>`code`</code> →{" "}
              <code className="rounded bg-neutral-100 px-1">code</code>
            </li>
            <li>
              <code>[texte](https://exemple.com)</code> → lien cliquable
            </li>
            <li>Les URLs nues deviennent automatiquement des liens.</li>
          </ul>
        </div>
        <div>
          <p className="mb-1 font-medium text-neutral-700">Variables (envois externes)</p>
          <ul className="space-y-0.5 font-mono text-[11px]">
            <li>
              <code>{"{name}"}</code> → le nom du destinataire
            </li>
            <li>
              <code>{"{email}"}</code> → son email
            </li>
          </ul>
          <p className="mt-1 text-[11px] text-neutral-500">
            Personnalisées par destinataire pour les envois email/SMS. Sans
            effet sur l'affichage dans le fil (même contenu pour tous).
          </p>
        </div>
      </div>
    </details>
  );
}
