"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { fetchToday, fetchAllMotions, startSession, getMe } from "@/lib/api";
import { Toast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";

const CATEGORY_LABELS: Record<string, string> = {
  politik_hukum: "Politik & Hukum",
  ekonomi: "Ekonomi",
  teknologi: "Teknologi",
  sosial_pendidikan: "Sosial & Pendidikan",
  lingkungan: "Lingkungan",
};

export default function TodayPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [todayState, setTodayState] = useState<any>(null);
  const [meState, setMeState] = useState<any>(null);
  const [allMotions, setAllMotions] = useState<any>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [starting, setStarting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) throw new Error(error.message);
        }
        const [todayRes, meRes, allRes] = await Promise.all([
          fetchToday(),
          getMe(),
          fetchAllMotions(),
        ]);
        setTodayState(todayRes);
        setMeState(meRes);
        setAllMotions(allRes);
        if (todayRes.state === "in_progress" && todayRes.session_id) {
          router.push(`/arena/${todayRes.session_id}`);
        }
        // Start carousel at daily category index
        if (allRes?.items?.length) {
          const dailyIdx = allRes.items.findIndex((it: any) => it.is_daily);
          setCarouselIdx(dailyIdx >= 0 ? dailyIdx : 0);
        }
      } catch (err: any) {
        setErrorMsg(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  }

  async function handleStart(category?: string) {
    setStarting(true);
    try {
      const data = await startSession(category);
      router.push(`/arena/${data.session_id}`);
    } catch (err) {
      showToast(String(err));
      setStarting(false);
    }
  }

  const scrollToMotion = () => {
    document.getElementById("section-motion")?.scrollIntoView({ behavior: "smooth" });
  };

  const items: any[] = allMotions?.items ?? [];
  const dailyDone: boolean = allMotions?.daily_done ?? false;
  const currentItem = items[carouselIdx] ?? null;

  return (
    <>
      {/* ═══════════════════════════════════════════
          SECTION 1 — Hero
      ═══════════════════════════════════════════ */}
      <section className="relative h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">

        <div className="absolute inset-0 -z-0">
          <Image
            src="/assets/background/bg.svg"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div
            className="absolute pointer-events-none select-none"
            style={{
              right: "-3%",
              top: "-6%",
              width: "clamp(320px, 58vw, 620px)",
              transform: "rotate(22deg)",
              transformOrigin: "top right",
              zIndex: 0,
            }}
          >
            <Image src="/assets/folder.svg" alt="" width={781} height={781} className="w-full h-auto drop-shadow-2xl" priority />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4 select-none">
            <div className="relative inline-block">
              <Image
                src="/assets/title.svg"
                alt="debat.In"
                width={956}
                height={225}
                className="drop-shadow-xl"
                style={{ width: "clamp(320px, 68vw, 820px)", height: "auto" }}
                priority
              />
              <div className="absolute" style={{ top: "-2%", right: "-5%" }}>
                <Image src="/assets/TM.svg" alt="TM" width={70} height={42} style={{ width: "clamp(34px, 5.5vw, 66px)", height: "auto" }} />
              </div>
            </div>
            <Image
              src="/assets/sub-title.svg"
              alt="AI Argument Training"
              width={1248}
              height={126}
              className="drop-shadow-lg"
              style={{ width: "clamp(280px, 60vw, 720px)", height: "auto" }}
            />
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center pb-7 gap-2 select-none">
          <button
            onClick={scrollToMotion}
            className="flex items-center gap-4 group cursor-pointer hover:opacity-80 smooth-transition"
          >
            <Image src="/assets/button/arrow-down.svg" alt="" width={46} height={89} className="w-5 h-auto animate-bounce" />
            <span className="text-white/70 text-sm tracking-[0.2em] font-medium">scroll down</span>
            <Image src="/assets/button/arrow-down.svg" alt="" width={46} height={89} className="w-5 h-auto animate-bounce" style={{ animationDelay: "0.15s" }} />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — Motion Carousel
      ═══════════════════════════════════════════ */}
      <section
        id="section-motion"
        className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center overflow-hidden py-12"
      >
        <div className="absolute inset-0 -z-0">
          <Image src="/assets/background/bg-brown.svg" alt="" fill className="object-cover object-center" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 w-full">
          {loading ? (
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              <span>Mengambil mosi hari ini...</span>
            </div>

          ) : errorMsg ? (
            <div className="text-center space-y-4">
              <p className="text-white/60 text-sm">{errorMsg}</p>
              <button onClick={() => window.location.reload()} className="text-xs text-white/40 underline">
                Coba lagi
              </button>
            </div>

          ) : items.length === 0 ? (
            <div className="text-center space-y-4">
              <p className="text-3xl">📭</p>
              <p className="text-white/60 text-sm">Mosi hari ini belum tersedia. Cek lagi nanti.</p>
            </div>

          ) : (
            <MotionCarousel
              items={items}
              dailyDone={dailyDone}
              currentIdx={carouselIdx}
              onPrev={() => setCarouselIdx((i) => Math.max(0, i - 1))}
              onNext={() => setCarouselIdx((i) => Math.min(items.length - 1, i + 1))}
              onStart={(category) => handleStart(category)}
              onResume={(sessionId) => router.push(`/arena/${sessionId}`)}
              onReview={(sessionId) => router.push(`/result/${sessionId}`)}
              starting={starting}
            />
          )}
        </div>
      </section>

      <Toast message={toast} />
    </>
  );
}

