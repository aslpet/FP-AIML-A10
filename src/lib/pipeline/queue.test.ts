import { describe, it, expect } from "vitest";

/**
 * Pure logic: TTL check without DB.
 * Acuan: TRD-02 §6
 */

function isExpired(createdAt: string, ttlDays: number, now: string): boolean {
  const created = new Date(createdAt + "T00:00:00+07:00");
  const current = new Date(now + "T00:00:00+07:00");
  const diffMs = current.getTime() - created.getTime();
  const diffDays = diffMs / 86400000;
  return diffDays > ttlDays;
}

function lifoPick(
  items: { id: string; createdAt: string }[],
  ttlDays: number,
  now: string,
): string | null {
  const valid = items.filter((i) => !isExpired(i.createdAt, ttlDays, now));
  if (valid.length === 0) return null;
  // LIFO: termuda (createdAt terbaru)
  valid.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return valid[0].id;
}

describe("TTL Queue (TRD-02 §6)", () => {
  const NOW = "2026-06-12";

  it("item ≤3 hari → belum expired", () => {
    expect(isExpired("2026-06-10", 3, NOW)).toBe(false);
    expect(isExpired("2026-06-09", 3, NOW)).toBe(false);
  });

  it("item >3 hari → expired", () => {
    expect(isExpired("2026-06-08", 3, NOW)).toBe(true);
    expect(isExpired("2026-01-01", 3, NOW)).toBe(true);
  });

  it("batas tepat 3 hari → belum expired (≤, bukan <)", () => {
    // created 3 hari lalu, masih hidup
    expect(isExpired("2026-06-09", 3, NOW)).toBe(false);
  });

  it("LIFO: ambil item termuda yang belum expired", () => {
    const items = [
      { id: "old", createdAt: "2026-06-09" },
      { id: "new", createdAt: "2026-06-10" },
      { id: "expired", createdAt: "2026-06-05" },
    ];
    const picked = lifoPick(items, 3, NOW);
    // "new" (2026-06-10) lebih muda dari "old" (2026-06-09)
    expect(picked).toBe("new");
  });

  it("jika semua expired → return null", () => {
    const items = [
      { id: "a", createdAt: "2026-06-01" },
      { id: "b", createdAt: "2026-06-05" },
    ];
    const picked = lifoPick(items, 3, NOW);
    expect(picked).toBeNull();
  });

  it("hanya item yang belum expired yang dipertimbangkan", () => {
    const items = [
      { id: "expired", createdAt: "2026-06-01" },
      { id: "valid", createdAt: "2026-06-10" },
    ];
    const picked = lifoPick(items, 3, NOW);
    expect(picked).toBe("valid");
  });
});

describe("Housekeeping (TRD-02 §6)", () => {
  it("filter item expired untuk di-retire", () => {
    const NOW = "2026-06-12";
    const items = [
      { id: "keep1", createdAt: "2026-06-10" },
      { id: "keep2", createdAt: "2026-06-09" },
      { id: "retire1", createdAt: "2026-06-08" },
      { id: "retire2", createdAt: "2026-06-01" },
    ];
    const toRetire = items.filter((i) => isExpired(i.createdAt, 3, NOW));
    expect(toRetire).toHaveLength(2);
    expect(toRetire.map((i) => i.id)).toEqual(["retire1", "retire2"]);
  });
});
