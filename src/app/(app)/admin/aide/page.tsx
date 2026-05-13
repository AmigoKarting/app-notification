import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { GUIDE_CATEGORIES } from "./layout";

export default function HelpIndexPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Centre d'aide"
        description="Guides courts et concrets pour configurer chaque partie de l'app."
      />

      <Card className="p-5 bg-brand-50 border-brand-200">
        <p className="text-sm font-medium text-brand-900">
          🆕 Première fois ici ?
        </p>
        <p className="mt-1 text-sm text-brand-800">
          Commence par le guide{" "}
          <Link
            href="/admin/aide/bien-demarrer"
            className="font-semibold underline hover:no-underline"
          >
            Bien démarrer
          </Link>{" "}
          — 5 minutes pour comprendre la structure de l'app.
        </p>
      </Card>

      <div className="space-y-5">
        {GUIDE_CATEGORIES.map((category) => (
          <section key={category.label}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {category.label}
            </h2>
            <Card>
              <ul className="divide-y divide-neutral-100">
                {category.entries.map((entry) => (
                  <li key={entry.href}>
                    <Link
                      href={entry.href}
                      className="flex items-start gap-3 px-5 py-4 transition hover:bg-neutral-50"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg">
                        {entry.icon}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{entry.title}</p>
                        {entry.description && (
                          <p className="mt-0.5 text-sm text-neutral-600">{entry.description}</p>
                        )}
                      </div>
                      <span className="self-center text-neutral-400">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
