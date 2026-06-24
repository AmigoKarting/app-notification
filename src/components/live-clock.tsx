"use client";

import { useState, useEffect } from "react";

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const date = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Montreal",
  });

  const time = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Montreal",
  });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <p className="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
        {time}
      </p>
      <p className="mt-0.5 text-sm capitalize text-neutral-500 dark:text-neutral-400">
        {date}
      </p>
    </div>
  );
}
