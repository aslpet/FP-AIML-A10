import type { CategoryId, Motion } from "../types";

// Naskah mock (Tahap A) — 1-2 mosi per kategori. Konteks netral 1-2 kalimat.
export const MOTIONS: Motion[] = [
  {
    motion_id: "m_eko_1",
    category: "ekonomi",
    claim_form: "kebijakan",
    motion_text:
      "Kewajiban kendaraan listrik untuk ojek online seharusnya ditunda hingga infrastruktur pengisian daya merata.",
    context:
      "Pemerintah berencana mewajibkan ojek online beralih ke kendaraan listrik mulai 2027. Saat ini stasiun pengisian daya masih terkonsentrasi di kota besar.",
    source_title: "Pemerintah Targetkan Elektrifikasi Ojol pada 2027",
    source_outlet: "Kontan",
  },
  {
    motion_id: "m_tek_1",
    category: "teknologi",
    claim_form: "kebijakan",
    motion_text:
      "Kampus seharusnya mengizinkan penggunaan AI dalam tugas selama dideklarasikan secara terbuka.",
    context:
      "Sejumlah kampus mulai mengizinkan penggunaan AI dalam pengerjaan tugas dengan syarat disclosure. Sebagian dosen khawatir hal ini menumpulkan kemampuan menulis.",
    source_title: "Kampus Mulai Atur Penggunaan AI dalam Tugas Mahasiswa",
    source_outlet: "Tempo",
  },
  {
    motion_id: "m_pol_1",
    category: "politik_hukum",
    claim_form: "kebijakan",
    motion_text:
      "Masa kampanye pemilu seharusnya dipersingkat untuk menekan biaya politik dan polarisasi.",
    context:
      "Penyelenggara pemilu mengevaluasi durasi kampanye yang dinilai terlalu panjang. Pendukung pemangkasan menyoroti biaya, penentang khawatir sosialisasi tidak merata.",
    source_title: "Evaluasi Durasi Kampanye Jadi Sorotan Jelang Revisi UU",
    source_outlet: "Kompas",
  },
  {
    motion_id: "m_sos_1",
    category: "sosial_pendidikan",
    claim_form: "nilai",
    motion_text:
      "Mana yang lebih layak diprioritaskan sekolah: pembentukan karakter atau pencapaian nilai akademik?",
    context:
      "Kurikulum baru menekankan penguatan karakter di samping capaian akademik. Perdebatan muncul soal porsi waktu dan penilaian yang adil.",
    source_title: "Penguatan Karakter Masuk Lebih Dalam ke Kurikulum",
    source_outlet: "Media Indonesia",
  },
  {
    motion_id: "m_lin_1",
    category: "lingkungan",
    claim_form: "kebijakan",
    motion_text:
      "Kota besar seharusnya menerapkan pembatasan kendaraan pribadi berbasis tarif untuk menekan polusi.",
    context:
      "Kualitas udara di sejumlah kota kerap masuk kategori tidak sehat. Skema jalan berbayar elektronik kembali diwacanakan sebagai salah satu solusi.",
    source_title: "Wacana Jalan Berbayar Kembali Mengemuka di Tengah Polusi",
    source_outlet: "CNN Indonesia",
  },
];

export const MOTION_BY_CATEGORY: Record<CategoryId, Motion> = MOTIONS.reduce(
  (acc, m) => {
    if (!acc[m.category]) acc[m.category] = m;
    return acc;
  },
  {} as Record<CategoryId, Motion>,
);

export const getMotion = (id: string) =>
  MOTIONS.find((m) => m.motion_id === id);
