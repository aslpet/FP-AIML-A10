"use client";

import { motion } from "framer-motion";
import type { Motion } from "@/lib/types";

export function MotionCard({
  motion: m,
  onReport,
  delay = 0.9,
}: {
  motion: Motion;
  onReport?: () => void;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative rounded-2xl border border-ink/10 bg-white p-6 shadow-card"
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">
        Mosi · {m.claim_form}
      </span>
      <p className="mt-2 text-xl font-bold leading-snug text-ink">
        “{m.motion_text}”
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink/60">{m.context}</p>
      <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3">
        <span className="text-xs text-ink/40">
          Sumber: {m.source_title} — <em>{m.source_outlet}</em>
        </span>
        {onReport && (
          <button
            onClick={onReport}
            className="text-xs font-medium text-ink/40 hover:text-rose-600"
          >
            ⚐ Lapor
          </button>
        )}
      </div>
    </motion.div>
  );
}
