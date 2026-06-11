"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CATEGORIES, VERDICT_META } from "@/lib/categories";
import { MOTION_BY_CATEGORY } from "@/lib/mock/motions";
import { formatTanggalID, todayWIB } from "@/lib/util";
import { useProto } from "@/lib/store";
import { TopBar } from "@/components/ui/TopBar";
import { Button } from "@/components/ui/Button";
import { CategoryReveal } from "@/components/CategoryReveal";
import { MotionCard } from "@/components/MotionCard";
import { CategoryChip } from "@/components/CategoryChip";
import { ConsentModal } from "@/components/ConsentModal";
import { StatsModal } from "@/components/StatsModal";
import { ReportModal } from "@/components/ReportModal";
import { GoogleLinkButton } from "@/components/GoogleLinkButton";
import { Toast } from "@/components/ui/Toast";

export default function TodayPage() {
  const router = useRouter();
  const { state, ready, consent, assignCategory, nextCategory, linkGoogle, reset } =
    useProto();
  const [statsOpen, setStatsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Undi & kunci kategori pertama setelah consent (anti-reroll).
  useEffect(() => {
    if (ready && state?.consented && !state.assignedCategory) {
      assignCategory();
    }
  }, [ready, state?.consented, state?.assignedCategory, assignCategory]);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }

  if (!ready || !state) {
    return (
      <main className="grid min-h-screen place-items-center text-ink/40">
        Memuat arena…
      </main>
    );
  }

  const assigned = state.assignedCategory;
  const dailyMotion = assigned ? MOTION_BY_CATEGORY[assigned] : null;
  const today = todayWIB();
  const todaySession = state.sessions.find(
    (s) => s.play_date === today && s.category === assigned,
  );
  const alreadyPlayed = assigned
    ? state.playedTodayCategories.includes(assigned)
    : false;
  const nextCat = nextCategory(state);

  return (
    <>
      <TopBar streak={state.streak} onOpenStats={() => setStatsOpen(true)} />

      <main className="mx-auto max-w-xl px-4 pb-16 pt-8">
        <p className="text-center text-sm text-ink/40">
          {formatTanggalID(today)}
        </p>

        {/* Status kategori aktif hari ini */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {state.activeCategories.map((c) => {
            const played = state.playedTodayCategories.includes(c);
            const isAssigned = c === assigned;
            return (
              <span
                key={c}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                  played
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : isAssigned
                      ? "bg-white text-ink ring-ink/20"
                      : "bg-paper text-ink/40 ring-ink/10"
                }`}
              >
                {CATEGORIES[c].emoji}
                {played ? "✓" : isAssigned ? "•" : ""}
              </span>
            );
          })}
        </div>

        {!alreadyPlayed && dailyMotion && assigned && (
          <section className="mt-8 flex flex-col items-center gap-6">
            <CategoryReveal category={assigned} />
            <div className="w-full">
              <MotionCard motion={dailyMotion} onReport={() => setReportOpen(true)} />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="w-full"
            >
              <Button
                full
                onClick={() => router.push(`/arena?cat=${assigned}&bonus=0`)}
              >
                Mulai Debat ⚔️
              </Button>
              <p className="mt-2 text-center text-xs text-ink/40">
                3 ronde · skor di akhir · lawan tak bisa dipilih
              </p>
            </motion.div>
          </section>
        )}

        {alreadyPlayed && todaySession && assigned && (
          <section className="mt-8 flex flex-col items-center gap-5">
            <div className="text-center">
              <span className="text-4xl">
                {VERDICT_META[todaySession.verdict].emoji}
              </span>
              <h1 className="mt-2 text-2xl font-extrabold">
                Kamu sudah bertanding hari ini
              </h1>
              <p className="mt-1 text-sm text-ink/50">
                Kembali besok untuk mosi baru — atau lanjut ke kategori lain.
              </p>
            </div>

            <div className="w-full rounded-2xl border border-ink/10 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <CategoryChip category={assigned} size="sm" />
                <span
                  className="rounded-full px-3 py-1 text-sm font-bold"
                  style={{
                    background: VERDICT_META[todaySession.verdict].soft,
                    color: VERDICT_META[todaySession.verdict].color,
                  }}
                >
                  {todaySession.total_score}/100 ·{" "}
                  {VERDICT_META[todaySession.verdict].label}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-ink/80">
                “{todaySession.motion_text}”
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => router.push(`/result?sid=${todaySession.session_id}`)}
              >
                Lihat Hasil
              </Button>
              {nextCat ? (
                <Button onClick={() => router.push(`/arena?cat=${nextCat}&bonus=1`)}>
                  Lanjut: {CATEGORIES[nextCat].label}
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => router.push("/history")}>
                  Lihat Riwayat
                </Button>
              )}
            </div>
            {!nextCat && (
              <p className="text-center text-xs text-ink/40">
                🎉 Semua kategori hari ini sudah kamu selesaikan!
              </p>
            )}
          </section>
        )}

        <div className="mt-10">
          <GoogleLinkButton
            isAnonymous={state.isAnonymous}
            onLink={() => {
              linkGoogle();
              showToast("Akun Google tertaut — progres aman");
            }}
          />
        </div>
      </main>

      <ConsentModal open={!state.consented} onAgree={consent} />
      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        state={state}
        onReset={() => {
          reset();
          setStatsOpen(false);
          showToast("Prototype direset");
        }}
      />
      <ReportModal
        open={reportOpen}
        target="motion"
        onClose={() => setReportOpen(false)}
        onSubmit={() => {
          setReportOpen(false);
          showToast("Laporan terkirim — terima kasih");
        }}
      />
      <Toast message={toast} />
    </>
  );
}
