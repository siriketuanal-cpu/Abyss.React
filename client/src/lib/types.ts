export type AbyssSlot = {
  id: string;
  label: string;
  rank: number;
  stamCurrent: number;
  stamMax: number;
  stamStart: number | null;
  stamRunning: boolean;
  idleStart: number | null;
  idleCapMs: number;
  idleRunning: boolean;
  missionDone: boolean;
};

export type GSlot = {
  id: string;
  label: string;
  stamCurrent: number;
  stamMax: number;
  stamStart: number | null;
  stamRunning: boolean;
  missionDone: boolean;
};

export type StarLeapTimer = {
  current: number;
  start: number | null;
  running: boolean;
};

export type StarLeapState = {
  stamina: StarLeapTimer;
  orb: StarLeapTimer;
};

export type TimerState = {
  schemaVersion: 1;
  slots: AbyssSlot[];
  dailyDate: string;
  g: { slots: GSlot[]; dailyDate: string };
  sl: StarLeapState;
};

export type CountdownInfo = {
  current: number;
  nextIn: number | null;
  fullIn: number | null;
  fullAt: number | null;
  isFull: boolean;
};

export type IdleInfo = {
  remainingMs: number | null;
  fullAt: number | null;
  isFull: boolean;
};
