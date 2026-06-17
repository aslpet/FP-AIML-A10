"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const PROFILE_KEY = "debetin_profile";

interface Profile {
  displayName: string;
  avatarDataUrl: string | null;
}

function loadProfile(): Profile {
  if (typeof window === "undefined") return { displayName: "", avatarDataUrl: null };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { displayName: "", avatarDataUrl: null };
    return JSON.parse(raw);
  } catch {
    return { displayName: "", avatarDataUrl: null };
  }
}

function saveProfile(p: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("debetin_profile_updated"));
}

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    setDisplayName(p.displayName ?? "");
    setAvatarDataUrl(p.avatarDataUrl ?? null);
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAvatarDataUrl(result);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    saveProfile({ displayName, avatarDataUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/background/bg.svg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>
      <div className="absolute inset-0 z-0 bg-black/50" />

      {/* Back button */}
      <div className="relative z-10 px-5 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/70 hover:text-white smooth-transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-game text-lg tracking-wider">KEMBALI</span>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8">

        {/* Title */}
        <h1
          className="font-game text-white text-center"
          style={{
            fontSize: "clamp(32px, 6vw, 64px)",
            textShadow: "0 0 20px rgba(27,79,228,0.7), 2px 2px 0 #000",
            letterSpacing: "0.1em",
          }}
        >
          PROFIL
        </h1>

        {/* Avatar area */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative group cursor-pointer"
            title="Ubah foto profil"
          >
            {/* Outer ring */}
            <div
              className="rounded-full p-1"
              style={{
                background: "linear-gradient(135deg, #1B4FE4, #6B8EF5, #1B4FE4)",
                boxShadow: "0 0 24px rgba(27,79,228,0.6)",
              }}
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
                {avatarDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarDataUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-14 h-14 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Edit overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 smooth-transition">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="font-game text-white/60 hover:text-white smooth-transition cursor-pointer text-lg tracking-widest"
          >
            [ UBAH FOTO ]
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Display name input */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <label className="font-game text-white/60 text-lg tracking-widest">
            NAMA TAMPILAN
          </label>
          <div
            className="relative"
            style={{
              border: "2px solid rgba(27,79,228,0.5)",
              borderRadius: "4px",
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
            }}
          >
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={24}
              placeholder="MASUKKAN NAMAMU..."
              className="w-full bg-transparent px-4 py-3 font-game text-white text-xl tracking-wider focus:outline-none placeholder:text-white/25"
              style={{ caretColor: "#1B4FE4" }}
            />
            <span className="absolute blink-retro right-3 top-1/2 -translate-y-1/2 font-game text-white/20 text-xs">
              {displayName.length}/24
            </span>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="relative group cursor-pointer smooth-transition hover:scale-105 active:scale-95"
        >
          <Image
            src="/assets/button/button-mulai.svg"
            alt="Simpan"
            width={249}
            height={111}
            style={{ width: "clamp(160px, 36vw, 240px)", height: "auto" }}
            className="drop-shadow-lg"
          />
          <span
            className="absolute inset-0 flex items-center justify-center font-game text-white"
            style={{ fontSize: "clamp(16px, 3vw, 22px)", textShadow: "1px 1px 2px #000", letterSpacing: "0.15em" }}
          >
            {saved ? "TERSIMPAN ✓" : "SIMPAN"}
          </span>
        </button>

        {saved && (
          <p className="font-game text-green-400 text-lg tracking-wider animate-pulse">
            Profil berhasil disimpan!
          </p>
        )}
      </div>
    </div>
  );
}
