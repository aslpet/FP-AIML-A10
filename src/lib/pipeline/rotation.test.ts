import { describe, it, expect } from "vitest";

/**
 * Pure logic: determine active categories based on last-active dates.
 * Extracted from rotation.ts for testability without DB.
 *
 * Acuan: TRD-02 §3
 */

type CategoryId =
  | "politik_hukum"
  | "ekonomi"
  | "teknologi"
  | "sosial_pendidikan"
  | "lingkungan";

const ALL: CategoryId[] = [
  "politik_hukum",
  "ekonomi",
  "teknologi",
  "sosial_pendidikan",
  "lingkungan",
];

function rotate(
  lastActive: Record<CategoryId, number>, // days since last active
  target: number, // DAILY_ACTIVE_CATEGORIES (4)
): CategoryId[] {
  const selected: CategoryId[] = [];

  // Pagar keadilan: WAJIB sertakan yang absen ≥2 hari
  const mustInclude = ALL.filter((c) => lastActive[c] >= 2);
  for (const cat of mustInclude) {
    if (selected.length < target && !selected.includes(cat)) {
      selected.push(cat);
    }
  }

  // Sisa slot diisi dari yang absen terlama (bobot prioritas)
  const remaining = ALL.filter((c) => !selected.includes(c));
  remaining.sort((a, b) => lastActive[b] - lastActive[a]);

  for (const cat of remaining) {
    if (selected.length >= target) break;
    selected.push(cat);
  }

  return selected;
}

describe("Rotasi Kategori (TRD-02 §3)", () => {
  it("memilih tepat 4 kategori", () => {
    const lastActive: Record<CategoryId, number> = {
      politik_hukum: 1,
      ekonomi: 1,
      teknologi: 1,
      sosial_pendidikan: 1,
      lingkungan: 1,
    };
    const result = rotate(lastActive, 4);
    expect(result).toHaveLength(4);
  });

  it("WAJIB sertakan kategori yang absen ≥2 hari (pagar keadilan FR-3)", () => {
    // lingkungan absen 3 hari → harus masuk
    const lastActive: Record<CategoryId, number> = {
      politik_hukum: 1,
      ekonomi: 1,
      teknologi: 1,
      sosial_pendidikan: 1,
      lingkungan: 3,
    };
    const result = rotate(lastActive, 4);
    expect(result).toContain("lingkungan");
  });

  it("jika ≥2 kategori absen ≥2 hari, prioritaskan semuanya", () => {
    const lastActive: Record<CategoryId, number> = {
      politik_hukum: 2,
      ekonomi: 2,
      teknologi: 1,
      sosial_pendidikan: 1,
      lingkungan: 1,
    };
    const result = rotate(lastActive, 4);
    expect(result).toContain("politik_hukum");
    expect(result).toContain("ekonomi");
    expect(result).toHaveLength(4);
  });

  it("prioritas berbobot: yang paling lama absen dipilih duluan", () => {
    // All have been active recently except one very stale
    const lastActive: Record<CategoryId, number> = {
      politik_hukum: 5,
      ekonomi: 1,
      teknologi: 1,
      sosial_pendidikan: 2,
      lingkungan: 1,
    };
    const result = rotate(lastActive, 4);
    // politik_hukum (5) dan sosial_pendidikan (2) wajib masuk
    expect(result).toContain("politik_hukum");
    expect(result).toContain("sosial_pendidikan");
  });

  it("semua kategori belum pernah aktif → 4 terpilih acak", () => {
    const lastActive: Record<CategoryId, number> = {
      politik_hukum: 999,
      ekonomi: 999,
      teknologi: 999,
      sosial_pendidikan: 999,
      lingkungan: 999,
    };
    const result = rotate(lastActive, 4);
    expect(result).toHaveLength(4);
    // Semua unik
    expect(new Set(result).size).toBe(4);
  });
});
