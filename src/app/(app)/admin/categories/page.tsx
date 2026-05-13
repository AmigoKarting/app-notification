import Link from "next/link";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { countUnclaimedCategories, listCategories } from "@/domain/categories/repository";
import { ClaimSystemBanner } from "./claim-banner";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, unclaimed] = await Promise.all([
    listCategories(),
    countUnclaimedCategories(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catégories"
        description="Tags pour classer les notifications et rappels."
        action={<LinkButton href="/admin/categories/new">Nouvelle catégorie</LinkButton>}
      />

      {unclaimed > 0 && <ClaimSystemBanner count={unclaimed} />}

      {categories.length === 0 ? (
        <EmptyState title="Aucune catégorie" description="Crée ta première catégorie." />
      ) : (
        <Card>
          <ul className="divide-y divide-neutral-200">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-neutral-50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-8 w-8 rounded-full ring-1 ring-neutral-200"
                    style={{ backgroundColor: c.color }}
                  />
                  <div>
                    <p className="font-medium text-neutral-900">
                      {c.icon && <span className="mr-1">{c.icon}</span>}
                      {c.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      slug: <code>{c.slug}</code> • <span style={{ color: c.color }}>{c.color}</span>
                    </p>
                  </div>
                </div>
                <Link
                  href={`/admin/categories/${c.id}`}
                  className="text-sm font-medium text-neutral-900 hover:underline"
                >
                  Modifier
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
