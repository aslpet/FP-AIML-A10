"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
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

// Lebar dasar folder yang meluncur = ukuran kartu mosi di carousel (pose B).
const FOLDER_W = "clamp(320px, 55vw, 520px)";
// Posisi folder (titik TENGAH folder, dalam % viewport) dari pose A (hero) ke
// pose B (kartu mosi). Folder pakai position: fixed, jadi koordinat = viewport.
// Tweak angka-angka ini kalau posisi awal/akhir belum pas.
const SLIDE = {
  leftFrom: "72%",   // pose A: agak ke kanan (seperti folder hero semula)
  leftTo: "50%",     // pose B: tengah
  topFrom: "52%",    // pose A: ketinggian folder di hero
  topTo: "50%",      // pose B: tengah carousel
  rotateFrom: 25.95, // kemiringan di hero
  rotateTo: 1,       // hampir tegak saat jadi kartu mosi
  scaleFrom: 1.15,   // sedikit lebih besar di hero
  scaleTo: 1,        // ukuran kartu mosi
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

  // ── Shared-folder slide (pose A = hero top-right, pose B = carousel center) ──
  // Satu folder.svg yang sama meluncur dari hero ke posisi mosi saat scroll.
  // Angka di bawah ini bisa di-tweak untuk pas-kan posisi akhir.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const folderLeft = useTransform(scrollYProgress, [0, 1], [SLIDE.leftFrom, SLIDE.leftTo]);
  const folderTop = useTransform(scrollYProgress, [0, 1], [SLIDE.topFrom, SLIDE.topTo]);
  const folderRotate = useTransform(scrollYProgress, [0, 1], [SLIDE.rotateFrom, SLIDE.rotateTo]);
  const folderScale = useTransform(scrollYProgress, [0, 1], [SLIDE.scaleFrom, SLIDE.scaleTo]);
  // Konten mosi (badge + teks) baru muncul saat folder mendekati posisi bawah
  const folderContentOpacity = useTransform(scrollYProgress, [0, 0.6, 0.85], [0, 0, 1]);

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

  // Derived state for the shared folder overlay (mirrors MotionCarousel)
  const folderCategory = currentItem ? (CATEGORY_LABELS[currentItem.category] ?? currentItem.category) : "";
  const folderMotionText = currentItem?.motion?.context ?? currentItem?.motion?.motion_text ?? "";
  const folderLocked = currentItem ? (!currentItem.is_daily && !dailyDone) : false;
  const folderDone = currentItem?.state === "finished";

  return (
    <>
      {/* ═══════════════════════════════════════════
          Shared folder — SATU folder.svg yang meluncur dari hero (pose A)
          ke posisi kartu mosi (pose B) saat scroll. position: fixed supaya
          selalu di atas background; z di antara konten carousel & judul hero.
      ═══════════════════════════════════════════ */}
      <motion.div
        aria-hidden
        className="fixed pointer-events-none select-none z-[15]"
        style={{
          left: folderLeft,
          top: folderTop,
          width: FOLDER_W,
          x: "-50%",
          y: "-50%",
          rotate: folderRotate,
          scale: folderScale,
          transformOrigin: "center center",
        }}
      >
        <Image src="/assets/folder.svg" alt="" width={781} height={781} className="w-full h-auto drop-shadow-2xl" priority />

        {/* Overlay konten mosi — fade-in saat folder mendekati posisi bawah */}
        {currentItem && (
          <motion.div className="absolute inset-0" style={{ opacity: folderContentOpacity }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={carouselIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                {/* Category badge — rect: top 13.2% left 24.3% w 31.6% h 12.4% */}
                <div
                  className="absolute flex items-center justify-center overflow-hidden"
                  style={{ top: "13.2%", left: "24.3%", width: "31.6%", height: "12.4%" }}
                >
                  <span
                    className="font-bold leading-tight text-center"
                    style={{
                      color: "#3B1A06",
                      fontSize: "clamp(12px, 1.3vw, 20px)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {folderCategory}
                  </span>
                </div>

                {/* Motion text */}
                {!folderLocked && (
                  <div
                    className="absolute flex items-start justify-center overflow-hidden"
                    style={{ top: "40%", left: "22%", width: "50%", height: "50%" }}
                  >
                    <p
                      className="text-center leading-relaxed italic"
                      style={{
                        color: "#3d2a1a",
                        fontSize: "clamp(10px, 1.2vw, 16px)",
                        display: "-webkit-box",
                        WebkitLineClamp: 8,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      &ldquo;{folderMotionText}&rdquo;
                    </p>
                  </div>
                )}

                {/* Lock overlay */}
                {folderLocked && (
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
                {folderDone && (
                  <div
                    className="absolute flex items-center justify-center"
                    style={{ top: "50%", left: "10%", width: "76%", height: "52%" }}
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
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════
          SECTION 1 — Hero
      ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative h-screen -mt-16 flex flex-col overflow-hidden">

        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/background/bg.svg"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        {/* Main content — centered with pt-16 to clear the navbar */}
        <div className="relative z-20 flex-1 flex items-center justify-center px-6 pt-16">
          <div className="flex flex-col items-center gap-4 select-none">
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

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />

        {/* Scroll-down — retro bounce */}
        <div className="relative z-30 flex items-end justify-center pb-8 select-none">
          <button
            onClick={scrollToMotion}
            className="flex flex-col items-center gap-2 cursor-pointer group"
          >
            <div className="animate-bounce-retro">
              <span
                className="font-game text-white/85 tracking-widest group-hover:text-white smooth-transition"
                style={{ fontSize: "clamp(22px, 3.5vw, 52px)" }}
              >
                &gt;&gt; scroll down &lt;&lt;
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — Motion Carousel
      ═══════════════════════════════════════════ */}
      <section
        id="section-motion"
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-12"
      >
        <div className="absolute inset-0 -z-0">
          <Image src="/assets/background/bg-brown.svg" alt="" fill className="object-cover object-center" />
        </div>
          {/* Seamless gradient: blends hero bottom into this section */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none z-[5]" />

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
              onJump={(i) => setCarouselIdx(i)}
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
  onJump,
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
  onJump: (idx: number) => void;
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

  // Side cards — visibly peeking behind the sliding center folder
  const SIDE1_W = "clamp(180px, 35vw, 290px)";
  const SIDE2_W = "clamp(130px, 25vw, 210px)";

  return (
    <>
      {/* ── Row: arrows + clipping viewport ── */}
      <div className="relative w-full flex items-center justify-center">

        {/* Left arrow */}
        <motion.button
          whileHover={{ scale: 1.15, x: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={onPrev}
          className={`absolute left-2 sm:left-6 z-20 cursor-pointer ${
            hasPrev1 ? "opacity-80 hover:opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Image src="/assets/button/arrow-left.svg" alt="Prev" width={49} height={46} className="w-8 h-auto sm:w-11 drop-shadow-lg" />
        </motion.button>

        {/* Clipping viewport */}
        <div
          className="relative overflow-hidden"
          style={{ width: "min(90vw, 760px)", height: "clamp(300px, 56vw, 460px)" }}
        >
          {/* Prev-2 — sliver far left, clickable */}
          {hasPrev2 && (
            <motion.div
              initial={{ rotate: -9, opacity: 0.22 }}
              animate={{ rotate: -9, opacity: 0.22 }}
              whileHover={{ rotate: -9, opacity: 0.42, scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={onPrev}
              className="absolute select-none cursor-pointer"
              style={{
                width: SIDE2_W,
                top: "40%",
                right: "67%",
                transformOrigin: "bottom right",
                zIndex: 1,
              }}
            >
              <Image src="/assets/folder.svg" alt="" width={781} height={781} className="w-full h-auto" />
            </motion.div>
          )}

          {/* Prev-1 — closely behind center left, clickable */}
          {hasPrev1 && (
            <motion.div
              initial={{ rotate: -5, opacity: 0.54 }}
              animate={{ rotate: -5, opacity: 0.54 }}
              whileHover={{ rotate: -5, opacity: 0.8, scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={onPrev}
              className="absolute select-none cursor-pointer"
              style={{
                width: SIDE1_W,
                top: "30%",
                right: "55%",
                transformOrigin: "bottom right",
                zIndex: 2,
              }}
            >
              <Image src="/assets/folder.svg" alt="" width={781} height={781} className="w-full h-auto" />
            </motion.div>
          )}

          {/* Center card dipindah ke folder "meluncur" di Section 1 (Hero).
              Folder yang sama meluncur turun ke titik ini saat scroll, jadi di
              sini hanya disediakan ruang kosong di tengah viewport. */}

          {/* Next-1 — closely behind center right, clickable */}
          {hasNext1 && (
            <motion.div
              initial={{ rotate: 5, opacity: 0.54 }}
              animate={{ rotate: 5, opacity: 0.54 }}
              whileHover={{ rotate: 5, opacity: 0.8, scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={onNext}
              className="absolute select-none cursor-pointer"
              style={{
                width: SIDE1_W,
                top: "30%",
                left: "55%",
                transformOrigin: "bottom left",
                zIndex: 2,
              }}
            >
              <Image src="/assets/folder.svg" alt="" width={781} height={781} className="w-full h-auto" />
            </motion.div>
          )}

          {/* Next-2 — sliver far right, clickable */}
          {hasNext2 && (
            <motion.div
              initial={{ rotate: 9, opacity: 0.22 }}
              animate={{ rotate: 9, opacity: 0.22 }}
              whileHover={{ rotate: 9, opacity: 0.42, scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={onNext}
              className="absolute select-none cursor-pointer"
              style={{
                width: SIDE2_W,
                top: "40%",
                left: "67%",
                transformOrigin: "bottom left",
                zIndex: 1,
              }}
            >
              <Image src="/assets/folder.svg" alt="" width={781} height={781} className="w-full h-auto" />
            </motion.div>
          )}
        </div>

        {/* Right arrow */}
        <motion.button
          whileHover={{ scale: 1.15, x: 4 }}
          whileTap={{ scale: 0.9 }}
          onClick={onNext}
          className={`absolute right-2 sm:right-6 z-20 cursor-pointer ${
            hasNext1 ? "opacity-80 hover:opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Image src="/assets/button/arrow-right.svg" alt="Next" width={49} height={46} className="w-8 h-auto sm:w-11 drop-shadow-lg" />
        </motion.button>
      </div>

      {/* Dot indicators — clickable */}
      {items.length > 1 && (
        <div className="flex items-center gap-2 mt-1">
          {items.map((it: any, i: number) => (
            <button
              key={i}
              onClick={() => onJump(i)}
              className="cursor-pointer p-1 group"
            >
              <div
                className="rounded-full transition-all duration-200 group-hover:scale-125"
                style={{
                  width: i === currentIdx ? 20 : 6,
                  height: 6,
                  background:
                    i === currentIdx
                      ? "rgba(255,255,255,0.9)"
                      : it.state === "finished"
                      ? "rgba(34,197,94,0.65)"
                      : "rgba(255,255,255,0.3)",
                  transition: "width 0.2s, transform 0.15s",
                }}
              />
            </button>
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
            // PERUBAHAN: Tambahkan mt-8 (margin-top) agar tombol mepet ke bawah
            className="mt-10" 
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
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
                // PERUBAHAN: Nilai clamp diperkecil dari (180px, 42vw, 280px)
                style={{ width: "clamp(130px, 28vw, 200px)", height: "auto" }}
                className="drop-shadow-xl"
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
