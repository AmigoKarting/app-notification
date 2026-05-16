"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Barre de progression en haut de l'écran pendant la navigation.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const prev = useRef(pathname);

  useEffect(() => {
    if (pathname !== prev.current) {
      // Navigation terminée
      setProgress(100);
      clearInterval(timer.current);
      const t = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
      prev.current = pathname;
      return () => clearTimeout(t);
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href === pathname) return;

      setLoading(true);
      setProgress(20);
      clearInterval(timer.current);
      timer.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + 10));
      }, 150);
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      clearInterval(timer.current);
    };
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5">
      <div
        className="h-full bg-brand-600 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
