"use client";

import { motion, useMotionValue, animate as fmAnimate } from "framer-motion";
import { useEffect, useState } from "react";

/** Lingkaran skor 0-100 dengan count-up + ring terisi beranimasi. */
export function ScoreCircle({
  value,
  color = "#4f46e5",
  size = 168,
}: {
  value: number;
  color?: string;
  size?: number;
}) {
  const [display, setDisplay] = useState(0);
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const mv = useMotionValue(0);

  useEffect(() => {
    const controls = fmAnimate(mv, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, mv]);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ececea" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * value) / 100 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-extrabold tabular-nums" style={{ color }}>
          {display}
        </span>
        <span className="text-xs font-medium text-ink/40">dari 100</span>
      </div>
    </div>
  );
}
