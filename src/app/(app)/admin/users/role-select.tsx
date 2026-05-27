"use client";

import { setUserRoleAction } from "@/domain/users/actions";

interface RoleOption {
  slug: string;
  name: string;
  icon: string | null;
}

interface Props {
  userId: string;
  currentRole: string;
  allRoles: RoleOption[];
  label: string;
}

/**
 * Dropdown pour assigner un rôle. Soumission instantanée au changement.
 */
export function RoleSelect({ userId, currentRole, allRoles, label }: Props) {
  return (
    <form action={setUserRoleAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <label className="text-xs text-neutral-500 dark:text-neutral-400">{label}</label>
      <select
        name="role"
        defaultValue={currentRole}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
      >
        {allRoles.map((r) => (
          <option key={r.slug} value={r.slug}>
            {r.icon ? `${r.icon} ` : ""}
            {r.name}
          </option>
        ))}
      </select>
    </form>
  );
}
