"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProto } from "@/lib/store";
import { TopBar } from "@/components/ui/TopBar";
import { Button } from "@/components/ui/Button";
import { TrendChart } from "@/components/history/TrendChart";
import { SessionListItem } from "@/components/history/SessionListItem";
import { StatsModal } from "@/components/StatsModal";
import { Toast } from "@/components/ui/Toast";

export default function HistoryPage() {
  const router = useRouter();
  const { state, ready, reset } = useProto();
  const [statsOpen, setStatsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!ready || !state) {
    return (
      <main className="grid min-h-screen place-items-center text-ink/40">
        Memuat riwayat…
      </main>
    );
  }

  const hasData = state.sessions.length > 0;

  return (
    <>
      <TopBar streak={state.streak} onOpenStats={() => setStatsOpen(true)} />
      <main className="mx-auto max-w-xl px-4 pb-16 pt-6">
        <h1 className="text-2xl font-extrabold">Riwayat & Tren</h1>
        <p className="mt-1 text-sm text-ink/50">
          Alat refleksi diri — lihat dimensi mana yang perlu kamu asah.
        </p>

        {!hasData ? (
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <span className="text-5xl">📜</span>
            <p className="text-ink/50">
              Belum ada riwayat — mulai debat pertamamu hari ini.
            </p>
            <Button onClick={() => router.push("/")}>Ke Arena</Button>
          </div>
        ) : (
          <>
            {state.sessions.length >= 2 && (
              <div className="mt-6">
                <TrendChart sessions={state.sessions} />
              </div>
            )}

            <div className="mt-6 space-y-3">
              {state.sessions.map((s) => (
                <SessionListItem key={s.session_id} session={s} />
              ))}
            </div>
          </>
        )}
      </main>

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        state={state}
        onReset={() => {
          reset();
          setStatsOpen(false);
          setToast("Prototype direset");
          setTimeout(() => setToast(null), 1800);
        }}
      />
      <Toast message={toast} />
    </>
  );
}
