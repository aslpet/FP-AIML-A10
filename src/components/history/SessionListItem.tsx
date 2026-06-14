"use client";

import { CATEGORIES, VERDICT_META } from "@/lib/categories";
import { formatTanggalID } from "@/lib/util";
import type { SessionResult } from "@/lib/types";

export function SessionListItem({ session }: { session: SessionResult }) {
  const catLabel = session.category;
  
  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 hover:border-zinc-800 smooth-transition group">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-xs text-zinc-500 font-semibold">
          {formatTanggalID(session.play_date)}
          <span className="capitalize text-emerald-400">
            • {catLabel}
          </span>
        </span>
        <span
          className="rounded-full px-3 py-1 text-xs font-extrabold tabular-nums bg-zinc-900 border border-zinc-800"
          style={{ color: "#10b981" }}
        >
          {session.total_score} / 100
        </span>
      </div>
      <p className="line-clamp-2 text-sm font-semibold text-zinc-300">
        &ldquo;{session.motion_text}&rdquo;
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-zinc-900/50 rounded-lg border border-zinc-900/50">
            <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wide">Relevansi</div>
            <div className="text-sm font-bold text-emerald-400">
              {session.scores.relevansi || session.scores.penalaran || 0}
            </div>
          </div>
          <div className="text-center p-2 bg-zinc-900/50 rounded-lg border border-zinc-900/50">
            <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wide">Koherensi</div>
            <div className="text-sm font-bold text-indigo-400">
              {session.scores.koherensi || session.scores.responsiveness || 0}
            </div>
          </div>
          <div className="text-center p-2 bg-zinc-900/50 rounded-lg border border-zinc-900/50">
            <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wide">Bukti</div>
            <div className="text-sm font-bold text-zinc-400">
              {session.scores.kekuatan_bukti || session.scores.kejelasan || 0}
            </div>
          </div>
      </div>
    </div>
  );
}
