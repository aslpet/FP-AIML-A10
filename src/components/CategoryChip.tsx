"use client";

import { CATEGORIES } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";

export function CategoryChip({
  category,
  size = "md",
}: {
  category: CategoryId;
  size?: "sm" | "md";
}) {
  const c = CATEGORIES[category];
  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${pad}`}
      style={{ background: c.soft, color: c.color }}
    >
      <span>{c.emoji}</span>
      {c.label}
    </span>
  );
}
