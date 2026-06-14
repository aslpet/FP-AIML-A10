"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20",
  secondary: "bg-zinc-900 text-zinc-100 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800",
  ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50",
  danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
  full = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  full?: boolean;
}) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        full ? "w-full" : ""
      } ${styles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
