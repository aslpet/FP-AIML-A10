"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface PersonaData {
  id: string;
  name: string;
  desc: ReactNode;
  image: string;
}

const PERSONAS: PersonaData[] = [
  {
    id: "penuntut",
    name: "Sang Penuntut",
    desc: "serang klaim terkuat user lebih dulu; tuntut pertahankan",
    image: "/assets/persona/mybini.jpg",
  },
  {
    id: "skeptis",
    name: "Sang Skeptis",
    desc: 'bongkar lewat pertanyaan ("apa buktimu?", "premis mana yang menjamin?")',
    image: "/assets/persona/kucing.jpg",
  },
  {
    id: "pragmatis",
    name: "Sang Pragmatis",
    desc: "gugat kelayakan dunia nyata (biaya, penegakan, implementasi)",
    image: "/assets/persona/carte.webp",
  },
  {
    id: "idealis",
    name: "Sang Idealis",
    desc: 'gugat dari nilai/etika ("sekalipun efektif, apakah adil?")',
    image: "/assets/persona/mr.webp",
  },
  {
    id: "analis_data",
    name: "Sang Analis Data",
    desc: (
      <>
        gugat <strong>struktur penalaran</strong> &amp; generalisasi;{" "}
        <strong>TIDAK</strong> memvalidasi kebenaran fakta
      </>
    ),
    image: "/assets/persona/sigma.jpg",
  },
];

export default function PersonaPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  function prev() {
    setDir(-1);
    setIdx((i) => (i - 1 + PERSONAS.length) % PERSONAS.length);
  }

  function next() {
    setDir(1);
    setIdx((i) => (i + 1) % PERSONAS.length);
  }

  const persona = PERSONAS[idx];

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/assets/background/bg-persona.svg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Top-right nav */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/")}
          className="cursor-pointer"
        >
          <Image
            src="/assets/button/button-backhome.svg"
            alt="Back to Home"
            width={110}
            height={38}
            style={{ width: "clamp(72px, 18vw, 100px)", height: "auto" }}
          />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/")}
          className="cursor-pointer"
        >
          <Image
            src="/assets/button/button-x.svg"
            alt="X"
            width={28}
            height={28}
            style={{ width: "clamp(20px, 5vw, 28px)", height: "auto" }}
          />
        </motion.button>
      </div>

      {/* Main layout: left arrow — card — right arrow */}
      <div className="relative z-10 w-full flex items-center justify-center px-3 sm:px-6 gap-2 sm:gap-4">

        {/* Left arrow */}
        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          onClick={prev}
          className="flex-shrink-0 cursor-pointer"
        >
          <Image
            src="/assets/button/arrow-left.svg"
            alt="Sebelumnya"
            width={49}
            height={46}
            style={{ width: "clamp(26px, 3.5vw, 49px)", height: "auto" }}
          />
        </motion.button>

        {/* Persona card */}
        <div
          className="relative flex-1"
          style={{ maxWidth: "min(86vw, 960px)" }}
        >
          {/* Card shape — box-persona.svg is a skewed parallelogram (1244×569) */}
          <Image
            src="/assets/box-persona.svg"
            alt=""
            width={1244}
            height={569}
            className="w-full h-auto"
            priority
          />

          {/* Content overlay, padded inside the safe region of the skewed shape */}
          <div
            className="absolute inset-0 flex items-center"
            style={{
              paddingLeft: "7%",
              paddingRight: "11%",
              paddingTop: "13%",
              paddingBottom: "22%",
            }}
          >
            {/* Portrait polaroid */}
            <div
              className="flex-shrink-0 bg-white shadow-2xl overflow-hidden"
              style={{
                // PERUBAHAN 1: Memperbesar batas ukuran dari 17% menjadi 26%, dan batas maksimal dari 180px menjadi 280px
                width: "clamp(200px, 26%, 280px)", 
                aspectRatio: "1 / 1.15",
                // PERUBAHAN 2: Menyesuaikan bingkai polaroid agar sedikit lebih tebal dan responsif
                padding: "clamp(6px, 1vw, 12px) clamp(6px, 1vw, 12px) 3% clamp(6px, 1vw, 12px)",
                transform: "rotate(-4deg)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={persona.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full bg-zinc-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={persona.image}
                    alt={persona.name}
                    className="w-full h-full object-cover object-top"
                    // PERUBAHAN 3 (Opsional): Dihapus sementara agar jika gambar error/tidak ada, kotak hitamnya tetap terlihat sebagai placeholder, bukan hilang menjadi putih polos
                    // onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} 
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Gap (Jarak antara foto dan teks) */}
            <div
              // PERUBAHAN 4: Jarak diperlebar sedikit agar teks tidak terlalu menempel dengan foto yang sudah membesar
              style={{ width: "clamp(16px, 5%, 48px)", flexShrink: 0 }} 
            />

            {/* Name + description */}
            <div
              className="flex-1 min-w-0 flex flex-col justify-center"
              style={{ gap: "clamp(4px, 1.2vw, 14px)" }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={persona.id}
                  initial={{ opacity: 0, x: dir * 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -28 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex flex-col"
                  style={{ gap: "clamp(4px, 1.2vw, 14px)" }}
                >
                  <h2
                    className="font-bold text-white leading-tight"
                    style={{ fontSize: "clamp(16px, 3.4vw, 38px)" }}
                  >
                    {persona.name}
                  </h2>
                  <p
                    className="text-white/90 leading-snug"
                    style={{ fontSize: "clamp(11px, 1.7vw, 20px)" }}
                  >
                    {persona.desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right arrow */}
        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          onClick={next}
          className="flex-shrink-0 cursor-pointer"
        >
          <Image
            src="/assets/button/arrow-right.svg"
            alt="Selanjutnya"
            width={49}
            height={46}
            style={{ width: "clamp(26px, 3.5vw, 49px)", height: "auto" }}
          />
        </motion.button>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center gap-2">
        {PERSONAS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => {
              setDir(i > idx ? 1 : -1);
              setIdx(i);
            }}
            className="cursor-pointer transition-all duration-200"
            style={{
              width: i === idx ? "clamp(18px,2.8vw,26px)" : "clamp(7px,1.1vw,9px)",
              height: "clamp(7px,1.1vw,9px)",
              borderRadius: 999,
              background:
                i === idx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>
    </main>
  );
}
