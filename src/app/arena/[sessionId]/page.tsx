"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { respondToSession, fetchSession } from "@/lib/api";
import type { Turn } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";

const CATEGORY_LABELS: Record<string, string> = {
  politik_hukum: "Politik & Hukum",
  ekonomi: "Ekonomi",
  teknologi: "Teknologi",
  sosial_pendidikan: "Sosial & Pendidikan",
  lingkungan: "Lingkungan",
};

type Phase = "thinking" | "await" | "done";

// Use big bubble when text is longer than ~3-4 lines worth of chars
const BIG_THRESHOLD = 160;

const PHOTO_W = "clamp(38px, 5vw, 60px)";

function ChatBubble({ role, content }: { role: "ai" | "user"; content: string }) {
  const isAI = role === "ai";
  const isBig = content.length > BIG_THRESHOLD;

  const src = isAI
    ? (isBig ? "/assets/chat-big.svg" : "/assets/chat-small.svg")
    : (isBig ? "/assets/chat-big(inverse).svg" : "/assets/chat-small(inverse).svg");

  const dims = isBig ? { w: 917, h: 303 } : { w: 887, h: 218 };

  const pl = isAI ? (isBig ? "14%" : "14%") : (isBig ? "9%" : "5%");
  const pr = isAI ? (isBig ? "9%" : "5%") : (isBig ? "15%" : "14%");
  const pt = isBig ? "9%" : "11%";
  const pb = isBig ? "12%" : "11%";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        alignSelf: isAI ? "flex-start" : "flex-end",
        display: "flex",
        alignItems: "flex-end",
        gap: "clamp(4px, 0.8vw, 10px)",
        width: "clamp(240px, 74vw, 740px)",
      }}
    >
      {/* AI persona polaroid — left of AI bubble */}
      {isAI && (
        <div
          className="bg-white shadow-lg flex-shrink-0"
          style={{
            padding: "3px 3px 13px 3px",
            width: PHOTO_W,
            transform: "rotate(-4deg)",
            transformOrigin: "bottom center",
          }}
        >
          <div className="bg-zinc-900 w-full" style={{ aspectRatio: "1" }} />
        </div>
      )}

      {/* Bubble */}
      <div className="relative flex-1 min-w-0">
        <Image src={src} alt="" width={dims.w} height={dims.h} className="w-full h-auto" />
        <div
          className="absolute inset-0 flex items-center overflow-hidden"
          style={{ paddingLeft: pl, paddingRight: pr, paddingTop: pt, paddingBottom: pb }}
        >
          <p className="text-white text-xs sm:text-sm leading-snug font-medium">
            {content}
          </p>
        </div>
      </div>

      {/* User profile box — right of user bubble */}
      {!isAI && (
        <div
          className="flex-shrink-0"
          style={{
            width: PHOTO_W,
            transform: "rotate(5deg)",
            transformOrigin: "bottom center",
          }}
        >
          <Image
            src="/assets/box-profil.svg"
            alt=""
            width={240}
            height={189}
            className="w-full h-auto drop-shadow-lg"
          />
        </div>
      )}
    </motion.div>
  );
}

