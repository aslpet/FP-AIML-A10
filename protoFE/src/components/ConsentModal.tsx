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
        <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl bg-gradient-to-r from-brand via-purple-500 to-brand-deep" />

        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand to-purple-600 text-3xl shadow-glow">
          <span className="drop-shadow-sm">⚔️</span>
        </div>
        <h2 className="text-xl font-extrabold text-ink">
          Selamat datang di debat<span className="text-brand">.in</span>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Setiap hari, satu mosi dari berita terkini. Beradu argumen 3 ronde
          melawan AI, lalu lihat seberapa kuat argumenmu berdiri.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <span className="pill">⚔️ 3 ronde</span>
          <span className="pill">📊 4 dimensi</span>
          <span className="pill">🔥 streak harian</span>
        </div>
        <p className="mt-4 rounded-xl bg-ink/[0.03] p-3 text-xs leading-relaxed text-ink/45">
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
