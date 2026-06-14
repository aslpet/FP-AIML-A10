"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DIMENSIONS } from "@/lib/categories";
import { formatTanggalID } from "@/lib/util";
import type { SessionResult } from "@/lib/types";

const COLORS: Record<string, string> = {
  penalaran: "#4f46e5",
  relevansi: "#059669",
  responsiveness: "#d97706",
  kejelasan: "#7c3aed",
};

export function TrendChart({ sessions }: { sessions: SessionResult[] }) {
  // urut kronologis (lama → baru)
  const data = [...sessions]
    .sort((a, b) => a.play_date.localeCompare(b.play_date))
    .map((s) => ({
      date: formatTanggalID(s.play_date),
      penalaran: s.scores.penalaran,
      relevansi: s.scores.relevansi,
      responsiveness: s.scores.responsiveness,
      kejelasan: s.scores.kejelasan,
    }));

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-card">
      <p className="mb-3 text-sm font-bold">Tren skor per dimensi</p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #eee" }} />
            {DIMENSIONS.map((d) => (
              <Line
                key={d.id}
                type="monotone"
                dataKey={d.id}
                name={d.label}
                stroke={COLORS[d.id]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {DIMENSIONS.map((d) => (
          <span key={d.id} className="flex items-center gap-1.5 text-[11px] text-ink/50">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[d.id] }} />
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
