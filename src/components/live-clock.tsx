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
    <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
      <span className="capitalize">{date}</span> — <span className="tabular-nums">{time}</span>
    </p>
  );
}
