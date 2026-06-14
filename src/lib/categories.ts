import type { CategoryId, DimensionId, VerdictTier } from "./types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  emoji: string;
  /** warna aksen (hex) — dipakai inline agar aman dari purge Tailwind */
  color: string;
  soft: string; // background lembut
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  politik_hukum: {
    id: "politik_hukum",
    label: "Politik & Hukum",
    emoji: "⚖️",
    color: "#4f46e5",
    soft: "#eef2ff",
  },
  ekonomi: {
    id: "ekonomi",
    label: "Ekonomi",
    emoji: "💹",
    color: "#059669",
    soft: "#ecfdf5",
  },
  teknologi: {
    id: "teknologi",
    label: "Teknologi",
    emoji: "🤖",
    color: "#7c3aed",
    soft: "#f5f3ff",
  },
  sosial_pendidikan: {
    id: "sosial_pendidikan",
    label: "Sosial & Pendidikan",
    emoji: "🎓",
    color: "#d97706",
    soft: "#fffbeb",
  },
  lingkungan: {
    id: "lingkungan",
    label: "Lingkungan",
    emoji: "🌱",
    color: "#0d9488",
    soft: "#f0fdfa",
  },
};

export const CATEGORY_ORDER: CategoryId[] = [
  "politik_hukum",
  "ekonomi",
  "teknologi",
  "sosial_pendidikan",
  "lingkungan",
];

export const DIMENSIONS: { id: DimensionId; label: string; weight: number }[] = [
  { id: "penalaran", label: "Penalaran", weight: 0.35 },
  { id: "relevansi", label: "Relevansi", weight: 0.25 },
  { id: "responsiveness", label: "Responsiveness", weight: 0.25 },
  { id: "kejelasan", label: "Kejelasan", weight: 0.15 },
];

export const VERDICT_META: Record<
  VerdictTier,
  { label: string; color: string; soft: string; blurb: string; emoji: string }
> = {
  bertahan: {
    label: "Argumen Bertahan",
    color: "#059669",
    soft: "#ecfdf5",
    blurb: "Posisimu kokoh menghadapi serangan.",
    emoji: "🛡️",
  },
  imbang: {
    label: "Imbang Ketat",
    color: "#d97706",
    soft: "#fffbeb",
    blurb: "Pertarungan sengit tanpa pemenang jelas.",
    emoji: "⚔️",
  },
  runtuh: {
    label: "Argumen Runtuh",
    color: "#e11d48",
    soft: "#fff1f2",
    blurb: "Serangan lawan menembus pertahananmu.",
    emoji: "💥",
  },
};
