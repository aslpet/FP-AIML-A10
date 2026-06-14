"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchHistory } from "@/lib/api";
import { TopBar } from "@/components/ui/TopBar";
import { SessionListItem } from "@/components/history/SessionListItem";
import { createClient } from "@/lib/supabase/client";

export default function HistoryPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          await supabase.auth.signInAnonymously();
        }
        const res = await fetchHistory();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <TopBar streak={0} onOpenStats={() => {}} hideStreak />
      <main className="flex-1 mx-auto max-w-xl w-full px-4 pb-20 pt-8">
        <h1 className="text-2xl font-bold text-white">Riwayat Debat</h1>
        {loading ? (
           <p className="mt-8 text-zinc-500">Memuat riwayat...</p>
        ) : (
           <div className="mt-6 space-y-4">
             {data?.sessions?.map((s: any) => (
               <div key={s.session_id} onClick={() => router.push(`/result/${s.session_id}`)} className="cursor-pointer">
                 <SessionListItem session={s} />
               </div>
             ))}
             {(!data?.sessions || data.sessions.length === 0) && (
               <p className="text-zinc-500">Belum ada riwayat debat.</p>
             )}
           </div>
        )}
      </main>
    </div>
  );
}
