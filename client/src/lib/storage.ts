import { ABYSS_IDLE_CAP, ABYSS_RANK_MAX, ABYSS_RANK_MIN, ABYSS_SLOT_COUNT, G_SLOT_COUNT, SL_ORB_MAX, SL_STAM_MAX, abyssMaxForRank, clampInt, createAbyssSlot, createGSlot, createInitialState } from "./timerMath";
import type { AbyssSlot, GSlot, StarLeapTimer, TimerState } from "./types";

const STORAGE_KEY = "dotabyss:react:v1";
const BACKUP_KEY = "dotabyss:react:backup:v1";
const LEGACY_KEY = "dotabyss:unified:v1";

const safeTimestamp = (value: unknown) => {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 && timestamp < Date.now() + 60000 ? timestamp : null;
};

const normalizeAbyssSlot = (value: unknown, index: number): AbyssSlot => {
  const base = createAbyssSlot(index);
  if (!value || typeof value !== "object") return base;
  const source = value as Partial<AbyssSlot>;
  const rank = clampInt(source.rank, ABYSS_RANK_MIN, ABYSS_RANK_MAX, base.rank);
  const max = source.rank == null ? clampInt(source.stamMax, 1, 999, base.stamMax) : abyssMaxForRank(rank);
  return {
    ...base,
    label: typeof source.label === "string" ? source.label.slice(0, 32) : base.label,
    rank,
    stamMax: max,
    stamCurrent: clampInt(source.stamCurrent, 0, max, 0),
    stamStart: source.stamRunning ? safeTimestamp(source.stamStart) : null,
    stamRunning: Boolean(source.stamRunning && safeTimestamp(source.stamStart)),
    idleStart: source.idleRunning ? safeTimestamp(source.idleStart) : null,
    idleCapMs: clampInt(source.idleCapMs, 60000, 7 * 24 * 60 * 60 * 1000, ABYSS_IDLE_CAP),
    idleRunning: Boolean(source.idleRunning && safeTimestamp(source.idleStart)),
    missionDone: Boolean(source.missionDone),
  };
};

const normalizeGSlot = (value: unknown, index: number): GSlot => {
  const base = createGSlot(index);
  if (!value || typeof value !== "object") return base;
  const source = value as Partial<GSlot>;
  const max = clampInt(source.stamMax, 1, 999, base.stamMax);
  return {
    ...base,
    label: typeof source.label === "string" && source.label ? source.label.slice(0, 24) : base.label,
    stamMax: max,
    stamCurrent: clampInt(source.stamCurrent, 0, max, 0),
    stamStart: source.stamRunning ? safeTimestamp(source.stamStart) : null,
    stamRunning: Boolean(source.stamRunning && safeTimestamp(source.stamStart)),
    missionDone: Boolean(source.missionDone),
  };
};

const normalizeStarLeapTimer = (value: unknown, max: number): StarLeapTimer => {
  if (!value || typeof value !== "object") return { current: 0, start: null, running: false };
  const source = value as Partial<StarLeapTimer>;
  const start = source.running ? safeTimestamp(source.start) : null;
  return { current: clampInt(source.current, 0, max, 0), start, running: Boolean(source.running && start) };
};

export const normalizeState = (value: unknown): TimerState => {
  const initial = createInitialState();
  if (!value || typeof value !== "object") return initial;
  const source = value as Partial<TimerState>;
  return {
    schemaVersion: 1,
    slots: Array.isArray(source.slots) && source.slots.length === ABYSS_SLOT_COUNT ? source.slots.map(normalizeAbyssSlot) : initial.slots,
    dailyDate: typeof source.dailyDate === "string" ? source.dailyDate : initial.dailyDate,
    g: {
      slots: Array.isArray(source.g?.slots) && source.g.slots.length === G_SLOT_COUNT ? source.g.slots.map(normalizeGSlot) : initial.g.slots,
      dailyDate: typeof source.g?.dailyDate === "string" ? source.g.dailyDate : initial.g.dailyDate,
    },
    sl: {
      stamina: normalizeStarLeapTimer(source.sl?.stamina, SL_STAM_MAX),
      orb: normalizeStarLeapTimer(source.sl?.orb, SL_ORB_MAX),
    },
  };
};

export const loadTimerState = (): TimerState => {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return normalizeState(JSON.parse(current));
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) return normalizeState(JSON.parse(legacy));
  } catch {
    return createInitialState();
  }
  return createInitialState();
};

export const saveTimerState = (state: TimerState) => {
  try {
    const previous = localStorage.getItem(STORAGE_KEY);
    if (previous) localStorage.setItem(BACKUP_KEY, previous);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const restoreBackupState = () => {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (!backup) return null;
    const parsed = normalizeState(JSON.parse(backup));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return null;
  }
};

export const hasBackupState = () => {
  try {
    return Boolean(localStorage.getItem(BACKUP_KEY));
  } catch {
    return false;
  }
};

export const clearReactTimerState = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_KEY);
};
