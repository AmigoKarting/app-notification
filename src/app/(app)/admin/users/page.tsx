import Link from "next/link";
import { Card, EmptyState, PageHeader, formatDateTime } from "@/components/ui";
import { requireDev } from "@/domain/auth/role";
import { setUserRoleAction } from "@/domain/users/actions";
import { listProfilesWithEmail } from "@/domain/users/repository";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: { q?: string; role?: string };
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const me = await requireDev();
  const all = await listProfilesWithEmail();

  const search = searchParams?.q?.trim().toLowerCase() ?? "";
  const roleFilter = searchParams?.role === "dev" || searchParams?.role === "employee"
    ? searchParams.role
    : undefined;

  const users = all.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (!search) return true;
    return (
      (u.display_name?.toLowerCase().includes(search) ?? false) ||
      (u.email?.toLowerCase().includes(search) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Gère les rôles. Employés = lecture du fil. Dev = administration complète."
      />

      <form action="/admin/users" method="get" className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Rechercher par nom ou email…"
          className="w-full max-w-md rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
        {(search || roleFilter) && (
          <Link
            href="/admin/users"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
          >
            Effacer
          </Link>
        )}
      </form>

      <div className="flex gap-2 text-sm">
        <RoleFilter
          href={search ? `/admin/users?q=${encodeURIComponent(search)}` : "/admin/users"}
          active={!roleFilter}
          label="Tous"
        />
        <RoleFilter
          href={`/admin/users?role=dev${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          active={roleFilter === "dev"}
          label="Devs"
        />
        <RoleFilter
          href={`/admin/users?role=employee${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          active={roleFilter === "employee"}
          label="Employés"
        />
      </div>

      {users.length === 0 ? (
        <EmptyState
          title={search || roleFilter ? "Aucun résultat" : "Aucun utilisateur"}
          description={
            search || roleFilter
              ? "Aucun utilisateur ne correspond aux filtres."
              : "Les comptes apparaîtront ici dès qu'ils s'inscrivent."
          }
        />
      ) : (
        <>
          {(search || roleFilter) && (
            <p className="text-xs text-neutral-500">
              {users.length} sur {all.length} utilisateurs
            </p>
          )}
          <Card>
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Nom</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Rôle</th>
                  <th className="px-4 py-2 font-medium">Inscription</th>
                  <th className="px-4 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {users.map((u) => {
                  const isMe = u.id === me.id;
                  return (
                    <tr key={u.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">
                          {u.display_name?.trim() || (
                            <span className="italic text-neutral-400">Sans nom</span>
                          )}
                        </p>
                        {isMe && <p className="text-xs text-neutral-500">(vous)</p>}
                      </td>
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
                        {formatDateTime(u.created_at)}
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
                              {u.role === "dev" ? "Rétrograder employé" : "Promouvoir dev"}
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
