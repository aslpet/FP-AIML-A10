"use client";

import { CATEGORIES, DIMENSIONS, VERDICT_META } from "@/lib/categories";
import { formatTanggalID } from "@/lib/util";
import type { SessionResult } from "@/lib/types";

export function SessionListItem({ session }: { session: SessionResult }) {
  const cat = CATEGORIES[session.category];
  const v = VERDICT_META[session.verdict];
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs text-ink/40">
          {formatTanggalID(session.play_date)}
          <span style={{ color: cat.color }}>
            {cat.emoji} {cat.label}
          </span>
          {session.is_bonus && (
            <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[10px]">bonus</span>
          )}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ background: v.soft, color: v.color }}
        >
          {session.total_score}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-ink/80">
        “{session.motion_text}”
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {DIMENSIONS.map((d) => (
          <div key={d.id} className="text-center">
            <div className="text-[10px] text-ink/40">{d.label.slice(0, 5)}</div>
            <div className="text-sm font-bold text-ink/70">{session.scores[d.id]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
