import Link from "next/link";
import { Card, EmptyState, PageHeader, PageTip, formatDateTime } from "@/components/ui";
import { requireDev } from "@/domain/auth/role";
import { setUserRoleAction } from "@/domain/users/actions";
import { listProfilesWithEmail } from "@/domain/users/repository";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";
import type { AppRole } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

const ROLE_BADGE: Record<AppRole, string> = {
  dev: "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-700",
  gerant: "bg-neutral-100 text-neutral-700 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-600",
  caissiere: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700",
};

interface PageProps {
  searchParams?: { q?: string; role?: string };
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const t = getServerDictionary();
  const locale = getLocale();
  const dateFmt = locale === "en" ? "en-US" : "fr-FR";
  const me = await requireDev();
  const all = await listProfilesWithEmail();

  const search = searchParams?.q?.trim().toLowerCase() ?? "";
  const validRoles: AppRole[] = ["dev", "gerant", "caissiere"];
  const roleFilter = validRoles.includes(searchParams?.role as AppRole)
    ? (searchParams!.role as AppRole)
    : undefined;

  const users = all.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (!search) return true;
    const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ").toLowerCase();
    return (
      fullName.includes(search) ||
      (u.display_name?.toLowerCase().includes(search) ?? false) ||
      (u.email?.toLowerCase().includes(search) ?? false) ||
      (u.phone?.includes(search) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminUsers.title}
        description={t.adminUsers.description}
      />
      <form action="/admin/users" method="get" className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder={t.adminUsers.searchPlaceholder}
          className="w-full max-w-md rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-brand-500 dark:focus:ring-brand-900/50"
        />
        {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
        {(search || roleFilter) && (
          <Link
            href="/admin/users"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            {t.common.clear}
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        <RoleFilter
          href={search ? `/admin/users?q=${encodeURIComponent(search)}` : "/admin/users"}
          active={!roleFilter}
          label={t.adminUsers.all}
        />
        <RoleFilter
          href={`/admin/users?role=dev${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          active={roleFilter === "dev"}
          label={t.adminUsers.devs}
        />
        <RoleFilter
          href={`/admin/users?role=gerant${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          active={roleFilter === "gerant"}
          label={t.adminUsers.gerants}
        />
        <RoleFilter
          href={`/admin/users?role=caissiere${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          active={roleFilter === "caissiere"}
          label={t.adminUsers.cashiers}
        />
      </div>

      {users.length === 0 ? (
        <EmptyState
          title={search || roleFilter ? t.adminUsers.noResults : t.adminUsers.noUsers}
          description={
            search || roleFilter
              ? t.adminUsers.noResultsDesc
              : t.adminUsers.noUsersDesc
          }
        />
      ) : (
        <>
          {(search || roleFilter) && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {users.length} {t.adminUsers.of} {all.length} {t.adminUsers.usersLabel}
            </p>
          )}
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {users.map((u) => {
              const isMe = u.id === me.id;
              return (
                <Card key={u.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                        {u.first_name && u.last_name
                          ? `${u.first_name} ${u.last_name}`
                          : u.display_name?.trim() || (
                              <span className="italic text-neutral-400">{t.common.noName}</span>
                            )}
                        {isMe && <span className="ml-1 text-xs text-neutral-500">{t.common.you}</span>}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">{u.email ?? "—"}</p>
                      {u.phone && <p className="text-xs text-neutral-500 dark:text-neutral-400">{u.phone}</p>}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_BADGE[u.role] ?? ROLE_BADGE.gerant}`}
                    >
                      {t.adminUsers.roleLabels[u.role] ?? u.role}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>{formatDateTime(u.created_at, dateFmt)}</span>
                    {!isMe && (
                      <RoleActions
                        userId={u.id}
                        currentRole={u.role}
                        promoteLabel={t.adminUsers.promoteShort}
                        setGerantLabel={t.adminUsers.setGerant}
                        setCashierLabel={t.adminUsers.setCashier}
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop: table layout */}
          <Card className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-2 font-medium">{t.adminUsers.name}</th>
                  <th className="px-4 py-2 font-medium">{t.adminUsers.phone}</th>
                  <th className="px-4 py-2 font-medium">{t.adminUsers.email}</th>
                  <th className="px-4 py-2 font-medium">{t.adminUsers.role}</th>
                  <th className="px-4 py-2 font-medium">{t.adminUsers.signupDate}</th>
                  <th className="px-4 py-2 font-medium text-right">{t.adminUsers.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {users.map((u) => {
                  const isMe = u.id === me.id;
                  return (
                    <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {u.first_name && u.last_name
                            ? `${u.first_name} ${u.last_name}`
                            : u.display_name?.trim() || (
                                <span className="italic text-neutral-400">{t.common.noName}</span>
                              )}
                        </p>
                        {isMe && <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.common.you}</p>}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{u.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{u.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_BADGE[u.role] ?? ROLE_BADGE.gerant}`}
                        >
                          {t.adminUsers.roleLabels[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                        {formatDateTime(u.created_at, dateFmt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isMe && (
                          <RoleActions
                            userId={u.id}
                            currentRole={u.role}
                            promoteLabel={t.adminUsers.promoteShort}
                            setGerantLabel={t.adminUsers.setGerant}
                            setCashierLabel={t.adminUsers.setCashier}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
      <PageTip>{t.pageTips.adminUsers}</PageTip>
    </div>
  );
}

/**
 * Boutons d'action pour changer le rôle d'un utilisateur.
 * Le dev peut assigner n'importe quel rôle parmi les 3.
 */
function RoleActions({
  userId,
  currentRole,
  promoteLabel,
  setGerantLabel,
  setCashierLabel,
}: {
  userId: string;
  currentRole: AppRole;
  promoteLabel: string;
  setGerantLabel: string;
  setCashierLabel: string;
}) {
  const targets: { role: AppRole; label: string }[] = [];

  if (currentRole !== "dev") {
    targets.push({ role: "dev", label: promoteLabel });
  }
  if (currentRole !== "gerant") {
    targets.push({ role: "gerant", label: setGerantLabel });
  }
  if (currentRole !== "caissiere") {
    targets.push({ role: "caissiere", label: setCashierLabel });
  }

  return (
    <div className="flex items-center gap-2">
      {targets.map((tgt) => (
        <form key={tgt.role} action={setUserRoleAction} className="inline-flex">
          <input type="hidden" name="user_id" value={userId} />
          <input type="hidden" name="role" value={tgt.role} />
          <button
            type="submit"
            className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            {tgt.label}
          </button>
        </form>
      ))}
    </div>
  );
}

function RoleFilter({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 transition ${
        active
          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      }`}
    >
      {label}
    </Link>
  );
}
