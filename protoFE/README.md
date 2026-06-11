# debat.in — Prototype FE (mock, simulasi)

Prototype frontend untuk **debat.in** — gamified, bergaya **Wordle**. **Tanpa backend**:
semua data dummy (`src/lib/mock/`), alur debat 3 ronde **disimulasikan** dengan
respons AI kalengan + delay "AI sedang menyusun argumen".

Acuan desain: `../docs/debat-in-FE-Prototype-Plan.md`.

## Menjalankan

```bash
npm install
npm run dev
# buka http://localhost:3000
```

> Butuh Node 18.18+ / 20+.

## Alur demo (simulasi penuh)

1. **/** — Onboarding + Consent (sekali) → **Daily Reveal**: kategori diundi & terkunci
   (flip), kartu mosi, "Mulai Debat".
2. **/arena** — pembuka AI → kirim argumen → "AI menyusun…" → tanggapan → 3 ronde
   (tanpa skor di ronde 1–2) → penutup.
3. **/result** — **verdict reveal** → skor lingkaran (count-up) → 4 kartu dimensi
   (tile 1–5) → feedback → **Bagikan** (share block-art) / Lanjut kategori.
4. **/history** — daftar sesi + grafik tren 4 dimensi. Ikon 📈 di top bar → **Stats Modal**
   (streak, distribusi vonis, countdown "mosi baru").

Tombol **Reset prototype** ada di Stats Modal untuk mengulang demo dari awal
(consent, reveal, dst). State disimpan di `localStorage`.

## Peta komponen → layar (untuk UI/UX)

| Layar | File |
|---|---|
| Today / Reveal | `src/app/page.tsx` + `CategoryReveal`, `MotionCard` |
| Arena | `src/app/arena/page.tsx` + `arena/*` |
| Result | `src/app/result/page.tsx` + `result/*` |
| History | `src/app/history/page.tsx` + `history/*` |
| Share / Stats / Consent / Report | `components/share/ShareCard`, `StatsModal`, `ConsentModal`, `ReportModal` |

## Catatan

- **Bukan produk.** Tidak ada Supabase/Gemini/RSS. Skor dihitung dari heuristik
  ringan (panjang argumen) + baseline kalengan — cukup untuk merasakan ritme.
- Animasi menghormati `prefers-reduced-motion`.
- Komponen di `src/components/**` dirancang agar **dipakai ulang** saat produk
  asli dibangun (M1 di Implementation Plan).
- Batasan desain (yang **tidak** boleh ada): pilih mode lawan, label persona,
  skor per-ronde, leaderboard. Lihat FE Prototype Plan §2.
```
