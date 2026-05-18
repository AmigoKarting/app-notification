import Link from "next/link";
import { Card, EmptyState, PageHeader, PageTip, formatDateTime } from "@/components/ui";
import { requireDev } from "@/domain/auth/role";
import { setUserRoleAction } from "@/domain/users/actions";
import { listProfilesWithEmail } from "@/domain/users/repository";
import { getServerDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

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
  const roleFilter = searchParams?.role === "dev" || searchParams?.role === "employee"
    ? searchParams.role
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
          className="w-full max-w-md rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
        {(search || roleFilter) && (
          <Link
            href="/admin/users"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
          >
            {t.common.clear}
          </Link>
        )}
      </form>

      <div className="flex gap-2 text-sm">
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
          href={`/admin/users?role=employee${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          active={roleFilter === "employee"}
          label={t.adminUsers.employees}
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
            <p className="text-xs text-neutral-500">
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
                      <p className="truncate font-medium text-neutral-900">
                        {u.first_name && u.last_name
                          ? `${u.first_name} ${u.last_name}`
                          : u.display_name?.trim() || (
                              <span className="italic text-neutral-400">{t.common.noName}</span>
                            )}
                        {isMe && <span className="ml-1 text-xs text-neutral-500">{t.common.you}</span>}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">{u.email ?? "—"}</p>
                      {u.phone && <p className="text-xs text-neutral-500">{u.phone}</p>}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        u.role === "dev"
                          ? "bg-brand-50 text-brand-700 ring-brand-200"
                          : "bg-neutral-100 text-neutral-700 ring-neutral-200"
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                    <span>{formatDateTime(u.created_at, dateFmt)}</span>
                    {!isMe && (
                      <form action={setUserRoleAction}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <input type="hidden" name="role" value={u.role === "dev" ? "employee" : "dev"} />
                        <button type="submit" className="font-medium text-brand-700 hover:underline">
                          {u.role === "dev" ? t.adminUsers.demoteShort : t.adminUsers.promoteShort}
                        </button>
                      </form>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop: table layout */}
          <Card className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{t.adminUsers.name}</th>
                  <th className="px-4 py-2 font-medium">{t.adminUsers.phone}</th>
                  <th className="px-4 py-2 font-medium">{t.adminUsers.email}</th>
                  <th className="px-4 py-2 font-medium">{t.adminUsers.role}</th>
                  <th className="px-4 py-2 font-medium">{t.adminUsers.signupDate}</th>
                  <th className="px-4 py-2 font-medium text-right">{t.adminUsers.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {users.map((u) => {
                  const isMe = u.id === me.id;
                  return (
                    <tr key={u.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">
                          {u.first_name && u.last_name
                            ? `${u.first_name} ${u.last_name}`
                            : u.display_name?.trim() || (
                                <span className="italic text-neutral-400">{t.common.noName}</span>
                              )}
                        </p>
                        {isMe && <p className="text-xs text-neutral-500">{t.common.you}</p>}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{u.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-neutral-700">{u.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            u.role === "dev"
                              ? "bg-brand-50 text-brand-700 ring-brand-200"
                              : "bg-neutral-100 text-neutral-700 ring-neutral-200"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {formatDateTime(u.created_at, dateFmt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isMe && (
                          <form action={setUserRoleAction} className="inline-flex">
                            <input type="hidden" name="user_id" value={u.id} />
                            <input
                              type="hidden"
                              name="role"
                              value={u.role === "dev" ? "employee" : "dev"}
                            />
                            <button
                              type="submit"
                              className="text-sm font-medium text-neutral-900 hover:underline"
                            >
                              {u.role === "dev" ? t.adminUsers.demote : t.adminUsers.promote}
                            </button>
                          </form>
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
          ? "bg-neutral-900 text-white"
          : "border border-neutral-200 bg-white hover:bg-neutral-50"
      }`}
    >
      {label}
    </Link>
  );
}