/* ─── Motion Carousel ─── */
function MotionCarousel({
  items,
  dailyDone,
  currentIdx,
  onPrev,
  onNext,
  onStart,
  onResume,
  onReview,
  starting,
}: {
  items: any[];
  dailyDone: boolean;
  currentIdx: number;
  onPrev: () => void;
  onNext: () => void;
  onStart: (category: string) => void;
  onResume: (sessionId: string) => void;
  onReview: (sessionId: string) => void;
  starting: boolean;
}) {
  const item = items[currentIdx];
  if (!item) return null;

  const hasPrev2 = currentIdx >= 2;
  const hasPrev1 = currentIdx >= 1;
  const hasNext1 = currentIdx < items.length - 1;
  const hasNext2 = currentIdx < items.length - 2;

  const isLocked = !item.is_daily && !dailyDone;
  const isDone = item.state === "finished";
  const isInProgress = item.state === "in_progress";
  const categoryLabel = CATEGORY_LABELS[item.category] ?? item.category;
  const motionText = item.motion?.context ?? item.motion?.motion_text ?? "";

  // folder.svg is 781×781 (square).
  // Category badge rect in SVG: x=190(24.3%), y=103(13.2%), w=247(31.6%), h=97(12.4%)
  // Content body (below badge): estimated top≈30%, left≈12%, w≈76%, h≈52%
  const CARD_W = "clamp(200px, 36vw, 300px)";  // center card — square folder
  const SIDE1_W = "clamp(110px, 21vw, 180px)"; // closest side card
  const SIDE2_W = "clamp(95px,  18vw, 155px)"; // far side card

  return (
    <>
      {/* ── Row: arrows + clipping viewport ── */}
      <div className="relative w-full flex items-center justify-center">

        {/* Left arrow */}
        <motion.button
          whileHover={{ scale: 1.1, x: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPrev}
          className={`absolute left-3 sm:left-8 z-20 cursor-pointer smooth-transition ${
            hasPrev1 ? "opacity-80 hover:opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Image src="/assets/button/arrow-left.svg" alt="Prev" width={49} height={46} className="w-8 h-auto sm:w-10" />
        </motion.button>

        {/* Clipping viewport */}
        <div
          className="relative overflow-hidden"
          style={{ width: "min(84vw, 680px)", height: "clamp(220px, 46vw, 390px)" }}
        >
          {/* Prev-2 — sliver at far left */}
          {hasPrev2 && (
            <div
              className="absolute pointer-events-none select-none"
              style={{
                width: SIDE2_W,
                top: "4%",
                right: "71%",
                opacity: 0.22,
                transform: "rotate(-7deg)",
                transformOrigin: "bottom right",
                zIndex: 1,
              }}
            >
              <Image src="/assets/folder.svg" alt="" width={781} height={781} className="w-full h-auto" />
            </div>
          )}

          {/* Prev-1 — partial strip left of center */}
          {hasPrev1 && (
            <div
              className="absolute pointer-events-none select-none"
              style={{
                width: SIDE1_W,
                top: "2%",
                right: "62%",
                opacity: 0.42,
                transform: "rotate(-4deg)",
                transformOrigin: "bottom right",
                zIndex: 2,
              }}
            >
              <Image src="/assets/folder.svg" alt="" width={781} height={781} className="w-full h-auto" />
            </div>
          )}

          {/* Center card — folder.svg, fully visible */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              transition={{ duration: 0.22 }}
              className="absolute select-none"
              style={{
                width: CARD_W,
                left: "50%",
                top: 0,
                transform: "translateX(-50%)",
                zIndex: 4,
              }}
            >
              <Image
                src="/assets/folder.svg"
                alt="Mosi"
                width={781}
                height={781}
                className="w-full h-auto drop-shadow-2xl"
                priority
              />

              {/* ── Overlay: category badge ──
                  folder.svg badge rect: x=190(24.3%) y=103(13.2%) w=247(31.6%) h=97(12.4%) */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute flex items-center justify-center"
                  style={{ top: "13.2%", left: "24.3%", width: "31.6%", height: "12.4%" }}
                >
                  <span
                    className="font-bold leading-tight text-center"
                    style={{ color: "#3B1A06", fontSize: "clamp(8px, 1.7vw, 13px)" }}
                  >
                    {categoryLabel}
                  </span>
                </div>

                {/* Motion text — positioned in the book body */}
                {!isLocked && (
                  <div
                    className="absolute flex items-start justify-center overflow-hidden"
                    style={{
                      top: "30%",
                      left: "12%",
                      width: "76%",
                      height: "52%",
                      padding: "6% 8% 4%",
                      background: "rgba(255,248,238,0.82)",
                      borderRadius: "6px",
                    }}
                  >
                    <p
                      className="text-center leading-snug italic"
                      style={{
                        color: "#3d2a1a",
                        fontSize: "clamp(7px, 1.5vw, 11px)",
                        display: "-webkit-box",
                        WebkitLineClamp: 7,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      &ldquo;{motionText}&rdquo;
                    </p>
                  </div>
                )}

                {/* Lock overlay */}
                {isLocked && (
                  <div
                    className="absolute flex flex-col items-center justify-center"
                    style={{
                      top: "30%", left: "12%", width: "76%", height: "52%",
                      background: "rgba(15,5,0,0.65)",
                      backdropFilter: "blur(3px)",
                      borderRadius: "6px",
                    }}
                  >
                    <span className="text-2xl">🔒</span>
                    <p className="text-white/80 text-xs text-center mt-1.5 px-3 leading-snug">
                      Selesaikan mosi harian<br />terlebih dahulu
                    </p>
                  </div>
                )}

                {/* Done overlay */}
                {isDone && (
                  <div
                    className="absolute flex items-center justify-center"
                    style={{ top: "30%", left: "12%", width: "76%", height: "52%" }}
                  >
                    <div
                      className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-lg"
                      style={{ background: "rgba(22,163,74,0.88)", backdropFilter: "blur(2px)" }}
                    >
                      <span className="text-white text-xl">✓</span>
                      <span className="text-white text-xs font-bold">Sudah Dikerjakan</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Next-1 — partial strip right of center */}
          {hasNext1 && (
            <div
              className="absolute pointer-events-none select-none"
              style={{
                width: SIDE1_W,
                top: "2%",
                left: "62%",
                opacity: 0.42,
                transform: "rotate(4deg)",
                transformOrigin: "bottom left",
                zIndex: 2,
              }}
            >
              <Image src="/assets/folder.svg" alt="" width={781} height={781} className="w-full h-auto" />
            </div>
          )}

          {/* Next-2 — sliver at far right */}
          {hasNext2 && (
            <div
              className="absolute pointer-events-none select-none"
              style={{
                width: SIDE2_W,
                top: "4%",
                left: "71%",
                opacity: 0.22,
                transform: "rotate(7deg)",
                transformOrigin: "bottom left",
                zIndex: 1,
              }}
            >
              <Image src="/assets/folder.svg" alt="" width={781} height={781} className="w-full h-auto" />
            </div>
          )}
        </div>

        {/* Right arrow */}
        <motion.button
          whileHover={{ scale: 1.1, x: 3 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className={`absolute right-3 sm:right-8 z-20 cursor-pointer smooth-transition ${
            hasNext1 ? "opacity-80 hover:opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Image src="/assets/button/arrow-right.svg" alt="Next" width={49} height={46} className="w-8 h-auto sm:w-10" />
        </motion.button>
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="flex items-center gap-2 mt-1">
          {items.map((it: any, i: number) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === currentIdx ? 20 : 6,
                height: 6,
                background:
                  i === currentIdx
                    ? "rgba(255,255,255,0.85)"
                    : it.state === "finished"
                    ? "rgba(34,197,94,0.65)"
                    : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>
      )}

      {/* Action button */}
      <AnimatePresence mode="wait">
        {!isLocked && (
          <motion.div
            key={`btn-${currentIdx}-${item.state}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (isDone) onReview(item.session_id);
                else if (isInProgress) onResume(item.session_id);
                else onStart(item.category);
              }}
              disabled={starting}
              className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image
                src={isDone ? "/assets/button/button-review.svg" : "/assets/button/button-mulai.svg"}
                alt={isDone ? "Review" : "Mulai"}
                width={249}
                height={111}
                style={{ width: "clamp(180px, 42vw, 280px)", height: "auto" }}
                className="drop-shadow-lg"
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
