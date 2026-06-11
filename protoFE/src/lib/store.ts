"use client";

import { useCallback, useEffect, useState } from "react";
import { CATEGORY_ORDER } from "./categories";
import { aggregate, computeVerdict, shuffle, todayWIB, uid } from "./util";
import { getMotion, MOTION_BY_CATEGORY } from "./mock/motions";
import type {
  CategoryId,
  ProtoState,
  Scores,
  SessionResult,
  VerdictTier,
} from "./types";

const KEY = "debatin_proto_v1";

function daysAgo(n: number): string {
  const d = new Date(new Date(todayWIB()).getTime() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

function seededSession(
  category: CategoryId,
  scores: Scores,
  daysBack: number,
): SessionResult {
  const motion = MOTION_BY_CATEGORY[category];
  const total = aggregate(scores);
  const verdict = computeVerdict(scores);
  return {
    session_id: uid(),
    play_date: daysAgo(daysBack),
    category,
    motion_text: motion?.motion_text ?? "",
    scores,
    rationale: {
      penalaran: "Penalaran tertata, sebagian klaim perlu bukti tambahan.",
      relevansi: "Argumen menempel pada mosi.",
      responsiveness: "Beberapa sanggahan dijawab langsung.",
      kejelasan: "Penyampaian runut.",
    },
    total_score: total,
    feedback: "Sesi latihan tersimpan.",
    verdict,
    is_bonus: false,
  };
}

function chooseActiveCategories(): CategoryId[] {
  // Simulasi rotasi 4 dari 5.
  return shuffle(CATEGORY_ORDER).slice(0, 4);
}

function freshDailyFields() {
  return {
    todayDate: todayWIB(),
    activeCategories: chooseActiveCategories(),
    assignedCategory: null as CategoryId | null,
    playedTodayCategories: [] as CategoryId[],
  };
}

function defaultState(): ProtoState {
  // Seed riwayat agar History & tren tidak kosong saat demo.
  const seeds: SessionResult[] = [
    seededSession("ekonomi", { penalaran: 3, relevansi: 3, responsiveness: 2, kejelasan: 3 }, 6),
    seededSession("teknologi", { penalaran: 3, relevansi: 4, responsiveness: 3, kejelasan: 3 }, 5),
    seededSession("lingkungan", { penalaran: 4, relevansi: 4, responsiveness: 3, kejelasan: 4 }, 3),
    seededSession("sosial_pendidikan", { penalaran: 4, relevansi: 4, responsiveness: 4, kejelasan: 4 }, 1),
  ];
  const verdictDist: Record<VerdictTier, number> = {
    bertahan: 0,
    imbang: 0,
    runtuh: 0,
  };
  seeds.forEach((s) => (verdictDist[s.verdict] += 1));

  return {
    consented: false,
    streak: 3,
    bestStreak: 5,
    totalPlayed: seeds.length,
    lastPlayedDate: daysAgo(1),
    verdictDist,
    ...freshDailyFields(),
    sessions: seeds,
    isAnonymous: true,
  };
}

function load(): ProtoState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as ProtoState;
    // Roll-over harian
    if (parsed.todayDate !== todayWIB()) {
      Object.assign(parsed, freshDailyFields());
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

function persist(s: ProtoState) {
  if (typeof window !== "undefined")
    window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function useProto() {
  const [state, setState] = useState<ProtoState | null>(null);

  useEffect(() => {
    setState(load());
  }, []);

  const update = useCallback((mut: (s: ProtoState) => ProtoState) => {
    setState((prev) => {
      const base = prev ?? load();
      const next = mut({ ...base });
      persist(next);
      return next;
    });
  }, []);

  const consent = useCallback(
    () => update((s) => ({ ...s, consented: true })),
    [update],
  );

  /** Undi & kunci kategori pertama (anti-reroll). */
  const assignCategory = useCallback(() => {
    let chosen: CategoryId | null = null;
    update((s) => {
      if (s.assignedCategory) {
        chosen = s.assignedCategory;
        return s;
      }
      const pool = s.activeCategories.filter(
        (c) => !s.playedTodayCategories.includes(c),
      );
      chosen = pool.length ? pool[Math.floor(Math.random() * pool.length)] : s.activeCategories[0];
      return { ...s, assignedCategory: chosen };
    });
    return chosen;
  }, [update]);

  /** Kategori aktif lain yang belum dimainkan (bonus). */
  const nextCategory = useCallback((s: ProtoState): CategoryId | null => {
    const pool = s.activeCategories.filter(
      (c) => !s.playedTodayCategories.includes(c),
    );
    return pool.length ? pool[0] : null;
  }, []);

  const finishSession = useCallback(
    (result: SessionResult) =>
      update((s) => {
        const firstToday = s.lastPlayedDate !== result.play_date;
        let streak = s.streak;
        if (firstToday) {
          const yest = daysAgo(1);
          streak =
            s.lastPlayedDate === result.play_date
              ? s.streak
              : s.lastPlayedDate === yest
                ? s.streak + 1
                : 1;
        }
        const verdictDist = { ...s.verdictDist };
        verdictDist[result.verdict] += 1;
        return {
          ...s,
          sessions: [result, ...s.sessions],
          playedTodayCategories: Array.from(
            new Set([...s.playedTodayCategories, result.category]),
          ),
          totalPlayed: s.totalPlayed + 1,
          streak,
          bestStreak: Math.max(s.bestStreak, streak),
          lastPlayedDate: result.play_date,
          verdictDist,
        };
      }),
    [update],
  );

  const linkGoogle = useCallback(
    () => update((s) => ({ ...s, isAnonymous: false })),
    [update],
  );

  const reset = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
    setState(defaultState());
  }, []);

  return {
    state,
    ready: state !== null,
    consent,
    assignCategory,
    nextCategory,
    finishSession,
    linkGoogle,
    reset,
  };
}

export { getMotion };
