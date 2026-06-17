"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { fetchResult } from "@/lib/api";

const VERDICT_CONFIG: Record<string, string> = {
  "Argumen Bertahan": "#22c55e",
  "Imbang Ketat": "#f59e0b",
  "Argumen Runtuh": "#ef4444",
};

function DonutScore({ score, color }: { score: number; color: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(score / 100, 1));

  return (
    <div className="relative" style={{ width: 148, height: 148 }}>
      <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90">
        <circle cx="74" cy="74" r={r} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="13" />
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
        <span className="text-xs mt-1" style={{ color: "rgba(40,15,5,0.55)" }}>
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
          className="rounded-md"
          style={{
            width: "clamp(30px, 7vw, 40px)",
            height: "clamp(30px, 7vw, 40px)",
            background: i < score ? "#22c55e" : "rgba(40,15,5,0.18)",
          }}
        />
      ))}
    </div>
  );
}

export default function ResultPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { sessionId } = params;

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
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
        <div className="relative z-10 flex items-center gap-3 text-white/60 text-sm">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <span>Menghitung hasil...</span>
        </div>
      </main>
    );
  }

  const { scores, total_score, feedback, verdict } = result;
  const totalScore = total_score ?? 0;
  const scoreColor = VERDICT_CONFIG[verdict] ?? (totalScore >= 70 ? "#22c55e" : totalScore >= 50 ? "#f59e0b" : "#ef4444");
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
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: "#C8946A",
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
        if (blob) {
          const file = new File([blob], "hasil-debat.png", { type: "image/png" });

          // 1. Native share with file (mobile, supports HTTPS)
          if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
            try {
              await navigator.share({ title: "debat.in", text: fallbackText, files: [file] });
              setSharing(false);
              return;
            } catch { /* cancelled, fall through */ }
          }

          // 2. Clipboard image (desktop, HTTPS only)
          if (typeof ClipboardItem !== "undefined" && window.isSecureContext) {
            try {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
              setSharing(false);
              return;
            } catch { /* fall through */ }
          }

          // 3. Auto-download PNG (works on HTTP too)
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "hasil-debat.png";
          a.click();
          URL.revokeObjectURL(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
          setSharing(false);
          return;
        }
      } catch { /* screenshot failed, fall through to text */ }
    }

    // 4. Last resort: copy text
    try {
      await navigator.clipboard.writeText(fallbackText);
    } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setSharing(false);
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
      {/* Arena background */}
      <div className="absolute inset-0">
        <Image
          src="/assets/background/bg-debate.svg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Top-right nav — fixed to page corner */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push(`/arena/${sessionId}`)}
          className="cursor-pointer"
          title="Kembali ke Chat"
        >
          <Image
            src="/assets/button/button-gochat.svg"
            alt="Go to Chat"
            width={110}
            height={38}
            style={{ width: "clamp(72px, 18vw, 100px)", height: "auto" }}
          />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/")}
          className="cursor-pointer"
          title="Beranda"
        >
          <Image
            src="/assets/button/button-backhome.svg"
            alt="Back to Home"
            width={110}
            height={38}
            style={{ width: "clamp(72px, 18vw, 100px)", height: "auto" }}
          />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/")}
          className="cursor-pointer"
          title="Tutup"
        >
          <Image
            src="/assets/button/button-x.svg"
            alt="X"
            width={28}
            height={28}
            style={{ width: "clamp(20px, 5vw, 28px)", height: "auto" }}
          />
        </motion.button>
      </div>

      {/* Popup card */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full rounded-2xl overflow-y-auto"
        style={{
          maxWidth: 460,
          maxHeight: "calc(100vh - 5.5rem)",
          background: "#C8946A",
          boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
        }}
      >
        {/* Main content */}
        <div className="px-6 pb-6 space-y-5">

          {/* Donut + verdict */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <DonutScore score={totalScore} color={scoreColor} />
            <p className="text-sm font-bold" style={{ color: scoreColor }}>
              {verdictLabel}
            </p>
          </div>

          {/* Dimension rows */}
          <div className="space-y-4">
            {metrics.map((m) => (
              <div key={m.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: "#3B1A06" }}>
                    {m.label}
                  </span>
                  <span className="text-sm font-bold text-green-700">
                    {m.score}<span className="text-xs font-normal" style={{ color: "rgba(40,15,5,0.45)" }}>/5</span>
                  </span>
                </div>
                <ScoreBlocks score={m.score} />
              </div>
            ))}
          </div>

          {/* Catatan Juri */}
          {feedback && (
            <div
              className="rounded-xl p-4 space-y-1.5"
              style={{ background: "rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.12)" }}
            >
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#5A2808" }}>
                Catatan Juri
              </p>
              <p className="text-sm leading-relaxed italic" style={{ color: "#3B1A06" }}>
                &ldquo;{feedback}&rdquo;
              </p>
            </div>
          )}

          {/* Bagikan */}
          <motion.button
            whileHover={{ scale: sharing ? 1 : 1.02 }}
            whileTap={{ scale: sharing ? 1 : 0.97 }}
            onClick={handleShare}
            disabled={sharing}
            className="w-full py-3 rounded-xl text-sm font-bold cursor-pointer smooth-transition flex items-center justify-center gap-2"
            style={{
              background: copied ? "#22c55e" : "#EBD9C2",
              color: copied ? "#052e0c" : "#3B1A06",
              opacity: sharing ? 0.7 : 1,
            }}
          >
            {sharing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Menyiapkan gambar...
              </>
            ) : copied ? "Gambar tersimpan! Tinggal bagikan" : "Share (download) ^^"}
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}
