"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { CATEGORIES } from "@/lib/categories";
import { MOTION_BY_CATEGORY } from "@/lib/mock/motions";
import { getScript } from "@/lib/mock/debate";
import { buildResult } from "@/lib/mock/result";
import { fakeDelay } from "@/lib/util";
import { useProto } from "@/lib/store";
import type { CategoryId, Turn } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { CategoryChip } from "@/components/CategoryChip";
import { ChatBubble } from "@/components/arena/ChatBubble";
import { AIThinking } from "@/components/arena/AIThinking";
import { ArgumentInput } from "@/components/arena/ArgumentInput";
import { RoundProgress } from "@/components/arena/RoundProgress";
import { ReportModal } from "@/components/ReportModal";
import { Toast } from "@/components/ui/Toast";

type Phase = "thinking" | "await" | "done";

function Arena() {
  const router = useRouter();
  const params = useSearchParams();
  const cat = (params.get("cat") as CategoryId) || "ekonomi";
  const isBonus = params.get("bonus") === "1";
  const { ready, finishSession } = useProto();

  const motion = MOTION_BY_CATEGORY[cat];
  const script = getScript(motion?.motion_id ?? "");

  const [turns, setTurns] = useState<Turn[]>([]);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>("thinking");
  const [resultId, setResultId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const userArgs = useRef<string[]>([]);
  const started = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Pembuka AI (sekali).
  useEffect(() => {
    if (!ready || started.current || !motion) return;
    started.current = true;
    (async () => {
      await fakeDelay(1100);
      setTurns([{ role: "ai", content: script.opening, round: 0 }]);
      setPhase("await");
    })();
  }, [ready, motion, script.opening]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, phase]);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }

  async function handleSubmit(text: string) {
    userArgs.current.push(text);
    setTurns((t) => [...t, { role: "user", content: text, round }]);
    setPhase("thinking");
    await fakeDelay(1300);

    if (round < 3) {
      setTurns((t) => [
        ...t,
        { role: "ai", content: script.rebuttals[round - 1], round },
      ]);
      setRound((r) => r + 1);
      setPhase("await");
    } else {
      // Ronde 3 → penutup + evaluasi.
      setTurns((t) => [...t, { role: "ai", content: script.closing, round: 3 }]);
      const result = buildResult(
        motion.motion_id,
        cat,
        userArgs.current,
        isBonus,
      );
      finishSession(result);
      setResultId(result.session_id);
      setPhase("done");
    }
  }

  if (!motion) {
    return (
      <main className="grid min-h-screen place-items-center text-ink/40">
        Mosi tidak ditemukan.
      </main>
    );
  }

  return (
    <>
      {/* Header arena */}
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-paper/90 backdrop-blur">
        <div className="mx-auto max-w-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <CategoryChip category={cat} size="sm" />
            <RoundProgress current={phase === "done" ? 3 : round} />
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-semibold text-ink/70">
            “{motion.motion_text}”
          </p>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-xl flex-col px-4 pb-6 pt-5">
        <div className="scroll-slim flex-1 space-y-4">
          {turns.map((t, i) => (
            <ChatBubble
              key={i}
              role={t.role}
              onReport={t.role === "ai" ? () => setReportOpen(true) : undefined}
            >
              {t.content}
            </ChatBubble>
          ))}
          <AnimatePresence>
            {phase === "thinking" && <AIThinking />}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <div className="sticky bottom-0 mt-4 bg-gradient-to-t from-paper via-paper to-transparent pt-3">
          {phase === "await" && (
            <ArgumentInput round={round} onSubmit={handleSubmit} />
          )}
          {phase === "thinking" && turns.length > 0 && (
            <div className="rounded-2xl border border-ink/10 bg-white/60 p-4 text-center text-sm text-ink/40">
              Lawan sedang menyusun argumen…
            </div>
          )}
          {phase === "done" && resultId && (
            <Button full onClick={() => router.push(`/result?sid=${resultId}&fresh=1`)}>
              Lihat Penilaian →
            </Button>
          )}
        </div>
      </main>

      <ReportModal
        open={reportOpen}
        target="ai_response"
        onClose={() => setReportOpen(false)}
        onSubmit={() => {
          setReportOpen(false);
          showToast("Laporan terkirim untuk ditinjau tim");
        }}
      />
      <Toast message={toast} />
    </>
  );
}

export default function ArenaPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center text-ink/40">
          Menyiapkan arena…
        </main>
      }
    >
      <Arena />
    </Suspense>
  );
}
