"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StreakBadge } from "../StreakBadge";

export function TopBar({
  streak,
  onOpenStats,
}: {
  streak: number;
  onOpenStats?: () => void;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-ink/5 bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-sm text-white">
            ⚔
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            debat<span className="text-brand">.in</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <StreakBadge count={streak} />
          <button
            onClick={() => router.push("/history")}
            className="rounded-lg px-2 py-1.5 text-ink/50 hover:bg-ink/5 hover:text-ink"
            aria-label="Riwayat"
            title="Riwayat"
          >
            📊
          </button>
          {onOpenStats && (
            <button
              onClick={onOpenStats}
              className="rounded-lg px-2 py-1.5 text-ink/50 hover:bg-ink/5 hover:text-ink"
              aria-label="Statistik"
              title="Statistik"
            >
              📈
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
