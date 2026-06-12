/**
 * Hari berjalan dalam zona WIB (UTC+7).
 * Satu-satunya sumber "hari ini" untuk seluruh sistem —
 * assignment, streak, pipeline, play_date.
 */
export function todayWIB(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
}

export function yesterdayWIB(today?: string): string {
  const base = today
    ? new Date(today + "T00:00:00+07:00")
    : new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
  base.setDate(base.getDate() - 1);
  return base.toISOString().slice(0, 10);
}

export function daysAgoWIB(n: number): string {
  const base = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
  base.setDate(base.getDate() - n);
  return base.toISOString().slice(0, 10);
}
