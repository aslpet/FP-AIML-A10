/**
 * Pure function untuk logika streak harian.
 * Acuan: TRD-06 §2
 *
 * Rules:
 * - Hanya sesi pertama/hari yang memengaruhi streak
 * - Konsekutif (+1 jika kemarin main)
 * - Bolong 1 hari → reset ke 1
 * - Sesi bonus (bukan pertama hari itu) → streak TIDAK berubah
 */

export interface StreakState {
  streakCount: number;
  lastPlayedDate: string | null; // yyyy-mm-dd
}

/**
 * Hitung streak baru setelah menyelesaikan sesi.
 *
 * @param state    - state streak sebelum sesi ini
 * @param today    - tanggal hari ini (yyyy-mm-dd WIB)
 * @param isFirst  - apakah ini sesi pertama user hari ini?
 * @returns        - state streak yang baru
 */
export function updateStreak(
  state: StreakState,
  today: string,
  isFirst: boolean,
): StreakState {
  if (!isFirst) {
    // Sesi bonus — streak tidak berubah
    return state;
  }

  const yesterday = offsetDate(today, -1);

  if (state.lastPlayedDate === null) {
    // Main pertama kali
    return { streakCount: 1, lastPlayedDate: today };
  }

  if (state.lastPlayedDate === today) {
    // Sudah dihitung hari ini
    return state;
  }

  if (state.lastPlayedDate === yesterday) {
    // Hari berturut-turut
    return {
      streakCount: state.streakCount + 1,
      lastPlayedDate: today,
    };
  }

  // Bolong — reset
  return { streakCount: 1, lastPlayedDate: today };
}

/**
 * Offset tanggal yyyy-mm-dd sebanyak n hari.
 * Menggunakan Date.UTC agar tidak terpengaruh timezone lokal.
 */
export function offsetDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().slice(0, 10);
}
