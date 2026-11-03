# Panduan Strategi Presentasi & Live Demo LENTERA (10 Mnt Demo + 15 Mnt Q&A)

Dokumen ini disusun sebagai panduan taktis tim LENTERA untuk menghadapi sesi penjurian: **10 Menit Presentasi & Live Demo** serta **15 Menit Tanya Jawab (Q&A)** bersama dewan juri.

---

## ⏱️ RUNDOWN 10 MENIT (PRESENTASI + LIVE DEMO)

```
┌─────────────────┬──────────────────────────────────────────┬───────────┐
│ Waktu (Menit)   │ Bagian / Topik                          │ Pelaksana │
├─────────────────┼──────────────────────────────────────────┼───────────┤
│ 00:00 - 01:30   │ Hook Masalah & Pengenalan LENTERA        │ Speaker   │
│ 01:30 - 03:00   │ 3 Pilar Inovasi Teknologi                │ Speaker   │
│ 03:00 - 08:00   │ LIVE DEMO 4 Babak Interaktif             │ Speaker + │
│                 │ (Login -> Sirkuit Sukses -> Korsleting)  │ Operator  │
│ 08:00 - 10:00   │ Validasi SLB, Efisiensi Biaya & Closing  │ Speaker   │
└─────────────────┴──────────────────────────────────────────┴───────────┘
```

---

## 🎯 BABAK 1: PRESENTASI PEMBUKA (00:00 - 03:00)

### 1. Menit 00:00 - 01:30 | Hook & Problem Statement
* **Script / Narasi:**
  > *"Selamat pagi/siang Dewan Juri yang terhormat. Bagaimana seorang siswa tunanetra belajar konsep listrik di sekolah?*  
  > *Selama ini, mereka hanya menghafal teori abstrak dari buku Braille tanpa pernah merasakan sensasi merangkai sirkuit listrik sendiri. Alat peraga konvensional berbahaya karena risiko sengatan listrik, sementara media visual tidak dapat mereka akses.*  
  > *Perkenalkan **LENTERA**: Interactive Multisensory Circuit Board for Visually Impaired Learners — media pembelajaran sirkuit listrik cerdas berbasis AI dan Computer Vision yang aman, inklusif, dan mandiri."*

### 2. Menit 01:30 - 03:00 | 3 Pilar Inovasi Utama
* **Pilar 1 - Tangible Tactile Blocks:** Balok modular 3D dengan tekstur rabaan Braille dan sistem pelacakan optik ArUco di bawah papan (bebas kabel kusut).
* **Pilar 2 - Dual-Sensory Real-Time Feedback:** Suara AI narator dwibahasa yang ramah dipadukan melodi nada buzzer instan untuk setiap aksi rangkaian.
* **Pilar 3 - Inclusive Analytics:** Web Dashboard otomatis yang mencatat capaian belajar, waktu pengerjaan, dan riwayat kesalahan siswa tanpa membebani guru.

---

## 🔬 BABAK 2: LIVE DEMO 4 SKENARIO (03:00 - 08:00)

> **Pembagian Peran:**  
> - **Speaker:** Menghadap juri, menjelaskan alur pedagogi dan teknologi.  
> - **Operator:** Duduk di depan alat LENTERA, memperagakan peran "siswa tunanetra" dengan meraba balok sebelum ditaruh.

### Skenario 1: Login Mandiri Siswa (Durasi: ~1 Menit)
1. Operator mengambil balok identitas siswa (misal: ID Ajib / Via).
2. Operator meraba balok, lalu meletakkannya di slot **A1**.
3. **Respon Alat:**  
   - Suara AI: *"Halo Ajib, selamat datang di Lab Listrik LENTERA! Mari kita selesaikan tantangan membuat sirkuit seri sederhana."*
4. **Poin untuk Juri:** Tunjukkan bahwa sistem mengenal siswa secara personal dan mendukung pembelajaran mandiri (*self-paced learning*).

### Skenario 2: Merangkai Sirkuit Sukses (Durasi: ~2 Menit)
1. Operator meletakkan balok **Baterai** di slot baterai.  
   - *Suara AI: "Baterai terdeteksi."*
2. Operator memasang **Kabel Penghubung** dan balok **Lampu**.  
   - *Suara AI: "Lampu terpasang."*
3. Operator memasang balok **Saklar** dalam kondisi terbuka (OFF).  
   - *Suara AI: "Saklar terhubung, rangkaian masih terbuka."*
4. **Momen Puncak:** Operator memutar balok saklar 90° (posisi ON).
5. **Respon Alat:**  
   - 🎵 **Melodi Kemenangan Buzzer** berbunyi nyaring.  
   - *Suara AI: "Luar biasa! Rangkaian tertutup berhasil, arus listrik mengalir dan lampu menyala!"*
6. **Poin untuk Juri:** Validasi *state machine* sirkuit dan deteksi rotasi balok secara *real-time*.

### Skenario 3: Penanganan Kesalahan Cerdas / Korsleting (Durasi: ~1.5 Menit)
1. Operator melepas lampu dan sengaja menghubungkan kutub baterai langsung dengan kabel (korsleting).
2. **Respon Alat:**  
   - ⚠️ **Buzzer Alarm Peringatan** berbunyi cepat (beep 3x).  
   - *Suara AI: "Peringatan! Terjadi korsleting / arus pendek. Arus listrik terlalu besar tanpa beban, segera perbaiki jalur kabelmu!"*
