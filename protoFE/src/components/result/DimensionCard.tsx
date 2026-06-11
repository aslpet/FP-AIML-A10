"use client";

import { motion } from "framer-motion";
import { DimensionTiles } from "./DimensionTiles";

export function DimensionCard({
  label,
  weight,
  score,
  rationale,
  color,
  index,
}: {
  label: string;
  weight: number;
  score: number;
  rationale: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      className="rounded-2xl border border-ink/10 bg-white p-4 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-ink">{label}</p>
          <p className="text-[11px] text-ink/40">Bobot {Math.round(weight * 100)}%</p>
        </div>
        <span className="text-lg font-extrabold tabular-nums" style={{ color }}>
          {score}
          <span className="text-sm text-ink/30">/5</span>
        </span>
      </div>
      <div className="my-3">
        <DimensionTiles score={score} color={color} delay={0.3 + index * 0.1} />
      </div>
      <p className="text-sm leading-relaxed text-ink/60">{rationale}</p>
    </motion.div>
  );
}
