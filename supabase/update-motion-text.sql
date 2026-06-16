-- Update motion_text to be max 3 lines (~75 chars each)
-- Run this in Supabase SQL Editor

UPDATE daily_motion
SET motion_text = 'Pemerintah perlu lembaga independen pengawas AI di layanan publik'
WHERE source_id = 'seed-manual-m1-1';

UPDATE daily_motion
SET motion_text = 'Mewajibkan ojol pakai motor listrik turunkan pendapatan driver dalam 5 tahun'
WHERE source_id = 'seed-manual-m1-2';

UPDATE daily_motion
SET motion_text = 'Apakah kenyamanan algoritma lebih berharga daripada privasi data pengguna?'
WHERE source_id = 'seed-manual-m1-3';

UPDATE daily_motion
SET motion_text = 'Kampus seharusnya izinkan AI dalam tugas akademik jika mahasiswa mendeklarasikannya'
WHERE source_id = 'seed-manual-m1-4';

UPDATE daily_motion
SET motion_text = 'Indonesia perlu pajak karbon progresif untuk industri berat mulai 2027'
WHERE source_id = 'seed-manual-m1-5';
