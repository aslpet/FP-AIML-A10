"use client";

import { motion } from "framer-motion";

/** Pip/tile terisi per ronde (rasa "mengisi grid" ala Wordle). 3 ronde. */
export function RoundProgress({ current }: { current: number }) {
  // current: 1..3 (ronde berjalan); selesai → 3 penuh.
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-ink/40">
        Ronde {Math.min(current, 3)}/3
      </span>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((n) => {
          const on = n <= current;
          return (
            <motion.div
              key={n}
              animate={{
                backgroundColor: on ? "#4f46e5" : "#e8e8e4",
                scale: on ? 1 : 0.9,
              }}
              className="h-2.5 w-7 rounded-full"
            />
          );
        })}
      </div>
    </div>
  );
}
