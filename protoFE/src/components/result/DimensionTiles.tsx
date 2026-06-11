"use client";

import { motion } from "framer-motion";

/** Skor 1-5 → 5 kotak terisi (bahasa "tile" ala Wordle). */
export function DimensionTiles({
  score,
  color = "#4f46e5",
  delay = 0,
}: {
  score: number;
  color?: string;
  delay?: number;
}) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= score;
        return (
          <motion.div
            key={n}
            className="tile"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + n * 0.07, type: "spring", stiffness: 300, damping: 18 }}
            style={on ? ({ ["--tile" as string]: color, background: color } as React.CSSProperties) : undefined}
          />
        );
      })}
    </div>
  );
}