export default function ArenaPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const router = useRouter();
  const { sessionId } = params;
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [motionData, setMotionData] = useState<any>(null);
  const [category, setCategory] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>("thinking");
  const [userInput, setUserInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showMosi, setShowMosi] = useState(false);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, phase]);

  useEffect(() => {
    async function load() {
      try {
        const today = await fetchSession(sessionId);
        setMotionData(today.motion);
        setCategory(CATEGORY_LABELS[today.category] ?? today.category ?? "");

        const mapped: Turn[] = (today.transcript ?? []).map((t: any) => ({
          role: t.role,
          content: t.content,
          round: t.round ?? 0,
        }));
        setTurns(mapped);
        setRound(today.current_round === 0 ? 1 : today.current_round);
        setPhase(today.state === "finished" ? "done" : "await");
      } catch {
        showToast("Gagal memuat sesi");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId, router]);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  }

  async function handleSubmit() {
    const text = userInput.trim();
    if (!text || phase !== "await") return;

    const currentRound = round;
    setTurns((t) => [...t, { role: "user", content: text, round: currentRound }]);
    setPhase("thinking");
    setUserInput("");

    try {
      const data = await respondToSession(sessionId, text);
      setTurns((t) => [
        ...t,
        { role: "ai", content: data.ai_message, round: data.current_round ?? currentRound },
      ]);
      setPhase(data.finished ? "done" : "await");
      if (!data.finished) setRound(data.current_round);
    } catch (err) {
      showToast(String(err));
      setTurns((t) => t.slice(0, -1));
      setUserInput(text);
      setPhase("await");
    }
  }

  const displayRound = Math.min(round, 3);

  if (loading) {
    return (
      <main className="relative h-[calc(100vh-3.5rem)] grid place-items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/assets/background/bg.svg" alt="" fill className="object-cover" priority />
        </div>
        <div className="relative z-10 flex items-center gap-3 text-white/60 text-sm">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <span>Menyiapkan arena...</span>
        </div>
      </main>
    );
  }

  const inputBarH = "clamp(50px, 6.5vw, 68px)";

  return (
    <main className="relative h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Background ── */}
      <div className="absolute inset-0">
        <Image
          src="/assets/background/bg.svg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* ── Top-left: folder tab + AI persona polaroid ── */}
      <div className="absolute top-3 left-3 z-20 flex items-end gap-2">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setShowMosi(true)}
          className="cursor-pointer"
          title="Lihat Mosi"
        >
          <Image
            src="/assets/folder.svg"
            alt="Mosi"
            width={781}
            height={781}
            style={{ width: "clamp(38px, 5vw, 56px)", height: "auto" }}
            priority
          />
        </motion.button>

        {/* AI Persona — polaroid frame */}
        <div
          className="bg-white shadow-2xl flex-shrink-0"
          style={{
            padding: "4px 4px 18px 4px",
            width: "clamp(54px, 7.5vw, 90px)",
            transform: "rotate(-5deg)",
            transformOrigin: "bottom left",
          }}
        >
          <div className="bg-zinc-900 w-full" style={{ aspectRatio: "1" }} />
        </div>
      </div>

      {/* ── Top-right: round indicator + user profile box ── */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((r) => (
            <div
              key={r}
              className="w-2.5 h-2.5 rounded-full border-2 border-white/80 transition-all"
              style={{ background: r <= displayRound ? "white" : "transparent" }}
            />
          ))}
          <span className="text-white/80 text-xs font-bold ml-1 select-none">
            {displayRound}/3
          </span>
        </div>

        {/* User profile box */}
        <div
          style={{
            width: "clamp(54px, 7.5vw, 90px)",
            transform: "rotate(5deg)",
            transformOrigin: "bottom right",
          }}
        >
          <Image
            src="/assets/box-profil.svg"
            alt="Profil"
            width={240}
            height={189}
            className="w-full h-auto drop-shadow-lg"
          />
        </div>
      </div>

      {/* ── Chat area — scrollable, all messages ── */}
      <div
        className="absolute left-0 right-0 overflow-y-auto"
        style={{
          top: "clamp(86px, 13vw, 124px)",
          bottom: `calc(${inputBarH} + 20px)`,
          paddingLeft: "clamp(10px, 2.5vw, 32px)",
          paddingRight: "clamp(10px, 2.5vw, 32px)",
          paddingTop: "6px",
          paddingBottom: "6px",
        }}
      >
        <div className="flex flex-col gap-2.5 max-w-3xl mx-auto">
          {turns.map((turn, i) => (
            <ChatBubble key={i} role={turn.role} content={turn.content} />
          ))}

          {/* Thinking indicator */}
          {phase === "thinking" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                alignSelf: "flex-start",
                display: "flex",
                alignItems: "flex-end",
                gap: "clamp(4px, 0.8vw, 10px)",
              }}
            >
              <div
                className="bg-white shadow-lg flex-shrink-0"
                style={{ padding: "3px 3px 13px 3px", width: PHOTO_W, transform: "rotate(-4deg)", transformOrigin: "bottom center" }}
              >
                <div className="bg-zinc-900 w-full" style={{ aspectRatio: "1" }} />
              </div>
              <div className="relative" style={{ width: "clamp(120px, 20vw, 220px)" }}>
                <Image src="/assets/chat-small.svg" alt="" width={887} height={218} className="w-full h-auto" />
                <div
                  className="absolute inset-0 flex items-center"
                  style={{ paddingLeft: "16%", paddingTop: "11%", paddingBottom: "11%" }}
                >
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full bg-white animate-bounce"
                        style={{ animationDelay: `${i * 0.18}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ── Bottom: statistik button (done) OR input bar ── */}
      {phase === "done" ? (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center pb-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/result/${sessionId}`)}
            className="cursor-pointer flex items-center"
          >
            <Image
              src="/assets/statistik-left.svg"
              alt=""
              width={60}
              height={60}
              style={{ width: "clamp(32px, 4.5vw, 56px)", height: "auto" }}
            />
            <Image
              src="/assets/button/button-statistik.svg"
              alt="Lihat Statistik Debat"
              width={480}
              height={80}
              style={{ width: "clamp(180px, 38vw, 460px)", height: "auto" }}
            />
            <Image
              src="/assets/statistik-right.svg"
              alt=""
              width={60}
              height={60}
              style={{ width: "clamp(32px, 4.5vw, 56px)", height: "auto" }}
            />
          </motion.button>
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center pb-3 px-3">
          <div
            className="flex items-stretch"
            style={{ width: "clamp(320px, 76vw, 840px)", height: inputBarH }}
          >
            {/* chat-answer.svg (white parallelogram) */}
            <div className="relative min-w-0" style={{ flex: 961 }}>
              <Image src="/assets/chat-answer.svg" alt="" fill className="object-fill" />
              <div
                className="absolute inset-0 flex items-center"
                style={{ paddingLeft: "9%", paddingRight: "3%", paddingTop: "7%", paddingBottom: "7%" }}
              >
                {phase === "await" ? (
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="Argumen kamu ....."
                    className="w-full bg-transparent text-zinc-800 placeholder-zinc-500 text-sm sm:text-base font-medium outline-none"
                    autoFocus
                  />
                ) : (
                  <span className="text-zinc-400 text-sm italic select-none">
                    AI sedang berpikir...
                  </span>
                )}
              </div>
            </div>

            {/* button-submit.svg */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleSubmit}
              disabled={phase === "thinking"}
              className="relative cursor-pointer disabled:opacity-40"
              style={{ flex: 162 }}
              title="Kirim Argumen (Enter)"
            >
              <Image src="/assets/button/button-submit.svg" alt="Kirim" fill className="object-fill" />
            </motion.button>
          </div>
        </div>
      )}

      {/* ── Mosi card overlay ── */}
      <AnimatePresence>
        {showMosi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowMosi(false)}
          >
            {/* X button */}
            <button
              className="absolute top-4 right-6 font-game text-white/90 cursor-pointer hover:opacity-70 select-none"
              style={{ fontSize: "clamp(22px, 4vw, 36px)", zIndex: 60 }}
              onClick={() => setShowMosi(false)}
            >
              X
            </button>

            <motion.div
              initial={{ scale: 0.82, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.82, y: 40 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative"
              style={{ width: "clamp(200px, 34vw, 380px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src="/assets/folder-mosi.svg"
                alt="Mosi"
                width={666}
                height={980}
                className="w-full h-auto drop-shadow-2xl"
              />
              <div className="absolute inset-0 pointer-events-none" style={{ transform: "rotate(-2deg)" }}>
                <div
                  className="absolute flex items-center justify-center"
                  style={{ top: "19%", left: "13%", width: "30%", height: "10%" }}
                >
                  <span
                    className="font-bold text-center"
                    style={{ color: "#26170A", fontSize: "clamp(8px, 1.6vw, 13px)" }}
                  >
                    {category}
                  </span>
                </div>
                <div
                  className="absolute overflow-hidden flex items-start justify-center"
                  style={{ top: "39%", left: "15%", width: "53%", height: "40%", paddingTop: "4%" }}
                >
                  <p
                    className="text-center leading-snug italic"
                    style={{
                      color: "#3d2a1a",
                      fontSize: "clamp(7px, 1.4vw, 11px)",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    &ldquo;{motionData?.motion_text ?? motionData?.context}&rdquo;
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast} />
    </main>
  );
}
