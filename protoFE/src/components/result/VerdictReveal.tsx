"use client";

import { motion } from "framer-motion";
import { VERDICT_META } from "@/lib/categories";
import type { VerdictTier } from "@/lib/types";

function Confetti({ color }: { color: string }) {
  const pieces = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = (i / pieces.length) * 100;
        const colors = [color, "#fbbf24", "#34d399", "#60a5fa"];
        return (
          <motion.span
            key={i}
            className="absolute top-0 h-2 w-2 rounded-sm"
            style={{ left: `${left}%`, background: colors[i % colors.length] }}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{ y: 180, opacity: [0, 1, 1, 0], rotate: 360 }}
            transition={{ duration: 1.6, delay: 0.5 + (i % 6) * 0.06, ease: "easeIn" }}
          />
        );
      })}
    </div>
  );
}

/** Reveal verdict bertahap (klimaks, sebelum angka). */
export function VerdictReveal({ tier }: { tier: VerdictTier }) {
  const v = VERDICT_META[tier];
  return (
    <div className="relative flex flex-col items-center py-2">
      {tier === "bertahan" && <Confetti color={v.color} />}
      <motion.span
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 12, delay: 0.1 }}
        className="text-5xl"
      >
        {v.emoji}
      </motion.span>
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-2 rounded-full px-4 py-1 text-xl font-extrabold"
        style={{ background: v.soft, color: v.color }}
      >
        {v.label}
      </motion.span>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-2 text-sm text-ink/50"
      >
        {v.blurb}
      </motion.p>
    </div>
  );
}
