"use client";

import { VERDICT_META } from "@/lib/categories";
import type { ProtoState, VerdictTier } from "@/lib/types";
import { Countdown } from "./Countdown";
import { Modal } from "./ui/Modal";

const TIERS: VerdictTier[] = ["bertahan", "imbang", "runtuh"];

export function StatsModal({
  open,
  onClose,
  state,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  state: ProtoState;
  onReset: () => void;
}) {
  const max = Math.max(1, ...TIERS.map((t) => state.verdictDist[t]));
  const stats = [
    { label: "Total Main", value: state.totalPlayed },
    { label: "Streak", value: state.streak },
    { label: "Streak Terbaik", value: state.bestStreak },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Statistik">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-paper p-3 text-center">
            <div className="text-2xl font-extrabold tabular-nums">{s.value}</div>
            <div className="text-[11px] text-ink/40">{s.label}</div>
          </div>
        ))}
      </div>

      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-ink/40">
        Distribusi Vonis
      </p>
      <div className="space-y-2">
        {TIERS.map((t) => {
          const v = VERDICT_META[t];
          const n = state.verdictDist[t];
          return (
            <div key={t} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm text-ink/60">{v.label}</span>
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-paper">
                <div
                  className="grid h-full place-items-end rounded-full pr-2 text-[11px] font-bold text-white"
                  style={{
                    width: `${Math.max(8, (n / max) * 100)}%`,
                    background: v.color,
                  }}
                >
                  {n}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl bg-paper p-3 text-center text-sm text-ink/60">
        <Countdown /> 👋
      </div>

      <button
        onClick={onReset}
        className="mt-4 w-full text-center text-[11px] text-ink/30 hover:text-rose-600"
      >
        Reset prototype (untuk demo)
      </button>
    </Modal>
  );
}
