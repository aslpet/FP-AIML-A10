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

const HIDE_ON = ["/history", "/persona", "/about", "/result", "/profile"];

const PROFILE_KEY = "debetin_profile";

function getStoredAvatar(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.avatarDataUrl ?? null;
  } catch {
    return null;
  }
}

export function Navbar() {
  const pathname = usePathname();
  const [streak, setStreak] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((me) => setStreak(me?.streak_count ?? 0))
      .catch(() => setStreak(0));
    setAvatar(getStoredAvatar());

    // Listen for profile updates from other components
    const handler = () => setAvatar(getStoredAvatar());
    window.addEventListener("debetin_profile_updated", handler);
    return () => window.removeEventListener("debetin_profile_updated", handler);
  }, []);

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-black/25 backdrop-blur-lg border-b border-white/[0.08]">
        <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 select-none group">
            <Image
              src="/assets/title.svg"
              alt="debat.In logo"
              width={150}
              height={40}
              className="h-8 sm:h-10 w-auto transition-opacity group-hover:opacity-80 drop-shadow-md"
              priority
            />
          </Link>

          {/* Right controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Streak */}
            {streak !== null && (
              <div className="flex items-center gap-1.5 select-none">
                <Image
                  src="/assets/streak.svg"
                  alt="streak"
                  width={56}
                  height={61}
                  className="w-5 h-auto"
                  priority
                />
                <span className="font-game text-base text-white font-bold">{streak}</span>
              </div>
            )}

            {/* Profile button → /profile */}
            <Link
              href="/profile"
              className="flex items-center justify-center smooth-transition hover:opacity-80 focus:outline-none"
              title="Profil"
            >
              {avatar ? (
                <div
                  className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/40 shadow-lg"
                  style={{ boxShadow: "0 0 8px rgba(0, 0, 0, 0.5)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatar} alt="Profil" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center"
                  style={{ background: "rgba(0, 0, 0, 0.25)" }}
                >
                  <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </Link>

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
          <div className="absolute top-full left-0 right-0 bg-black/85 backdrop-blur-xl border-b border-white/[0.06] py-2 z-50">
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
