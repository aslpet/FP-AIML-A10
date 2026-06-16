"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchToday } from "@/lib/api";

export default function ArenaIndexPage() {
  const router = useRouter();

  useEffect(() => {
    fetchToday()
      .then((today) => {
        if (
          today?.session_id &&
          (today.state === "in_progress" || today.state === "finished")
        ) {
          router.replace(`/arena/${today.session_id}`);
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  return (
    <main className="min-h-[calc(100vh-3.5rem)] grid place-items-center">
      <div className="flex items-center gap-3 text-zinc-500 text-sm">
        <div className="w-4 h-4 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
        <span>Memuat arena...</span>
      </div>
    </main>
  );
}
