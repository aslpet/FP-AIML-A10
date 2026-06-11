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
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-3xl">
          ⚔️
        </div>
        <h2 className="text-xl font-extrabold">Selamat datang di debat.in</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Setiap hari, satu mosi dari berita terkini. Beradu argumen 3 ronde
          melawan AI, lalu lihat seberapa kuat argumenmu berdiri.
        </p>
        <p className="mt-4 rounded-xl bg-paper p-3 text-xs leading-relaxed text-ink/50">
          Dengan melanjutkan, kamu setuju argumenmu dipakai untuk meningkatkan
          sistem. Kamu bermain anonim — tanpa perlu mendaftar.
        </p>
        <div className="mt-5">
          <Button full onClick={onAgree}>
            Setuju & Mulai
          </Button>
        </div>
      </div>
    </Modal>
  );
}
