"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, Menu } from "lucide-react";
import { getMe } from "@/lib/api";

const NAV_LINKS = [
  { href: "/history", label: "History" },
  { href: "/persona", label: "Persona" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [streak, setStreak] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getMe()
      .then((me) => setStreak(me?.streak_count ?? 0))
      .catch(() => setStreak(0));
  }, []);

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-transparent border-b border-white/[0.08]">
        <div className="w-full px-3 sm:px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 select-none">
            <span
              className="font-geist font-black text-2xl sm:text-3xl tracking-tight"
              style={{
                color: "#1B4FE4",
                WebkitTextStroke: "2px white",
                paintOrder: "stroke fill",
              }}
            >
              debat<span style={{ color: "#1B4FE4" }}>.</span>In
            </span>
          </Link>

          {/* Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak */}
            {streak !== null && streak > 0 && (
              <div className="flex items-center gap-1.5 select-none">
                <Image
                  src="/assets/streak.svg"
                  alt="streak"
                  width={56}
                  height={61}
                  className="w-5 h-auto"
                  priority
                />
                <span className="text-sm font-bold text-white">{streak}</span>
              </div>
            )}

            {/* Profile */}
            <button className="flex items-center justify-center hover:opacity-75 smooth-transition" title="Profil">
              <Image
                src="/assets/box-profil.svg"
                alt="profil"
                width={28}
                height={28}
                className="w-7 h-auto"
              />
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white smooth-transition"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black/80 backdrop-blur-md border-b border-white/[0.06] py-2 z-50">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center px-6 py-3 text-sm font-medium smooth-transition ${
                  isActive(link.href)
                    ? "text-white bg-white/[0.08]"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
