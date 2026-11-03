# Titik Aman Versi Stabil LENTERA (Fallback Checkpoint)

Dokumen ini mencatat titik commit stabil yang telah **teruji berhasil 100% pada kondisi siang hari** (menggunakan pencahayaan sinar matahari jendela penuh dan 4 LED internal boks tanpa memerlukan bantuan senter).

---

## 📌 Informasi Commit Stabil

- **Nama Tag Git:** `stable-demo`
- **Short Hash:** `61bf996`
- **Full Hash:** `61bf9960f411bde380b9fd05ca1455c50275c5a5`
- **Tanggal:** Selasa, 3 November 2026
- **Subjek Commit:**  
  `Revert "fix(camera,hardware): restore default Picamera2 tuning and enforce 4 board LEDs on GPIO 18"`
- **Branch Referensi:** `main` & `ui/lab-redesign`

---

## ⚙️ Karakteristik Konfigurasi Stabil Ini

1. **Kamera (Raspberry Pi):**
   - Menggunakan tuning resmi `ov5647_noir.json` (`Picamera2(tuning=Picamera2.load_tuning_file("ov5647_noir.json"))`) yang mengompensasi radiasi inframerah sinar matahari alami agar kontras stiker tidak memudar (*washout*).
   - Buffer count diatur ke `2` untuk menghilangkan lag/antrean frame lama.
2. **Vision Core (Deteksi ArUco):**
   - Batas statis kaku `mean_edge > 95` telah **dihapus**.
   - Menggunakan verifikasi rasio relatif dinamis: `if p90 > 50 and mean_edge > p90 * 0.72: return False` (stiker diterima selama tepi hitam lebih gelap dari kotak putihnya, kebal terhadap variasi kecerahan ruangan).
   - Multi-channel detection: Grayscale, CLAHE, Green, Blue, Red.
3. **Audio & Navigasi Suara:**
   - Navigasi token identitas (A1 ke Dashboard Learn, E5 ke Logout) menunggu tuntasnya suara `onEnd` (+ jeda artikulasi 250 ms), tidak pernah terpotong di tengah kalimat.

---

## 🚀 Cara Cepat Kembali ke Titik Ini (Instruksi Fallback)

Jika sewaktu-waktu ada perubahan kode baru yang menyebabkan kendala dan Anda ingin mengembalikan sistem ke kondisi stabil ini:

### 1. Di Laptop (Windows PowerShell / CMD)
```bash
git fetch origin
git reset --hard 61bf996
```
*(Atau `git checkout stable-demo`)*

### 2. Di Raspberry Pi (Linux Terminal)
```bash
cd /home/pilentera/Lentera-Malaysia
git fetch origin
git reset --hard 61bf996
sudo systemctl restart lentera
```

---
*Catatan: Dokumen ini disimpan di repositori utama agar tidak hilang saat berpindah perangkat.*
