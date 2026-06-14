"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Shield, BookOpen, ArrowRight } from "lucide-react";
import { fetchToday, startSession, getMe } from "@/lib/api";
import { TopBar } from "@/components/ui/TopBar";
import { ConsentModal } from "@/components/ConsentModal";
import { Toast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";

export default function TodayPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [todayState, setTodayState] = useState<any>(null);
  const [meState, setMeState] = useState<any>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) throw new Error("Gagal membuat sesi anonim: " + error.message);
        }

        const [todayRes, meRes] = await Promise.all([fetchToday(), getMe()]);
        setTodayState(todayRes);
        setMeState(meRes);
        
        if (todayRes.state === "in_progress" && todayRes.session_id) {
          router.push(`/arena/${todayRes.session_id}`);
          return;
        }
      } catch (err: any) {
        console.error("Failed to load state", err);
        setErrorMsg(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }

  async function handleStart() {
    if (!todayState?.category) return;
    setLoading(true);
    try {
      const data = await startSession(todayState.category);
      router.push(`/arena/${data.session_id}`);
    } catch (err) {
      showToast(String(err));
      setLoading(false);
    }
  }

  async function handleNextCategory() {
    setLoadingNext(true);
    try {
      const res = await fetch("/api/session/next-category", { method: "POST" });
      if (res.status === 204) {
        showToast("Anda sudah memainkan semua kategori hari ini!");
        setLoadingNext(false);
        return;
      }
      if (!res.ok) throw new Error("Gagal mengambil kategori baru");
      window.location.reload();
    } catch(err: any) {
      showToast(err.message || String(err));
      setLoadingNext(false);
    }
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <TopBar streak={0} hideStreak />
        <section className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full glass rounded-2xl p-8 border border-red-500/20 text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-red-400">Gagal Memuat Data</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {errorMsg}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg smooth-transition cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (loading || !todayState || !meState) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <TopBar streak={0} hideStreak />
        <section className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-4xl w-full text-center space-y-4">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            <p className="text-zinc-400">Mengambil mosi perdebatan hari ini...</p>
          </div>
        </section>
      </div>
    );
  }

  const { state, category, motion: dailyMotion } = todayState;

  if (state === "unavailable" || !dailyMotion) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <TopBar streak={meState.streak_count} />
        <section className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full glass rounded-2xl p-8 border border-zinc-800 text-center space-y-6">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-300">Belum Ada Mosi</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Mosi perdebatan untuk hari ini belum tersedia atau Anda sudah menyelesaikan semua kategori.
            </p>
            <button
              onClick={() => router.push("/history")}
              className="w-full py-3 bg-zinc-900 text-white font-semibold rounded-lg hover:bg-zinc-800 smooth-transition cursor-pointer"
            >
              Lihat Riwayat
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (state === "finished") {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <TopBar streak={meState.streak_count} />
        <section className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full glass rounded-2xl p-8 border border-emerald-500/20 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <Wand2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-400">Sesi Selesai</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Hebat! Anda sudah menyelesaikan debat hari ini. Silakan lihat hasil evaluasi Anda atau kembali besok untuk tantangan baru.
            </p>
            <button
              onClick={() => router.push(`/result/${todayState.session_id}`)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg smooth-transition cursor-pointer"
            >
              Lihat Hasil Debat
            </button>
            <button
              onClick={handleNextCategory}
              disabled={loadingNext}
              className="w-full py-3 mt-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-emerald-400 font-semibold rounded-lg smooth-transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingNext ? "Memuat..." : "Mainkan Kategori Lain (Bonus)"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <TopBar streak={meState.streak_count} />

      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex-1 flex items-center justify-center px-4 py-12"
          >
            <div className="max-w-4xl w-full space-y-8">
              {/* Header Section */}
              <div className="space-y-4">
                <div className="inline-block px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                  <span className="text-xs font-semibold text-emerald-400 tracking-wider">MOSI HARI INI</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-geist font-bold leading-tight text-white tracking-tight">
                  {dailyMotion.motion_text}
                </h2>

                <p className="text-lg text-zinc-400">
                  <span className="inline-flex items-center gap-2 text-emerald-400 font-semibold capitalize">
                    <BookOpen className="w-5 h-5" />
                    {category}
                  </span>
                </p>
              </div>

              {/* Context Card */}
              <div className="bg-zinc-950/50 border border-zinc-800 border-l-4 border-l-emerald-500 rounded-2xl p-8">
                <div className="space-y-4">
                  <p className="text-lg leading-relaxed text-zinc-300 font-medium italic">
                    "{dailyMotion.context}"
                  </p>
                </div>
              </div>

              {/* Start Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleStart}
                className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 smooth-transition bg-emerald-500 text-black hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                <span>Mulai Debat</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.section>
        </AnimatePresence>
      </main>

      <ConsentModal open={!meState.consent} onAgree={() => {
         setMeState({...meState, consent: true});
      }} />
      <Toast message={toast} />
    </div>
  );
}
