"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-deep shadow-card shadow-glow/40",
  secondary: "bg-white text-ink border border-ink/15 hover:border-ink/30",
  ghost: "bg-transparent text-ink/70 hover:text-ink hover:bg-ink/5",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
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
