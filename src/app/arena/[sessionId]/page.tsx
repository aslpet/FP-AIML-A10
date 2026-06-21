"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { respondToSession, fetchSession } from "@/lib/api";
import type { Turn } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";

const PROFILE_KEY = "debetin_profile";
function getStoredAvatar(): string | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}")?.avatarDataUrl ?? null; }
  catch { return null; }
}

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

const PHOTO_W = "clamp(70px, 10vw, 150px)";

const PERSONA_IMAGE: Record<string, string> = {
  penuntut:   "/assets/persona/mybini.jpg",
  skeptis:    "/assets/persona/kucing.jpg",
  pragmatis:  "/assets/persona/carte.webp",
  idealis:    "/assets/persona/mr.webp",
  analis_data: "/assets/persona/sigma.jpg",
};

function ChatBubble({ role, content, userAvatar, personaImage }: { role: "ai" | "user"; content: string; userAvatar: string | null; personaImage: string | null }) {
  const isAI = role === "ai";
  const isBig = content.length > BIG_THRESHOLD;

  const src = isAI
    ? (isBig ? "/assets/chat-big.svg" : "/assets/chat-small.svg")
    : (isBig ? "/assets/chat-big(inverse).svg" : "/assets/chat-small(inverse).svg");

  // PENTING: dims = viewBox asli SVG (small 891×197, big 922×341), supaya gambar
  // mengisi kotak overlay tanpa "letterbox" dan persentase posisi memetakan tepat.
  const dims = isBig ? { w: 922, h: 341 } : { w: 891, h: 197 };

  // Area teks diposisikan dengan INSET absolut (left/right/top/bottom), BUKAN padding.
  // Alasan: padding-top/bottom dalam % dihitung dari LEBAR elemen — karena bubble jauh
  // lebih lebar daripada tinggi, padding vertikal jadi raksasa & area teks kolaps (teks
  // hilang). Dengan inset absolut, top/bottom = % TINGGI dan left/right = % LEBAR.
  // Nilai dicocokkan ke kotak hitam tiap SVG; bubble user = cermin horizontal dari AI.
  const left   = isAI ? (isBig ? "24%" : "29%") : (isBig ? "11%" : "14%");
  const right  = isAI ? (isBig ? "11%" : "12%") : (isBig ? "24%" : "29%");
  const top    = isBig ? "13%" : "17%";
  const bottom = isBig ? "25%" : "31%";

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
      {/* AI side — box-profil.svg frame with optional persona photo */}
      {isAI && (
        <div
          className="flex-shrink-0"
          style={{
            width: PHOTO_W,
            transform: "rotate(-4deg)",
            transformOrigin: "bottom center",
            marginBottom: "clamp(38px, 5vw, 67px)",
          }}
        >
          <div className="relative w-full" style={{ aspectRatio: "240/189" }}>
            <Image src="/assets/box-profil.svg" alt="" width={240} height={189} className="w-full h-auto drop-shadow-lg" />
            {personaImage && (
              <div
                className="absolute overflow-hidden"
                style={{
                  // 1. Mempersempit area gambar agar pas di area kotak hitam
                  top: "1%",
                  bottom: "7%",
                  left: "1%",
                  right: "1%",
                  // 2. Memotong sudut-sudut asimetris yang tersisa
                  clipPath: "polygon(89% 21%, 3% 11%, 10.5% 96%, 77.5% 88%)",
                  zIndex: 1,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={personaImage}
                  alt=""
                  className="w-full h-full object-cover object-top"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bubble */}
      <div className="relative flex-1 min-w-0">
        <Image src={src} alt="" width={dims.w} height={dims.h} className="w-full h-auto block" />
        <div
          className="absolute flex flex-col justify-center"
          style={{ left, right, top, bottom }}
        >
          {/* Wadah teks: scrollable bila konten melebihi tinggi area (inset di atas) */}
          <div
            className="w-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ maxHeight: "100%" }}
          >
            {/* Ukuran teks chat — naikkan/turunkan di sini (mobile / sm / md).
                Saat ini: 12px → 14px → 16px. */}
            <p className="text-white text-[12px] sm:text-[14px] md:text-[16px] leading-relaxed font-medium">
              {content}
            </p>
          </div>
        </div>
      </div>

      {/* User side — box-profil(inverse).svg frame with optional photo */}
      {!isAI && (
        <div
          className="flex-shrink-0"
          style={{ 
            width: PHOTO_W, 
            transform: "rotate(5deg)", 
            transformOrigin: "bottom center",
            // PERUBAHAN: Tambahkan baris ini agar ikut naik
            marginBottom: "clamp(38px, 6vw, 23px)",
          }}
        >
          <div className="relative w-full" style={{ aspectRatio: "240/189" }}>
            <Image
              src="/assets/box-profil(inverse).svg"
              alt=""
              width={240}
              height={189}
              className="w-full h-auto drop-shadow-lg"
            />
            {userAvatar && (
              <div
                className="absolute overflow-hidden"
                style={{
                  // 1. Mempersempit area gambar agar pas di area kotak hitam
                  top: "10%",
                  bottom: "1%",
                  left: "1%",
                  right: "1%",
                  // 2. Memotong sudut-sudut asimetris yang tersisa
                  clipPath: "polygon(11% 11%, 96% 3%, 90% 89%, 23% 81%)",
                  zIndex: 1,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={userAvatar}
                  alt=""
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}
          </div>
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
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [personaImage, setPersonaImage] = useState<string | null>(null);

  useEffect(() => { setUserAvatar(getStoredAvatar()); }, []);

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
        const style = today.motion?.persona_style as string | undefined;
        if (style && PERSONA_IMAGE[style]) setPersonaImage(PERSONA_IMAGE[style]);

        const mapped: Turn[] = (today.transcript ?? []).map((t: any) => ({
          role: t.role,
          content: t.content,
          round: t.round ?? 0,
        }));
        setTurns(mapped);
        setRound(today.current_round === 0 ? 1 : today.current_round);
        setPhase(today.state === "finished" ? "done" : "await");
        // Always greet the user with the mosi on entry
        setShowMosi(true);
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
      <main className="relative h-[calc(100vh-4rem)] grid place-items-center overflow-hidden">
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
    <main className="relative h-[calc(100vh-4rem)] overflow-hidden">

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

      {/* ── Top-left: folder tab (mosi viewer) ── */}
      <div className="absolute top-8 sm:top-10 left-3 sm:left-6 z-20">
        <motion.button
          whileHover={{ scale: 1.1, rotate: -3 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowMosi(true)}
          className="cursor-pointer"
          title="Lihat Mosi"
        >
          <Image
            src="/assets/folder.svg"
            alt="Mosi"
            width={781}
            height={781}
            style={{ width: "clamp(56px, 8vw, 90px)", height: "auto" }}
            priority
          />
        </motion.button>
      </div>

      {/* ── Top-right: round indicator ── */}
      <div className="absolute top-8 sm:top-10 right-3 sm:right-6 z-20 flex items-center gap-2">
        {[1, 2, 3].map((r) => (
          <div
            key={r}
            className="rounded-full border-2 border-white/90 transition-all duration-300 shadow-md"
            style={{
              width: "clamp(12px, 1.8vw, 20px)",
              height: "clamp(12px, 1.8vw, 20px)",
              background: r <= displayRound ? "white" : "rgba(255,255,255,0.1)",
              boxShadow: r <= displayRound ? "0 0 8px rgba(255,255,255,0.6)" : "none",
            }}
          />
        ))}
        <span
          className="text-white/90 font-bold select-none ml-0.5"
          style={{ fontSize: "clamp(14px, 2vw, 20px)", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
        >
          {displayRound}/3
        </span>
      </div>

      {/* ── Chat area — scrollable, all messages ── */}
      <div
        className="absolute left-0 right-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{
          top: 0, // PERUBAHAN: Ditarik agar nempel persis di bawah batas navbar
          bottom: `calc(${inputBarH} + 20px)`,
          paddingLeft: "clamp(10px, 2.5vw, 32px)",
          paddingRight: "clamp(10px, 2.5vw, 32px)",
          paddingTop: "clamp(20px, 4vw, 40px)", // Padding awal untuk memberi ruang napas
          paddingBottom: "6px",
          
          // PERUBAHAN PENTING: Masking untuk efek memudar (fade) di bagian atas layar
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 100%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 100%)",
        }}
      >
        <div className="flex flex-col gap-2.5 max-w-3xl mx-auto">
          {turns.map((turn, i) => (
            <ChatBubble key={i} role={turn.role} content={turn.content} userAvatar={userAvatar} personaImage={personaImage} />
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
                className="flex-shrink-0"
                style={{ 
                  width: PHOTO_W, 
                  transform: "rotate(-4deg)", 
                  transformOrigin: "bottom center",
                  marginBottom: "clamp(38px, 6vw, 52px)",
                }}
              >
                <Image src="/assets/box-profil.svg" alt="" width={240} height={189} className="w-full h-auto drop-shadow-lg" />
              </div>

              {/* PERUBAHAN: Tambahkan flex-shrink-0 dan nilai marginBottom yang sama di sini */}
              <div
                className="relative flex-shrink-0"
                style={{
                  width: "clamp(200px, 40vw, 420px)",
                  marginBottom: "clamp(38px, 6vw, 52px)",
                }}
              >
                <Image src="/assets/chat-small.svg" alt="" width={891} height={197} className="w-full h-auto" />
                <div
                  className="absolute flex items-center"
                  style={{ left: "30%", right: "12%", top: "17%", bottom: "31%" }}
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
              style={{ width: "clamp(42px, 6vw, 72px)", height: "auto" }}
            />
            <div className="relative">
              <Image
                src="/assets/button/button-statistik.svg"
                alt="Lihat Statistik Debat"
                width={480}
                height={80}
                style={{ width: "clamp(220px, 48vw, 560px)", height: "auto" }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center font-game text-white select-none"
                style={{ fontSize: "clamp(14px, 2.4vw, 28px)", letterSpacing: "0.12em", textShadow: "1px 1px 3px rgba(0,0,0,0.7)" }}
              >
                LIHAT STATISTIK
              </span>
            </div>
            <Image
              src="/assets/statistik-right.svg"
              alt=""
              width={60}
              height={60}
              style={{ width: "clamp(42px, 6vw, 72px)", height: "auto" }}
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
              <Image src="/assets/chat-answer.svg" alt="" fill className="object-fill z-0" />
              
              {/* LAYER 1: PENGATURAN BATAS TEKS (Menggunakan Posisi Absolut) */}
              <div
                className="absolute z-10 flex flex-col justify-center"
                style={{ 
                  left: "21%",   // Batas kiri (atur jika teks menabrak garis miring kiri)
                  right: "21%",   // Batas kanan 
                  top: "16%",    // Batas atas (atur tinggi maksimal teks dari atas)
                  bottom: "16%"  // Batas bawah (atur tinggi maksimal teks dari bawah)
                }}
              >
                {phase === "await" ? (
                  /* LAYER 2: TEXTAREA SCROLLABLE */
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="Argumen kamu ....."
                    // w-full dan h-full memastikan teks hanya sebatas ruang yang diapit top/bottom/left/right di atas
                    className="w-full h-full bg-transparent text-zinc-800 placeholder-zinc-500 text-sm sm:text-base font-medium outline-none resize-none overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
              style={{ width: "clamp(260px, 42vw, 500px)" }}
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
                {/* Category badge */}
                <div
                  className="absolute flex items-center justify-center"
                  style={{ top: "19%", left: "13%", width: "30%", height: "8%" }}
                >
                  <span
                    className="font-bold text-center leading-tight"
                    style={{ color: "#26170A", fontSize: "clamp(20px, 2.3vw, 24px)" }}
                  >
                    {category}
                  </span>
                </div>
                {/* Motion text — no clamp, overflow-y scroll if needed */}
                <div
                  className="absolute flex items-start justify-center overflow-y-auto"
                  style={{ top: "38%", left: "13%", width: "56%", height: "42%", paddingTop: "3%" }}
                >
                  <p
                    className="text-center leading-relaxed"
                    style={{
                      color: "#000000",
                      // Ukuran teks topik mosi — atur di sini: clamp(min, preferred, max)
                      fontSize: "clamp(16px, 2.1vw, 24px)",
                      fontWeight: 500,
                      fontStyle: "italic",
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
