import { describe, it, expect } from "vitest";
import { aggregate, computeVerdict, type DimensionScores } from "./scoring";

describe("Aggregate (TRD-05 §3)", () => {
  const baseScores: DimensionScores = {
    penalaran: 5,
    relevansi: 5,
    responsiveness: 5,
    kejelasan: 5,
  };

  it("skor sempurna (5,5,5,5) → 100", () => {
    expect(aggregate(baseScores)).toBe(100);
  });

  it("skor minimum (1,1,1,1) → 0", () => {
    const scores: DimensionScores = {
      penalaran: 1,
      relevansi: 1,
      responsiveness: 1,
      kejelasan: 1,
    };
    expect(aggregate(scores)).toBe(0);
  });

  it("weighted sum sesuai bobot 35/25/25/15", () => {
    // penalaran=5, lainnya=1
    const scores: DimensionScores = {
      penalaran: 5,
      relevansi: 1,
      responsiveness: 1,
      kejelasan: 1,
    };
    // raw = 0.35*5 + 0.25*1 + 0.25*1 + 0.15*1 = 1.75+0.25+0.25+0.15 = 2.4
    // total = round((2.4-1)/4*100) = round(35) = 35
    // relevansi <= 2 → gate ×0.5 → 18
    const result = aggregate(scores);
    expect(result).toBe(18);
  });

  it("skor 3 di semua dimensi → 50", () => {
    const scores: DimensionScores = {
      penalaran: 3,
      relevansi: 3,
      responsiveness: 3,
      kejelasan: 3,
    };
    // raw = 3 (karena semua bobot sum = 1)
    // total = round((3-1)/4*100) = round(50) = 50
    expect(aggregate(scores)).toBe(50);
  });

  describe("Gate Relevansi (FR-39)", () => {
    it("Relevansi ≤ 2 → skor ×0.5", () => {
      const high: DimensionScores = {
        penalaran: 5,
        relevansi: 2,
        responsiveness: 4,
        kejelasan: 4,
      };
      // raw = 0.35*5 + 0.25*2 + 0.25*4 + 0.15*4 = 1.75+0.5+1+0.6 = 3.85
      // total = round((3.85-1)/4*100) = round(71.25) = 71
      // gate: ×0.5 → 36
      const withGate = aggregate(high);
      expect(withGate).toBe(36);

      // Bandingkan tanpa gate (relevansi >2)
      const noGate: DimensionScores = {
        penalaran: 5,
        relevansi: 3,
        responsiveness: 4,
        kejelasan: 4,
      };
      // raw = 0.35*5 + 0.25*3 + 0.25*4 + 0.15*4 = 1.75+0.75+1+0.6 = 4.1
      // total = round((4.1-1)/4*100) = round(77.5) = 78
      const withoutGate = aggregate(noGate);
      expect(withoutGate).toBeGreaterThan(withGate);
    });

    it("Relevansi > 2 → tidak kena gate", () => {
      const scores: DimensionScores = {
        penalaran: 3,
        relevansi: 3,
        responsiveness: 3,
        kejelasan: 3,
      };
      expect(aggregate(scores)).toBe(50); // tidak di-cap
    });
  });

  it("clamp 0–100", () => {
    // Skor sangat rendah
    const low: DimensionScores = {
      penalaran: 1,
      relevansi: 1,
      responsiveness: 1,
      kejelasan: 1,
    };
    expect(aggregate(low)).toBe(0);

    // Skor di atas 100 tidak mungkin dengan rumus rescale, tapi pastikan
    expect(aggregate(baseScores)).toBeLessThanOrEqual(100);
  });
});

describe("Verdict (TRD-05 §5)", () => {
  it("base ≥ 4 → Argumen Bertahan", () => {
    const scores: DimensionScores = {
      penalaran: 5,
      relevansi: 5,
      responsiveness: 4,
      kejelasan: 5,
    };
    // base = 0.5*4 + 0.5*5 = 4.5 ≥ 4
    expect(computeVerdict(scores)).toBe("Argumen Bertahan");
  });

  it("base ≥ 2.5 → Imbang Ketat", () => {
    const scores: DimensionScores = {
      penalaran: 3,
      relevansi: 3,
      responsiveness: 3,
      kejelasan: 3,
    };
    // base = 0.5*3 + 0.5*3 = 3 ≥ 2.5
    expect(computeVerdict(scores)).toBe("Imbang Ketat");
  });

  it("base < 2.5 → Argumen Runtuh", () => {
    const scores: DimensionScores = {
      penalaran: 2,
      relevansi: 2,
      responsiveness: 2,
      kejelasan: 2,
    };
    // base = 0.5*2 + 0.5*2 = 2 < 2.5
    expect(computeVerdict(scores)).toBe("Argumen Runtuh");
  });

  it("batas tepat 4.0 → Bertahan", () => {
    const scores: DimensionScores = {
      penalaran: 4,
      relevansi: 3,
      responsiveness: 4,
      kejelasan: 3,
    };
    // base = 0.5*4 + 0.5*4 = 4
    expect(computeVerdict(scores)).toBe("Argumen Bertahan");
  });

  it("batas tepat 2.5 → Imbang", () => {
    const scores: DimensionScores = {
      penalaran: 2,
      relevansi: 3,
      responsiveness: 3,
      kejelasan: 3,
    };
    // base = 0.5*3 + 0.5*2 = 2.5
    expect(computeVerdict(scores)).toBe("Imbang Ketat");
  });
});
