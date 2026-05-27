import { LinkButton, PageHeader } from "@/components/ui";
import { requireDev } from "@/domain/auth/role";
import { getServerDictionary } from "@/lib/i18n/server";
import { RoleForm } from "../role-form";

export const dynamic = "force-dynamic";

export default async function NewRolePage() {
  await requireDev();
  const t = getServerDictionary();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.rolesAdmin.newRole}
        description={t.rolesAdmin.newRoleDesc}
        action={
          <LinkButton href="/admin/roles" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />
      <RoleForm mode="new" />
    </div>
  );
}
