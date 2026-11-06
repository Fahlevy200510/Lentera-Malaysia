# Titik Aman Versi Stabil LENTERA (Fallback Checkpoint)

Dokumen ini mencatat titik-titik commit stabil LENTERA yang telah **terverifikasi 100% pada pengujian fisik**.

---

## 📌 Checkpoint 4: Pre-Playwright Audit (Titik Aman Sebelum Perbaikan UI Audit)

*Titik cadangan persis sebelum eksekusi perbaikan hasil audit Playwright (tombol rapor daftar siswa, backoff WebSocket, tooltip kalibrasi, dan autocomplete login).*

- **Nama Tag Git:** `stable-pre-audit`
- **Short Hash:** `4ec4f00`
- **Full Hash:** `4ec4f00fb8c9547282382cab17019c540b5258f8`
- **Next.js Build ID:** `xKQfZcB_TxnBrzwoqc262`
- **Tanggal Commit:** Selasa, 3 November 2026 (`22:18:22 +0700`)
- **Tanggal Pencatatan:** Jumat, 6 November 2026
- **Subjek Commit:** `docs: add comprehensive final report document DOKUMEN_LAPORAN_AKHIR_LENTERA.md for competition submission`
- **Branch:** `main`

### 🔄 Cara Rollback Cepat ke Checkpoint 4:
```powershell
git reset --hard 4ec4f00fb8c9547282382cab17019c540b5258f8
# atau menggunakan tag:
git reset --hard stable-pre-audit
```

---

## 📌 Checkpoint 3: Tangible Audio Speed Slider & UI Dropdown (Versi Terkini & Paling Lengkap)

*Gunakan checkpoint ini sebagai versi produksi paling mutakhir: mencakup seluruh optimasi penglihatan daylight, slider fisik kecepatan suara di Baris 2 (1.0x - 4.0x), perbaikan dropdown UI non-tunanetra, dan reaktivitas suara.*

- **Nama Tag Git:** `stable-speed-audio`
- **Short Hash:** `50279fd`
- **Tanggal:** Selasa, 3 November 2026
- **Subjek Commit:** `feat(audio): push maximum speech rate to ceiling 4.0x`
- **Branch:** `main` & `ui/lab-redesign`

### ⚙️ Peningkatan di Checkpoint Ini:
1. **Tangible Audio Speed Slider (Baris 2):** Siswa tunanetra dapat menyetel tempo bicara suara AI secara mandiri (A2: 1.0x, B2: 1.6x, C2: 2.3x, D2: 3.2x, E2: 4.0x mentok TalkBack Pro) hanya dengan menggeser balok identitas.
2. **SpeechSpeedSelector UI:** Komponen dropdown pemilih kecepatan grafis untuk guru/juri di navbar Beranda dan tombol kompak di atas pemindai LENTERA Lab.
3. **Reaktivitas Suara Seketika:** Perubahan kecepatan di dropdown langsung me-restart audio arahan yang sedang berbicara ke tempo baru secara instan.
4. **Semua Optimasi Daylight Vision (Checkpoint 2) Tetap Terbawa Utuh.**

---

## 📌 Checkpoint 2: Toleran Sinar Matahari Jendela & Lampu Ruangan

*Gunakan checkpoint ini untuk demo utama: terbukti membaca di dekat jendela terang siang hari dan di dalam ruangan berlampu LED.*

- **Nama Tag Git:** `stable-daylight`
- **Short Hash:** `f9b381c`
- **Full Hash:** `f9b381c62fdf21f7dbbe0c6d7a505b2ee3ff4a88`
- **Tanggal:** Selasa, 3 November 2026
- **Subjek Commit:**  
  `fix(vision): enhance ArUco parameters and validation for ambient daylight tolerance`
- **Branch:** `main` & `ui/lab-redesign`

### ⚙️ Peningkatan di Checkpoint Ini:
1. **Window Binarisasi Adaptif:** `adaptiveThreshWinSizeMax = 45`, `min = 3`, `step = 8` (mampu melingkupi gradasi silau jendela tanpa memutus border hitam stiker).
2. **Sensitivitas Kontras Rendah:** `adaptiveThreshConstant = 4.0`, `minOtsuStdDev = 2.0` (mendeteksi tinta hitam yang memudar di bawah cahaya terang).
3. **Prioritas Kanal Merah:** Menggunakan kanal Red + CLAHE Red karena kebal terhadap saturasi radiasi inframerah sinar matahari alami.
4. **Validasi Anti-Ghosting Realistis:** Ambang batas perbandingan bingkai hitam stiker terhadap sel putih dilonggarkan ke `0.82` (mencegah penolakan stiker asli saat siang hari).

---

## 📌 Checkpoint 1: Versi Demo Awal (Cadangan)

- **Nama Tag Git:** `stable-demo`
- **Short Hash:** `61bf996`
- **Full Hash:** `61bf9960f411bde380b9fd05ca1455c50275c5a5`
- **Tanggal:** Selasa, 3 November 2026
- **Subjek Commit:**  
  `Revert "fix(camera,hardware): restore default Picamera2 tuning and enforce 4 board LEDs on GPIO 18"`

---

## 🚀 Cara Cepat Kembali ke Titik Aman (Instruksi Fallback)

### Kembali ke Checkpoint 2 (Paling Baru & Stabil Daylight):
#### Di Raspberry Pi (Linux Terminal):
```bash
cd ~/Lentera-Malaysia
git fetch origin
git reset --hard stable-daylight
sudo systemctl restart lentera
```

#### Di Laptop (Windows PowerShell):
```powershell
git fetch origin
git reset --hard stable-daylight
```

---

### Kembali ke Checkpoint 1 (Cadangan Awal):
#### Di Raspberry Pi (Linux Terminal):
```bash
cd ~/Lentera-Malaysia
git fetch origin
git reset --hard stable-demo
sudo systemctl restart lentera
```

---
*Catatan: Dokumen ini disimpan di repositori utama agar tidak hilang saat berpindah perangkat.*
