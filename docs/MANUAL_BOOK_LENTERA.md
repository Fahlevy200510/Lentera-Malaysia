# BUKU PANDUAN LENGKAP & MANUAL PENGGUNAAN LENTERA
### Media Pembelajaran Sirkuit Listrik Taktil, Mandiri, dan Inklusif untuk Siswa Tunanetra
**Dokumen Resmi Spesifikasi, Pedagogi, Perakitan Hardware, dan Pengoperasian Sistem**

---

## DAFTAR ISI
1. [BAB 1: PENGENALAN LENTERA](#bab-1-pengenalan-lentera)
   - 1.1 Latar Belakang & Filosofi Edukasi Inklusi
   - 1.2 Konsep Kunci: Zero-Screen, Zero-Mouse, 100% Tangible
   - 1.3 Keunggulan Inovasi Kamera Bawah Meja (*Under-Board Vision*)
2. [BAB 2: ANATOMI PERANGKAT KERAS (HARDWARE)](#bab-2-anatomi-perangkat-keras-hardware)
   - 2.1 Papan Grid Fisik 5×5
   - 2.2 Desain Balok Taktil & Fitur Rabaan
   - 2.3 Daftar Komponen Fisik & Pemetaan Marker ArUco
   - 2.4 Sistem Kamera Bawah Meja & Pencahayaan
   - 2.5 Panel Kontrol, Tombol Stainless Steel LED, & Buzzer
3. [BAB 3: ARSITEKTUR SISTEM & PERANGKAT LUNAK (SOFTWARE)](#bab-3-arsitektur-sistem--perangkat-lunak-software)
   - 3.1 Diagram Alur Sistem Terpadu
   - 3.2 Vision Engine & Koreksi Optik
   - 3.3 Engine Evaluasi Graf Rangkaian Listrik
   - 3.4 Audio Engine, Fonetik Braille, & Earcon
   - 3.5 AI Live Tutor (Whisper STT & Socratic LLM)
4. [BAB 4: SISTEM KOORDINAT & NAVIGASI TAKTIL MANDIRI](#bab-4-sistem-koordinat--navigasi-taktil-mandiri)
   - 4.1 Orientasi Grid 5×5 Standar Fisik Siswa
   - 4.2 Prosedur Login Taktil Siswa (Zero-Password & Zero-Screen Login dengan Blok Identitas ID 35, 36, 37)
   - 4.3 Peta Pintasan Taktil (*Tangible Shortcuts*)
   - 4.4 Operasional Tanya AI Live Tutor (*Tangible Push-To-Talk* via Sel A1)
   - 4.5 Transisi Checkpoint Papan (Pembersihan Papan & Pilihan Taktil A1 / E1)
5. [BAB 5: MODUL KURIKULUM & PANDUAN BELAJAR SISWA](#bab-5-modul-kurikulum--panduan-belajar-siswa)
   - 5.1 Tahap 1: Pengenalan Bentuk Taktil (Sel C3)
   - 5.2 Tahap 2: Kuis Taktil Interaktif (B3, D3, C4, C2)
   - 5.3 Tahap 3: Panduan Rangkaian Seri Bertahap
   - 5.4 Tahap 4: Panduan Rangkaian Paralel Dua Cabang
   - 5.5 Tahap 5: Tantangan Detektif Sirkuit
   - 5.6 Mode Eksplorasi Bebas & Tanya AI Tutor
6. [BAB 6: PANDUAN OPERASIONAL UNTUK GURU & PENDAMPING](#bab-6-panduan-operasional-untuk-guru--pendamping)
   - 6.1 Prosedur Menyalakan Alat (Power ON, Startup Melody, & Unlock Audio)
   - 6.2 Prosedur Kalibrasi Otomatis Kamera (*Auto-Calibrate* 4 Sudut)
   - 6.3 Pengelolaan Profil Multi-Siswa & Pemantauan Visual Real-time
   - 6.4 Mengunduh & Mencetak Rapor Evaluasi Siswa
   - 6.5 Mematikan Perangkat dengan Aman (*Safe Shutdown* Fisik & Web)
   - 6.6 Tabel Tindakan Cepat Kendala Operasional (*Quick Action Troubleshooting*)
7. [BAB 7: PANDUAN PERAKITAN TEKNIS & WIRING (HARDWARE BUILDER)](#bab-7-panduan-perakitan-teknis--wiring-hardware-builder)
   - 7.1 Daftar Komponen Elektronika & Pinout Raspberry Pi 4B
   - 7.2 Skema Rangkaian Tombol Stainless 4-Pin Latching
   - 7.3 Skema Rangkaian Driver Buzzer NPN 2N2222
   - 7.4 Penataan Kamera CSI & Jarak Fokus
8. [BAB 8: DEPLOYMENT, KONEKTIVITAS & LAYANAN SYSTEMD](#bab-8-deployment-konektivitas--layanan-systemd)
   - 8.1 Mode Standalone Offline (Hotspot Lokal)
   - 8.2 Mode Akses Jarak Jauh (Cloudflare & Ngrok Tunnel)
   - 8.3 Konfigurasi Otomatis Systemd Service
9. [BAB 9: PANDUAN PEMECAHAN MASALAH (TROUBLESHOOTING & FAQ)](#bab-9-panduan-pemecahan-masalah-troubleshooting--faq)
   - 9.1 Masalah Penglihatan Komputer
   - 9.2 Masalah Audio Browser
   - 9.3 Masalah Validasi Sirkuit
   - 9.4 FAQ Sekolah Luar Biasa (SLB)

---

# BAB 1: PENGENALAN LENTERA

## 1.1 Latar Belakang & Filosofi Edukasi Inklusi
Bagi siswa dengan hambatan penglihatan (tunanetra total maupun *low vision*) di Sekolah Luar Biasa (SLB-A) dan sekolah inklusi, materi sains kelistrikan sering kali diajarkan secara abstrak melalui teori lisan. Aplikasi simulator sirkuit digital (seperti PhET atau Tinkercad) sangat bergantung pada grafis visual di layar dan kendali mouse, sehingga tidak dapat diakses secara mandiri oleh siswa tunanetra. Di sisi lain, kit sirkuit kabel konvensional rawan membuat siswa bingung karena kabel kusut, sengatan listrik, atau sulitnya mendeteksi apakah lampu menyala tanpa bantuan orang yang melihat.

**LENTERA (Learning Electronic Circuit via Tangible Exploration & Real-time Audio)** diciptakan sebagai solusi nyata: sebuah media pembelajaran fisik berbasis balok modular yang dilengkapi sistem sensor penglihatan cerdas di balik papan, umpan balik suara otomatis seketika (*real-time speech*), serta asisten AI Tutor berbasis suara.

## 1.2 Konsep Kunci: Zero-Screen, Zero-Mouse, 100% Tangible
LENTERA dirancang dengan prinsip desain aksesibilitas universal:
* **Zero-Screen**: Siswa tidak diwajibkan melihat monitor komputer sama sekali untuk belajar. Seluruh instruksi, petunjuk posisi, dan penjelasan materi disampaikan melalui suara narator berbahasa Indonesia yang ramah.
* **Zero-Mouse**: Siswa tidak perlu mengklik mouse, trackpad, atau keyboard. Papan sirkuit itu sendiri berfungsi sebagai antarmuka input (*tangible interface*). Meletakkan balok di sel tertentu bertindak sebagai tombol seleksi menu atau jawaban.
* **100% Tangible & Taktil**: Setiap balok komponen memiliki tanda timbul khusus (*embossed relief*) dan simbol Braille sehingga siswa dapat mengenali jenis komponen hanya dengan meraba menggunakan ujung jari.

## 1.3 Keunggulan Inovasi Kamera Bawah Meja (*Under-Board Vision*)
Pada sistem *tangible tabletop* konvensional, kamera diletakkan di atas meja menyorot ke bawah (*overhead camera*). Kelemahan fatal pendekatan ini bagi siswa tunanetra adalah:
1. **Oklusi Tangan**: Saat siswa tunanetra meraba papan mencari posisi sel, kedua tangan mereka akan menutupi komponen, sehingga kamera atas gagal membaca marker.
2. **Bayangan Tubuh Siswa**: Tubuh siswa yang membungkuk di atas papan menghalangi pencahayaan lampu ruangan.

**Solusi Inovasi LENTERA:**
Kamera diposisikan **di dalam bodi alat di bawah papan grid**, menatap ke atas melalui dasar slot yang terbuat dari akrilik bening transparan. Marker pengenal tertempel di bagian bawah setiap balok. Ketika siswa meraba balok dari atas, tangan siswa berada di bagian luar, sehingga kamera di bawah tetap dapat membaca posisi, jenis komponen, dan sudut rotasi tanpa pernah terhalang oleh tangan (*100% occlusion-free*).

---

# BAB 2: ANATOMI PERANGKAT KERAS (HARDWARE)

## 2.1 Papan Grid Fisik 5×5
Permukaan atas LENTERA berupa papan grid berukuran **5 baris × 5 kolom** (total 25 slot cekung berukuran 50 mm × 50 mm).
* Dasar setiap slot berupa lembaran akrilik transparan setebal 2 mm.
* Pada tepi luar papan terdapat penanda taktil huruf timbul ($A, B, C, D, E$) pada sumbu horizontal dan angka timbul ($1, 2, 3, 4, 5$) pada sumbu vertikal.
* Kedalaman slot dirancang 8 mm agar balok terpasang kokoh, tidak mudah bergeser saat disentuh, namun mudah diangkat oleh siswa.

```
       [KOLOM A]      [KOLOM B]      [KOLOM C]      [KOLOM D]      [KOLOM E]
     ┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
[5]  │   A5 (Tutor) │      B5      │  C5 (Free)   │      D5      │  E5 (Exit)   │  <-- Baris Atas (Jauh dari siswa)
     ├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
[4]  │      A4      │      B4      │      C4      │      D4      │      E4      │
     ├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
[3]  │      A3      │      B3      │  C3 (Center) │      D3      │      E3      │  <-- Baris Tengah
     ├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
[2]  │      A2      │      B2      │      C2      │      D2      │      E2      │
     ├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
[1]  │ A1 (Tahap 1) │ B1 (Tahap 2) │ C1 (Tahap 3) │ D1 (Tahap 4) │ E1 (Tahap 5) │  <-- Baris Bawah (Dekat dada siswa)
     └──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

## 2.2 Desain Balok Taktil & Fitur Rabaan
Setiap balok fisik dibuat menggunakan cetak 3D (*3D printing*) PLA ramah lingkungan dengan tekstur timbul spesifik:
* **Baterai**: Tanda tambah (`+`) timbul pada kutub positif dan garis minus mendatar (`-`) pada kutub negatif.
* **Lampu LED**: Kubah setengah bola bulat menonjol di bagian atas balok, menyerupai bohlam lampu, dengan tanda kutub `+` (anoda) dan `-` (katoda) di kedua sisinya.
* **Saklar**: Tuas geser mekanis timbul di atas balok yang dapat digeser atau diputar oleh jari siswa antara posisi mendatar (OFF) dan tegak (ON).
* **Kabel Lurus**: Alur garis lurus tunggal timbul melintang dari satu sisi tembus ke sisi seberang.
* **Kabel Sudut L**: Alur garis timbul siku-siku 90 derajat menyerupai huruf L untuk belokan sirkuit.
* **Kabel Cabang T**: Alur garis timbul bercabang tiga menyerupai huruf T untuk membentuk percabangan paralel.
* **Resistor**: Alur garis bergerigi atau bergelombang timbul penahan arus.

## 2.3 Daftar Komponen Fisik & Pemetaan Marker ArUco
LENTERA menggunakan kamus marker OpenCV **`cv2.aruco.DICT_4X4_50`**. Stiker marker ArUco berukuran 30 mm × 30 mm ditempelkan di bagian bawah masing-masing balok dengan pelindung laminasi anti-gores.

| ID Marker | Jenis Komponen Fisik | Tekstur Rabaan Taktil | Terminal Aktif Default (Rotasi 0°) |
| :---: | :--- | :--- | :--- |
| **1** | Baterai (*Battery*) | Simbol `+` dan `-` timbul | Positif di Atas, Negatif di Bawah |
| **2** | Kabel Lurus (*Straight*) | Garis lurus melintang | Kiri dan Kanan |
| **3** | Kabel Sudut L (*L-Cable*) | Garis siku 90° (huruf L) | Atas dan Kanan |
| **4** | Kabel Cabang T (*T-Cable*) | Garis cabang tiga (huruf T) | Kiri, Kanan, dan Bawah |
| **5** | Lampu LED (*Lamp*) | Kubah bola bulat + polaritas | Positif di Kiri, Negatif di Kanan |
| **6 & 7**| Saklar (*Switch*) | Tuas geser saklar ON/OFF | 4 Sisi (Status ditentukan posisi tuas) |
| **35** | Kartu Siswa: **Via** | Kartu taktil nama Via | Token Navigasi Khusus (Buka Rapor) |
| **36** | Kartu Siswa: **Amira** | Kartu taktil nama Amira | Token Navigasi Khusus (Buka Rapor) |
| **37** | Kartu Siswa: **Ajib** | Kartu taktil nama Ajib | Token Navigasi Khusus (Buka Rapor) |

## 2.4 Sistem Kamera Bawah Meja & Pencahayaan
* **Sensor Kamera**: Raspberry Pi Camera Module Wide-Angle (FOV $\ge 120^\circ$) atau lensa fisheye dengan sensor NoIR.
* **Pencahayaan Internal**: Strip LED putih netral 12V / 5V dipasang di dinding dalam enclosure mengarah ke atas secara tidak langsung (*diffused light*), mencegah silau langsung (*glare*) pada sensor kamera.
* **Penyaring Saluran Hijau (*Green Channel*)**: Engine OpenCV membaca channel hijau (G) dari citra kamera yang terbukti paling kebal terhadap radiasi inframerah dan bayangan gradasi.

## 2.5 Panel Kontrol, Tombol Stainless Steel LED, & Buzzer
* **Tombol Daya Stainless (16mm/22mm Detent Latching)**:
  * Dilengkapi cincin LED biru/hijau yang menyala saat sistem aktif.
  * Terhubung ke Pin Fisik 5 (GPIO 3) untuk menyalakan Raspberry Pi dari mode tidur (*halt*) serta memicu skrip *graceful shutdown* otomatis saat tombol ditekan kembali.
* **Piezo Buzzer (BCM 17)**:
  * Digerakkan oleh rangkaian transistor NPN 2N2222.
  * Menghasilkan nada status: Startup melody, step-success beep, short-circuit warning beep, dan victory chime.

---

# BAB 3: ARSITEKTUR SISTEM & PERANGKAT LUNAK (SOFTWARE)

## 3.1 Diagram Alur Sistem Terpadu

```
[ Papan Fisik & Balok ArUco ]
              │ (Dilihat dari bawah akrilik)
              ▼
    [ Kamera CSI / NoIR ]
              │ (Frame 640x480 @ 15fps)
              ▼
  [ Python Engine (main.py) ]
    ├─ VisionCore (ArUco Detection + Green Channel + CLAHE)
    ├─ GridMapper (Pemetaan ROI Koordinat 5x5: A1-E5)
    ├─ GridState & Debouncer (Filtrasi kedip 3-frame & Hysteresis)
    ├─ Circuit Evaluator (NetworkX Graf: Loop, Polaritas, Korsleting)
    └─ AudioNarrator & Buzzer Driver (Melodi Hardware BCM 17)
              │
              │ (WebSocket Port 8765 & MJPEG Port 8766)
              ▼
  [ Lentera-Portal (Next.js 15) ]
    ├─ VoiceGuide (Panduan Kurikulum Taktil & Checkpoint Transisi)
    ├─ AudioCoordinator (Web Speech API TTS + Web Audio Earcon)
    ├─ Socratic AI Tutor (Groq Whisper STT + LLM)
    └─ CircuitSenseDashboard (Visualisasi Sirkuit & Rapor Guru)
```

## 3.2 Vision Engine & Koreksi Optik
Karena kamera diletakkan di bawah meja menghadap ke atas, citra kamera secara alami **tercermin secara vertikal** dibandingkan pandangan siswa dari atas.
1. **Transformasi Rotasi Marker**:
   ```python
   # Sudut putar searah jarum jam (CW) dari atas meja = berlawanan jarum jam (CCW) pada kamera bawah.
   transformed_angle = (360 - raw_angle) % 360
   ```
2. **Koreksi Overlay Tampilan Guru**:
   Frame video pada preview web dibalik secara vertikal menggunakan `cv2.flip(frame, 0)` sehingga orientasi visual yang dilihat guru di layar tepat sama 1:1 dengan perspektif siswa yang duduk di depan meja.
3. **Debounce & Anti-Kedip (*Spatial Tracker*)**:
   Komponen fisik dipertahankan statusnya selama 0.5 detik toleransi *dropout* kamera untuk mencegah suara terputus-putus saat tangan siswa menyenggol balok sejenak.

## 3.3 Engine Evaluasi Graf Rangkaian Listrik ([circuit.py](file:///l:/LENTERA%20MALAYSIA/backend/logic/circuit.py))
Sirkuit dievaluasi sebagai graf berarah (*directed graph*) menggunakan prinsip hukum fisika kelistrikan:
* **Deteksi Rangkaian Terbuka (*Open Circuit*)**: Arus tidak dapat kembali ke kutub negatif baterai.
* **Deteksi Rangkaian Tertutup (*Closed Circuit*)**: Arus mengalir dari kutub `+` baterai melalui beban menuju kutub `-`.
* **Deteksi Korsleting (*Short Circuit*)**: Kutub positif baterai terhubung langsung ke kutub negatif tanpa melewati beban hambatan (lampu/resistor). Buzzer seketika membunyikan nada peringatan bahaya 3 kali.
* **Deteksi Polaritas Lampu LED**: Arus harus masuk melalui kutub positif (anoda) lampu. Jika terbalik, lampu tidak menyala dan narator memandu siswa untuk mengangkat dan memutar balok lampu 180°.
* **Klasifikasi Seri vs Paralel**: Menggunakan struktur graf NetworkX untuk mendeteksi apakah arus mengalir dalam satu lintasan tunggal (seri) atau terbagi di kabel cabang T menjadi lintasan mandiri (paralel).

## 3.4 Audio Engine, Fonetik Braille, & Earcon
* **Audio Coordinator ([audioCoordinator.ts](file:///l:/LENTERA%20MALAYSIA/Lentera-Portal/utils/audioCoordinator.ts))**: Mengelola antrean ucapan (*queue manager*) agar suara narator tidak saling menumpuk atau terpotong tiba-tiba.
* **Koreksi Fonetik Bahasa Indonesia ([phonetics.ts](file:///l:/LENTERA%20MALAYSIA/Lentera-Portal/utils/phonetics.ts))**: Mengonversi teks teknis menjadi pelafalan ramah rabaan:
  * `"Kabel L"` $\to$ diucapkan *"Kabel El"*
  * `"Kabel T"` $\to$ diucapkan *"Kabel Te"*
  * `"C3"` $\to$ diucapkan *"C Tiga"*
  * `"A1"` $\to$ diucapkan *"A Satu"*
* **Web Audio Synthesizer**: Menghasilkan suara *earcon* instan (ding saat balok masuk, klakson pendek saat salah kotak, dan *victory chime* saat misi selesai).

## 3.5 AI Live Tutor (Whisper STT & Socratic LLM)
Siswa dapat bertanya secara bebas menggunakan bahasa percakapan sehari-hari.
* **STT (Speech-to-Text)**: Audio dari mikrofon ditranskripsi super cepat menggunakan model **Groq Whisper-large-v3**.
* **LLM Sokratik**: Model bahasa cerdas LENTERA diinstruksikan untuk tidak sekadar memberi jawaban instan, melainkan membimbing siswa berpikir analitis layaknya tutor privat tunanetra yang hangat dan sabar.

---

# BAB 4: SISTEM KOORDINAT & NAVIGASI TAKTIL MANDIRI

## 4.1 Orientasi Grid 5×5 Standar Fisik Siswa
* **Sumbu X (Kolom A – E)**:
  * Kolom A = Sisi Paling Kiri
  * Kolom B = Sisi Kiri-Tengah
  * Kolom C = Garis Tengah Papan
  * Kolom D = Sisi Kanan-Tengah
  * Kolom E = Sisi Paling Kanan
* **Sumbu Y (Baris 1 – 5)**:
  * Baris 1 = Baris Paling Bawah (Paling dekat dengan dada/tubuh siswa)
  * Baris 2 = Baris Tengah Bawah
  * Baris 3 = Baris Tengah ($C3$ adalah titik pusat seluruh papan)
  * Baris 4 = Baris Tengah Atas
  * Baris 5 = Baris Paling Atas (Paling jauh dari tubuh siswa)

## 4.2 Prosedur Login Taktil Siswa (Zero-Password & Zero-Screen Login dengan Blok Identitas)
Siswa tunanetra **tidak perlu mengetik username atau password** di layar laptop. Setiap siswa dibekali satu **Blok Identitas Fisik** pribadi berstiker ArUco dengan label nama timbul Braille:
* **Blok ID 35**: Kartu Identitas **Via** (Siswa Kelas 11 SMA)
* **Blok ID 36**: Kartu Identitas **Amira** (Siswa Kelas 11 SMA)
* **Blok ID 37**: Kartu Identitas **Ajib** (Siswa Kelas 11 SMA)

```
[ Bawa Blok Identitas ] ──> [ Letakkan di Papan Grid ] ──> [ Suara Menyapa Personal ] ──> [ Sesi Aktif ]
```

### 1. Cara Login Mandiri di Awal Sesi (Dari Halaman Depan / Landing Page):
1. Saat tiba di meja lab, siswa memegang blok identitas pribadinya.
2. Siswa **cukup meletakkan blok identitas di mana saja di atas papan grid** (atau di kotak $A1$).
3. Kamera bawah meja mendeteksi ID siswa dalam waktu kurang dari 0.5 detik.
4. Narator suara langsung menyapa secara personal:
   > *"Halo Amira! Kartu identitasmu terdeteksi. Selamat datang kembali di LENTERA Lab. Seluruh modul dan progres belajarmu telah dimuat!"*
5. Halaman web secara otomatis login ke profil siswa tersebut dan langsung membuka ruang praktikum LENTERA Lab (`/aruco`).

### 2. Cara Melihat Nilai & Rapor Belajar Sendiri (LENTERA Learn):
1. Saat sedang berada di dalam lab, siswa meletakkan blok identitasnya di kotak **A1 (Sudut Kiri Bawah)**.
2. Sistem otomatis membuka portal **LENTERA Learn** dan membacakan capaian belajar siswa secara lisan:
   > *"Kartu identitas Amira terdeteksi di sel A1. Membuka LENTERA Learn... Statusmu saat ini: Kelas 11 SMA, Level Mahir dengan perolehan 450 XP. Pelajaran fokusmu hari ini adalah Rangkaian Seri!"*
3. Siswa dapat mendengarkan rincian capaian tanpa perlu bantuan orang lain.

### 3. Cara Logout / Mengakhiri Sesi Mandiri (Exit Token):
1. Setelah selesai belajar, siswa memindahkan blok identitasnya ke kotak **E5 (Sudut Kanan Atas)**.
2. Narator menyampaikan pesan pamit:
   > *"Kartu identitas Amira terdeteksi di sel keluar E5. Sesi belajar selesai. Sampai jumpa!"*
3. Seluruh progres dan nilai siswa tersimpan aman ke memori, sesi ditutup, dan sistem kembali ke halaman awal yang bersih untuk digunakan oleh siswa berikutnya.

---

## 4.3 Peta Pintasan Taktil (*Tangible Shortcuts*)
Siswa tunanetra dapat berpindah mode belajar secara mandiri hanya dengan meletakkan satu balok fisik di kotak pintasan tanpa bantuan mouse:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [A5] Tanya AI Tutor (Suara)       [C5] Eksplorasi Bebas       [E5] Keluar Sesi │
│                                                                        │
│                                [C3] Pusat                              │
│                                                                        │
│ [A1] Pengenalan     [B1] Kuis      [C1] Seri     [D1] Paralel    [E1] Detektif │
└────────────────────────────────────────────────────────────────────────┘
                          (DEKAT KE DADA SISWA)
```

1. **Baris Bawah ($A1–E1$) — 5 Modul Kurikulum Utama**:
   * **$A1$**: Membuka **Tahap 1: Pengenalan Bentuk Taktil**.
   * **$B1$**: Membuka **Tahap 2: Kuis Taktil Interaktif**.
   * **$C1$**: Membuka **Tahap 3: Panduan Rangkaian Seri**.
   * **$D1$**: Membuka **Tahap 4: Panduan Rangkaian Paralel**.
   * **$E1$**: Membuka **Tahap 5: Tantangan Detektif Sirkuit**.
2. **Baris Atas ($A5, C5, E5$) — Fitur Lanjutan & Kontrol**:
   * **$A5$ (Sudut Kiri Atas)**: Membuka **Tanya AI Tutor** (tanya-jawab suara).
   * **$C5$ (Tengah Atas)**: Membuka **Mode Eksplorasi Bebas** (rakit bebas dengan pendampingan AI).
   * **$E5$ (Sudut Kanan Atas)**: **Kembali ke Menu Utama / Keluar Sesi**.
3. **Pintasan Khusus Sel $A1$**:
   * **Di LENTERA Lab**: Meletakkan balok di $A1$ memanggil evaluasi AI Tutor seketika (*live hint*).
   * **Di Tanya AI Tutor**: Meletakkan balok di $A1$ berfungsi sebagai tombol *Push-to-Talk* (bicara saat balok di $A1$, angkat balok untuk mengirim pertanyaan).
   * **Kartu Identitas Siswa**: Meletakkan kartu identitas siswa di $A1$ langsung membuka portal rapor **LENTERA Learn**.

---

## 4.4 Operasional Tanya AI Live Tutor (*Tangible Push-To-Talk*)
Fitur ini memungkinkan siswa tunanetra berdialog langsung dengan AI Sokratik menggunakan balok fisik di tangannya tanpa keyboard atau mouse:
1. **Membuka Mode Tutor**: Letakkan balok di **A5 (Sudut Kiri Atas)**, lalu angkat kembali balok tersebut.
2. **Push-To-Talk via Sel A1**:
   * **Mulai Bicara**: Letakkan satu balok di kotak **A1 (Sudut Kiri Bawah)**. Lampu indikator mikrofon di web akan menyala merah menandakan suara sedang direkam.
   * **Ucapkan Pertanyaan**: Bicaralah secara wajar menghadap ke arah meja/laptop (contoh: *"Mengapa saklar harus dipasang sebelum lampu?"*).
   * **Kirim Pertanyaan**: Segera **angkat balok dari kotak A1**.
   * **Mendengarkan Jawaban**: Sistem mentranskripsi suara via Groq Whisper secara instan dan AI Tutor menjawab dengan suara narasi ramah menggunakan analogi kontekstual.
3. **Alternatif Tombol**: Pendamping dapat menekan tombol **'V'** pada keyboard laptop untuk mulai/selesai merekam.
4. **Kembali ke Menu**: Letakkan balok di **E5 (Sudut Kanan Atas)**.

---

## 4.5 Transisi Checkpoint Papan (Pembersihan Papan & Pilihan Taktil A1 / E1)
Setelah siswa berhasil menyelesaikan suatu modul (misalnya Rangkaian Seri):
1. **Instruksi Pembersihan Papan**:
   Narator bersuara: *"Hebat! Modul selesai. Silakan angkat semua balok dari papan hingga bersih."*
2. **Validasi Papan Kosong**:
   Sistem menunggu hingga seluruh 25 sel kosong dari balok.
3. **Penyajian Pilihan Taktil di Baris Bawah**:
   Narator menyajikan pilihan mandiri:
   > *"Papan sudah bersih. Apakah kamu ingin lanjut ke panduan modul berikutnya? Letakkan balok di A1 untuk LANJUT, atau di E1 untuk ISTIRAHAT ke menu utama."*
4. **Keputusan Siswa**:
   * Letakkan balok di **A1 (Sudut Kiri Bawah)** $\to$ Modul berikutnya langsung dimulai.
   * Letakkan balok di **E1 (Sudut Kanan Bawah)** $\to$ Kembali ke menu utama.
5. Siswa mengangkat kembali balok konfirmasi untuk mulai merakit materi baru.

---

# BAB 5: MODUL KURIKULUM & PANDUAN BELAJAR SISWA

## 5.1 Tahap 1: Pengenalan Bentuk Taktil (Sel C3)
* **Tujuan**: Membimbing siswa meraba dan mengenali 6 balok komponen fisik dasar.
* **Prosedur**:
  1. Narator memandu siswa mencari balok komponen tertentu di meja.
  2. Siswa meletakkan balok tersebut di **sel C3 tepat di tengah papan**.
  3. Sistem memverifikasi jenis komponen. Jika benar, narator menjelaskan fungsi komponen tersebut dalam rangkaian.
  4. Siswa diminta mengangkat balok, lalu beralih ke komponen berikutnya.
* **Panduan Toleransi Kesalahan**:
  Jika siswa salah meletakkan balok di kotak lain (misalnya di $C1$), narator memberikan panduan arah relatif:
  > *"Kamu meletakkan balok di kotak C1. Posisi pengenalan ada di sel C3 tepat di tengah papan. Silakan geser 2 kotak ke atas menuju sel C3."*

## 5.2 Tahap 2: Kuis Taktil Interaktif (B3, D3, C4, C2)
* **Tujuan**: Menguji pemahaman siswa mengenai fungsi komponen secara menyenangkan melalui tebak-tebakan rabaan.
* **Slot Jawaban Taktil di Sekitar Pusat ($C3$)**:
  * Pertanyaan 1: Letakkan balok jawaban di **$B3$** (sebelah kiri tengah papan, tepat di sebelah kiri C3).
  * Pertanyaan 2: Letakkan balok jawaban di **$D3$** (sebelah kanan tengah papan, tepat di sebelah kanan C3).
  * Pertanyaan 3: Letakkan balok jawaban di **$C4$** (bagian tengah atas papan, tepat satu kotak di atas C3).
  * Pertanyaan 4: Letakkan balok jawaban di **$C2$** (bagian tengah bawah papan, tepat satu kotak di bawah C3).
* **Bank Pertanyaan**: Diambil secara adaptif dari 7 komponen resmi LENTERA (Baterai, Lampu, Saklar, Kabel Lurus, Kabel L, Kabel T, Resistor).

## 5.3 Tahap 3: Panduan Rangkaian Seri Bertahap
* **Tujuan**: Memandu siswa merakit rangkaian tertutup loop tunggal 2 lampu dan 2 saklar yang saling bergantung.
* **Peta Peletakan Komponen Seri (13 Langkah)**:
  * **Langkah 1**: Baterai di **$B4$** (kutub `+` menghadap ke atas menuju baris 5).
  * **Langkah 2**: Kabel Sudut L di **$B5$** (membelokkan arus ke kanan).
  * **Langkah 3**: Saklar 1 di **$C5$** (mendatar di sebelah kanan B5).
  * **Langkah 4**: Lampu 1 di **$D5$** (kutub `+` menghadap ke kiri ke arah saklar).
  * **Langkah 5**: Kabel Sudut L di **$E5$** (sudut kanan atas papan, belok ke bawah).
  * **Langkah 6**: Saklar 2 di **$E4$** (tegak lurus di bawah E5).
  * **Langkah 7**: Lampu 2 di **$E3$** (tegak, kutub `+` menghadap ke atas).
  * **Langkah 8**: Kabel Sudut L di **$E2$** (sudut kanan bawah lintasan seri, belok ke kiri).
  * **Langkah 9**: Kabel Lurus di **$D2$** (mendatar ke kiri).
  * **Langkah 10**: Kabel Lurus di **$C2$** (mendatar ke kiri).
  * **Langkah 11**: Kabel Sudut L di **$B2$** (sudut kiri bawah lintasan seri, belok ke atas).
  * **Langkah 12**: Kabel Lurus di **$B3$** (menyambungkan B2 kembali ke Baterai di B4).
  * **Langkah 13**: Geser kedua saklar di **$C5$** dan **$E4$** ke posisi ON untuk menyalakan kedua lampu!

## 5.4 Tahap 4: Panduan Rangkaian Paralel Dua Cabang
* **Tujuan**: Memandu siswa memahami prinsip percabangan arus mandiri menggunakan kabel cabang T.
* **Peta Peletakan Komponen Paralel (13 Langkah)**:
  * **Langkah 1**: Baterai di **$C5$** (kutub `+` menghadap ke kiri).
  * **Langkah 2**: Kabel Lurus di **$D5$** (mendatar di kanan baterai).
  * **Langkah 3**: Kabel Sudut L di **$B5$** (sudut kiri atas, belok ke bawah).
  * **Langkah 4**: Kabel Sudut L di **$E5$** (sudut kanan atas, belok ke bawah).
  * **Langkah 5**: Kabel Cabang T di **$B4$** (membagi arus ke dua cabang di baris 4 dan 3).
  * **Langkah 6**: Saklar 1 di **$C4$** (mengendalikan cabang pertama).
  * **Langkah 7**: Lampu 1 di **$D4$** (kutub `+` menghadap ke saklar di kiri).
  * **Langkah 8**: Kabel Cabang T di **$E4$** (menyatukan kembali arus dari cabang pertama).
  * **Langkah 9**: Kabel Sudut L di **$B3$** (sudut cabang kedua, belok ke kanan).
  * **Langkah 10**: Saklar 2 di **$C3$** (mengendalikan cabang kedua).
  * **Langkah 11**: Lampu 2 di **$D3$** (lampu cabang kedua).
  * **Langkah 12**: Kabel Sudut L di **$E3$** (sudut cabang kedua, belok ke atas menuju T di E4).
  * **Langkah 13**: Uji kemandirian cabang! Nyalakan saklar di C4 untuk menyalakan lampu 1, atau saklar di C3 untuk menyalakan lampu 2 secara independen.

## 5.5 Tahap 5: Tantangan Detektif Sirkuit
* **Tujuan**: Mengasah kemampuan analisis pemecahan masalah (*troubleshooting*) siswa:
  * **Misi 1**: Merangkai sirkuit satu lampu dan satu saklar di posisi bebas mana saja hingga menyala.
  * **Misi 2**: Menguji pemutus arus: matikan sirkuit dengan menggeser tuas saklar ke OFF tanpa membongkar balok dari papan.
  * **Misi 3**: Merancang sirkuit paralel mandiri minimal 2 lampu dengan kabel cabang T.

## 5.6 Mode Eksplorasi Bebas & Tanya AI Tutor
* **Eksplorasi Bebas ($C5$)**: Siswa bebas merakit rangkaian apa pun. Sistem AI mengamati secara pasif. Jika sirkuit tidak menyala atau korsleting, AI memberikan petunjuk suara.
* **Tanya AI Tutor ($A5$)**: Siswa dapat menanyakan konsep fisika, misalnya: *"Kenapa lampu di rangkaian seri meredup kalau ditambah satu lampu lagi?"* atau *"Apa bedanya saklar dengan kabel lurus?"*. AI Tutor menjawab dengan analogi dunia nyata (seperti aliran air pipa atau jembatan penyeberangan).

---

# BAB 6: PANDUAN OPERASIONAL UNTUK GURU & PENDAMPING

## 6.1 Prosedur Menyalakan Alat (Power ON, Startup Melody, & Unlock Audio)
Lakukan 4 langkah berikut setiap kali akan memulai sesi pembelajaran di kelas:

```
[ Colok Adaptor 5V/3A ] ──> [ Tekan Tombol Stainless ] ──> [ Tunggu Melodi Siap ] ──> [ Buka Web & Klik Layar ]
```

1. **Pemasangan Daya**:
   * Pastikan permukaan meja LENTERA bersih dari balok sisa sesi sebelumnya.
   * Pasang adaptor daya USB-C resmi (5V / 3A) ke port daya pada panel samping, lalu tancapkan ke stopkontak listrik.
2. **Menyalakan Alat**:
   * Tekan **Tombol Stainless Steel** pada panel depan sekali hingga terdengar bunyi klik mekanis (*mengunci/latching*).
   * Cincin lampu LED pada tombol akan langsung menyala berwarna hijau/biru dan lampu strip internal di bawah akrilik menyala menerangi area deteksi.
3. **Konfirmasi Kesiapan Sistem**:
   * Tunggu proses booting selama ±20–30 detik.
   * Indikator kesiapan: Buzzer berbunyi melodi siap (nada pendek naik) dan speaker mengeluarkan suara ramah: *"Sistem pengamat siap digunakan."*
4. **Membuka Dashboard Pengamat & Buka Kunci Audio Browser**:
   * Sambungkan laptop atau tablet guru ke Wi-Fi alat: SSID `LENTERA-AP` (Password: `lentera123`).
   * Buka browser (Chrome / Edge) ke alamat `http://localhost:3000` atau `http://192.168.4.1:3000`.
   * **PENTING (Unlock Audio Autoplay)**: Klik satu kali di sembarang area layar laptop atau tekan bilah Spasi agar browser mengizinkan audio narator berbicara menyapa.

## 6.2 Prosedur Kalibrasi Otomatis Kamera (*Auto-Calibrate*)
Kalibrasi hanya perlu dilakukan satu kali saat alat pertama kali dirakit atau jika posisi kamera bergeser:
1. Letakkan 4 buah balok komponen apa saja di **4 sudut terluar papan**:
   * 1 balok di sel **$A1$** (sudut kiri bawah)
   * 1 balok di sel **$E1$** (sudut kanan bawah)
   * 1 balok di sel **$A5$** (sudut kiri atas)
   * 1 balok di sel **$E5$** (sudut kanan atas)
2. Buka dashboard web guru di menu **Kalibrasi Kamera**.
3. Klik tombol **"Auto-Calibrate 4 Sudut"**.
4. Sistem akan otomatis mendeteksi keempat sudut, menghitung matriks perspektif homografi, dan menyimpan koordinat 25 sel ke file `grid_roi.json`.
5. Speaker berbunyi: *"Kalibrasi berhasil. Papan sudah terpetakan."* Angkat kembali keempat balok tersebut.

## 6.3 Pengelolaan Profil Multi-Siswa & Pemantauan Visual Real-time
LENTERA mendukung penggunaan 1 laptop untuk bergantian banyak siswa di kelas inklusi:
1. **Memilih Profil Siswa**:
   * Guru dapat memilih nama siswa aktif melalui dropdown `StudentProfileSwitcher` di pojok kanan atas layar (Ahmad Fadhil, Siti Rahma, Dimas Putra, atau Tamu/Juri Lomba).
   * Setiap siswa memiliki penyimpanan nilai, capaian XP, lencana, dan riwayat modul yang terisolasi aman di `localStorage`.
2. **Login Taktil via Kartu Siswa**:
   * Siswa cukup meletakkan kartu identitas fisiknya (ID 35: Via, ID 36: Amira, ID 37: Ajib) di papan fisik. Sistem otomatis menyapa dan mengaktifkan profil siswa tersebut tanpa perlu disentuh oleh guru.
3. **Pemantauan Sirkuit Real-time**:
   * Visualisasi Grid 5×5 menampilkan posisi balok nyata di meja siswa secara 1:1, status arus (garis bercahaya hijau), dan polaritas kutub.
   * Badge Status Sirkuit: 🟢 Rangkaian Tertutup (Closed Loop), 🟡 Rangkaian Terbuka (Open Loop), 🔴 Korsleting (Short Circuit).

## 6.4 Mengunduh & Mencetak Rapor Evaluasi Siswa
1. Klik tombol **"Rapor Siswa"** di dashboard web.
2. Rapor menampilkan:
   * Total skor XP dan lencana kompetensi yang diraih.
   * Persentase pemahaman konsep (Rangkaian Seri, Paralel, Polaritas LED, Logika Saklar).
   * Catatan kemandirian navigasi papan fisik siswa.
3. Klik **"Cetak / Simpan PDF"** untuk dokumentasi guru dan laporan wali murid.

## 6.5 Mematikan Perangkat dengan Aman (*Safe Shutdown*)
> [!CAUTION]
> Jangan langsung mencabut kabel adaptor daya dari stopkontak karena dapat merusak file sistem pada kartu MicroSD Raspberry Pi.

Lakukan salah satu dari 2 metode aman berikut:
* **Metode 1 (Tombol Fisik - Rekomendasi)**: Tekan kembali tombol stainless pada panel depan hingga pengunci terlepas (*pop out*). Skrip `switch_daemon.py` akan membunyikan melodi pamit pada buzzer, mematikan sistem secara aman, dan lampu indikator akan padam (sekitar 10 detik). Setelah lampu padam, cabut kabel adaptor.
* **Metode 2 (Tombol Web)**: Klik tombol merah **"Matikan Sistem"** di dashboard guru. Narator akan berbicara: *"Alat LENTERA sedang dimatikan secara aman..."*, lalu sistem mengeksekusi perintah shutdown.

## 6.6 Tabel Tindakan Cepat Kendala Operasional (*Quick Action Troubleshooting*)

| Gejala Kendala | Kemungkinan Penyebab | Tindakan Cepat (Solusi 1 Menit) |
| :--- | :--- | :--- |
| **Suara narasi di laptop guru tidak terdengar sama sekali.** | Kebijakan browser menahan audio otomatis (*autoplay blocked*). | **Klik satu kali di sembarang area layar laptop** atau tekan bilah Spasi untuk membuka kunci audio. |
| **Balok diletakkan di kotak tapi sistem tidak merespons suara.** | 1. Stiker marker di bawah balok kotor/berdebu.<br>2. Lampu LED dalam alat belum menyala. | 1. Usap bagian bawah balok dengan kain bersih.<br>2. Intip melalui celah akrilik: pastikan lampu internal menyala terang. |
| **Buzzer berbunyi nada 'tit-tit-tit' cepat 3 kali berturut-turut.** | Terjadi **Korsleting** (baterai terhubung langsung kabel ke kabel tanpa melewati lampu). | Minta siswa mengangkat satu kabel penghubung, lalu pasang balok Lampu atau Saklar di antara jalur kabel tersebut. |
| **Lampu sirkuit tidak menyala padahal semua balok sudah tersambung rapat.** | 1. Tuas saklar masih dalam posisi OFF.<br>2. Kutub lampu LED terbalik. | 1. Raba tuas saklar di C5/C4/E4 dan geser ke posisi ON.<br>2. Angkat balok lampu, putar posisinya 180 derajat, lalu pasang kembali. |
| **Siswa bingung arah koreksi saat salah meletakkan balok.** | Siswa meletakkan balok di luar kotak target panduan. | Dengarkan petunjuk suara narator secara tenang (sistem otomatis menyebutkan: *"geser N kotak ke atas/bawah/kiri/kanan"*). |
| **Web di laptop guru terputus / status WebSocket Offline.** | Koneksi Wi-Fi laptop berpindah ke jaringan lain. | Buka pengaturan Wi-Fi laptop, pastikan tersambung kembali ke SSID: `LENTERA-AP`. |

---

# BAB 7: PANDUAN PERAKITAN TEKNIS & WIRING (HARDWARE BUILDER)

## 7.1 Daftar Komponen Elektronika & Pinout Raspberry Pi 4B

| Komponen | Spesifikasi Teknis | Keterangan |
| :--- | :--- | :--- |
| Komputer Utama | Raspberry Pi 4 Model B (RAM 4GB / 8GB) | OS: Raspberry Pi OS 64-bit |
| Sensor Kamera | Raspberry Pi Camera Module NoIR / Wide Fisheye | Kabel pita CSI 15-pin |
| Tombol Power | Push Button Stainless 4-Pin 16mm (Latching Detent) | Pin NO, NC, C, LED+, LED- |
| Piezo Buzzer | Active Buzzer 5V DC | SFM-27 / SFM-20 |
| Transistor Driver | Transistor NPN 2N2222 (Kemasan TO-92) | Saklar penguat arus buzzer |
| Resistor 1 | 1 kΩ (Cokelat - Hitam - Merah - Emas) | Resistor basis pelindung GPIO 17 |
| Resistor 2 | 220 Ω (Merah - Merah - Cokelat - Emas) | Resistor pembatas arus LED tombol |

```
                       HEADER 40-PIN RASPBERRY PI 4B
                       ┌───────────────────────┐
             +3.3V (1) │ ●  ● │ (2)  +5V  ───────────────> VCC Buzzer (+)
   SDA1 / GPIO 2   (3) │ ●  ● │ (4)  +5V
   SCL1 / GPIO 3   (5) │ ●  ● │ (6)  GND  ───────────────> GND Bersama & Emitter 2N2222
          GPIO 4   (7) │ ●  ● │ (8)  GPIO 14 (UART TXD) ─> Anoda LED Tombol (+) via 220Ω
             GND   (9) │ ●  ● │ (10) GPIO 15 (UART RXD)
         GPIO 17  (11) │ ●  ● │ (12) GPIO 18 (PCM CLK)
                 ...   │ ...  │
```

## 7.2 Skema Rangkaian Tombol Stainless 4-Pin Latching
Tombol stainless 4-pin memiliki 4 terminal: dua terminal saklar kontak dan dua terminal LED (`+` dan `-`).
1. **Jalur Kontak Saklar (Sensing & Wake-up)**:
   * Hubungkan salah satu kaki kontak saklar ke **Pin Fisik 5 (GPIO 3)**.
   * Hubungkan kaki kontak saklar pasangannya ke **Pin Fisik 6 (GND)**.
   * *Cara Kerja*: Menghubungkan GPIO 3 ke GND saat Raspberry Pi mati akan memicu sinyal hardware wake-up bawaan Pi. Saat sistem hidup, daemon `switch_daemon.py` mendeteksi penekanan tombol untuk memicu shutdown aman.
2. **Jalur Indikator Cincin LED Tombol**:
   * Kaki **LED (+)** dihubungkan seri dengan **Resistor 220Ω**, lalu disambungkan ke **Pin Fisik 8 (GPIO 14 / UART0 TXD)**.
   * Kaki **LED (-)** disambungkan ke **Pin Fisik 6 (GND)**.
   * *Cara Kerja*: Pin UART TXD secara default berlogika HIGH (3.3V) segera setelah kernel Linux aktif dan otomatis mati saat Pi selesai shutdown. Cincin LED menyala otomatis sebagai indikator status sistem hidup.

## 7.3 Skema Rangkaian Driver Buzzer NPN 2N2222
Buzzer 5V membutuhkan arus hingga 30 mA, melebihi batas aman pin GPIO (16 mA). Oleh karena itu, digunakan sirkuit penguat transistor NPN 2N2222 sebagai *low-side switch*:

```
                       +5V (Pin Fisik 2)
                           │
                           ▼
                     ┌───────────┐
                     │  [ + ]    │
                     │  BUZZER   │  Active Buzzer 5V
                     │  [ - ]    │
                     └─────┬─────┘
                           │
                           ▼
                     Collector (C) [Kaki 3 Transistor 2N2222]
                           │
GPIO 17 (Pin 11) ──[ 1kΩ ]─┼── Base (B) [Kaki 2 Transistor 2N2222]
                           │
                      Emitter (E) [Kaki 1 Transistor 2N2222]
                           │
                           ▼
                      GND (Pin Fisik 6 / 9)
```

## 7.4 Penataan Kamera CSI & Jarak Fokus
* Kamera dipasang di dasar enclosure pada posisi tepat di tengah bawah sel $C3$.
* Jarak ideal antara lensa kamera dan permukaan bawah akrilik adalah **18 cm – 22 cm** untuk lensa wide-angle $120^\circ$ agar seluruh 25 slot masuk ke dalam bidang pandang tanpa terpotong (*vignetting*).
* Putar cincin fokus lensa kamera secara manual hingga pola marker ArUco 4×4 terlihat tajam dan kontras pada preview.

---

# BAB 8: DEPLOYMENT, KONEKTIVITAS & LAYANAN SYSTEMD

## 8.1 Mode Standalone Offline (Hotspot Lokal)
LENTERA dapat beroperasi 100% mandiri di daerah tanpa akses internet:
* Raspberry Pi dikonfigurasi memancarkan Wi-Fi Hotspot lokal dengan nama: `LENTERA-AP` (Password: `lentera123`).
* Laptop guru cukup menyambungkan koneksi Wi-Fi ke hotspot tersebut dan membuka browser di alamat IP: `http://192.168.4.1:3000`.

## 8.2 Mode Akses Jarak Jauh (Cloudflare & Ngrok Tunnel)
Untuk keperluan penjurian lomba daring atau pemantauan guru dari jarak jauh:
* **Cloudflare Tunnel**: Skrip [install_tunnel.sh](file:///l:/LENTERA%20MALAYSIA/install_tunnel.sh) dan [start_tunnel_autosync.sh](file:///l:/LENTERA%20MALAYSIA/start_tunnel_autosync.sh) otomatis menghubungkan server lokal ke domain publik HTTPS yang aman tanpa perlu port forwarding modem.
* **Ngrok Tunnel**: Skrip [setup_ngrok_tunnel.sh](file:///l:/LENTERA%20MALAYSIA/setup_ngrok_tunnel.sh) sebagai opsi cadangan cepat.

## 8.3 Konfigurasi Otomatis Systemd Service
Sistem operasi Raspberry Pi menjalankan 3 background daemon secara otomatis saat alat dinyalakan:
1. `lentera.service`: Menjalankan engine penglihatan komputer `main.py` dan server WebSocket.
2. `lentera-switch.service`: Menjalankan daemon pembaca tombol power fisik dan kontrol shutdown aman.
3. `lentera-tunnel.service`: Menjalankan sinkronisasi tunnel publik ke Cloudflare/Ngrok.

Untuk memeriksa status layanan di terminal Raspberry Pi:
```bash
sudo systemctl status lentera.service
sudo systemctl status lentera-switch.service
```

---

# BAB 9: PANDUAN PEMECAHAN MASALAH (TROUBLESHOOTING & FAQ)

## 9.1 Masalah Penglihatan Komputer
* **Gejala: Balok diletakkan tetapi tidak terdengar suara atau tidak terdeteksi di layar.**
  * *Penyebab 1*: Stiker marker ArUco kotor, tergores, atau tertutup debu.
  * *Solusi*: Bersihkan permukaan stiker dengan kain mikrofiber lembut.
  * *Penyebab 2*: Cahaya ruangan terlalu redup sehingga bagian dalam bodi alat gelap.
  * *Solusi*: Pastikan lampu strip LED internal di dalam bodi alat menyala normal.
  * *Penyebab 3*: Posisi kamera bergeser dari kalibrasi awal.
  * *Solusi*: Jalankan prosedur kalibrasi otomatis 4 sudut melalui menu dashboard guru.

## 9.2 Masalah Audio Browser
* **Gejala: Narasi suara di laptop guru tidak berbunyi saat web pertama kali dibuka.**
  * *Penyebab*: Kebijakan keamanan browser modern (*Browser Autoplay Policy*) melarang audio bersuara sebelum ada interaksi klik dari pengguna.
  * *Solusi*: Klik sembarang area layar laptop atau tekan bilah spasi sekali. Sistem LENTERA akan langsung terbuka (*unlocked*) dan suara narator menyapa otomatis.

## 9.3 Masalah Validasi Sirkuit
* **Gejala: Sirkuit sudah tersambung semua tetapi buzzer berbunyi peringatan cepat 3 kali ("Korsleting!").**
  * *Penyebab*: Jalur kabel menghubungkan kutub positif baterai langsung ke kutub negatif tanpa melewati lampu atau beban hambatan.
  * *Solusi*: Periksa kembali susunan balok. Pastikan arus melewati balok Lampu LED atau Resistor sebelum kembali ke kutub negatif baterai.
* **Gejala: Sirkuit tertutup tetapi lampu tidak menyala.**
  * *Penyebab*: Kutub lampu LED terbalik (katoda terhubung ke positif baterai) atau tuas saklar masih dalam posisi OFF.
  * *Solusi*: Putar tuas saklar ke posisi ON. Jika masih belum menyala, angkat balok lampu dan putar 180 derajat.

## 9.4 FAQ Sekolah Luar Biasa (SLB)
* **T: Apakah siswa tunanetra dapat menggunakan alat ini secara mandiri tanpa didampingi guru?**
  * *J*: Ya, 100% mandiri. Mulai dari menyalakan tombol daya, memilih materi di sel $A1–E1$, merakit sirkuit, hingga bertanya ke AI Tutor, seluruhnya dipandu secara auditori melalui suara ramah berbahasa Indonesia.
* **T: Bagaimana jika ada 2 siswa yang belajar bergantian pada hari yang sama?**
  * *J*: Masing-masing siswa cukup meletakkan kartu identitas taktil mereka di sel $A1$. Sistem akan otomatis memuat nama, level kemahiran, dan riwayat belajar siswa yang bersangkutan tanpa menghapus data siswa sebelumnya.

---

### Tim Pengembang & Hak Cipta
**LENTERA Team — Inovasi Pendidikan Inklusif Tunanetra**  
*Mewujudkan Kesetaraan Pendidikan Sains & Teknologi untuk Semua Anak Bangsa.*