3. **Poin untuk Juri:** Tekankan konsep **Digital-Twin Simulation**. Siswa belajar bahaya kelistrikan secara nyata tanpa risiko tersetrum atau merusak komponen fisik.

### Skenario 4: Tampilan Web Portal Guru (Durasi: ~0.5 Menit)
1. Tunjukkan layar laptop/tablet ke juri:  
   - Live stream status papan 5x5.
   - Status pencapaian misi sirkuit Ajib tercentang hijau otomatis.
   - Grafik riwayat kesalahan tercatat rapi untuk evaluasi guru.

---

## 🏆 BABAK 3: DAMPAK & PENUTUP (08:00 - 10:00)

* **Validasi Empiris di Lapangan:** Ceritakan uji coba nyata di SLB bersama guru dan siswa tunanetra (antusiasme tinggi, waktu pemahaman materi listrik meningkat drastis).
* **Cost Efficiency & Kemandirian:**  
  * Alat peraga sains tunanetra impor komersial: **Rp 15.000.000 – Rp 30.000.000**.  
  * Biaya produksi LENTERA (BOM): **< Rp 1.500.000** (berbasis open hardware, Raspberry Pi, dan 3D printing lokal).
* **Kalimat Penutup (Punchline):**  
  > *"LENTERA bukan sekadar alat peraga, melainkan jembatan kesetaraan bagi anak-anak berkebutuhan khusus untuk meraih mimpi di bidang sains dan teknologi. Menyalakan harapan, mencerdaskan kehidupan. Terima kasih."*

---

## 💬 STRATEGI TANYA JAWAB JURI (15 MENIT)

### Kategori A: Pertanyaan Teknis & Rekayasa (Engineering)
* **T: "Mengapa memilih kamera ArUco di bawah papan dibanding sensor RFID/NFC di tiap lubang?"**  
  * **Jawab:** *"Efisiensi biaya dan ketahanan fisik. RFID/NFC butuh 25 modul reader di bawah papan yang membuat kabel sangat ruwet, rentan interferensi, dan biayanya mahal. Konektor pin pogo mudah patah jika sering ditusuk siswa. Dengan 1 kamera di bawah boks, kita bisa memantau 25 slot sekaligus secara non-kontak, dan stiker ArUco biayanya kurang dari Rp 500 per stiker."*
* **T: "Bagaimana jika kondisi ruangan sangat silau sinar matahari atau lampu panggung?"**  
  * **Jawab:** *"Boks LENTERA memiliki 4 LED internal terisolasi. Pipeline visi komputer kami memproses multi-channel (terutama kanal Merah dan CLAHE adaptif) dengan window adaptif hingga 45 piksel yang kebal terhadap radiasi inframerah dan silau jendela siang hari."*
* **T: "Bagaimana sistem mengenali orientasi/putaran saklar?"**  
  * **Jawab:** *"OpenCV menghitung vektor corner titik sudut marker ArUco (0°, 90°, 180°, 270°) dan menerapkan filter hysteresis debouncing sudut agar tidak terjadi pembacaan goyang saat tangan siswa memutar balok."*

### Kategori B: Pertanyaan Pedagogi & Aksesibilitas Disabilitas
* **T: "Bagaimana siswa tunanetra total membedakan balok sebelum ditaruh?"**  
  * **Jawab:** *"Setiap balok 3D dirancang dengan prinsip desain universal: memiliki huruf Braille timbul di permukaan atas, coakan arah kutub positif-negatif, dan bentuk geometri tepi yang berbeda sehingga siswa cukup meraba bentuknya."*
* **T: "Apakah siswa tidak pusing dengan banyaknya suara audio?"**  
  * **Jawab:** *"Kami menggunakan dual-layer feedback: melodi buzzer pendek untuk konfirmasi taktil instan (<100ms) dan suara AI untuk narasi penjelasan. AI tidak memotong kalimat di tengah jalan dan hanya berbicara saat ada perubahan status rangkaian."*

### Kategori C: Skalabilitas & Produksi
* **T: "Berapa estimasi biaya produksi massal?"**  
  * **Jawab:** *"Bill of Materials (BOM) sekitar Rp 1.200.000 - Rp 1.400.000. Seluruh cetakan 3D balok dan kode bersifat open source, sehingga sekolah luar biasa di berbagai daerah dapat memproduksi dan mereplikasi kit ini secara mandiri dengan printer 3D lokal."*

---

## 📋 CHECKLIST PERSIAPAN H-1 / HARI-H

1. **Jaringan:** **Wajib gunakan Hotspot HP pribadi (tethering)** untuk laptop dan Raspberry Pi. Jangan pakai WiFi publik aula venue yang padat/lambat.
2. **Catu Daya:** Pastikan powerbank terisi 100%, gunakan kabel USB-C pendek tebal (3A/5A), dan pastikan `vcgencmd get_throttled` menghasilkan `0x0`.
3. **Kamera:** Bersihkan lensa kamera bawah dengan kain mikrofiber lembut.
4. **Volume Speaker:** Atur volume speaker eksternal ke 80–90% agar suara AI tutor terdengar jelas di tengah kebisingan aula pameran.
5. **Fallback:** Jika terjadi kendala pada software, gunakan perintah cepat fallback:
   ```bash
   git reset --hard stable-daylight && sudo systemctl restart lentera
   ```
