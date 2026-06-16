"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";

export interface ChecklistTaskProps {
  key: string;
  section: "opening" | "during" | "closing";
  label: string;
}

const SEND_DELAY = 7;

interface TaskState {
  checked: boolean;
  countdown: number | null;
  sent: boolean;
  sending: boolean;
  sentAt: string | null;
}

export function ChecklistForm({
  tasks,
  initialCompleted,
  initialTimestamps = {},
  initialOperator,
  userName,
  streak = 0,
}: {
  tasks: ChecklistTaskProps[];
  initialCompleted: string[];
  initialTimestamps?: Record<string, string>;
  initialOperator?: string;
  userName?: string;
  streak?: number;
}) {
  const { t } = useTranslation();

  const [selectedOperator, setSelectedOperator] = useState(initialOperator ?? "");
  const operatorRef = useRef(selectedOperator);
  useEffect(() => { operatorRef.current = selectedOperator; }, [selectedOperator]);

  const [states, setStates] = useState<Record<string, TaskState>>(() => {
    const init: Record<string, TaskState> = {};
    for (const task of tasks) {
      const done = initialCompleted.includes(task.key);
      init[task.key] = {
        checked: done,
        countdown: null,
        sent: done,
        sending: false,
        sentAt: initialTimestamps[task.key] ?? null,
      };
    }
    return init;
  });

  const [showCelebration, setShowCelebration] = useState(false);
  const prevCompletedRef = useRef(
    Object.values(states).filter((s) => s.sent).length,
  );

  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(clearInterval);
    };
  }, []);

  const completedCount = Object.values(states).filter((s) => s.sent).length;
  const totalCount = tasks.length;

  useEffect(() => {
    const wasComplete = prevCompletedRef.current === totalCount;
    const isComplete = completedCount === totalCount && totalCount > 0;

    if (isComplete && !wasComplete) {
      setShowCelebration(true);
      if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
    }

    prevCompletedRef.current = completedCount;
  }, [completedCount, totalCount]);

  const sendTask = useCallback(async (taskKey: string) => {
    setStates((prev) => ({
      ...prev,
      [taskKey]: { ...prev[taskKey], sending: true, countdown: null },
    }));

    try {
      const body: Record<string, string> = { taskKey };
      if (operatorRef.current) body.operatorName = operatorRef.current;

      const res = await fetch("/api/checklist/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setStates((prev) => ({
          ...prev,
          [taskKey]: { ...prev[taskKey], sent: true, sending: false, sentAt: new Date().toISOString() },
        }));
        if (navigator.vibrate) navigator.vibrate(30);
      } else {
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
  }, []);

  const handleToggle = useCallback(
    (taskKey: string) => {
      if (!selectedOperator) return;

      setStates((prev) => {
        const current = prev[taskKey];
        if (!current) return prev;
        if (current.sent) return prev;

        const nowChecked = !current.checked;

        if (nowChecked) {
          const countdown = SEND_DELAY;
          const interval = setInterval(() => {
            setStates((s) => {
              const st = s[taskKey];
              if (!st || st.countdown === null || st.countdown <= 1) {
                clearInterval(timersRef.current[taskKey]);
                delete timersRef.current[taskKey];
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
    [sendTask, selectedOperator],
  );

  const sections = [
    { id: "opening" as const, label: t.checklist.sectionOpening },
    { id: "during" as const, label: t.checklist.sectionDuring },
    { id: "closing" as const, label: t.checklist.sectionClosing },
  ];

  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount && totalCount > 0;

  const needsOperator = !selectedOperator;

  return (
    <div className="space-y-4">
      {/* Greeting + Streak */}
      <div className="flex items-center justify-between">
        <TimeGreeting name={userName} />
        {streak >= 2 && (
          <span className="animate-scale-in rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-700">
            🔥 {streak} {streak === 1 ? t.checklist.streakSingular : t.checklist.streakPlural}
          </span>
        )}
      </div>

      {/* Operator input */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
        <label
          htmlFor="operator-input"
          className="mb-2 block text-sm font-semibold text-neutral-700 dark:text-neutral-300"
        >
          {t.checklist.operatorLabel}
        </label>
        <input
          id="operator-input"
          type="text"
          value={selectedOperator}
          onChange={(e) => setSelectedOperator(e.target.value)}
          placeholder={t.checklist.operatorPlaceholder}
          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition ${
            selectedOperator
              ? "border-brand-300 bg-brand-50 text-brand-800 ring-1 ring-brand-200 dark:border-brand-600 dark:bg-brand-900/20 dark:text-brand-300 dark:ring-brand-700"
              : "border-amber-300 bg-amber-50 text-neutral-800 ring-1 ring-amber-200 dark:border-amber-600 dark:bg-amber-900/20 dark:text-neutral-200 dark:ring-amber-700"
          }`}
        />
        {needsOperator && (
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
            {t.checklist.operatorRequired}
          </p>
        )}
      </div>

      {/* Progress / Celebration */}
      <div
        className={`rounded-xl border p-4 transition-all duration-500 ${
          allDone
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
            : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800/50"
        }`}
      >
        {allDone ? (
          <div className="animate-scale-in text-center">
            <div className="text-3xl">🎉</div>
            <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-300">
              {t.checklist.allDone}
            </p>
            <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
              {t.checklist.allDoneDesc}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {completedCount}/{totalCount}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {pct}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completedCount > 0
                    ? "bg-brand-500"
                    : "bg-neutral-300 dark:bg-neutral-600"
                }`}
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Confetti overlay */}
      {showCelebration && <Confetti />}

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
                      disabled={st.sent || st.sending || needsOperator}
                      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                        st.sent
                          ? "bg-emerald-50 dark:bg-emerald-900/20"
                          : st.countdown !== null
                            ? "bg-amber-50 dark:bg-amber-900/20"
                            : needsOperator
                              ? "cursor-not-allowed opacity-50"
                              : "hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-700/50 dark:active:bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-200 ${
                          st.sent
                            ? "scale-110 border-emerald-500 bg-emerald-500 text-white"
                            : st.checked
                              ? "scale-110 border-brand-500 bg-brand-500 text-white"
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

                      <span className="flex-1">
                        <span
                          className={`text-sm transition-all duration-300 ${
                            st.sent
                              ? "text-emerald-700 line-through dark:text-emerald-400"
                              : "text-neutral-800 dark:text-neutral-200"
                          }`}
                        >
                          {item.label}
                        </span>

                        {st.countdown !== null && (
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                            <CountdownRing seconds={st.countdown} total={SEND_DELAY} />
                            {t.checklist.sendingIn.replace("{seconds}", String(st.countdown))}
                          </span>
                        )}

                        {st.sending && (
                          <span className="mt-1 block text-xs text-brand-600 dark:text-brand-400">
                            {t.checklist.sending}
                          </span>
                        )}

                        {st.sent && (
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                            ✓ {t.checklist.sent}
                            {st.sentAt && (
                              <span className="text-emerald-500 dark:text-emerald-500">
                                — {formatTime(st.sentAt)}
                              </span>
                            )}
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

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------ */
/* Greeting based on time of day                                       */
/* ------------------------------------------------------------------ */
function TimeGreeting({ name }: { name?: string }) {
  const { t } = useTranslation();
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting(t.checklist.greetingMorning);
    else if (hour >= 12 && hour < 17) setGreeting(t.checklist.greetingAfternoon);
    else setGreeting(t.checklist.greetingEvening);
  }, [t]);

  if (!greeting) return null;

  return (
    <p className="animate-fade-in text-lg font-semibold text-neutral-800 dark:text-neutral-200">
      {greeting}
      {name ? `, ${name}` : ""} 👋
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Confetti celebration                                                */
/* ------------------------------------------------------------------ */
function Confetti() {
  const colors = [
    "#6366f1", "#ec4899", "#f59e0b", "#10b981",
    "#3b82f6", "#8b5cf6", "#f43f5e", "#14b8a6",
  ];

  // Deterministic pseudo-random using golden ratio
  const pseudo = (i: number) => ((i * 2654435761) >>> 0) / 4294967296;

  useEffect(() => {
    const timeout = setTimeout(() => {
      const el = document.getElementById("confetti-container");
      if (el) el.style.opacity = "0";
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      id="confetti-container"
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden transition-opacity duration-1000"
    >
      {Array.from({ length: 50 }, (_, i) => (
        <div
          key={i}
          className="confetti-particle"
          style={{
            left: `${pseudo(i) * 100}%`,
            width: `${6 + (i % 4) * 2}px`,
            height: `${6 + (i % 4) * 2}px`,
            backgroundColor: colors[i % colors.length],
            animationDuration: `${2 + pseudo(i + 50) * 2}s`,
            animationDelay: `${pseudo(i + 100) * 0.8}s`,
            borderRadius: i % 3 === 0 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small sub-components                                                */
/* ------------------------------------------------------------------ */
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
