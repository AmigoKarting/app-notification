"use client";

import { useState } from "react";

interface DatedNotif {
  id: string;
  title: string;
  body: string;
  date: string;
  snoozed_to: string | null;
}

export function DatedAlerts({ notifications }: { notifications: DatedNotif[] }) {
  const [items, setItems] = useState(notifications);
  const [snoozing, setSnoozing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (items.length === 0) return null;

  async function handleSnooze(id: string, days: number) {
    setLoading(true);
    const target = new Date();
    target.setDate(target.getDate() + days);
    const snoozeTo = target.toISOString().split("T")[0];

    const res = await fetch("/api/notifications/snooze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, snoozeTo }),
    });

    if (res.ok) {
      setItems((prev) => prev.filter((n) => n.id !== id));
      setSnoozing(null);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      {items.map((n) => (
        <div
          key={n.id}
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/50 dark:bg-amber-900/20"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                {n.title}
              </p>
              <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
                {n.body}
              </p>
            </div>
            {snoozing === n.id ? (
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => handleSnooze(n.id, 1)}
                  disabled={loading}
                  className="rounded-lg bg-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-300 disabled:opacity-50 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
                >
                  Demain
                </button>
                <button
                  onClick={() => handleSnooze(n.id, 7)}
                  disabled={loading}
                  className="rounded-lg bg-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-300 disabled:opacity-50 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
                >
                  +7 jours
                </button>
                <button
                  onClick={() => setSnoozing(null)}
                  className="rounded-lg px-2 py-1.5 text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSnoozing(n.id)}
                className="shrink-0 rounded-lg bg-amber-200 px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
              >
                Reporter
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
