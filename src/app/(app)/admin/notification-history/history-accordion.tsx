"use client";

import { useState } from "react";
import { Card } from "@/components/ui";

interface FeedRow {
  id: string;
  title: string;
  body: string | null;
  published_at: string;
}

interface DayGroup {
  dayLabel: string;
  date: string;
  items: FeedRow[];
}

interface WeekGroup {
  weekLabel: string;
  dateRange: string;
  days: DayGroup[];
  total: number;
}

interface Props {
  weeks: WeekGroup[];
  noNotifs: string;
  noNotifsDay: string;
  totalLabel: string;
}

export function HistoryAccordion({ weeks, noNotifs, noNotifsDay, totalLabel }: Props) {
  const [openWeek, setOpenWeek] = useState<number | null>(weeks.length > 0 ? 0 : null);
  const [openDay, setOpenDay] = useState<string | null>(null);

  if (weeks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-neutral-500">{noNotifs}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {weeks.map((week, wi) => {
        const isWeekOpen = openWeek === wi;
        return (
          <Card key={wi} className="overflow-hidden">
            <button
              onClick={() => setOpenWeek(isWeekOpen ? null : wi)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <div className="flex items-center gap-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-neutral-400 transition-transform ${isWeekOpen ? "rotate-90" : ""}`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{week.weekLabel}</span>
                  <span className="ml-2 text-sm text-neutral-500">{week.dateRange}</span>
                </div>
              </div>
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                {week.total}
              </span>
            </button>

            {isWeekOpen && (
              <div className="border-t border-neutral-200 dark:border-neutral-700">
                {week.days.map((day) => {
                  const dayKey = `${wi}-${day.date}`;
                  const isDayOpen = openDay === dayKey;
                  return (
                    <div key={dayKey}>
                      <button
                        onClick={() => setOpenDay(isDayOpen ? null : dayKey)}
                        className="flex w-full items-center justify-between px-6 py-2.5 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`text-neutral-400 transition-transform ${isDayOpen ? "rotate-90" : ""}`}
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{day.dayLabel}</span>
                          <span className="text-xs text-neutral-500">{day.date}</span>
                        </div>
                        <span className="text-xs font-medium text-neutral-500">{day.items.length}</span>
                      </button>

                      {isDayOpen && (
                        <div className="space-y-1 px-8 pb-3 pt-1">
                          {day.items.length === 0 ? (
                            <p className="text-xs text-neutral-400">{noNotifsDay}</p>
                          ) : (
                            day.items.map((item) => {
                              const time = new Date(item.published_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              });
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-start gap-3 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50"
                                >
                                  <span className="mt-0.5 shrink-0 text-xs text-neutral-400">{time}</span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.title}</p>
                                    {item.body && (
                                      <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{item.body}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
