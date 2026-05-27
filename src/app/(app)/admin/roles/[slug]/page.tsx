import { notFound } from "next/navigation";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { requireDev } from "@/domain/auth/role";
import { deleteRoleAction } from "@/domain/roles/actions";
import { getRoleWithPermissions } from "@/domain/roles/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { RoleForm } from "../role-form";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export default async function EditRolePage({ params }: Props) {
  await requireDev();
  const t = getServerDictionary();
  const role = await getRoleWithPermissions(decodeURIComponent(params.slug));
  if (!role) notFound();

  const isDevRole = role.slug === "dev";

  return (
    <div className="space-y-6">
      <PageHeader
        title={role.name}
        description={role.description ?? t.rolesAdmin.editDescription}
        action={
          <LinkButton href="/admin/roles" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />

      <RoleForm
        mode="edit"
        initialSlug={role.slug}
        initialName={role.name}
        initialDescription={role.description}
        initialColor={role.color}
        initialIcon={role.icon}
        initialPermissions={role.permissions}
        lockAllPermissions={isDevRole}
      />

      {/* Suppression : seulement pour les rôles non-système. */}
      {!role.is_system && (
        <Card className="border-red-200 bg-red-50/40 p-4 sm:p-6 dark:border-red-900 dark:bg-red-950/20">
          <h3 className="mb-2 text-sm font-semibold text-red-700 dark:text-red-300">
            {t.dangerZone.title}
          </h3>
          <p className="mb-3 text-xs text-red-700/80 dark:text-red-300/80">
            {t.rolesAdmin.deleteHint}
          </p>
          <form action={deleteRoleAction}>
            <input type="hidden" name="slug" value={role.slug} />
            <button
              type="submit"
              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
              onClick={(e) => {
                if (!confirm(t.rolesAdmin.confirmDelete)) e.preventDefault();
              }}
            >
              {t.dangerZone.deleteBtn}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
