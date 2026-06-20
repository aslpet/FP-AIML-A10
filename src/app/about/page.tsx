"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const PARAGRAPHS = [
  "debat.in adalah aplikasi web yang melatih kemampuan berargumentasi melalui sesi debat harian melawan AI. Setiap hari, sistem secara otomatis mengambil berita terhangat dari beberapa kategori dan merumuskannya menjadi mosi debat per kategori melalui pipeline kurasi otomatis yang berlapis pengaman keamanan konten.",
  "Saat user membuka aplikasi, mereka diundi satu kategori secara acak (terkunci, tidak bisa di-reroll) dan menerima mosi hari itu beserta lawan AI berpersona. Sesi berlangsung dalam maksimal 3 ronde: AI membuka dengan menyatakan posisi, lalu di tiap ronde user menulis argumen dan AI menyerang/merespons. Di akhir sesi (ronde ke-3), AI menutup pertukaran sekaligus memberikan feedback dan penilaian atas keseluruhan debat.",
  "Setelah menyelesaikan satu sesi, user dapat lanjut ke kategori lain yang belum dimainkan hari itu (bonus opsional). Progres dilacak lewat streak harian dan riwayat skor lintas waktu, dan hasil dapat dibagikan lewat share card ala Wordle. Tidak ada leaderboard — skor bersifat personal sebagai alat refleksi diri.",
  "Seluruh interaksi berlangsung dalam Bahasa Indonesia. User dapat langsung bermain secara anonim tanpa mendaftar (identitas persisten otomatis); akun Google opsional untuk persistensi lintas-device.",
];

export default function AboutPage() {
  const router = useRouter();
  const [done, setDone] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  return (
    <main
      className={`relative min-h-screen ${done ? "overflow-y-auto" : "overflow-hidden"}`}
    >
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/assets/background/bg-about.svg"
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

      {/* Fade masks atas & bawah biar teks muncul/hilang halus */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{ height: "18vh", background: "linear-gradient(to bottom, rgba(20,10,2,0.85), transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
        style={{ height: "18vh", background: "linear-gradient(to top, rgba(20,10,2,0.85), transparent)" }}
      />

      {/* Credits-roll viewport */}
      <div
        className={`credits-viewport ${done ? "is-done" : ""} ${
          done ? "relative min-h-screen" : "absolute inset-0 overflow-hidden"
        } z-[5] flex justify-center`}
      >
        <div
          className="credits-roll text-center"
          onAnimationEnd={() => setDone(true)}
          style={{ maxWidth: "min(88vw, 900px)" }}
        >
          <div className="space-y-6">
            {PARAGRAPHS.map((p, i) => (
              <p
                key={i}
                className="font-game text-white"
                style={{ fontSize: "clamp(18px, 2.2vw, 28px)", lineHeight: 1.55 }}
              >
                {p}
              </p>
            ))}
          </div>

          {/* Attribution */}
          <p
            className="font-game text-white/60 mt-12"
            style={{ fontSize: "clamp(14px, 1.6vw, 20px)" }}
          >
            — Final Project AI —
          </p>
        </div>
      </div>

      <style jsx>{`
        .credits-roll {
          position: absolute;
          top: 0;
          padding: 14vh 0;
          /* gulir sekali dari bawah viewport sampai berhenti di posisi baca */
          animation: credits-scroll 22s linear forwards;
        }
        /* setelah selesai: konten jadi alur normal & bisa di-scroll manual */
        .credits-viewport.is-done .credits-roll {
          position: static;
          transform: none;
          animation: none;
        }
        @keyframes credits-scroll {
          from {
            transform: translateY(100vh);
          }
          to {
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .credits-roll {
            animation: none;
            position: static;
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}
