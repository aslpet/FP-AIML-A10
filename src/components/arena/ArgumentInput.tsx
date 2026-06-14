"use client";

import { useState } from "react";
import { Button } from "../ui/Button";

const MIN = 20;
const MAX = 600;

export function ArgumentInput({
  round,
  disabled,
  onSubmit,
}: {
  round: number;
  disabled?: boolean;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const len = text.trim().length;
  const tooShort = len > 0 && len < MIN;
  const ok = len >= MIN && len <= MAX;

  function submit() {
    if (!ok || disabled) return;
    onSubmit(text.trim());
    setText("");
  }

  return (
    <div className="card-std">
      <div className="mb-2 flex items-center justify-between text-xs text-ink/40">
        <span>Argumenmu — ronde {round}</span>
        <span className={len > MAX ? "font-semibold text-rose-600" : ""}>
          {len}/{MAX}
        </span>
      </div>
      <textarea
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
        }}
        rows={4}
        placeholder="Susun argumenmu. Nyatakan klaim, beri alasan, jawab serangan lawan…"
        className="w-full resize-none rounded-xl bg-paper p-3 text-[15px] leading-relaxed text-ink outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-brand disabled:opacity-50"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-ink/40">
          {tooShort ? `Minimal ${MIN} karakter` : "⌘/Ctrl + Enter untuk kirim"}
        </span>
        <Button onClick={submit} disabled={!ok || disabled}>
          Kirim Argumen ⚔️
        </Button>
      </div>
    </div>
  );
}
