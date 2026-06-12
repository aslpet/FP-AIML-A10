-- =============================================================================
-- debat.in — M1 Seed Script: Mosi Manual untuk Testing Mesin Sesi
-- Insert 5 mosi live (1 per kategori) lengkap dengan persona.
-- Dipakai oleh M1 (A4 testing mesin sesi) sebelum M2 pipeline berjalan.
-- =============================================================================

-- 1. Politik & Hukum — kebijakan — kontrarian × penuntut
INSERT INTO daily_motion (
  motion_text, context, claim_form, category,
  source_title, source_url, source_outlet, source_date, source_id,
  persona_stance, persona_style, ai_position,
  status, live_date, quality_score
) VALUES (
  'Pemerintah seharusnya membentuk lembaga independen khusus untuk mengawasi penggunaan AI dalam layanan publik',
  'Sejumlah instansi pemerintah mulai mengadopsi kecerdasan buatan untuk layanan administratif seperti verifikasi dokumen dan chatbot pengaduan warga, namun belum ada badan pengawas khusus.',
  'kebijakan',
  'politik_hukum',
  'Pemerintah Banyak Gunakan AI Tanpa Pengawasan', 'https://example.com/seed/ai-pemerintah', 'Seed Manual M1', CURRENT_DATE,
  'seed-manual-m1-1',
  'kontrarian', 'penuntut', NULL,
  'live', CURRENT_DATE, 88.0
);

-- 2. Ekonomi — fakta — berpendirian × skeptis
INSERT INTO daily_motion (
  motion_text, context, claim_form, category,
  source_title, source_url, source_outlet, source_date, source_id,
  persona_stance, persona_style, ai_position,
  status, live_date, quality_score
) VALUES (
  'Kewajiban kendaraan listrik untuk ojek online akan menurunkan pendapatan driver dalam lima tahun pertama',
  'Pemerintah berencana mewajibkan ojek online beralih ke kendaraan listrik mulai 2027 sebagai bagian dari target pengurangan emisi transportasi.',
  'fakta',
  'ekonomi',
  'Target Elektrifikasi Ojol 2027 Tuai Pro-Kontra', 'https://example.com/seed/ojol-listrik', 'Seed Manual M1', CURRENT_DATE,
  'seed-manual-m1-2',
  'berpendirian', 'skeptis',
  'Kewajiban kendaraan listrik untuk ojek online TIDAK akan menurunkan pendapatan driver secara signifikan karena subsidi pemerintah dan efisiensi biaya operasional jangka panjang',
  'live', CURRENT_DATE, 82.0
);

-- 3. Teknologi — nilai — kontrarian × pragmatis
INSERT INTO daily_motion (
  motion_text, context, claim_form, category,
  source_title, source_url, source_outlet, source_date, source_id,
  persona_stance, persona_style, ai_position,
  status, live_date, quality_score
) VALUES (
  'Apakah kenyamanan personalisasi algoritma lebih berharga daripada privasi data pengguna?',
  'Platform digital semakin mengandalkan personalisasi berbasis data pengguna untuk meningkatkan pengalaman, sementara regulasi perlindungan data pribadi belum sepenuhnya diterapkan di Indonesia.',
  'nilai',
  'teknologi',
  'UU PDP Berlaku, Platform Digital Diminta Transparan', 'https://example.com/seed/privasi-data', 'Seed Manual M1', CURRENT_DATE,
  'seed-manual-m1-3',
  'kontrarian', 'pragmatis', NULL,
  'live', CURRENT_DATE, 85.0
);

-- 4. Sosial & Pendidikan — kebijakan — berpendirian × idealis
INSERT INTO daily_motion (
  motion_text, context, claim_form, category,
  source_title, source_url, source_outlet, source_date, source_id,
  persona_stance, persona_style, ai_position,
  status, live_date, quality_score
) VALUES (
  'Kampus seharusnya mengizinkan penggunaan AI dalam tugas akademik selama mahasiswa mendeklarasikannya',
  'Beberapa universitas di Indonesia mulai menyusun pedoman penggunaan AI generatif dalam perkuliahan, di tengah kekhawatiran tentang plagiarisme dan penurunan kemampuan berpikir kritis.',
  'kebijakan',
  'sosial_pendidikan',
  'AI di Kampus: Antara Larangan dan Pedoman', 'https://example.com/seed/ai-kampus', 'Seed Manual M1', CURRENT_DATE,
  'seed-manual-m1-4',
  'berpendirian', 'idealis',
  'Kampus TIDAK seharusnya mengizinkan penggunaan AI dalam tugas akademik karena merusak integritas proses belajar dan melemahkan pengembangan kemampuan bernalar mandiri mahasiswa',
  'live', CURRENT_DATE, 80.0
);

-- 5. Lingkungan — kebijakan — kontrarian × analis_data
INSERT INTO daily_motion (
  motion_text, context, claim_form, category,
  source_title, source_url, source_outlet, source_date, source_id,
  persona_stance, persona_style, ai_position,
  status, live_date, quality_score
) VALUES (
  'Indonesia seharusnya menerapkan pajak karbon progresif untuk industri berat mulai 2027',
  'Pemerintah telah mengumumkan rencana penerapan pajak karbon sebagai bagian dari komitmen penurunan emisi, namun jadwal pelaksanaannya telah beberapa kali ditunda.',
  'kebijakan',
  'lingkungan',
  'Pajak Karbon Kembali Mundur, Ini Alasannya', 'https://example.com/seed/pajak-karbon', 'Seed Manual M1', CURRENT_DATE,
  'seed-manual-m1-5',
  'kontrarian', 'analis_data', NULL,
  'live', CURRENT_DATE, 87.0
);
