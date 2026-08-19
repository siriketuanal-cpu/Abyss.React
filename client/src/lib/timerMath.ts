import type { AbyssSlot, CountdownInfo, GSlot, IdleInfo, StarLeapTimer, TimerState } from "./types";

export const ABYSS_SLOT_COUNT = 6;
export const ABYSS_STAM_INTERVAL = 3 * 60 * 1000;
export const ABYSS_IDLE_CAP = 12 * 60 * 60 * 1000;
export const ABYSS_STAM_MAX_BASE = 240;
export const ABYSS_STAM_MAX_PER_RANK = 5;
export const ABYSS_RANK_MIN = 1;
export const ABYSS_RANK_MAX = 200;
export const G_SLOT_COUNT = 2;
export const G_STAM_INTERVAL = 5 * 60 * 1000;
export const SL_STAM_MAX = 80;
export const SL_STAM_INTERVAL = 12 * 60 * 1000;
export const SL_ORB_MAX = 4;
export const SL_ORB_INTERVAL = 6 * 60 * 60 * 1000;

export const clampInt = (value: unknown, min: number, max: number, fallback = min) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
};

export const formatClock = (timestamp: number | null) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export const formatGameMinute = (milliseconds: number | null) => {
  if (milliseconds == null) return "—:—";
  const totalMinutes = Math.max(1, Math.ceil(Math.max(0, milliseconds) / 60000));
  return `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, "0")}`;
};

export const getDayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const createAbyssSlot = (index: number): AbyssSlot => ({
  id: `abyss-${index + 1}`,
  label: "",
  rank: 1,
  stamCurrent: 0,
  stamMax: ABYSS_STAM_MAX_BASE,
  stamStart: null,
  stamRunning: false,
  idleStart: null,
  idleCapMs: ABYSS_IDLE_CAP,
  idleRunning: false,
  missionDone: false,
});

export const abyssMaxForRank = (rank: number) =>
  Math.min(999, ABYSS_STAM_MAX_BASE + (clampInt(rank, ABYSS_RANK_MIN, ABYSS_RANK_MAX, 1) - 1) * ABYSS_STAM_MAX_PER_RANK);

export const createGSlot = (index: number): GSlot => ({
  id: `g-${index + 1}`,
  label: `G${index + 1}`,
  stamCurrent: 0,
  stamMax: 130,
  stamStart: null,
  stamRunning: false,
  missionDone: false,
});

export const createInitialState = (): TimerState => ({
  schemaVersion: 1,
  slots: Array.from({ length: ABYSS_SLOT_COUNT }, (_, index) => createAbyssSlot(index)),
  dailyDate: getDayKey(),
  g: {
    slots: Array.from({ length: G_SLOT_COUNT }, (_, index) => createGSlot(index)),
    dailyDate: getDayKey(),
  },
  sl: {
    stamina: { current: 0, start: null, running: false },
    orb: { current: 0, start: null, running: false },
  },
});

export const getCountdown = (
  timer: Pick<StarLeapTimer, "current" | "start" | "running">,
  max: number,
  interval: number,
  now: number,
): CountdownInfo => {
  if (!timer.running || !timer.start) {
    return { current: timer.current, nextIn: null, fullIn: null, fullAt: null, isFull: timer.current >= max };
  }
  const elapsed = Math.max(0, now - timer.start);
  const recovered = Math.floor(elapsed / interval);
  const current = Math.min(max, timer.current + recovered);
  if (current >= max) {
    const fullAt = timer.start + Math.max(0, max - timer.current) * interval;
    return { current: max, nextIn: 0, fullIn: 0, fullAt, isFull: true };
  }
  const nextIn = interval - (elapsed % interval);
  const fullIn = (max - current - 1) * interval + nextIn;
  return { current, nextIn, fullIn, fullAt: now + fullIn, isFull: false };
};

export const getAbyssStamina = (slot: AbyssSlot, now: number) =>
  getCountdown(
    { current: slot.stamCurrent, start: slot.stamStart, running: slot.stamRunning },
    slot.stamMax,
    ABYSS_STAM_INTERVAL,
    now,
  );

export const getGStamina = (slot: GSlot, now: number) =>
  getCountdown(
    { current: slot.stamCurrent, start: slot.stamStart, running: slot.stamRunning },
    slot.stamMax,
    G_STAM_INTERVAL,
    now,
  );

export const getStarLeapStamina = (timer: StarLeapTimer, now: number) =>
  getCountdown(timer, SL_STAM_MAX, SL_STAM_INTERVAL, now);

export const getStarLeapOrb = (timer: StarLeapTimer, now: number) =>
  getCountdown(timer, SL_ORB_MAX, SL_ORB_INTERVAL, now);

export const getIdle = (slot: AbyssSlot, now: number): IdleInfo => {
  if (!slot.idleRunning || !slot.idleStart) return { remainingMs: null, fullAt: null, isFull: false };
  const fullAt = slot.idleStart + slot.idleCapMs;
  const remainingMs = Math.max(0, fullAt - now);
  return { remainingMs, fullAt, isFull: remainingMs === 0 };
};

export const cycleStartAfterAbyssUpdate = (slot: AbyssSlot, now: number) => {
  if (!slot.stamRunning || !slot.stamStart || getAbyssStamina(slot, now).isFull) return now;
  return now - ((now - slot.stamStart) % ABYSS_STAM_INTERVAL);
};

export const updateAbyssStaminaPreservingCycle = (slot: AbyssSlot, current: number, now: number): AbyssSlot => ({
  ...slot,
  stamCurrent: clampInt(current, 0, slot.stamMax, slot.stamCurrent),
  stamStart: cycleStartAfterAbyssUpdate(slot, now),
  stamRunning: true,
});

export const remainderAfterForty = (current: number) => Math.max(0, Math.floor(current || 0)) % 40;

export const hasRunningTimer = (state: TimerState, now: number) => {
  if (state.slots.some((slot) => (slot.stamRunning && !getAbyssStamina(slot, now).isFull) || (slot.idleRunning && !getIdle(slot, now).isFull))) return true;
  if (state.g.slots.some((slot) => slot.stamRunning && !getGStamina(slot, now).isFull)) return true;
  return (state.sl.stamina.running && !getStarLeapStamina(state.sl.stamina, now).isFull) || (state.sl.orb.running && !getStarLeapOrb(state.sl.orb, now).isFull);
};
