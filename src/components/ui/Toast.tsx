"use client";

import { AnimatePresence, motion } from "framer-motion";

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-zinc-900 border border-zinc-800 px-6 py-3 text-xs sm:text-sm font-semibold text-emerald-400 shadow-2xl flex items-center gap-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
