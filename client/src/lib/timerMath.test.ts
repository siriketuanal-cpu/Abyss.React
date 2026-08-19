import { describe, expect, it } from "vitest";
import { ABYSS_STAM_INTERVAL, createAbyssSlot, getAbyssStamina, updateAbyssStaminaPreservingCycle } from "./timerMath";
import { compactTimeToMs, orbStartForRemaining } from "@/components/StarLeapCard";

describe("ドットアビスの回復サイクル", () => {
  it("3分回復の途中で現在値を更新しても次回回復までの残り時間を維持する", () => {
    const now = 1_000_000;
    const slot = { ...createAbyssSlot(0), stamCurrent: 12, stamMax: 240, stamStart: now - 2 * 60 * 1000, stamRunning: true };
    const updated = updateAbyssStaminaPreservingCycle(slot, 7, now);
    const after = getAbyssStamina(updated, now + 59_999);
    const recovered = getAbyssStamina(updated, now + 60_000);
    expect(after.current).toBe(7);
    expect(recovered.current).toBe(8);
  });

  it("満タン到達時刻を開始時刻から一意に計算する", () => {
    const now = 1_000_000;
    const slot = { ...createAbyssSlot(0), stamCurrent: 239, stamMax: 240, stamStart: now, stamRunning: true };
    const info = getAbyssStamina(slot, now + ABYSS_STAM_INTERVAL);
    expect(info.isFull).toBe(true);
    expect(info.fullAt).toBe(now + ABYSS_STAM_INTERVAL);
  });
});

describe("スターリープのオーブ時刻入力", () => {
  it("4桁の1115を11時間15分として解釈する", () => {
    expect(compactTimeToMs("1115")).toBe((11 * 60 + 15) * 60 * 1000);
  });

  it("オーブ残り時間から開始時刻を逆算できる", () => {
    const now = 10_000_000;
    const remaining = 2 * 60 * 60 * 1000;
    expect(orbStartForRemaining(remaining, now)).toBe(now - (24 * 60 * 60 * 1000 - remaining));
  });
});
