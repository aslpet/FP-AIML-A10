"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Send, RotateCcw, BarChart3, Bot, User as UserIcon } from "lucide-react";
import { respondToSession, fetchToday } from "@/lib/api";
import type { CategoryId, Turn } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";

type Phase = "thinking" | "await" | "done";

export default function ArenaPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId;
  const mode = searchParams.get('mode') || 'advocate'; // 'advocate' | 'fixed'

  const [loading, setLoading] = useState(true);
  const [motionData, setMotionData] = useState<any>(null);
  
  const [turns, setTurns] = useState<Turn[]>([]);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>("thinking");
  
  const [userInput, setUserInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [showScore, setShowScore] = useState(false);
  const [currentRoundScores, setCurrentRoundScores] = useState({ relevansi: 0, koherensi: 0, kekuatan_bukti: 0 });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const today = await fetchToday();
        if (!today || today.session_id !== sessionId) {
          router.push("/");
          return;
        }
        setMotionData(today.motion);
        
        const mappedTurns: Turn[] = (today.transcript || []).map((t: any) => ({
          role: t.role,
          content: t.content,
          round: t.round || 0
        }));
        
        setTurns(mappedTurns);
        setRound(today.current_round === 0 ? 1 : today.current_round);
        
        if (today.state === "finished") {
          setPhase("done");
        } else {
          const last = mappedTurns[mappedTurns.length - 1];
          if (!last || last.role === "user") {
             setPhase("thinking");
             // If we just loaded and it's thinking, it means the server is generating a response (should not happen often unless interrupted)
             // For simplicity, we just set await so the user can type if they want, but really it should poll. 
             // We'll set phase to 'await' here to unblock.
             setPhase("await");
          } else {
             setPhase("await");
          }
        }
      } catch (err) {
        showToast("Gagal memuat sesi");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, phase, showScore]);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userInput.trim()) return;

    setTurns((t) => [...t, { role: "user", content: userInput, round }]);
    setPhase("thinking");
    setShowScore(false);
    
    const submittedText = userInput;
    setUserInput('');

    try {
      const data = await respondToSession(sessionId, submittedText);
      
      if (data.result && data.result.scores) {
         setCurrentRoundScores({
           relevansi: data.result.scores.relevansi || 0,
           koherensi: data.result.scores.koherensi || 0, // Fallback if API has different fields
           kekuatan_bukti: data.result.scores.kekuatan_bukti || 0,
         });
         setShowScore(true);
      }
      
      setTurns((t) => [
        ...t,
        { role: "ai", content: data.ai_message, round: data.current_round || round },
      ]);
      
      if (data.finished) {
        setPhase("done");
      } else {
        setRound(data.current_round);
        setTimeout(() => {
           setPhase("await");
           setShowScore(false);
        }, showScore ? 4000 : 0);
      }
    } catch (err) {
      showToast(String(err));
      setTurns((t) => t.slice(0, -1));
      setUserInput(submittedText);
      setPhase("await");
    }
  }

  const roundProgress = [1, 2, 3].map((r) => (
    <div
      key={r}
      className={`flex-1 h-1 rounded-full smooth-transition ${
        r <= round
          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
          : 'bg-zinc-900'
      }`}
    />
  ));

  if (loading || !motionData) {
    return (
      <main className="grid min-h-screen place-items-center bg-black text-zinc-400">
        Menyiapkan arena...
      </main>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 min-h-screen flex flex-col bg-black text-zinc-100"
    >
      {/* Progress Header */}
      <div className="sticky top-0 z-45 bg-black/95 backdrop-blur-md border-b border-zinc-900 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {round > 3 ? 3 : round}
              </div>
              <h3 className="text-md font-bold tracking-tight text-white">
                Ronde {round > 3 ? 3 : round} dari 3
              </h3>
            </div>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              {mode === 'advocate' ? "Devil's Advocate" : "Fixed Position"}
            </span>
          </div>

          <div className="flex gap-2">{roundProgress}</div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 scroll-slim">
        <div className="max-w-4xl mx-auto space-y-6">
          {turns.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-4 ${
                t.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-900 border border-zinc-800`}
              >
                {t.role === 'ai' ? (
                  <Bot className="w-5 h-5 text-emerald-400" />
                ) : (
                  <UserIcon className="w-5 h-5 text-zinc-400" />
                )}
              </div>

              <div className={`flex-1 max-w-2xl ${t.role === 'user' ? 'text-right' : ''}`}>
                <div className="flex items-center gap-2 mb-1.5 justify-start">
                  {t.role === 'ai' ? (
                    <>
                      <span className="font-semibold text-emerald-400 text-sm">AI Opponent</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/20 text-emerald-400 border border-emerald-900/30">
                        {mode === 'advocate' ? "Devil's Advocate" : "Fixed Position"}
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold text-zinc-300 text-sm">Anda</span>
                  )}
                </div>

                <div
                  className={`rounded-2xl p-4 leading-relaxed border ${
                    t.role === 'ai'
                      ? 'bg-zinc-950/40 border-zinc-900 text-zinc-300'
                      : 'bg-zinc-900/10 border-zinc-900/50 text-zinc-200'
                  }`}
                >
                  <p className="text-zinc-300 text-sm sm:text-base whitespace-pre-wrap">{t.content}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {showScore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-xl bg-zinc-950 border border-zinc-900"
            >
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-sm text-zinc-200">
                  Hasil Penilaian Ronde {round}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-900">
                  <p className="text-zinc-500 text-xs mb-1">Relevansi</p>
                  <p className="text-xl font-bold text-emerald-400">{currentRoundScores.relevansi}/10</p>
                </div>
                <div className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-900">
                  <p className="text-zinc-500 text-xs mb-1">Koherensi</p>
                  <p className="text-xl font-bold text-indigo-400">{currentRoundScores.koherensi}/10</p>
                </div>
                <div className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-900">
                  <p className="text-zinc-500 text-xs mb-1">Kekuatan Bukti</p>
                  <p className="text-xl font-bold text-zinc-400">{currentRoundScores.kekuatan_bukti}/10</p>
                </div>
              </div>
            </motion.div>
          )}

          {phase === "thinking" && turns.length > 0 && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-900 border border-zinc-800">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 max-w-2xl py-3 text-zinc-500 text-sm italic animate-pulse">
                AI sedang menganalisis argumen Anda dan bersiap menyanggah...
              </div>
            </div>
          )}

          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-black border-t border-zinc-900 px-4 sm:px-6 lg:px-8 py-6 mt-auto">
        <div className="max-w-4xl mx-auto">
          {phase === "await" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-zinc-300">
                  Berikan argumenmu untuk Ronde {round}:
                </label>
              </div>

              <div className="flex gap-3 flex-col sm:flex-row">
                <div className="flex-1 flex flex-col">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Ketik argumenmu di sini. Pastikan relevan dengan topik, logis, dan didukung oleh bukti..."
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 smooth-transition resize-none min-h-[100px] text-sm sm:text-base"
                    disabled={phase === "thinking" || phase === "done"}
                  />
                  <div className="flex justify-between items-center text-[10px] sm:text-xs text-zinc-500 px-1 mt-1.5">
                    <div className="min-h-[16px]">
                      {isFocused && (
                        <span className="text-emerald-500/80 transition-opacity">
                          💡 Tips: Gunakan alasan logis dan bukti pendukung yang relevan.
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-zinc-600">
                      {userInput.length} karakter
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-col justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!userInput.trim() || phase === "thinking" || phase === "done"}
                    className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-lg smooth-transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim</span>
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setUserInput('')}
                    className="px-4 py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-300 font-semibold rounded-lg smooth-transition cursor-pointer"
                    title="Clear input"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {phase === "done" && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push(`/result/${sessionId}`)}
              className="w-full py-4 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 smooth-transition cursor-pointer shadow-lg shadow-emerald-500/10 text-center"
            >
              Lihat Hasil Sesi
            </motion.button>
          )}
        </div>
      </div>
      <Toast message={toast} />
    </motion.section>
  );
}
