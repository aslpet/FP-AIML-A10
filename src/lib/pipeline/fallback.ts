import { admin } from "@/lib/supabase/admin";
import { todayWIB } from "@/lib/date";
import type { CategoryId, ClaimForm } from "./types";

interface FallbackMotion {
  motion_text: string;
  context: string;
  claim_form: ClaimForm;
  category: CategoryId;
}

/**
 * 10 mosi timeless fallback (≥2 per kategori).
 * Objek = kebijakan/nilai, bebas isu sensitif.
 * Acuan: TRD-02 §7, Implementation Plan temuan #6
 */
const FALLBACK_MOTIONS: FallbackMotion[] = [
  // Politik & Hukum
  {
    motion_text:
      "Indonesia seharusnya mewajibkan seluruh pejabat publik melaporkan harta kekayaan secara real-time",
    context:
      "Laporan Harta Kekayaan Penyelenggara Negara (LHKPN) saat ini dilaporkan setahun sekali dan tidak selalu diverifikasi secara ketat oleh KPK.",
    claim_form: "kebijakan",
    category: "politik_hukum",
  },
  {
    motion_text:
      "Apakah stabilitas politik lebih berharga daripada partisipasi publik yang luas dalam pengambilan keputusan?",
    context:
      "Beberapa negara demokrasi menghadapi tekanan untuk membatasi ruang partisipasi demi stabilitas, sementara yang lain membuka ruang seluas-luasnya.",
    claim_form: "nilai",
    category: "politik_hukum",
  },
  // Ekonomi
  {
    motion_text:
      "Indonesia seharusnya menerapkan kebijakan cukai minuman berpemanis untuk menekan konsumsi gula nasional",
    context:
      "Konsumsi gula di Indonesia terus meningkat dan dikaitkan dengan kenaikan kasus diabetes, sementara beberapa negara sudah menerapkan sugar tax.",
    claim_form: "kebijakan",
    category: "ekonomi",
  },
  {
    motion_text:
      "Apakah kesejahteraan pekerja lebih penting daripada fleksibilitas pasar tenaga kerja?",
    context:
      "Debat tentang hubungan antara regulasi ketenagakerjaan dan daya saing ekonomi masih berlangsung di banyak negara berkembang.",
    claim_form: "nilai",
    category: "ekonomi",
  },
  // Teknologi
  {
    motion_text:
      "Pemerintah seharusnya mewajibkan verifikasi identitas digital untuk semua pengguna media sosial",
    context:
      "Maraknya akun anonim yang menyebarkan informasi palsu mendorong wacana kewajiban verifikasi identitas, namun menuai kekhawatiran tentang privasi.",
    claim_form: "kebijakan",
    category: "teknologi",
  },
  {
    motion_text:
      "Apakah keamanan siber kolektif lebih berharga daripada enkripsi ujung-ke-ujung individual?",
    context:
      "Pemerintah di berbagai negara mendorong akses ke komunikasi terenkripsi untuk penegakan hukum, sementara aktivis privasi menentangnya.",
    claim_form: "nilai",
    category: "teknologi",
  },
  // Sosial & Pendidikan
  {
    motion_text:
      "Indonesia seharusnya menerapkan sistem zonasi ketat untuk seluruh jenjang sekolah negeri",
    context:
      "Sistem zonasi bertujuan memeratakan akses pendidikan, namun dikritik karena membatasi pilihan sekolah bagi siswa berprestasi.",
    claim_form: "kebijakan",
    category: "sosial_pendidikan",
  },
  {
    motion_text:
      "Apakah pendidikan karakter lebih penting daripada pendidikan akademik di tingkat dasar?",
    context:
      "Perdebatan tentang keseimbangan antara pembentukan karakter dan penguasaan akademik di kurikulum sekolah dasar terus berlanjut.",
    claim_form: "nilai",
    category: "sosial_pendidikan",
  },
  // Lingkungan
  {
    motion_text:
      "Indonesia seharusnya melarang pembangunan pembangkit listrik tenaga uap baru mulai 2028",
    context:
      "PLTU masih menjadi sumber energi listrik utama di Indonesia, namun berkontribusi signifikan terhadap emisi karbon nasional.",
    claim_form: "kebijakan",
    category: "lingkungan",
  },
  {
    motion_text:
      "Apakah konservasi hutan lebih berharga daripada pembangunan ekonomi daerah terpencil?",
    context:
      "Banyak daerah dengan tutupan hutan tinggi masih tertinggal secara ekonomi, menciptakan dilema antara pelestarian dan pembangunan.",
    claim_form: "nilai",
    category: "lingkungan",
  },
];

/**
 * Ambil satu mosi fallback untuk kategori, insert ke daily_motion,
 * lalu return motion_id (tanpa persona — persona di-set oleh promote()).
 * Acuan: TRD-02 §7
 */
export async function insertFallbackMotion(
  category: CategoryId,
): Promise<string | null> {
  const candidates = FALLBACK_MOTIONS.filter((m) => m.category === category);
  if (candidates.length === 0) return null;

  const pick = candidates[Math.floor(Math.random() * candidates.length)];

  const { data, error } = await admin()
    .from("daily_motion")
    .insert({
      motion_text: pick.motion_text,
      context: pick.context,
      claim_form: pick.claim_form,
      category: pick.category,
      source_id: `fallback_${category}_${Date.now()}`,
      source_outlet: "static_fallback",
      source_date: todayWIB(),
      status: "candidate",
      quality_score: 70,
      persona_stance: "kontrarian",
      persona_style: "skeptis",
    })
    .select("motion_id")
    .single();

  if (error) {
    console.error("[fallback] Insert failed:", error.message);
    return null;
  }

  return data.motion_id;
}
