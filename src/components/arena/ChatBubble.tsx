"use client";

import { motion } from "framer-motion";

export function ChatBubble({
  role,
  children,
  onReport,
}: {
  role: "ai" | "user";
  children: React.ReactNode;
  onReport?: () => void;
}) {
  const isAI = role === "ai";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`flex ${isAI ? "justify-start" : "justify-end"}`}
    >
      <div className={`group max-w-[85%] ${isAI ? "" : "text-right"}`}>
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-ink/40">
          {isAI ? (
            <>
              <span className="grid h-5 w-5 place-items-center rounded-lg bg-brand text-[10px] text-white">
                ⚔
              </span>
              <span className="text-brand/70">Lawan</span>
            </>
          ) : (
            <span className="ml-auto text-ink/50">Kamu</span>
          )}
        </div>
        <div
          className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
            isAI
              ? "rounded-tl-sm border-l-2 border-brand/30 bg-brand-soft/40 text-ink"
              : "rounded-tr-sm bg-brand text-white"
          }`}
        >
          {children}
        </div>
        {isAI && onReport && (
          <button
            onClick={onReport}
            className="mt-1 text-[11px] text-ink/25 opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
          >
            ⚐ Lapor respons ini
          </button>
        )}
      </div>
    </motion.div>
  );
}
