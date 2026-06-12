"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

const THRESHOLD = 70;
const MAX_PULL = 110;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 5 && !refreshingRef.current) {
        startYRef.current = e.touches[0].clientY;
        pullingRef.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 10) {
        e.preventDefault();
        const p = Math.min(dy * 0.4, MAX_PULL);
        pullRef.current = p;
        setPull(p);
      } else if (dy < -5) {
        pullingRef.current = false;
        pullRef.current = 0;
        setPull(0);
      }
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;

      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        pullRef.current = 40;
        setPull(40);
        if (navigator.vibrate) navigator.vibrate(15);
        router.refresh();
        setTimeout(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          pullRef.current = 0;
          setPull(0);
        }, 1200);
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [router]);

  const progress = Math.min(pull / THRESHOLD, 1);
  const ready = pull >= THRESHOLD;

  return (
    <div>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150 ease-out"
        style={{ height: pull > 0 || refreshing ? `${pull}px` : "0px" }}
      >
        <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={refreshing ? "animate-spin" : "transition-transform duration-150"}
            style={{
              opacity: Math.max(progress, refreshing ? 1 : 0),
              transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
            }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span style={{ opacity: progress > 0.3 ? 1 : 0 }}>
            {refreshing
              ? t.feed.refreshing
              : ready
                ? t.feed.releaseToRefresh
                : t.feed.pullToRefresh}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
