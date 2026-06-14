"use client";

import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

export function ConsentModal({
  open,
  onAgree,
}: {
  open: boolean;
  onAgree: () => void;
}) {
  return (
    <Modal open={open}>
      <div className="text-center">
        {/* Top decorative gradient bar */}
        <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-indigo-500 to-cyan-500" />

        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-zinc-900 border border-zinc-800 text-3xl shadow-glow-primary">
          <span className="drop-shadow-sm">⚔️</span>
        </div>
        <h2 className="text-xl font-extrabold text-white">
          Selamat datang di debat<span className="text-emerald-400">.in</span>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Setiap hari, satu mosi dari berita terkini. Beradu argumen 3 ronde
          melawan AI, lalu lihat seberapa kuat argumenmu berdiri.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <span className="px-2 py-1 rounded-full text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300">⚔️ 3 ronde</span>
          <span className="px-2 py-1 rounded-full text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300">📊 4 dimensi</span>
          <span className="px-2 py-1 rounded-full text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300">🔥 streak harian</span>
        </div>
        <p className="mt-4 rounded-xl bg-zinc-900/50 border border-zinc-800 p-3 text-xs leading-relaxed text-zinc-500">
          Dengan melanjutkan, kamu setuju argumenmu dipakai untuk meningkatkan
          sistem. Kamu bermain anonim — tanpa perlu mendaftar.
        </p>
        <div className="mt-5">
          <Button full onClick={onAgree}>
            Setuju & Mulai ⚔️
          </Button>
        </div>
      </div>
    </Modal>
  );
}
