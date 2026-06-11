"use client";

import { CATEGORIES, VERDICT_META } from "@/lib/categories";
import { formatTanggalID, scoreToBlocks } from "@/lib/util";
import type { SessionResult } from "@/lib/types";
import { Button } from "../ui/Button";

export function ShareCard({
  session,
  onCopied,
}: {
  session: SessionResult;
  onCopied: () => void;
}) {
  const cat = CATEGORIES[session.category];
  const v = VERDICT_META[session.verdict];
  const blocks = scoreToBlocks(session.total_score, session.verdict);

  // Teks salin (sesuai TRD-06, + block-art) — TANPA rincian per-dimensi.
  const shareText = [
    `debat.in — ${formatTanggalID(session.play_date)} · ${cat.emoji} ${cat.label}`,
    `⚔️ ${session.total_score}/100 — ${v.label}`,
    blocks,
    `https://debat.in`,
  ].join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      /* abaikan di prototype */
    }
    onCopied();
  }

  return (
    <div>
      <p className="mb-3 text-sm text-ink/50">
        Pamerkan hasilmu — tanpa membocorkan rincian performa.
      </p>
      <div
        className="rounded-2xl p-5 font-mono text-sm leading-relaxed text-ink"
        style={{ background: cat.soft }}
      >
        <div className="font-sans font-bold">
          debat.in — {formatTanggalID(session.play_date)}
        </div>
        <div className="font-sans">
          {cat.emoji} {cat.label}
        </div>
        <div className="mt-1 font-sans font-semibold" style={{ color: v.color }}>
          ⚔️ {session.total_score}/100 — {v.label}
        </div>
        <div className="mt-2 text-lg tracking-tight">{blocks}</div>
        <div className="mt-1 font-sans text-xs text-ink/40">https://debat.in</div>
      </div>
      <div className="mt-4">
        <Button full onClick={copy}>
          📋 Salin untuk dibagikan
        </Button>
      </div>
    </div>
  );
}
