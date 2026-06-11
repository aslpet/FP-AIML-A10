# TRD-06 — Identitas, Streak, History & Share · debat.in

| | |
|---|---|
| **Komponen** | Identitas (auth), streak, history, share, verdict (presentasi) |
| **Versi** | 1.0 · Draft |
| **Acuan** | TRD-01 (`app_user`,`session`,`report`); TRD-03 §6 (lapor); SRS FR-42…FR-49 |

---

## 1. Identitas (Supabase Auth)

### 1.1 Anonim (default, friksi rendah)
- Saat app dibuka pertama: `supabase.auth.signInAnonymously()` → **uid persisten** otomatis (tanpa form).
- uid bertahan lintas refresh/tutup-browser (sesi Supabase di storage). Hilang hanya bila storage di-clear / ganti device.
- Backend `upsert app_user(uid, is_anonymous=true)` saat sesi pertama.

### 1.2 Akun Google (opsional, lintas-device)
- `supabase.auth.linkIdentity({provider:'google'})` → **link** ke uid anonim yang sama.
- **uid TIDAK berubah** → seluruh `session`/`assignment`/`streak` otomatis terbawa (nol migrasi).
- Backend set `app_user.is_anonymous=false`.

### 1.3 Consent
- Pada main pertama, tampilkan pemberitahuan ringan: argumen dipakai untuk meningkatkan sistem.
- Saat disetujui → set `app_user.consent_at=now()`.

---

## 2. Streak (sekali per hari)

Diupdate **server-side** (service role) saat sesi pertama hari itu `finished`:
```
let d = app_user.last_played_date;
if (d == today) → tidak berubah (sudah dihitung hari ini)
elif (d == today - 1) → streak_count += 1
else → streak_count = 1            // bolong / pertama kali
app_user.last_played_date = today
```
- Hanya **sesi pertama/hari** memengaruhi streak; sesi bonus tidak menambah.
- Batas hari = **WIB** (TRD-00 §7).

---

## 3. History View

- Sumber: `session WHERE uid=? AND finished ORDER BY play_date DESC`.
- **Ditampilkan per entri:** `play_date`, `category`, `motion_text`, `total_score`, 4 skor dimensi.
- **Tren:** grafik garis 4 dimensi lintas waktu (mis. Recharts) — alat refleksi diri.
- **Persona/stance DISIMPAN** (di `daily_motion`) tetapi **TIDAK ditampilkan** (keputusan scope). Analitik per-persona = di luar scope.

---

## 4. Dashboard Hasil (akhir sesi)

- Skor total 0–100 (visual lingkaran), 4 kartu dimensi (skor + rationale), feedback naratif.
- **Verdict** (opsional, TRD-05 §5) ditampilkan sebagai headline tanding sebelum rincian skor.
- Aksi: **Bagikan** (share card §5), **Lanjut kategori lain** (jika ada yang belum dimainkan), **Kembali**.

---

## 5. Share Card

Teks yang disalin ke clipboard (ala Wordle, tanpa spoiler performa berlebih):
```
debat.in — {tanggal}
📁 {Kategori}
"{motion_text}"
⚔️ {total_score}/100   {verdict?}
{url aplikasi}
```
- Mosi disertakan sebagai **teaser** (spoiler ringan, tidak merusak — tahu mosi tidak membuat argumen otomatis bagus).
- **Tanpa** persona/stance.
- Implementasi: `navigator.clipboard.writeText(...)`.

---

## 6. Pelaporan (UI + endpoint)

- Tombol **lapor** pada: (a) mosi (di arena), (b) tiap respons AI.
- Memanggil `POST /api/report` (TRD-07) dengan `target_type`, `motion_id`/`session_id`, `reason?`.
- Penanganan ambang & retire = TRD-03 §6 (server-side).
- UI: konfirmasi singkat "laporan terkirim"; idempoten per user per mosi (uq_report_unique).

---

## 7. Out of Scope (tegas)
Profil/avatar, badge di luar streak, follow/komentar, notifikasi/reminder push. Semua pasca-FP.

---

## 8. Catatan Keamanan
- Operasi streak & penilaian **tidak** dipercayakan ke client (service role di backend) — cegah pemalsuan.
- Client hanya memegang `ANON_KEY`; RLS (TRD-01 §4) membatasi baca/tulis ke milik sendiri.
