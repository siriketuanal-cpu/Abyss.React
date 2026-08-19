/** Style guide: connected paired cards with quiet dark materials and aligned value baselines. */
import { useEffect, useRef, useState } from "react";
import { useLongPress } from "@/hooks/useLongPress";
import { formatClock, formatGameMinute, getAbyssStamina, getIdle, remainderAfterForty } from "@/lib/timerMath";
import type { AbyssSlot } from "@/lib/types";
import { TimerValue } from "./TimerValue";

export type AbyssEdit = { index: number; phase: "reference" | "manual"; reference: number } | null;

type Props = {
  slot: AbyssSlot;
  index: number;
  now: number;
  edit: AbyssEdit;
  idleArmed: boolean;
  onStaminaTap: (index: number) => void;
  onStaminaLongPress: (index: number) => void;
  onStaminaCommit: (index: number, value: string | null) => void;
  onIdleTap: (index: number) => void;
  onIdleLongPress: (index: number) => void;
  onNameCommit: (index: number, value: string) => void;
  onRankCommit: (index: number, value: string) => void;
};

export function AbyssPair({ slot, index, now, edit, idleArmed, onStaminaTap, onStaminaLongPress, onStaminaCommit, onIdleTap, onIdleLongPress, onNameCommit, onRankCommit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [headerEdit, setHeaderEdit] = useState<"name" | "rank" | null>(null);
  const stamina = getAbyssStamina(slot, now);
  const idle = getIdle(slot, now);
  const isReference = edit?.index === index && edit.phase === "reference";
  const isManual = edit?.index === index && edit.phase === "manual";
  const displayedCurrent = isReference || isManual ? edit.reference : stamina.current;
  const staminaGesture = useLongPress({ onClick: () => onStaminaTap(index), onLongPress: () => onStaminaLongPress(index) });
  const idleGesture = useLongPress({ onClick: () => onIdleTap(index), onLongPress: () => onIdleLongPress(index) });
  const nameGesture = useLongPress({ onClick: () => onStaminaTap(index), onLongPress: () => setHeaderEdit("name") });
  const rankGesture = useLongPress({ onClick: () => onStaminaTap(index), onLongPress: () => setHeaderEdit("rank") });

  useEffect(() => {
    if (isManual) {
      inputRef.current?.focus({ preventScroll: true });
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [isManual]);

  const group = `group-${Math.floor(index / 2)}`;
  const row = Math.floor(index / 2) + 1;
  const staminaColumn = index % 2 === 0 ? 1 : 4;
  const idleColumn = index % 2 === 0 ? 2 : 5;
  const idleMain = idle.isFull ? formatClock(idle.fullAt) : idle.remainingMs == null ? "—:—" : formatGameMinute(idle.remainingMs);
  const urgent = idle.isFull || (idle.remainingMs != null && idle.remainingMs < 2 * 60 * 1000);
  const stopHeader = (event: React.SyntheticEvent) => event.stopPropagation();
  const handleHeaderPointer = (event: React.PointerEvent, handler: (event: React.PointerEvent) => void) => {
    event.stopPropagation();
    handler(event);
  };
  const handleHeaderClick = (event: React.MouseEvent, handler: (event: React.MouseEvent) => void) => {
    event.stopPropagation();
    handler(event);
  };
  const suppressHeaderMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className={`abyss-pair ${group}`} data-abyss-index={index}>
      <div role="button" tabIndex={0} style={{ gridRow: row, gridColumn: staminaColumn }} className={`abyss-card stamina-card ${isReference || isManual ? "is-preview" : ""}`} {...staminaGesture}>
        <div className="slot-meta">
          {headerEdit === "name" ? <input autoFocus className="slot-meta-input slot-name-input" defaultValue={slot.label} placeholder={`スロット ${index + 1}`} onPointerDown={stopHeader} onPointerUp={stopHeader} onClick={stopHeader} onBlur={(event) => { onNameCommit(index, event.currentTarget.value); setHeaderEdit(null); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /> : <span className="header-edit-hit" {...nameGesture} onPointerDown={(event) => handleHeaderPointer(event, nameGesture.onPointerDown)} onPointerMove={(event) => handleHeaderPointer(event, nameGesture.onPointerMove)} onPointerUp={(event) => { event.stopPropagation(); nameGesture.onPointerUp(); }} onPointerCancel={(event) => { event.stopPropagation(); nameGesture.onPointerCancel(); }} onClick={(event) => handleHeaderClick(event, nameGesture.onClick)} onContextMenu={suppressHeaderMenu}>{slot.label || `スロット ${index + 1}`}</span>}
          {headerEdit === "rank" ? <input autoFocus className="slot-meta-input slot-rank-input" defaultValue={slot.rank} inputMode="numeric" onPointerDown={stopHeader} onPointerUp={stopHeader} onClick={stopHeader} onBlur={(event) => { onRankCommit(index, event.currentTarget.value); setHeaderEdit(null); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /> : <span className="header-edit-hit rank-hit" {...rankGesture} onPointerDown={(event) => handleHeaderPointer(event, rankGesture.onPointerDown)} onPointerMove={(event) => handleHeaderPointer(event, rankGesture.onPointerMove)} onPointerUp={(event) => { event.stopPropagation(); rankGesture.onPointerUp(); }} onPointerCancel={(event) => { event.stopPropagation(); rankGesture.onPointerCancel(); }} onClick={(event) => handleHeaderClick(event, rankGesture.onClick)} onContextMenu={suppressHeaderMenu}>Lv.{slot.rank}</span>}
        </div>
        <span className="card-label stamina-label">スタミナ</span>
        <TimerValue value={stamina.isFull ? formatClock(stamina.fullAt) : slot.stamRunning ? formatGameMinute(stamina.fullIn) : "—:—"} reached={stamina.isFull} urgent={!stamina.isFull && stamina.fullIn != null && stamina.fullIn < 2 * 60 * 60 * 1000} />
        <div className={`card-sub value-sub ${isManual ? "is-editing" : ""}`}>
          <span className="current-value">{displayedCurrent}</span>
          {isManual && <input ref={inputRef} className="inline-value-input" inputMode="numeric" pattern="[0-9]*" aria-label="現在スタミナ" onPointerDown={stopHeader} onBlur={(event) => onStaminaCommit(index, event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />}
          <span className="slash">/</span><span className="max-value">{slot.stamMax}</span>
          {!isReference && !isManual && !stamina.isFull && stamina.fullAt && <span className="plan-clock">{formatClock(stamina.fullAt)}</span>}
          {isReference && <span className="action-hint">長押しで確定</span>}
        </div>
      </div>
      <div role="button" tabIndex={0} style={{ gridRow: row, gridColumn: idleColumn }} className={`abyss-card idle-card ${idleArmed ? "is-armed" : ""}`} {...idleGesture}>
        <span className={`daily-mark ${slot.missionDone ? "is-done" : ""}`} aria-label="デイリー完了">✔</span>
        <span className="card-label idle-label">放置報酬</span>
        <TimerValue value={idleMain} reached={idle.isFull} urgent={urgent && !idleArmed} />
        <div className="card-sub idle-sub">{idleArmed ? "長押しで受取" : idle.isFull ? "満タン" : idle.remainingMs == null ? "未開始" : formatClock(idle.fullAt)}</div>
      </div>
    </div>
  );
}

export const referenceValueFor = (slot: AbyssSlot, now: number) => remainderAfterForty(getAbyssStamina(slot, now).current);
