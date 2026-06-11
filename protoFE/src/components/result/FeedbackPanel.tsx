"use client";

import { motion } from "framer-motion";

export function FeedbackPanel({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="rounded-2xl border border-ink/10 bg-brand-soft/60 p-5"
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand">
        Catatan Juri
      </p>
      <p className="text-[15px] leading-relaxed text-ink/80">{text}</p>
    </motion.div>
  );
}
