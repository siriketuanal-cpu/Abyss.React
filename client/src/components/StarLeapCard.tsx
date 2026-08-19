/** Style guide: label-free Star Leap cards; lower numeric rail aligns exactly with G Generation. */
import { useEffect, useRef } from "react";
import { formatClock, formatGameMinute, getStarLeapOrb, getStarLeapStamina, SL_ORB_INTERVAL } from "@/lib/timerMath";
import type { StarLeapState } from "@/lib/types";
import { TimerValue } from "./TimerValue";

type Props = {
  state: StarLeapState;
  now: number;
  armed: "stamina" | "orb" | null;
  edit: "stamina" | "orb" | null;
  onTap: (target: "stamina" | "orb") => void;
  onCommitStamina: (value: string) => void;
  onCommitOrb: (value: string) => void;
};

export function StarLeapCards({ state, now, armed, edit, onTap, onCommitStamina, onCommitOrb }: Props) {
  const staminaInput = useRef<HTMLInputElement>(null);
  const orbInput = useRef<HTMLInputElement>(null);
  const stamina = getStarLeapStamina(state.stamina, now);
  const orb = getStarLeapOrb(state.orb, now);

  useEffect(() => {
    const input = edit === "stamina" ? staminaInput.current : edit === "orb" ? orbInput.current : null;
    if (input) { input.value = ""; input.focus({ preventScroll: true }); }
  }, [edit]);

  return (
    <>
      <button type="button" className={`game-card sl-card ${armed === "stamina" || edit === "stamina" ? "is-focus" : ""}`} onClick={() => onTap("stamina")}>
        <TimerValue value={stamina.isFull ? formatClock(stamina.fullAt) : state.stamina.running ? formatGameMinute(stamina.fullIn) : "—:—"} reached={stamina.isFull} />
        <div className={`game-sub value-sub ${edit === "stamina" ? "is-editing" : ""}`}>
          <span className="current-value">{stamina.current}</span>
          {edit === "stamina" && <input ref={staminaInput} className="inline-value-input" inputMode="numeric" onBlur={(event) => onCommitStamina(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />}
          <span className="slash">/</span><span className="max-value">80</span>
          {!edit && stamina.fullAt && !stamina.isFull && <span className="plan-clock">{formatClock(stamina.fullAt)}</span>}
        </div>
      </button>
      <button type="button" className={`game-card sl-card orb-card ${armed === "orb" || edit === "orb" ? "is-focus" : ""}`} onClick={() => onTap("orb")}>
        <span className="orb-dots">{Array.from({ length: 4 }, (_, index) => <span key={index} className={index < orb.current ? "is-filled" : ""}>○</span>)}</span>
        <div className={`game-sub orb-sub ${edit === "orb" ? "is-editing" : ""}`}>
          {edit === "orb" ? <input ref={orbInput} maxLength={4} className="orb-input" inputMode="numeric" onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 4); }} onBlur={(event) => onCommitOrb(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /> : <>{orb.current}/4&nbsp;&nbsp;{orb.isFull ? "到達" : state.orb.running ? formatGameMinute(orb.fullIn) : "未開始"}</>}
        </div>
      </button>
    </>
  );
}

export const compactTimeToMs = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (!digits) return null;
  const minutes = digits.length <= 2 ? Number(digits) : Number(digits.slice(0, -2)) * 60 + Math.min(59, Number(digits.slice(-2)));
  return Math.max(0, minutes * 60000);
};

export const orbStartForRemaining = (remainingMs: number, now: number) => now - (4 * SL_ORB_INTERVAL - remainingMs);
