"use client";

import { motion } from "framer-motion";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";

/** Flip reveal kategori harian (momen kejutan ala Wordle). */
export function CategoryReveal({ category }: { category: CategoryId }) {
  const c = CATEGORIES[category];
  return (
    <div className="flex flex-col items-center gap-3 [perspective:1000px]">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-sm font-medium uppercase tracking-widest text-ink/40"
      >
        Kategori hari ini
      </motion.p>
      <motion.div
        initial={{ rotateX: 90, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.25 }}
        className="flex items-center gap-3 rounded-2xl px-6 py-4 shadow-card"
        style={{ background: c.soft }}
      >
        <span className="text-4xl">{c.emoji}</span>
        <span className="text-3xl font-extrabold" style={{ color: c.color }}>
          {c.label}
        </span>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-xs text-ink/40"
      >
        Sama untuk semua penantang hari ini
      </motion.p>
    </div>
  );
}
