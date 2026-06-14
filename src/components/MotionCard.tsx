"use client";

import { motion } from "framer-motion";
import type { Motion } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";

export function MotionCard({
  motion: m,
  onReport,
  delay = 0.9,
}: {
  motion: Motion;
  onReport?: () => void;
  delay?: number;
}) {
  const cat = CATEGORIES[m.category];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-hero relative"
      style={{ ["--card-accent" as string]: cat.color }}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-brand">
        Mosi · {m.claim_form}
      </span>
      <p className="mt-2 text-xl font-bold leading-snug text-ink">
        &ldquo;{m.motion_text}&rdquo;
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink/60">{m.context}</p>
      <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3">
        <span className="text-xs text-ink/35">
          Sumber: {m.source_title} — <em>{m.source_outlet}</em>
        </span>
        {onReport && (
          <button
            onClick={onReport}
            className="text-xs font-medium text-ink/35 hover:text-rose-600"
          >
            ⚐ Lapor
          </button>
        )}
      </div>
    </motion.div>
  );
}
