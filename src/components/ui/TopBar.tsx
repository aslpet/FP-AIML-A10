"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, Flame, User, Menu, X, BarChart2 } from "lucide-react";

export function TopBar({
  streak,
  onOpenStats,
  hideStreak,
}: {
  streak: number;
  onOpenStats?: () => void;
  hideStreak?: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Brain className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-geist font-bold text-white tracking-tight">debat<span className="text-emerald-400">.in</span></h1>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => router.push("/history")} className="text-sm font-semibold text-zinc-400 hover:text-white smooth-transition cursor-pointer">
              Riwayat
            </button>
            {onOpenStats && (
              <button onClick={onOpenStats} className="text-sm font-semibold text-zinc-400 hover:text-white smooth-transition cursor-pointer">
                Statistik
              </button>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Streak */}
            {!hideStreak && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-sm text-zinc-300">{streak} Hari Streak</span>
              </div>
            )}

            {/* Profile Button */}
            <button className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 smooth-transition flex items-center justify-center cursor-pointer">
              <User className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg smooth-transition"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-zinc-800 pt-4">
             <button onClick={() => { setIsMenuOpen(false); router.push("/history"); }} className="w-full text-left px-4 py-2 text-zinc-400 hover:text-white smooth-transition">
              Riwayat
            </button>
            {onOpenStats && (
              <button onClick={() => { setIsMenuOpen(false); onOpenStats(); }} className="w-full text-left px-4 py-2 text-zinc-400 hover:text-white smooth-transition">
                Statistik
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
