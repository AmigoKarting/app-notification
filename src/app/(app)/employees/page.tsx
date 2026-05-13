import Link from "next/link";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { listEmployees } from "@/domain/employees/repository";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: { q?: string };
}

export default async function EmployeesPage({ searchParams }: PageProps) {
  const search = searchParams?.q?.trim() ?? "";
  const employees = await listEmployees({ search: search || undefined });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employés"
        description="Annuaire des personnes pour qui des rappels sont planifiés."
        action={<LinkButton href="/employees/new">Nouvel employé</LinkButton>}
      />

      <form className="flex gap-2" action="/employees">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Rechercher par nom ou email..."
          className="w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
        {search && (
          <Link
            href="/employees"
            className="inline-flex items-center px-2 text-sm text-neutral-600 hover:underline"
          >
            Effacer
          </Link>
        )}
      </form>

      {employees.length === 0 ? (
        <EmptyState
          title={search ? "Aucun résultat" : "Aucun employé"}
          description={
            search
              ? "Modifie ta recherche ou efface le filtre pour voir tous les employés."
              : "Commence par ajouter un employé. Tu pourras ensuite lui associer des rappels."
          }
          action={!search && <LinkButton href="/employees/new">Ajouter un employé</LinkButton>}
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nom</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Téléphone</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{e.name}</td>
                  <td className="px-4 py-3 text-neutral-700">{e.email}</td>
                  <td className="px-4 py-3 text-neutral-700">{e.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/employees/${e.id}`}
                      className="text-sm font-medium text-neutral-900 hover:underline"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
