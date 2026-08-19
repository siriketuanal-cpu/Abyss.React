/** Style guide: v153-inspired compact dark console; preserve density, quiet motion, and clear timer baselines. */
import { useEffect, useMemo, useState } from "react";
import { AbyssPair, type AbyssEdit, referenceValueFor } from "@/components/AbyssPair";
import { GGenerationCard, type GEdit } from "@/components/GGenerationCard";
import { StarLeapCards, compactTimeToMs, orbStartForRemaining } from "@/components/StarLeapCard";
import { DataRecoveryPanel } from "@/components/DataRecoveryPanel";
import { usePersistentTimerState } from "@/hooks/usePersistentTimerState";
import { useTimerClock } from "@/hooks/useTimerClock";
import { abyssMaxForRank, ABYSS_RANK_MAX, ABYSS_RANK_MIN, clampInt, getAbyssStamina, getDayKey, updateAbyssStaminaPreservingCycle } from "@/lib/timerMath";

const replaceAt = <T,>(items: T[], index: number, next: T) => items.map((item, itemIndex) => itemIndex === index ? next : item);
const IDLE_LEAD_MS = 2 * 60 * 1000;

export default function Home() {
  const { state, updateState, saveFailed, hasBackup, restoreBackup, resetReactState } = usePersistentTimerState();
  const now = useTimerClock(state);
  const [abyssEdit, setAbyssEdit] = useState<AbyssEdit>(null);
  const [idleArmed, setIdleArmed] = useState<number | null>(null);
  const [gArmed, setGArmed] = useState<number | null>(null);
  const [gEdit, setGEdit] = useState<GEdit>(null);
  const [slArmed, setSlArmed] = useState<"stamina" | "orb" | null>(null);
  const [slEdit, setSlEdit] = useState<"stamina" | "orb" | null>(null);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const interactionFocus = Boolean(abyssEdit || idleArmed !== null || gArmed !== null || gEdit || slArmed || slEdit);
  const idleConfirmFocus = idleArmed !== null;

  const dismissInteractionFocus = () => {
    setAbyssEdit(null);
    setIdleArmed(null);
    setGArmed(null);
    setGEdit(null);
    setSlArmed(null);
    setSlEdit(null);
  };

  useEffect(() => {
    const resetAtDay = getDayKey();
    if (state.dailyDate !== resetAtDay) updateState((previous) => ({ ...previous, dailyDate: resetAtDay, slots: previous.slots.map((slot) => ({ ...slot, missionDone: false })) }));
  }, [state.dailyDate, updateState]);

  useEffect(() => {
    const cancelReference = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (abyssEdit?.phase === "reference" && !target?.closest("[data-abyss-index]")) setAbyssEdit(null);
    };
    document.addEventListener("pointerdown", cancelReference);
    return () => document.removeEventListener("pointerdown", cancelReference);
  }, [abyssEdit]);

  const abyssPairs = useMemo(() => state.slots.map((slot, index) => ({ slot, index })), [state.slots]);

  const beginAbyssReference = (index: number) => {
    const slot = state.slots[index];
    setIdleArmed(null);
    setAbyssEdit({ index, phase: "reference", reference: referenceValueFor(slot, now) });
  };

  const commitAbyss = (index: number, raw: string | null) => {
    const edit = abyssEdit;
    if (!edit || edit.index !== index) return;
    if (edit.phase === "manual" && !raw?.trim()) { setAbyssEdit(null); return; }
    updateState((previous) => {
      const slot = previous.slots[index];
      const next = raw?.trim() ? clampInt(raw, 0, slot.stamMax, edit.reference) : edit.reference;
      return { ...previous, slots: replaceAt(previous.slots, index, updateAbyssStaminaPreservingCycle(slot, next, Date.now())) };
    });
    setAbyssEdit(null);
  };

  const onAbyssTap = (index: number) => {
    if (idleArmed !== null) { setIdleArmed(null); return; }
    if (abyssEdit?.index === index) return;
    if (abyssEdit) { setAbyssEdit(null); return; }
    beginAbyssReference(index);
  };

  const onAbyssLongPress = (index: number) => {
    if (abyssEdit?.index === index && abyssEdit.phase === "reference") { commitAbyss(index, null); return; }
    const slot = state.slots[index];
    setIdleArmed(null);
    setAbyssEdit({ index, phase: "manual", reference: getAbyssStamina(slot, now).current });
  };

  const onIdleTap = (index: number) => {
    setAbyssEdit(null);
    if (idleArmed === index) return;
    if (idleArmed !== null) { setIdleArmed(null); return; }
    setIdleArmed(index);
  };

  const onIdleLongPress = (index: number) => {
    if (idleArmed === index) {
      updateState((previous) => ({ ...previous, slots: replaceAt(previous.slots, index, { ...previous.slots[index], idleStart: Date.now() - IDLE_LEAD_MS, idleRunning: true }) }));
      setIdleArmed(null);
      return;
    }
    updateState((previous) => ({ ...previous, slots: replaceAt(previous.slots, index, { ...previous.slots[index], missionDone: !previous.slots[index].missionDone }) }));
  };

  const onAbyssNameCommit = (index: number, value: string) => {
    updateState((previous) => ({ ...previous, slots: replaceAt(previous.slots, index, { ...previous.slots[index], label: value.trim().slice(0, 32) }) }));
  };

  const onAbyssRankCommit = (index: number, value: string) => {
    updateState((previous) => {
      const slot = previous.slots[index];
      const rank = clampInt(value.replace(/\D/g, ""), ABYSS_RANK_MIN, ABYSS_RANK_MAX, slot.rank);
      const max = abyssMaxForRank(rank);
      return { ...previous, slots: replaceAt(previous.slots, index, { ...slot, rank, stamMax: max, stamCurrent: Math.min(slot.stamCurrent, max) }) };
    });
  };

  const onGTap = (index: number) => {
    if (gArmed === index) { setGEdit({ index, field: "current" }); setGArmed(null); return; }
    if (gArmed !== null) return;
    setGArmed(index);
  };

  const onGCommit = (index: number, field: "current" | "max", raw: string) => {
    updateState((previous) => {
      const slot = previous.g.slots[index];
      if (!raw.trim()) return previous;
      if (field === "max") {
        const max = clampInt(raw, 1, 999, slot.stamMax);
        return { ...previous, g: { ...previous.g, slots: replaceAt(previous.g.slots, index, { ...slot, stamMax: max, stamCurrent: Math.min(slot.stamCurrent, max) }) } };
      }
      const current = clampInt(raw, 0, slot.stamMax, slot.stamCurrent);
      return { ...previous, g: { ...previous.g, slots: replaceAt(previous.g.slots, index, { ...slot, stamCurrent: current, stamStart: Date.now(), stamRunning: true }) } };
    });
    setGEdit(null);
  };

  const onStarLeapTap = (target: "stamina" | "orb") => {
    if (slEdit) { setSlEdit(null); setSlArmed(null); return; }
    if (slArmed === target) { setSlEdit(target); setSlArmed(null); return; }
    if (slArmed !== null) { setSlArmed(null); return; }
    setSlArmed(target);
  };

  const onStarLeapStaminaCommit = (raw: string) => {
    if (raw.trim()) updateState((previous) => ({ ...previous, sl: { ...previous.sl, stamina: { current: clampInt(raw, 0, 80, previous.sl.stamina.current), start: Date.now(), running: true } } }));
    setSlEdit(null);
  };

  const onStarLeapOrbCommit = (raw: string) => {
    const remaining = compactTimeToMs(raw);
    if (remaining != null) updateState((previous) => ({ ...previous, sl: { ...previous.sl, orb: { current: 0, start: orbStartForRemaining(Math.min(4 * 6 * 60 * 60 * 1000, remaining), Date.now()), running: true } } }));
    setSlEdit(null);
  };

  return (
    <main className="timer-app" aria-label="深淵タイマー">
      {interactionFocus && <button type="button" className={`confirm-backdrop ${idleConfirmFocus ? "idle-confirm" : "edit-confirm"}`} aria-label="確認待機を解除" onClick={dismissInteractionFocus} />}
      <header className="app-header">
        <time>{new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(new Date(now))}</time>
        {saveFailed && <span className="save-warning">保存失敗</span>}
        <button type="button" className="data-toggle" aria-expanded={showDataPanel} onClick={() => { setShowDataPanel((visible) => !visible); setResetConfirm(false); }}>管理</button>
      </header>

      {showDataPanel && <DataRecoveryPanel hasBackup={hasBackup} resetConfirm={resetConfirm} onRestore={() => { if (restoreBackup()) setResetConfirm(false); }} onResetRequest={() => setResetConfirm(true)} onResetConfirm={() => { resetReactState(); setResetConfirm(false); }} onResetCancel={() => setResetConfirm(false)} />}

      <section className="abyss-grid" aria-label="ドットアビス全グループ">
        {abyssPairs.map(({ slot, index }) => <AbyssPair key={slot.id} slot={slot} index={index} now={now} edit={abyssEdit} idleArmed={idleArmed === index} onStaminaTap={onAbyssTap} onStaminaLongPress={onAbyssLongPress} onStaminaCommit={commitAbyss} onIdleTap={onIdleTap} onIdleLongPress={onIdleLongPress} onNameCommit={onAbyssNameCommit} onRankCommit={onAbyssRankCommit} />)}
      </section>

      <section className="games-grid" aria-label="Gジェネとスターリープ">
        {state.g.slots.map((slot, index) => <GGenerationCard key={slot.id} slot={slot} index={index} now={now} armed={gArmed === index} edit={gEdit} onTap={onGTap} onLongPress={(slotIndex) => { setGEdit({ index: slotIndex, field: "max" }); setGArmed(null); }} onCommit={onGCommit} onToggleDaily={(slotIndex) => updateState((previous) => ({ ...previous, g: { ...previous.g, slots: replaceAt(previous.g.slots, slotIndex, { ...previous.g.slots[slotIndex], missionDone: !previous.g.slots[slotIndex].missionDone }) } }))} onNameCommit={(slotIndex, value) => updateState((previous) => ({ ...previous, g: { ...previous.g, slots: replaceAt(previous.g.slots, slotIndex, { ...previous.g.slots[slotIndex], label: value.trim().slice(0, 24) || `G${slotIndex + 1}` }) } }))} />)}
        <StarLeapCards state={state.sl} now={now} armed={slArmed} edit={slEdit} onTap={onStarLeapTap} onCommitStamina={onStarLeapStaminaCommit} onCommitOrb={onStarLeapOrbCommit} />
      </section>
    </main>
  );
}
