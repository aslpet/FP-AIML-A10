import { describe, it, expect } from "vitest";
import { updateStreak, type StreakState } from "./streak";

describe("Streak (TRD-06 §2)", () => {
  it("main pertama kali → streak = 1", () => {
    const state: StreakState = { streakCount: 0, lastPlayedDate: null };
    const result = updateStreak(state, "2026-06-12", true);
    expect(result.streakCount).toBe(1);
    expect(result.lastPlayedDate).toBe("2026-06-12");
  });

  it("hari berturut-turut → streak +1", () => {
    const state: StreakState = { streakCount: 3, lastPlayedDate: "2026-06-11" };
    const result = updateStreak(state, "2026-06-12", true);
    expect(result.streakCount).toBe(4);
  });

  it("bolong 1 hari → reset ke 1", () => {
    const state: StreakState = { streakCount: 5, lastPlayedDate: "2026-06-09" };
    const result = updateStreak(state, "2026-06-12", true);
    expect(result.streakCount).toBe(1);
  });

  it("bolong >1 hari → tetap reset ke 1", () => {
    const state: StreakState = { streakCount: 7, lastPlayedDate: "2026-06-01" };
    const result = updateStreak(state, "2026-06-12", true);
    expect(result.streakCount).toBe(1);
  });

  it("sesi bonus (bukan pertama hari itu) → streak TIDAK berubah", () => {
    const state: StreakState = { streakCount: 3, lastPlayedDate: "2026-06-12" };
    const result = updateStreak(state, "2026-06-12", false);
    expect(result.streakCount).toBe(3);
    expect(result.lastPlayedDate).toBe("2026-06-12");
  });

  it("main hari yang sama dua kali → streak tidak dobel", () => {
    // Sudah main hari ini
    const state: StreakState = { streakCount: 2, lastPlayedDate: "2026-06-12" };
    // Coba main lagi (sesi pertama dianggap sudah dihitung)
    const result = updateStreak(state, "2026-06-12", true);
    // Karena lastPlayedDate === today, streak tidak berubah
    expect(result.streakCount).toBe(2);
  });

  it("cross-bulan: 31 Jan → 1 Feb tetap konsekutif", () => {
    const state: StreakState = { streakCount: 10, lastPlayedDate: "2026-01-31" };
    const result = updateStreak(state, "2026-02-01", true);
    expect(result.streakCount).toBe(11);
  });

  it("cross-tahun: 31 Dec → 1 Jan tetap konsekutif", () => {
    const state: StreakState = { streakCount: 30, lastPlayedDate: "2026-12-31" };
    const result = updateStreak(state, "2027-01-01", true);
    expect(result.streakCount).toBe(31);
  });
});
