"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import { setTeamMembersAction } from "@/domain/teams/actions";

type UserOption = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : "Enregistrer les membres"}
    </Button>
  );
}

export function MembersForm({
  teamId,
  users,
  initialMemberIds,
}: {
  teamId: string;
  users: UserOption[];
  initialMemberIds: string[];
}) {
  const [search, setSearch] = useState("");
  const initial = new Set(initialMemberIds);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      false
    );
  });

  return (
    <form action={setTeamMembersAction} className="space-y-3">
      <input type="hidden" name="team_id" value={teamId} />

      <input
        type="search"
        placeholder="Rechercher par nom ou email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />

      <div className="max-h-72 overflow-y-auto rounded-lg border border-neutral-200">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">
            Aucun utilisateur ne correspond.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {filtered.map((u) => (
              <li key={u.id}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-neutral-50">
                  <input
                    type="checkbox"
                    name="user_ids"
                    value={u.id}
                    defaultChecked={initial.has(u.id)}
                    className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-neutral-900">
                      {u.name?.trim() || (
                        <span className="italic text-neutral-400">Sans nom</span>
                      )}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {u.email ?? "—"} • {u.role}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
