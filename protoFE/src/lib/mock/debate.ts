import type { DebateScript } from "../types";

// Skrip AI kalengan (simulasi). Persona tidak ditampilkan ke user — karakter
// hanya terasa dari tone (formal, tegas, menantang). Tanpa skor di ronde 1-2.
export const DEBATE_SCRIPTS: Record<string, DebateScript> = {
  m_eko_1: {
    opening:
      "Saya tegaskan posisi saya: penundaan justru memperpanjang kerugian. Setiap tahun penundaan berarti jutaan liter emisi tambahan dan ketergantungan BBM yang terus membebani subsidi. Infrastruktur tidak akan pernah 'merata' jika permintaan tidak dipaksa lebih dulu. Yakinkan saya bahwa menunggu lebih murah daripada bertindak.",
    rebuttals: [
      "Argumen soal kesiapan infrastruktur itu klise. Justru kewajiban inilah yang menarik investasi stasiun pengisian — pasar bergerak mengikuti regulasi, bukan sebaliknya. Anda belum menunjukkan angka: berapa lama 'merata' itu, dan siapa yang menanggung biaya menunggu?",
      "Anda memindahkan beban ke driver, tapi tanpa kewajiban, driver justru terjebak membeli kendaraan BBM yang nilainya akan anjlok. Mana yang lebih melindungi mereka: transisi terjadwal dengan insentif, atau penundaan tanpa kepastian kapan berakhir?",
    ],
    closing:
      "Pertukaran yang layak. Anda mempertahankan sisi kehati-hatian, saya menekan dari sisi biaya menunggu. Mari kita lihat seberapa kuat argumen Anda berdiri.",
  },
  m_tek_1: {
    opening:
      "Saya menentang. 'Deklarasi' hanya menggeser masalah, bukan menyelesaikannya. Jika kemampuan menulis adalah tujuan pendidikan, mengizinkan AI — sejujur apa pun — sama dengan mengizinkan mesin mengangkat beban di kelas angkat besi. Tunjukkan bagaimana disclosure benar-benar menjaga kompetensi, bukan sekadar formalitas.",
    rebuttals: [
      "Analogi 'kalkulator' Anda lemah. Kalkulator tidak menyusun argumen, AI menyusun keseluruhan nalar. Pertanyaan saya tetap: apa yang sebenarnya dinilai dosen jika produk akhir bisa digenerasi? Disclosure tidak menjawab itu.",
      "Anda bicara 'kesiapan dunia kerja', tapi dunia kerja menuntut orang yang bisa berpikir tanpa alat ketika alat gagal. Kebijakan Anda melatih ketergantungan, bukan penguasaan. Bantah itu.",
    ],
    closing:
      "Diskusi yang tajam. Anda membela keterbukaan dan adaptasi, saya menjaga garis kompetensi inti. Kita serahkan penilaiannya pada rubrik.",
  },
  m_pol_1: {
    opening:
      "Saya ambil sisi berlawanan: memangkas masa kampanye menghemat uang, tapi mengorbankan pemilih yang paling sulit dijangkau. Polarisasi tidak lahir dari durasi, melainkan dari isi pesan. Buktikan bahwa memendekkan waktu benar-benar menurunkan permusuhan, bukan sekadar memadatkannya.",
    rebuttals: [
      "Anda mengklaim biaya turun, tapi kandidat berkantong tebal justru diuntungkan saat waktu sempit — merekalah yang mampu membombardir iklan singkat. Bagaimana kebijakan Anda tidak memperlebar ketimpangan?",
      "Soal polarisasi: memendekkan kampanye bisa membuat pemilih memutuskan dengan informasi lebih dangkal. Kualitas demokrasi tidak diukur dari hemat anggaran. Yakinkan saya pemilih tetap terinformasi.",
    ],
    closing:
      "Pertarungan yang seimbang. Anda menekankan efisiensi dan suhu politik, saya menjaga keterjangkauan informasi. Mari kita ukur kekuatan argumennya.",
  },
  m_sos_1: {
    opening:
      "Saya berpegang pada satu nilai: tanpa fondasi akademik yang terukur, 'karakter' menjadi kabur dan mudah dipolitisasi. Sekolah dituntut akuntabel, dan nilai memberi ukuran itu. Tunjukkan bagaimana karakter bisa dinilai adil tanpa terjebak selera subjektif guru.",
    rebuttals: [
      "Anda bilang karakter membentuk manusia utuh — saya setuju itu indah, tapi indah bukan berarti bisa dijalankan. Siapa yang menilai 'jujur' atau 'empati' secara setara antar sekolah? Tanpa standar, yang Anda usulkan rapuh.",
      "Jika waktu dialihkan ke karakter, capaian literasi dan numerasi yang sudah tertinggal makin jauh. Apa harga yang Anda bersedia bayar, dan bagaimana mempertanggungjawabkannya ke orang tua?",
    ],
    closing:
      "Perdebatan nilai yang kaya. Anda menjunjung pembentukan manusia, saya menjaga akuntabilitas terukur. Keputusan ada pada kekuatan penalaranmu.",
  },
  m_lin_1: {
    opening:
      "Saya menentang skema berbayar: ini pajak regresif berkedok lingkungan. Yang berpenghasilan rendah paling terpukul, sementara yang kaya cukup membayar untuk tetap macet. Buktikan bahwa beban ini adil, bukan sekadar memindahkan kemacetan ke jalan tikus.",
    rebuttals: [
      "Anda janjikan 'dananya untuk transportasi publik', tapi itu janji, bukan mekanisme. Tanpa transit yang andal lebih dulu, Anda menghukum orang yang tidak punya pilihan. Tunjukkan urutan yang benar.",
      "Soal polusi: kendaraan pribadi hanya satu sumber. Mengapa membebani warga sebelum menindak industri dan pembangkit yang kontribusinya lebih besar? Yakinkan saya ini bukan solusi yang salah sasaran.",
    ],
    closing:
      "Tukar argumen yang berbobot. Anda menekan dari sisi udara bersih, saya menjaga keadilan beban. Mari kita lihat hasilnya.",
  },
};

export const getScript = (motionId: string): DebateScript =>
  DEBATE_SCRIPTS[motionId] ?? {
    motion_id: motionId,
    opening:
      "Saya mengambil posisi berlawanan. Sampaikan argumen terbaik Anda — saya akan menguji setiap premisnya.",
    rebuttals: [
      "Premis Anda belum cukup ditopang bukti. Pertajam, atau saya runtuhkan.",
      "Anda belum menjawab inti sanggahan saya. Fokus, jangan mengaburkan.",
    ],
    closing: "Pertukaran selesai. Mari kita lihat penilaiannya.",
  } as DebateScript;
