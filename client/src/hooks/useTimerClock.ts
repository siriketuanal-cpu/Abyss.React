import { useEffect, useState } from "react";
import { hasRunningTimer } from "@/lib/timerMath";
import type { TimerState } from "@/lib/types";

/** A single self-scheduled minute-aligned render clock for every game timer. */
export function useTimerClock(state: TimerState) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timeoutId: number | undefined;
    const schedule = () => {
      const current = Date.now();
      setNow(current);
      if (!hasRunningTimer(state, current)) return;
      const delay = Math.max(80, 60000 - (current % 60000));
      timeoutId = window.setTimeout(schedule, delay);
    };
    const resume = () => {
      if (!document.hidden) schedule();
    };
    schedule();
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
    };
  }, [state]);

  return now;
}
