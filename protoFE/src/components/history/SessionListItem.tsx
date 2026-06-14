"use client";

import { CATEGORIES, DIMENSIONS, VERDICT_META } from "@/lib/categories";
import { formatTanggalID } from "@/lib/util";
import type { SessionResult } from "@/lib/types";

export function SessionListItem({ session }: { session: SessionResult }) {
  const cat = CATEGORIES[session.category];
  const v = VERDICT_META[session.verdict];
  return (
    <div className="card-flat">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs text-ink/35">
          {formatTanggalID(session.play_date)}
          <span className="font-semibold" style={{ color: cat.color }}>
            {cat.emoji} {cat.label}
          </span>
          {session.is_bonus && (
            <span className="pill">bonus</span>
          )}
        </span>
        <span
          className="rounded-full px-3 py-1 text-sm font-extrabold tabular-nums"
          style={{ background: v.soft, color: v.color }}
        >
          {session.total_score}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-ink/70">
        &ldquo;{session.motion_text}&rdquo;
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {DIMENSIONS.map((d) => (
          <div key={d.id} className="text-center">
            <div className="text-[10px] text-ink/35">{d.label.slice(0, 5)}</div>
            <div
              className="text-sm font-bold"
              style={{
                color:
                  session.scores[d.id] >= 4
                    ? "#059669"
                    : session.scores[d.id] <= 2
                      ? "#e11d48"
                      : "rgba(15,23,42,0.6)",
              }}
            >
              {session.scores[d.id]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
