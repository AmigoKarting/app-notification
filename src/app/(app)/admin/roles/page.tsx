import Link from "next/link";
import { Card, EmptyState, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { requireDev } from "@/domain/auth/role";
import { listRolesWithPermissions } from "@/domain/roles/repository";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function RolesAdminPage() {
  await requireDev();
  const t = getServerDictionary();
  const roles = await listRolesWithPermissions();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.rolesAdmin.title}
        description={t.rolesAdmin.description}
        action={
          <LinkButton href="/admin/roles/new">{t.rolesAdmin.newRole}</LinkButton>
        }
      />

      {roles.length === 0 ? (
        <EmptyState title={t.rolesAdmin.noRoles} description={t.rolesAdmin.noRolesDesc} />
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <Card key={role.slug} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm"
                      style={{ backgroundColor: role.color + "33", color: role.color }}
                    >
                      {role.icon ?? "•"}
                    </span>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {role.name}
                    </h3>
                    {role.is_system && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium uppercase text-brand-700 ring-1 ring-inset ring-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-700">
                        {t.rolesAdmin.system}
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                      {role.slug}
                    </span>
                  </div>
                  {role.description && (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {role.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {role.slug === "dev"
                      ? t.rolesAdmin.devFullAccess
                      : `${role.permissions.length} ${
                          role.permissions.length === 1
                            ? t.rolesAdmin.permissionSingular
                            : t.rolesAdmin.permissionPlural
                        }`}
                  </p>
                </div>
                <Link
                  href={`/admin/roles/${encodeURIComponent(role.slug)}`}
                  className="shrink-0 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  {t.common.edit}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PageTip>{t.rolesAdmin.tip}</PageTip>
    </div>
  );
}
