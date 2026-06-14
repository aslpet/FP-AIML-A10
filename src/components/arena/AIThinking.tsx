"use client";

import { motion } from "framer-motion";

/** Indikator "AI sedang menyusun argumen" — bernyawa, bukan spinner generik. */
export function AIThinking() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3"
    >
      <span className="grid h-5 w-5 place-items-center rounded-lg bg-brand text-[10px] text-white">
        ⚔
      </span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border-l-2 border-brand/30 bg-brand-soft/40 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-brand/50"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
        <span className="ml-2 text-xs text-brand/60">menyusun argumen…</span>
      </div>
    </motion.div>
  );
}
