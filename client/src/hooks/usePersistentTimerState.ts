import { useCallback, useState } from "react";
import { clearReactTimerState, hasBackupState, loadTimerState, restoreBackupState, saveTimerState } from "@/lib/storage";
import { createInitialState } from "@/lib/timerMath";
import type { TimerState } from "@/lib/types";

export function usePersistentTimerState() {
  const [state, setState] = useState<TimerState>(() => loadTimerState());
  const [saveFailed, setSaveFailed] = useState(false);
  const [hasBackup, setHasBackup] = useState(() => hasBackupState());

  const updateState = useCallback((updater: (previous: TimerState) => TimerState) => {
    setState((previous) => {
      const next = updater(previous);
      setSaveFailed(!saveTimerState(next));
      setHasBackup(hasBackupState());
      return next;
    });
  }, []);

  const restoreBackup = useCallback(() => {
    const restored = restoreBackupState();
    if (!restored) return false;
    setState(restored);
    setSaveFailed(false);
    setHasBackup(hasBackupState());
    return true;
  }, []);

  const resetReactState = useCallback(() => {
    clearReactTimerState();
    const initial = createInitialState();
    setSaveFailed(!saveTimerState(initial));
    setState(initial);
    setHasBackup(false);
  }, []);

  return { state, updateState, saveFailed, hasBackup, restoreBackup, resetReactState };
}
