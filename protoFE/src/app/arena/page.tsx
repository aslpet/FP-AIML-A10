"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { CATEGORIES } from "@/lib/categories";
import { MOTION_BY_CATEGORY } from "@/lib/mock/motions";
import { getScript } from "@/lib/mock/debate";
import { aggregate, computeVerdict, uid, todayWIB } from "@/lib/util";
import { callDebateAPI, callEvaluateAPI } from "@/lib/api";
import { useProto } from "@/lib/store";
import type { CategoryId, Turn, SessionResult, Scores, DimensionId } from "@/lib/types";
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
  const script = getScript(motion?.motion_id ?? ""); // fallback

  const [turns, setTurns] = useState<Turn[]>([]);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>("thinking");
  const [resultId, setResultId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [useLive, setUseLive] = useState(true); // live Gemini mode
  const userArgs = useRef<string[]>([]);
  const aiMessages = useRef<string[]>([]);
  const started = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Build conversation history string for context
  function buildHistory(): string {
    return turns
      .map((t) => `[${t.role === "ai" ? "LAWAN" : "USER"}]: ${t.content}`)
      .join("\n");
  }

  // Pembuka AI — live Gemini or fallback to canned.
  useEffect(() => {
    if (!ready || started.current || !motion) return;
    started.current = true;

    (async () => {
      try {
        const data = await callDebateAPI(
          motion.motion_text,
          motion.context,
        );

        if (data.error && !data.ai_message) {
          throw new Error(data.error);
        }

        const msg = data.ai_message;
        aiMessages.current.push(msg);
        setTurns([{ role: "ai", content: msg, round: 0 }]);
        setPhase("await");
      } catch {
        // Fallback ke mock
        console.warn("[arena] Gemini unavailable, using mock scripts");
        setUseLive(false);
        setTurns([{ role: "ai", content: script.opening, round: 0 }]);
        aiMessages.current.push(script.opening);
        setPhase("await");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, motion]);

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

    if (round < 3) {
      // Ronde 1-2: get AI rebuttal
      let aiMsg: string;

      if (useLive) {
        try {
          const history = buildHistory() + `\n[USER]: ${text}`;
          const data = await callDebateAPI(
            motion!.motion_text,
            motion!.context,
            text,
            history,
          );

          if (data.error && !data.ai_message) throw new Error(data.error);
          aiMsg = data.ai_message;
        } catch {
          // Fallback to mock
          aiMsg = script.rebuttals[round - 1];
          showToast("Gemini gagal, pakai fallback");
        }
      } else {
        aiMsg = script.rebuttals[round - 1];
      }

      aiMessages.current.push(aiMsg);
      setTurns((t) => [
        ...t,
        { role: "ai", content: aiMsg, round },
      ]);
      setRound((r) => r + 1);
      setPhase("await");
    } else {
      // Ronde 3 → AI closing + evaluasi

      // Get AI closing message
      let closingMsg: string;
      if (useLive) {
        try {
          const history = buildHistory() + `\n[USER]: ${text}`;
          const data = await callDebateAPI(
            motion!.motion_text,
            motion!.context,
            text,
            history,
          );
          if (data.error && !data.ai_message) throw new Error(data.error);
          closingMsg = data.ai_message;
        } catch {
          closingMsg = script.closing;
        }
      } else {
        closingMsg = script.closing;
      }

      aiMessages.current.push(closingMsg);
      setTurns((t) => [...t, { role: "ai", content: closingMsg, round: 3 }]);

      // Evaluate with Gemini
      let scores: Scores;
      let rationale: Record<DimensionId, string>;
      let feedback: string;
      let verdict: "bertahan" | "imbang" | "runtuh";
      let totalScore: number;

      if (useLive) {
        try {
          const aiSummary = aiMessages.current.join(" | ");
          const evalData = await callEvaluateAPI(
            motion!.motion_text,
            motion!.context,
            userArgs.current as [string, string, string],
            aiSummary,
          );

          if (evalData.error) throw new Error(evalData.error);

          scores = {
            penalaran: evalData.penalaran,
            relevansi: evalData.relevansi,
            responsiveness: evalData.responsiveness,
            kejelasan: evalData.kejelasan,
          };
          rationale = evalData.rationale;
          feedback = evalData.feedback;
          totalScore = aggregate(scores);
          verdict = computeVerdict(scores);
        } catch {
          // Fallback to mock evaluation
          const { buildResult } = await import("@/lib/mock/result");
          const mockResult = buildResult(
            motion!.motion_id,
            cat,
            userArgs.current,
            isBonus,
          );
          scores = mockResult.scores;
          rationale = mockResult.rationale;
          feedback = mockResult.feedback;
          totalScore = mockResult.total_score;
          verdict = mockResult.verdict;
          showToast("Evaluasi Gemini gagal, pakai fallback");
        }
      } else {
        // Full mock
        const { buildResult } = await import("@/lib/mock/result");
        const mockResult = buildResult(
          motion!.motion_id,
          cat,
          userArgs.current,
          isBonus,
        );
        scores = mockResult.scores;
        rationale = mockResult.rationale;
        feedback = mockResult.feedback;
        totalScore = mockResult.total_score;
        verdict = mockResult.verdict;
      }

      const result: SessionResult = {
        session_id: uid(),
        play_date: todayWIB(),
        category: cat,
        motion_text: motion!.motion_text,
        scores,
        rationale,
        total_score: totalScore,
        feedback,
        verdict,
        is_bonus: isBonus,
      };

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
            <div className="flex items-center gap-3">
              {useLive && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              )}
              <RoundProgress current={phase === "done" ? 3 : round} />
            </div>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-semibold text-ink/70">
            &ldquo;{motion.motion_text}&rdquo;
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
              {useLive
                ? "Lawan sedang menyusun argumen via Gemini…"
                : "Lawan sedang menyusun argumen…"}
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
