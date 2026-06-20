"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { fetchResult } from "@/lib/api";

const VERDICT_CONFIG: Record<string, string> = {
  "Argumen Bertahan": "#22c55e",
  "Imbang Ketat":     "#f59e0b",
  "Argumen Runtuh":   "#ef4444",
};

function DonutScore({ score, color }: { score: number; color: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(score / 100, 1));

  return (
    <div className="relative" style={{ width: 148, height: 148 }}>
      <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90">
        <circle cx="74" cy="74" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="13" />
        <motion.circle
          cx="74" cy="74" r={r}
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold tabular-nums leading-none"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {score}
        </motion.span>
        <span className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
          dari 100
        </span>
      </div>
    </div>
  );
}

function ScoreBlocks({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 + i * 0.07, duration: 0.18 }}
          style={{
            width: "clamp(28px, 6.5vw, 38px)",
            height: "clamp(28px, 6.5vw, 38px)",
            borderRadius: 3,
            background: i < score ? "#22c55e" : "rgba(40,15,5,0.15)",
            boxShadow: i < score ? "0 2px 6px rgba(34,197,94,0.25)" : "none",
          }}
        />
      ))}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div style={{ flex: 1, height: 1, background: "rgba(59,26,6,0.22)" }} />
      <span className="font-game tracking-widest text-xs" style={{ color: "rgba(59,26,6,0.5)" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(59,26,6,0.22)" }} />
    </div>
  );
}

