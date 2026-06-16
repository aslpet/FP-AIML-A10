"use client";

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

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden">
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

      {/* Content */}
      <div
        className="relative z-10 text-center"
        style={{
          maxWidth: "min(88vw, 900px)",
          padding: "clamp(40px, 6vh, 80px) 0",
        }}
      >
        {/* Body paragraphs */}
        <div className="space-y-0">
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
          className="font-game text-white/60 mt-10"
          style={{ fontSize: "clamp(14px, 1.6vw, 20px)" }}
        >
          — Final Project AI —
        </p>
      </div>
    </main>
  );
}
