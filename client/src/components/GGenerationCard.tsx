/** Style guide: compact dark-console card; cyan state color and a baseline shared with Star Leap. */
import { useEffect, useRef, useState } from "react";
import { useLongPress } from "@/hooks/useLongPress";
import { formatClock, formatGameMinute, getGStamina } from "@/lib/timerMath";
import type { GSlot } from "@/lib/types";
import { TimerValue } from "./TimerValue";

export type GEdit = { index: number; field: "current" | "max" } | null;

type Props = {
  slot: GSlot;
  index: number;
  now: number;
  armed: boolean;
  edit: GEdit;
  onTap: (index: number) => void;
  onLongPress: (index: number) => void;
  onCommit: (index: number, field: "current" | "max", value: string) => void;
  onToggleDaily: (index: number) => void;
  onNameCommit: (index: number, value: string) => void;
};

export function GGenerationCard({ slot, index, now, armed, edit, onTap, onLongPress, onCommit, onToggleDaily, onNameCommit }: Props) {
  const currentInput = useRef<HTMLInputElement>(null);
  const maxInput = useRef<HTMLInputElement>(null);
  const [nameEdit, setNameEdit] = useState(false);
  const stamina = getGStamina(slot, now);
  const active = edit?.index === index ? edit.field : null;
  const gesture = useLongPress({ onClick: () => onTap(index), onLongPress: () => onLongPress(index) });
  const nameGesture = useLongPress({ onLongPress: () => setNameEdit(true) });
  const dailyGesture = useLongPress({ onLongPress: () => onToggleDaily(index) });

  useEffect(() => {
    const input = active === "current" ? currentInput.current : active === "max" ? maxInput.current : null;
    if (input) { input.value = ""; input.focus({ preventScroll: true }); }
  }, [active]);

  const stop = (event: React.SyntheticEvent) => event.stopPropagation();
  return (
    <div role="button" tabIndex={0} className={`game-card g-card ${armed ? "is-armed" : ""} ${active ? "is-editing" : ""}`} {...gesture}>
      <span className="game-daily" {...dailyGesture} onPointerDown={(event) => { stop(event); dailyGesture.onPointerDown(event); }} onPointerMove={(event) => { stop(event); dailyGesture.onPointerMove(event); }} onPointerUp={(event) => { stop(event); dailyGesture.onPointerUp(); }} onPointerCancel={(event) => { stop(event); dailyGesture.onPointerCancel(); }} onClick={(event) => { stop(event); dailyGesture.onClick(event); }}>{slot.missionDone ? "✓" : ""}</span>
      {nameEdit ? <input autoFocus className="g-name-input" defaultValue={slot.label} onPointerDown={stop} onBlur={(event) => { onNameCommit(index, event.currentTarget.value); setNameEdit(false); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /> : <span className="game-name" {...nameGesture} onPointerDown={(event) => { stop(event); nameGesture.onPointerDown(event); }} onPointerMove={(event) => { stop(event); nameGesture.onPointerMove(event); }} onPointerUp={(event) => { stop(event); nameGesture.onPointerUp(); }} onPointerCancel={(event) => { stop(event); nameGesture.onPointerCancel(); }} onClick={(event) => { stop(event); nameGesture.onClick(event); }}>{slot.label || `G${index + 1}`}</span>}
      <TimerValue value={stamina.isFull ? formatClock(stamina.fullAt) : slot.stamRunning ? formatGameMinute(stamina.fullIn) : "—:—"} reached={stamina.isFull} />
      <div className={`game-sub value-sub ${active ? "is-editing" : ""}`}>
        <span className="current-value">{stamina.current}</span>
        {active === "current" && <input ref={currentInput} className="inline-value-input" inputMode="numeric" onPointerDown={stop} onBlur={(event) => onCommit(index, "current", event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />}
        <span className="slash">/</span><span className="max-value">{slot.stamMax}</span>
        {active === "max" && <input ref={maxInput} className="inline-max-input" inputMode="numeric" onPointerDown={stop} onBlur={(event) => onCommit(index, "max", event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />}
        {!active && stamina.fullAt && !stamina.isFull && <span className="plan-clock">{formatClock(stamina.fullAt)}</span>}
        {armed && <span className="action-hint">ARM</span>}
      </div>
    </div>
  );
}