export default function ResultPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { sessionId } = params;

  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchResult(sessionId)
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading || !result) {
    return (
      <main className="relative min-h-screen grid place-items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/assets/background/bg-debate.svg" alt="" fill className="object-cover object-center" priority />
        </div>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex items-center gap-3 text-white/60 text-sm">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <span>Menghitung hasil...</span>
        </div>
      </main>
    );
  }

  const { scores, total_score, feedback, verdict } = result;
  const totalScore   = total_score ?? 0;
  const scoreColor   = VERDICT_CONFIG[verdict] ?? (totalScore >= 70 ? "#22c55e" : totalScore >= 50 ? "#f59e0b" : "#ef4444");
  const verdictLabel = verdict ?? "";

  const metrics = [
    { label: "Penalaran",      score: scores?.penalaran      ?? 0 },
    { label: "Relevansi",      score: scores?.relevansi      ?? 0 },
    { label: "Responsiveness", score: scores?.responsiveness ?? 0 },
    { label: "Kejelasan",      score: scores?.kejelasan      ?? 0 },
  ];

  async function handleShare() {
    setSharing(true);
    const fallbackText = [
      "🎯 debat.in — Hasil Debatku",
      `Skor: ${totalScore}/100 — ${verdictLabel}`,
      metrics.map((m) => `${m.label}: ${m.score}/5`).join(" · "),
      "",
      "Latih kemampuan berargumenmu di debat.in!",
    ].join("\n");

    if (cardRef.current) {
      try {
        const html2canvas = (await import("html2canvas")).default;

        const el = cardRef.current;
        const prevMaxHeight = el.style.maxHeight;
        const prevOverflow  = el.style.overflow;
        el.style.maxHeight = "none";
        el.style.overflow  = "visible";
        await new Promise<void>((r) => requestAnimationFrame(() => r()));

        const canvas = await html2canvas(el, {
          backgroundColor: "#110800",
          scale: 2,
          useCORS: true,
          logging: false,
          height: el.scrollHeight,
          windowHeight: el.scrollHeight,
        });

        el.style.maxHeight = prevMaxHeight;
        el.style.overflow  = prevOverflow;

        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
        if (blob) {
          const file = new File([blob], "hasil-debat.png", { type: "image/png" });

          if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
            try {
              await navigator.share({ title: "debat.in", text: fallbackText, files: [file] });
              setSharing(false);
              return;
            } catch { /* cancelled */ }
          }

          if (typeof ClipboardItem !== "undefined" && window.isSecureContext) {
            try {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
              setSharing(false);
              return;
            } catch { /* fall through */ }
          }

          const url = URL.createObjectURL(blob);
          const a   = document.createElement("a");
          a.href     = url;
          a.download = "hasil-debat.png";
          a.click();
          URL.revokeObjectURL(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
          setSharing(false);
          return;
        }
      } catch { /* screenshot failed */ }
    }

    try { await navigator.clipboard.writeText(fallbackText); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setSharing(false);
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
      {/* Background */}
      <div className="absolute inset-0">
        <Image src="/assets/background/bg-debate.svg" alt="" fill className="object-cover object-center" priority />
      </div>
      <div className="absolute inset-0 bg-black/50" />

      {/* Top-right nav */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => router.push(`/arena/${sessionId}`)}
          className="cursor-pointer" title="Kembali ke Chat"
        >
          <Image src="/assets/button/button-gochat.svg" alt="Go to Chat" width={110} height={38}
            style={{ width: "clamp(72px, 18vw, 100px)", height: "auto" }} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/")}
          className="cursor-pointer" title="Beranda"
        >
          <Image src="/assets/button/button-backhome.svg" alt="Back to Home" width={110} height={38}
            style={{ width: "clamp(72px, 18vw, 100px)", height: "auto" }} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/")}
          className="cursor-pointer" title="Tutup"
        >
          <Image src="/assets/button/button-x.svg" alt="X" width={28} height={28}
            style={{ width: "clamp(20px, 5vw, 28px)", height: "auto" }} />
        </motion.button>
      </div>

      {/* ── Result card ── */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full overflow-y-auto"
        style={{
          maxWidth: 420,
          maxHeight: "calc(100vh - 5rem)",
          borderRadius: 6,
          boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 2px rgba(160,100,40,0.35)",
        }}
      >
        {/* ── Header — dark courtroom panel ── */}
        <div
          className="flex flex-col items-center gap-1 px-6 pt-6 pb-5"
          style={{
            background: "linear-gradient(180deg, #0D0600 0%, #2A1505 100%)",
            borderBottom: "2px solid rgba(160,100,40,0.45)",
          }}
        >
          <span className="font-game tracking-[0.35em]" style={{ color: "rgba(200,148,106,0.6)", fontSize: 12 }}>
            debat.In
          </span>

          <div className="mt-3">
            <DonutScore score={totalScore} color={scoreColor} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-3 px-5 py-1.5"
            style={{
              background: scoreColor + "18",
              border: `1px solid ${scoreColor}44`,
              borderRadius: 3,
            }}
          >
            <span className="font-game tracking-[0.2em]" style={{ color: scoreColor, fontSize: 20 }}>
              {verdictLabel}
            </span>
          </motion.div>
        </div>

        {/* ── Body — parchment ── */}
        <div className="px-5 pt-5 pb-6 space-y-4" style={{ background: "#C8946A" }}>

          <SectionDivider label="RINCIAN SKOR" />

          {/* Metrics */}
          <div className="space-y-3.5">
            {metrics.map((m, idx) => (
              <motion.div
                key={m.label}
                className="space-y-1.5"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + idx * 0.08 }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-game tracking-wider" style={{ color: "#3B1A06", fontSize: 17 }}>
                    {m.label}
                  </span>
                  <span className="font-game" style={{ color: "#3B1A06", fontSize: 16 }}>
                    {m.score}
                    <span style={{ opacity: 0.4, fontSize: 12 }}>/5</span>
                  </span>
                </div>
                <ScoreBlocks score={m.score} />
              </motion.div>
            ))}
          </div>

          {/* Catatan Juri */}
          {feedback && (
            <>
              <SectionDivider label="CATATAN JURI" />
              <div
                className="rounded p-4"
                style={{
                  background: "rgba(0,0,0,0.08)",
                  border: "1px solid rgba(59,26,6,0.15)",
                  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.06)",
                }}
              >
                <p className="text-sm leading-relaxed italic" style={{ color: "#3B1A06" }}>
                  &ldquo;{feedback}&rdquo;
                </p>
              </div>
            </>
          )}

          {/* Share button */}
          <motion.button
            whileHover={{ scale: sharing ? 1 : 1.02 }}
            whileTap={{ scale: sharing ? 1 : 0.97 }}
            onClick={handleShare}
            disabled={sharing}
            className="w-full py-3 font-game tracking-[0.15em] cursor-pointer flex items-center justify-center gap-2 smooth-transition"
            style={{
              fontSize: 18,
              background: copied
                ? "linear-gradient(180deg, #16a34a, #15803d)"
                : "linear-gradient(180deg, #2A1505, #0D0600)",
              color: copied ? "#f0fdf4" : "#ffffff",
              border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(160,100,40,0.45)"}`,
              borderRadius: 3,
              opacity: sharing ? 0.7 : 1,
            }}
          >
            {sharing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Menyiapkan...
              </>
            ) : copied ? ">> TERSIMPAN! ✓ <<" : ">> BAGIKAN <<"}
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}
