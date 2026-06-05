"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";

export interface ChecklistTaskProps {
  key: string;
  section: "opening" | "during" | "closing";
  label: string;
}

const SEND_DELAY = 20; // secondes

interface TaskState {
  checked: boolean;
  /** Secondes restantes avant envoi (null = pas de timer / déjà envoyé) */
  countdown: number | null;
  /** Envoyé avec succès */
  sent: boolean;
  /** En cours d'envoi */
  sending: boolean;
}

export function ChecklistForm({
  alreadySubmittedToday: _unused,
  tasks,
  initialCompleted,
}: {
  alreadySubmittedToday: boolean;
  tasks: ChecklistTaskProps[];
  initialCompleted: string[];
}) {
  const { t } = useTranslation();

  const [states, setStates] = useState<Record<string, TaskState>>(() => {
    const init: Record<string, TaskState> = {};
    for (const task of tasks) {
      init[task.key] = {
        checked: initialCompleted.includes(task.key),
        countdown: null,
        sent: initialCompleted.includes(task.key),
        sending: false,
      };
    }
    return init;
  });

  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Cleanup tous les timers au unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearInterval);
    };
  }, []);

  const sendTask = useCallback(
    async (taskKey: string) => {
      setStates((prev) => ({
        ...prev,
        [taskKey]: { ...prev[taskKey], sending: true, countdown: null },
      }));

      try {
        const res = await fetch("/api/checklist/complete-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskKey }),
        });

        if (res.ok) {
          setStates((prev) => ({
            ...prev,
            [taskKey]: { ...prev[taskKey], sent: true, sending: false },
          }));
        } else {
          // En cas d'erreur, on laisse coché mais on signale l'échec
          setStates((prev) => ({
            ...prev,
            [taskKey]: { ...prev[taskKey], sending: false },
          }));
        }
      } catch {
        setStates((prev) => ({
          ...prev,
          [taskKey]: { ...prev[taskKey], sending: false },
        }));
      }
    },
    [],
  );

  const handleToggle = useCallback(
    (taskKey: string) => {
      setStates((prev) => {
        const current = prev[taskKey];
        if (!current) return prev;

        // Si déjà envoyé, on ne peut pas décocher
        if (current.sent) return prev;

        const nowChecked = !current.checked;

        if (nowChecked) {
          // On coche → démarre le countdown
          const countdown = SEND_DELAY;

          // Démarrer le timer
          const interval = setInterval(() => {
            setStates((s) => {
              const st = s[taskKey];
              if (!st || st.countdown === null || st.countdown <= 1) {
                clearInterval(timersRef.current[taskKey]);
                delete timersRef.current[taskKey];
                // Envoyer
                if (st && st.countdown !== null) {
                  sendTask(taskKey);
                }
                return {
                  ...s,
                  [taskKey]: { ...st!, countdown: null },
                };
              }
              return {
                ...s,
                [taskKey]: { ...st, countdown: st.countdown - 1 },
              };
            });
          }, 1000);

          timersRef.current[taskKey] = interval;

          return {
            ...prev,
            [taskKey]: { ...current, checked: true, countdown },
          };
        } else {
          // On décoche → annule le timer
          if (timersRef.current[taskKey]) {
            clearInterval(timersRef.current[taskKey]);
            delete timersRef.current[taskKey];
          }
          return {
            ...prev,
            [taskKey]: { ...current, checked: false, countdown: null },
          };
        }
      });
    },
    [sendTask],
  );

  const sections = [
    { id: "opening" as const, label: t.checklist.sectionOpening },
    { id: "during" as const, label: t.checklist.sectionDuring },
    { id: "closing" as const, label: t.checklist.sectionClosing },
  ];

  const completedCount = Object.values(states).filter((s) => s.sent).length;
  const totalCount = tasks.length;

  return (
    <div className="space-y-4">
      {/* Barre de progression */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            {completedCount}/{totalCount}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {Math.round((completedCount / totalCount) * 100)}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completedCount === totalCount
                ? "bg-emerald-500"
                : completedCount > 0
                  ? "bg-brand-500"
                  : "bg-neutral-300 dark:bg-neutral-600"
            }`}
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {sections.map((section) => {
        const items = tasks.filter((i) => i.section === section.id);
        if (items.length === 0) return null;
        return (
          <div
            key={section.id}
            className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              <SectionIcon section={section.id} />
              {section.label}
            </h3>
            <ul className="space-y-1">
              {items.map((item) => {
                const st = states[item.key];
                if (!st) return null;

                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => handleToggle(item.key)}
                      disabled={st.sent || st.sending}
                      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                        st.sent
                          ? "bg-emerald-50 dark:bg-emerald-900/20"
                          : st.countdown !== null
                            ? "bg-amber-50 dark:bg-amber-900/20"
                            : "hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-700/50 dark:active:bg-neutral-700"
                      }`}
                    >
                      {/* Checkbox visuel */}
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                          st.sent
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : st.checked
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-neutral-300 dark:border-neutral-600"
                        }`}
                      >
                        {(st.sent || st.checked) && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2.5 6L5 8.5L9.5 3.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>

                      {/* Texte + état */}
                      <span className="flex-1">
                        <span
                          className={`text-sm ${
                            st.sent
                              ? "text-emerald-700 line-through dark:text-emerald-400"
                              : "text-neutral-800 dark:text-neutral-200"
                          }`}
                        >
                          {item.label}
                        </span>

                        {/* Countdown */}
                        {st.countdown !== null && (
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                            <CountdownRing seconds={st.countdown} total={SEND_DELAY} />
                            Envoi dans {st.countdown}s — touche pour annuler
                          </span>
                        )}

                        {/* Envoi en cours */}
                        {st.sending && (
                          <span className="mt-1 block text-xs text-brand-600 dark:text-brand-400">
                            Envoi en cours…
                          </span>
                        )}

                        {/* Envoyé */}
                        {st.sent && (
                          <span className="mt-1 block text-xs text-emerald-600 dark:text-emerald-400">
                            ✓ Envoyé
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** Mini anneau animé pour le countdown */
function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const pct = seconds / total;
  const r = 6;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
      <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeWidth="2" opacity={0.2} />
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray={`${circ}`}
        strokeDashoffset={`${circ * (1 - pct)}`}
        strokeLinecap="round"
        transform="rotate(-90 8 8)"
        className="transition-all duration-1000 ease-linear"
      />
    </svg>
  );
}

function SectionIcon({ section }: { section: "opening" | "during" | "closing" }) {
  switch (section) {
    case "opening":
      return <span>🌅</span>;
    case "during":
      return <span>☀️</span>;
    case "closing":
      return <span>🌙</span>;
  }
}
