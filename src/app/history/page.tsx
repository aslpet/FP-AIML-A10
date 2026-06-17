"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { fetchHistory } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const CATEGORY_LABELS: Record<string, string> = {
  politik_hukum: "Politik & Hukum",
  ekonomi: "Ekonomi",
  teknologi: "Teknologi",
  sosial_pendidikan: "Sosial & Pendidikan",
  lingkungan: "Lingkungan",
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) await supabase.auth.signInAnonymously();
        const res = await fetchHistory();
        setSessions(res?.sessions ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/assets/background/bg-history.svg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Top-right nav */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="font-game text-white cursor-pointer hover:text-white/80 transition-opacity"
          style={{ fontSize: "clamp(18px, 2.4vw, 26px)" }}
        >
          Back to Home
        </button>
        <button
          onClick={() => router.push("/")}
          className="font-game text-white cursor-pointer hover:text-white/80 transition-opacity"
          style={{ fontSize: "clamp(18px, 2.4vw, 26px)" }}
        >
          X
        </button>
      </div>

      {/* Panel */}
      <div
        className="relative z-10 w-full overflow-hidden"
        style={{
          maxWidth: "min(92vw, 820px)",
          background: "rgba(30, 18, 14, 0.88)",
          border: "1.5px solid rgba(255,255,255,0.18)",
        }}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1.5px solid rgba(255,255,255,0.15)" }}
        >
          <h1
            className="font-game text-white"
            style={{ fontSize: "clamp(24px, 4vw, 36px)" }}
          >
            History Game
          </h1>
          <span
            className="text-white/70 select-none"
            style={{ fontSize: "clamp(20px, 3vw, 28px)" }}
          >
            ≡
          </span>
        </div>

        {/* Column headers */}
        <div
          className="grid items-center px-5 py-2"
          style={{
            gridTemplateColumns: "48px 1fr 1fr 1.4fr 110px",
            background: "#6B1515",
          }}
        >
          <div />
          {["Performance", "Topic", "Date", "History"].map((col) => (
            <div
              key={col}
              className="font-game text-center text-white"
              style={{ fontSize: "clamp(14px, 2vw, 20px)" }}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 text-white/50 text-sm py-12">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span className="font-game" style={{ fontSize: 18 }}>Memuat riwayat...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-14">
            <p className="font-game text-white/50" style={{ fontSize: 20 }}>
              Belum ada riwayat debat.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 font-game text-white/70 hover:text-white cursor-pointer transition-colors"
              style={{ fontSize: 18 }}
            >
              Mulai Debat Pertama →
            </button>
          </div>
        ) : (
          sessions.map((s: any, i: number) => (
            <motion.div
              key={s.session_id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="grid items-center px-5"
              style={{
                gridTemplateColumns: "48px 1fr 1fr 1.4fr 110px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: "clamp(10px, 1.4vw, 16px)",
                paddingBottom: "clamp(10px, 1.4vw, 16px)",
              }}
            >
              {/* Row number */}
              <span
                className="font-game text-white/60"
                style={{ fontSize: "clamp(16px, 2vw, 22px)" }}
              >
                {i + 1}.
              </span>

              {/* Performance */}
              <div className="text-center">
                <span
                  className="font-game font-bold"
                  style={{
                    fontSize: "clamp(20px, 3vw, 30px)",
                    color: "#D62222",
                  }}
                >
                  {s.total_score ?? 0}%
                </span>
              </div>

              {/* Topic */}
              <div
                className="font-game text-center text-white"
                style={{ fontSize: "clamp(16px, 2vw, 22px)" }}
              >
                {CATEGORY_LABELS[s.category] ?? s.category}
              </div>

              {/* Date */}
              <div
                className="font-game text-center text-white"
                style={{ fontSize: "clamp(16px, 2vw, 22px)" }}
              >
                {formatDate(s.play_date)}
              </div>

              {/* Review */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(`/result/${s.session_id}`)}
                  className="font-game text-white cursor-pointer px-4 py-1.5"
                  style={{
                    fontSize: "clamp(15px, 1.9vw, 20px)",
                    background: "#7A1515",
                    minWidth: 80,
                  }}
                >
                  Review
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </main>
  );
}
