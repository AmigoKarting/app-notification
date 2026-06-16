"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

interface Task {
  id: string;
  task_key: string;
  section: string;
  label: string;
  notes: string | null;
}

interface DailyState {
  assigned: boolean;
  verified: boolean;
  doneBy: string | null;
  rating: number | null;
}

export function SupervisorForm({
  tasks,
  initialDaily,
}: {
  tasks: Task[];
  initialDaily: Record<string, DailyState>;
}) {
  const { t } = useTranslation();
  const [daily, setDaily] = useState<Record<string, DailyState>>(initialDaily);
  const [popup, setPopup] = useState<string | null>(null);
  const [popupForm, setPopupForm] = useState({ doneBy: "", rating: 7, noTime: false, certify: false });
  const [loading, setLoading] = useState<string | null>(null);

  const sections = [
    { key: "caisse", label: t.supervisor.sectionCaisse },
    { key: "piste", label: t.supervisor.sectionPiste },
  ];

  const assignedCount = Object.values(daily).filter((d) => d.assigned).length;
  const verifiedCount = Object.values(daily).filter((d) => d.verified).length;

  async function handleAssign(taskId: string, assign: boolean) {
    setLoading(taskId);
    try {
      const res = await fetch("/api/supervisor/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, assign }),
      });
      if (res.ok) {
        setDaily((prev) => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            assigned: assign,
            ...(assign ? {} : { verified: false, doneBy: null, rating: null }),
          },
        }));
      }
    } finally {
      setLoading(null);
    }
  }

  function handleVerifyClick(taskId: string) {
    setPopupForm({ doneBy: "", rating: 7, noTime: false, certify: false });
    setPopup(taskId);
  }

  async function handleVerifySubmit() {
    if (!popup || !popupForm.doneBy.trim()) return;
    setLoading(popup);
    try {
      const res = await fetch("/api/supervisor/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: popup,
          doneBy: popupForm.doneBy.trim(),
          rating: popupForm.rating,
          noTimeToFinish: popupForm.noTime,
          qualityCertified: popupForm.certify,
        }),
      });
      if (res.ok) {
        setDaily((prev) => ({
          ...prev,
          [popup]: {
            ...prev[popup],
            verified: true,
            doneBy: popupForm.doneBy.trim(),
            rating: popupForm.rating,
          },
        }));
        setPopup(null);
      }
    } finally {
      setLoading(null);
    }
  }

  const popupTask = popup ? tasks.find((t) => t.id === popup) : null;

  return (
    <div className="space-y-6">
      {/* Counters */}
      <div className="flex gap-4 text-sm">
        <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          {assignedCount} {t.supervisor.assignedCount}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          {verifiedCount} {t.supervisor.verifiedCount}
        </span>
      </div>

      {sections.map((section) => {
        const sectionTasks = tasks.filter((t) => t.section === section.key);
        if (sectionTasks.length === 0) return null;

        return (
          <div key={section.key}>
            <h2 className="mb-3 text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {section.label}
            </h2>
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
              {/* Header */}
              <div className="grid grid-cols-[1fr_70px_70px] border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-400 sm:grid-cols-[1fr_90px_90px]">
                <span>&nbsp;</span>
                <span className="text-center">{t.supervisor.toDoColumn}</span>
                <span className="text-center">{t.supervisor.verifiedColumn}</span>
              </div>

              {sectionTasks.map((task, i) => {
                const state = daily[task.id] ?? { assigned: false, verified: false, doneBy: null, rating: null };
                const isLoading = loading === task.id;

                return (
                  <div
                    key={task.id}
                    className={`grid grid-cols-[1fr_70px_70px] items-center gap-2 px-4 py-3 sm:grid-cols-[1fr_90px_90px] ${
                      i < sectionTasks.length - 1
                        ? "border-b border-neutral-100 dark:border-neutral-700/50"
                        : ""
                    } ${state.verified ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""}`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${state.verified ? "text-emerald-700 line-through dark:text-emerald-400" : "text-neutral-900 dark:text-neutral-100"}`}>
                        {task.label}
                      </p>
                      {task.notes && (
                        <p className="mt-1 whitespace-pre-line text-xs text-neutral-500 dark:text-neutral-400">
                          {task.notes}
                        </p>
                      )}
                      {state.verified && state.doneBy && (
                        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                          {t.supervisor.verified} — {state.doneBy} ({state.rating}/10)
                        </p>
                      )}
                    </div>

                    {/* À faire checkbox */}
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={state.assigned}
                        disabled={isLoading || state.verified}
                        onChange={(e) => handleAssign(task.id, e.target.checked)}
                        className="h-5 w-5 cursor-pointer rounded border-neutral-300 text-amber-600 transition focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700"
                      />
                    </div>

                    {/* Vérifié checkbox */}
                    <div className="flex justify-center">
                      {state.verified ? (
                        <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <input
                          type="checkbox"
                          checked={false}
                          disabled={!state.assigned || isLoading}
                          onChange={() => handleVerifyClick(task.id)}
                          className="h-5 w-5 cursor-pointer rounded border-neutral-300 text-emerald-600 transition focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Verification Popup */}
      {popup && popupTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-800">
            <h3 className="mb-1 text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {t.supervisor.popupTitle}
            </h3>
            <p className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
              {popupTask.label}
            </p>

            <div className="space-y-4">
              {/* Who did it */}
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t.supervisor.doneByLabel}
                </span>
                <input
                  type="text"
                  value={popupForm.doneBy}
                  onChange={(e) => setPopupForm((p) => ({ ...p, doneBy: e.target.value }))}
                  placeholder={t.supervisor.doneByPlaceholder}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                  autoFocus
                />
              </label>

              {/* Rating */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t.supervisor.ratingLabel}
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={popupForm.rating}
                    onChange={(e) => setPopupForm((p) => ({ ...p, rating: Number(e.target.value) }))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-200 accent-brand-600 dark:bg-neutral-600"
                  />
                  <span className="min-w-[2.5rem] rounded-lg bg-brand-100 px-2 py-1 text-center text-lg font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    {popupForm.rating}
                  </span>
                </div>
              </label>

              {/* No time radio */}
              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${popupForm.noTime ? "border-brand-300 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/30" : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/50"}`}>
                <input
                  type="checkbox"
                  checked={popupForm.noTime}
                  onChange={() => setPopupForm((p) => ({ ...p, noTime: !p.noTime, certify: false }))}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-600 dark:border-neutral-600 dark:bg-neutral-700"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Ce qui a été fait est <strong>{popupForm.rating}/10</strong> mais n'a pas eu le temps de terminer
                </span>
              </label>

              {/* Certify radio */}
              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${popupForm.certify ? "border-emerald-300 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/30" : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/50"}`}>
                <input
                  type="checkbox"
                  checked={popupForm.certify}
                  onChange={() => setPopupForm((p) => ({ ...p, certify: !p.certify, noTime: false }))}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-emerald-600 dark:border-neutral-600 dark:bg-neutral-700"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Je certifie que la qualité du travail est <strong>{popupForm.rating}/10</strong>
                </span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleVerifySubmit}
                disabled={!popupForm.doneBy.trim() || loading === popup}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
              >
                {loading === popup ? "..." : t.supervisor.submit}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
