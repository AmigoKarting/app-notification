import Link from "next/link";
import { Card, LinkButton, PageHeader } from "@/components/ui";

export function GuidePage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        action={
          <LinkButton href="/admin/aide" variant="secondary">
            ← Tous les guides
          </LinkButton>
        }
      />
      <article className="prose-guide space-y-6">{children}</article>
    </div>
  );
}

export function GuideSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}

/**
 * Encadré informatif. type :
 *  - info  (par défaut, bleu)
 *  - tip   (vert)
 *  - warn  (ambre)
 */
export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "tip" | "warn";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: "bg-brand-50 ring-brand-200 text-brand-900",
    tip: "bg-emerald-50 ring-emerald-200 text-emerald-900",
    warn: "bg-amber-50 ring-amber-200 text-amber-900",
  } as const;
  const labels = {
    info: "À savoir",
    tip: "Astuce",
    warn: "Attention",
  } as const;
  return (
    <div className={`rounded-lg p-4 ring-1 ring-inset ${styles[type]}`}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider">
        {title ?? labels[type]}
      </p>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="space-y-3">{children}</ol>;
}

export function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
        {number}
      </span>
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-medium text-neutral-900">{title}</p>
        {children && (
          <div className="mt-1 text-sm leading-relaxed text-neutral-700">{children}</div>
        )}
      </div>
    </li>
  );
}

/**
 * Affiche un chemin de navigation dans l'app : "Admin → Notifications → Nouvelle".
 */
export function Path({ children }: { children: React.ReactNode }) {
  return (
    <code className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
      {children}
    </code>
  );
}

/**
 * Carte d'index — utilisée sur /admin/aide pour pointer vers chaque guide.
 */
export function GuideCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="card-hover block">
      <Card className="flex h-full items-start gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-neutral-900">{title}</p>
          <p className="mt-1 text-sm text-neutral-600">{description}</p>
        </div>
      </Card>
    </Link>
  );
}

/**
 * Navigation Précédent / Suivant en bas d'un guide.
 * Reçoit la liste complète des guides et le slug courant.
 */
export function GuideNav({
  current,
  guides,
}: {
  current: string;
  guides: Array<{ href: string; title: string }>;
}) {
  const idx = guides.findIndex((g) => g.href === current);
  if (idx === -1) return null;
  const prev = idx > 0 ? guides[idx - 1] : null;
  const next = idx < guides.length - 1 ? guides[idx + 1] : null;

  return (
    <nav className="grid grid-cols-1 gap-3 border-t border-neutral-200 pt-6 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.href}
          className="card-hover group flex flex-col rounded-xl border border-neutral-200 bg-white p-4"
        >
          <span className="text-xs text-neutral-500">← Guide précédent</span>
          <span className="mt-1 font-medium text-neutral-900 group-hover:text-brand-700">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="card-hover group flex flex-col items-end rounded-xl border border-neutral-200 bg-white p-4 text-right"
        >
          <span className="text-xs text-neutral-500">Guide suivant →</span>
          <span className="mt-1 font-medium text-neutral-900 group-hover:text-brand-700">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
