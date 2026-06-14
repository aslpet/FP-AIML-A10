"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Home, Target, Zap, BookMarked, ChevronDown, ChevronUp } from "lucide-react";
import { fetchResult } from "@/lib/api";
import { TopBar } from "@/components/ui/TopBar";

interface MetricCard {
  icon: React.ReactNode;
  title: string;
  score: number;
  color: string;
  description: string;
}

export default function ResultPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const sessionId = params.sessionId;
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [animatedScore, setAnimatedScore] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchResult(sessionId);
        setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  useEffect(() => {
    if (!result) return;
    const end = result.total_score || 0;
    if (end === 0) {
      setAnimatedScore(0);
      return;
    }
    let start = 0;
    const totalDuration = 1200;
    const incrementTime = Math.abs(Math.floor(totalDuration / end));
    const timer = setInterval(() => {
      start += 1;
      setAnimatedScore(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [result]);

  if (loading || !result) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <TopBar streak={0} hideStreak />
        <main className="flex-1 grid place-items-center text-zinc-400">Menghitung hasil...</main>
      </div>
    );
  }

  const { scores, total_score, rationale, feedback, verdict } = result;

  const handleShare = () => {
    const text = `debat.in Session Complete!\nTotal Score: ${total_score}/100\n- Relevansi: ${scores.relevansi}/10\n- Koherensi: ${scores.koherensi || scores.responsiveness || 0}/10\n- Kekuatan Bukti: ${scores.kekuatan_bukti || scores.penalaran || 0}/10\n\nTantang kemampuan analisismu secara harian di debat.in! 🔥`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const metrics: MetricCard[] = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Relevansi',
      score: scores.relevansi || 0,
      color: 'emerald',
      description: rationale.relevansi || 'Tingkat kesesuaian argumen dengan topik perdebatan.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Koherensi Logika',
      score: scores.koherensi || scores.responsiveness || 0,
      color: 'indigo',
      description: rationale.koherensi || rationale.responsiveness || 'Struktur argumen dan alur berpikir yang runtut.',
    },
    {
      icon: <BookMarked className="w-6 h-6" />,
      title: 'Kekuatan Bukti',
      score: scores.kekuatan_bukti || scores.penalaran || 0,
      color: 'zinc',
      description: rationale.kekuatan_bukti || rationale.penalaran || 'Penggunaan bukti, fakta, atau penalaran logis.',
    },
  ];

  // Map backend feedback string into items, or just one block if not array
  // If backend returns a string instead of an array of objects for feedback, we show it as Kesimpulan
  const feedbackItems = [
    {
      round: 1,
      title: 'Kesimpulan Evaluasi',
      content: feedback || 'Evaluasi secara keseluruhan atas performa Anda di sesi ini.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <TopBar streak={0} hideStreak />

      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4 }}
        className="flex-1 px-4 sm:px-6 lg:px-8 py-12 bg-black text-zinc-100"
      >
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Big Score Card */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-6 font-semibold">
              🎉 Sesi Selesai
            </p>

            {/* Circular Score */}
            <div className="w-40 h-40 mx-auto mb-8 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900/20 relative shadow-[0_0_20px_rgba(16,185,129,0.05)]">
              <svg className="w-full h-full absolute transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke="#18181b"
                  strokeWidth="4"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - animatedScore / 100)}`}
                  className="smooth-transition"
                />
              </svg>
              <div className="text-center z-10">
                <p className="text-5xl font-geist font-bold text-white">
                  {animatedScore}
                </p>
                <p className="text-xs text-zinc-500 mt-1">/100</p>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white tracking-tight capitalize">
              {verdict}
            </h2>

            <p className="text-zinc-400 text-base max-w-lg mx-auto">
              Performa Anda hari ini telah dievaluasi oleh juri AI.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <div
                key={metric.title}
                className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 hover:border-zinc-800 smooth-transition group"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400`}
                  >
                    {metric.icon}
                  </div>
                  <h3 className="font-semibold text-md text-zinc-200">{metric.title}</h3>
                </div>

                {/* Score */}
                <div className="mb-6">
                  <p className="text-4xl font-bold text-white">{metric.score}</p>
                  <p className="text-zinc-500 text-xs">dari 10</p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden mb-4">
                  <div
                    style={{ width: `${(metric.score / 10) * 100}%` }}
                    className={`h-full rounded-full ${
                      metric.color === 'emerald'
                        ? 'bg-emerald-500'
                        : metric.color === 'indigo'
                        ? 'bg-indigo-500'
                        : 'bg-zinc-400'
                    }`}
                  />
                </div>

                {/* Description */}
                <p className="text-zinc-500 text-xs leading-relaxed">
                  {metric.description}
                </p>
              </div>
            ))}
          </div>

          {/* Detailed Feedback */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
                <BookMarked className="w-5 h-5" />
              </div>
              Feedback Keseluruhan
            </h3>

            <div className="space-y-4">
              {feedbackItems.map((item) => {
                const isExpanded = expandedRound === item.round || feedbackItems.length === 1; // Auto expand if only 1
                return (
                  <div
                    key={item.round}
                    className={`border border-zinc-900 hover:border-zinc-800 rounded-xl p-5 cursor-pointer smooth-transition bg-zinc-900/10`}
                    onClick={() => setExpandedRound(isExpanded && feedbackItems.length > 1 ? null : item.round)}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-base flex items-center gap-3 text-zinc-200">
                        {item.title}
                      </h4>
                      {feedbackItems.length > 1 && (
                        <span className="text-zinc-500">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="text-zinc-400 text-sm leading-relaxed border-t border-zinc-900 pt-3">
                            {item.content}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleShare}
              className="px-6 py-4 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 smooth-transition flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <Share2 className="w-5 h-5" />
              Bagikan Hasil
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push("/")}
              className="px-6 py-4 bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 font-semibold rounded-lg smooth-transition flex items-center justify-center gap-3 cursor-pointer"
            >
              <Home className="w-5 h-5" />
              Kembali ke Beranda
            </motion.button>
          </div>
        </div>

        {/* Copy Notification Toast */}
        <AnimatePresence>
          {copySuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 text-emerald-400 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2 z-55"
            >
              <span>✓ Rangkuman skor berhasil disalin ke papan klip!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
