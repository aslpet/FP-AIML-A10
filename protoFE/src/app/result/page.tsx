"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CATEGORIES, DIMENSIONS, VERDICT_META } from "@/lib/categories";
import { useProto } from "@/lib/store";
import { TopBar } from "@/components/ui/TopBar";
import { Button } from "@/components/ui/Button";
import { CategoryChip } from "@/components/CategoryChip";
import { ScoreCircle } from "@/components/result/ScoreCircle";
import { DimensionCard } from "@/components/result/DimensionCard";
import { VerdictReveal } from "@/components/result/VerdictReveal";
import { FeedbackPanel } from "@/components/result/FeedbackPanel";
import { ShareCard } from "@/components/share/ShareCard";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";

function Result() {
  const router = useRouter();
  const params = useSearchParams();
  const sid = params.get("sid");
  const fresh = params.get("fresh") === "1";
  const { state, ready, nextCategory } = useProto();
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!ready || !state) {
    return (
      <main className="grid min-h-screen place-items-center text-ink/40">
        Memuat hasil…
      </main>
    );
  }

  const session = state.sessions.find((s) => s.session_id === sid);
  if (!session) {
    return (
      <>
        <TopBar streak={state.streak} />
        <main className="mx-auto max-w-xl px-4 py-16 text-center text-ink/50">
          Hasil tidak ditemukan.
          <div className="mt-4">
            <Button onClick={() => router.push("/")}>Kembali</Button>
          </div>
        </main>
      </>
    );
  }

  const v = VERDICT_META[session.verdict];
  const nextCat = nextCategory(state);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <>
      <TopBar streak={state.streak} />
      <main className="mx-auto max-w-xl px-4 pb-16 pt-6">
        <div className="mb-4 flex items-center justify-center">
          <CategoryChip category={session.category} size="sm" />
        </div>

        {/* Verdict (klimaks, sebelum angka) */}
        <VerdictReveal tier={session.verdict} />

        {/* Skor total */}
        <div className="mt-4 flex flex-col items-center">
          <ScoreCircle value={session.total_score} color={v.color} />
          {fresh && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-3 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-bold text-amber-700 ring-1 ring-amber-200"
            >
              🔥 Streak-mu jadi {state.streak} hari!
            </motion.div>
          )}
        </div>

        {/* 4 dimensi */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DIMENSIONS.map((d, i) => (
            <DimensionCard
              key={d.id}
              index={i}
              label={d.label}
              weight={d.weight}
              score={session.scores[d.id]}
              rationale={session.rationale[d.id]}
              color={CATEGORIES[session.category].color}
            />
          ))}
        </div>

        {/* Feedback */}
        <div className="mt-3">
          <FeedbackPanel text={session.feedback} />
        </div>

        {/* Aksi */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-6 space-y-3"
        >
          <Button full onClick={() => setShareOpen(true)}>
            📤 Bagikan Hasil
          </Button>
          <div className="grid grid-cols-2 gap-3">
            {nextCat ? (
              <Button
                variant="secondary"
                onClick={() => router.push(`/arena?cat=${nextCat}&bonus=1`)}
              >
                Lanjut: {CATEGORIES[nextCat].label}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => router.push("/history")}>
                Lihat Riwayat
              </Button>
            )}
            <Button variant="ghost" onClick={() => router.push("/")}>
              Kembali
            </Button>
          </div>
          {!nextCat && (
            <p className="text-center text-xs text-ink/40">
              🎉 Semua kategori hari ini selesai. Sampai jumpa besok!
            </p>
          )}
        </motion.div>
      </main>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Bagikan">
        <ShareCard
          session={session}
          onCopied={() => {
            setShareOpen(false);
            showToast("Tersalin! Tempel di mana saja 📋");
          }}
        />
      </Modal>
      <Toast message={toast} />
    </>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center text-ink/40">
          Memuat hasil…
        </main>
      }
    >
      <Result />
    </Suspense>
  );
}
