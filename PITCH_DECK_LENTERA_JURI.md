# 🌟 PITCH DECK & PANDUAN PRESENTASI JURI: LENTERA
> **LENTERA:** *Smart Tactile Experiment Board & Inclusive Adaptive Learning Platform*
> **Platform Belajar Rangkaian Listrik Taktil, Mandiri, dan Interaktif untuk Siswa Tunanetra**

---

## ⚡ 1. Elevator Pitch (30 Detik)
> *"Bayangkan jika Anda harus belajar fisika dan rangkaian listrik tanpa pernah bisa melihat kabel atau bohlam yang menyala. Selama puluhan tahun, siswa tunanetra hanya diminta menghafal teori secara verbal karena praktikum kabel konvensional terlalu berbahaya dan simulasi digital seperti PhET 100% berbasis layar visual.*
> 
> *Kenalkan **LENTERA** — ekosistem praktikum sains taktil pertama yang menggabungkan balok sirkuit fisik bertanda rabaan timbul, pelacakan optik dari bawah papan (**Under-Board Vision**), panduan suara interaktif seketika, dan dashboard analitik belajar adaptif (**LENTERA Learn**). Dengan LENTERA, siswa tunanetra dapat meraba, merakit, dan memahami sains secara 100% mandiri tanpa rasa takut tersengat listrik atau korsleting."*

---

## 🛑 2. Latar Belakang & Masalah Mendesak (*The Problem*)
1. **Ketiadaan Praktikum Sains Inklusif**: Di SLB-A maupun sekolah inklusi, materi rangkaian listrik IPA/Fisika SMP & SMA diajarkan secara pasif (mendengarkan ceramah guru).
2. **Bahaya Alat Praktikum Konvensional**: Kabel *jumper*, papan *breadboard* berlubang kecil, dan komponen tajam/panas berisiko tinggi menyebabkan sengatan arus atau korsleting jika diraba secara acak.
3. **Simulasi Digital Gagal Mengakomodasi Tunanetra**: Software visual seperti PhET Interactive Simulations, Tinkercad, atau lab virtual menuntut navigasi *drag-and-drop* mouse dan tampilan visual layar yang mustahil diakses (*inaccessible*) oleh tunanetra.
4. **Kelemahan Computer Vision Konvensional (*Hand Occlusion*)**: Sistem kamera dari atas (*top-down*) selalu gagal karena tangan siswa tunanetra terus-menerus meraba di atas papan, menutupi komponen dari pandangan kamera.

---

## 💡 3. Solusi & Inovasi Kunci LENTERA (*The 'Secret Sauce'*)

```
┌──────────────────────────────────────────────────────────────┐
│  SISWA TUNANETRA                                            │
│  Meraba & Merakit Balok Taktil di Papan Grid 5×5             │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  UNDER-BOARD OPTICAL TRACKING (Inovasi Kamera dari Bawah)     │
│  Kamera CSI Wide-Angle di balik slot akrilik transparan:     │
│  Zero Hand Occlusion — Tangan bebas meraba tanpa halangan!   │
└──────────────────────────────┬───────────────────────────────┘
                               │ (Deteksi ArUco & Topologi Graf)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  DUAL OUTPUT ENGINE: SUARA & DASHBOARD ANALITIK              │
│  1. Audio Panduan Sokratik + Haptic Earcon (Buzzer & Speaker)│
│  2. LENTERA Learn Dashboard (Skill Mastery, AI Tutor & Rapor)│
└──────────────────────────────────────────────────────────────┘
```

1. **Inovasi Kamera Bawah (*Under-Board Vision — Zero Occlusion*)**:
   - Kamera diletakkan di dalam dasar kotak papan, menghadap ke atas melalui slot akrilik bening untuk membaca marker di bagian bawah balok.
   - **Keunggulan**: Siswa bebas meraba balok dengan kedua tangannya tanpa pernah menutupi sensor kamera.
2. **Balok Taktil Ergonomis Multi-Bentuk**:
   - **Baterai**: Simbol timbul `(+)` dan `(-)` di kedua sisi.
   - **Saklar**: Tuas mekanik timbul yang bisa diklik (*toggle switch*).
   - **Lampu LED**: Kubah bulat timbul + tanda polaritas anoda/katoda timbul.
   - **Kabel Lurus, Siku L, dan Cabang T**: Alur garis timbul nyata yang memandu aliran rabaan tangan siswa.
3. **Sistem Evaluasi Sirkuit Cerdas Berbasis Graf (*Real-time Graph Adjacency*)**:
   - Algoritma memodelkan sirkuit listrik sebagai graf tertutup secara real-time (bukan sekadar mencocokkan gambar).
   - Mendeteksi loop tertutup, status saklar terbuka/tertutup, arah polaritas LED, hingga peringatan darurat korsleting (*short circuit safety alert*).

---

## 🚀 4. Fitur-Fitur Unggulan yang Dapat Didemonstrasikan

### A. Akses Mandiri Tanpa Layar (*Tangible Physical Grid Menu*)
- Siswa tidak perlu menyentuh layar laptop atau smartphone untuk memilih materi. Cukup letakkan satu balok di grid teratas:
  - Kotak **A1**: Membuka **Tahap 1 — Pengenalan Bentuk Komponen**
  - Kotak **B1**: Membuka **Tahap 2 — Kuis Pemahaman Fungsi Taktil**
  - Kotak **C1**: Membuka **Tahap 3 — Rangkaian Seri Mandiri**
  - Kotak **D1**: Membuka **Tahap 4 — Rangkaian Paralel Cabang T**
  - Kotak **E1**: Membuka **Tahap 5 — Tantangan Detektif Sirkuit Mahir**
- Saat materi selesai, siswa cukup meletakkan balok di **A1 untuk IYA** (lanjut materi) atau **E1 untuk TIDAK** (istirahat).

### B. Umpan Balik Suara & Haptic Earcons Multi-Kanal
- **Web Speech API**: Memberikan narasi suara ramah bahasa Indonesia dengan pelafalan fonetika abjad yang tepat (huruf L dibaca *"El"*, huruf T dibaca *"Te"*).
- **Audio Earcons Sintesis Web Audio**:
  - Nada *click* saat memilih menu.
  - Nada *chime gembira* saat langkah benar.
  - Nada *arpeggio fanfare* saat seluruh rangkaian sukses menyala.
  - Nada *warning* saat terjadi korsleting atau materi masih terkunci.
  - Nada *clue* sokratik saat polaritas lampu terbalik (*"Angkat lampu dan putar 180 derajat"*).

### C. LENTERA Learn Dashboard (Analitik Pembelajaran Terintegrasi)
- **Skill Tree Mastery**: Pemetaan level penguasaan 6 domain (Baterai, Kabel, Saklar, Aliran Arus, Rangkaian Seri, Rangkaian Paralel).
- **Gamifikasi & Lencana XP**: Siswa mengumpulkan poin XP dan lencana (*"Cahaya Pertama"*, *"Ahli Seri"*, *"Master Rangkaian"*).
- **Sistem Multi-Profil Siswa**: Mendukung profil siswa bergantian (Ahmad, Siti, Dimas, dan mode Pengamat/Juri) dengan penyimpanan data terisolasi.
- **Cetak Raport Resmi (PDF/Print)**: Guru dapat mencetak laporan capaian belajar siswa lengkap dengan matriks penguasaan kompetensi dan catatan guru.

### D. Keandalan Pameran & Lomba (*Exhibition-Ready*)
- **100% Offline Capable**: Memiliki akun demo lokal (`student@lentera.demo`, password `lentera123`) dan deteksi Edge computing di Raspberry Pi yang tidak membutuhkan koneksi internet publik.

---

## 🏆 5. Poin Penjualan Utama di Depan Juri (*Selling Points*)

| Aspek Penilaian | Nilai Unggul LENTERA | Argumen untuk Juri |
| :--- | :--- | :--- |
| **Inovasi Teknologi (*Novelty*)** | *Under-Board Optical Tracking* + *Graph Topolgy Analysis* | Menyelesaikan masalah mendasar Computer Vision pada alat bantu disabilitas (*hand occlusion*) dengan desain optik dari bawah. |
| **Inklusivitas & Aksesibilitas** | 100% *Non-Visual Accessibility* | Tidak sekadar menambahkan suara pada aplikasi biasa, tetapi merancang interaksi fisik taktil dari nol agar siswa tunanetra mandiri seutuhnya. |
| **Metodologi Pedagogi** | *Socratic Guided Discovery* | AI Tutor tidak mendikte jawaban, melainkan memberi petunjuk rabaan cerdas saat siswa salah merakit (*scaffolding learning*). |
| **Dampak Sosial (*Impact*)** | Mendukung SDGs No. 4 (Pendidikan Berkualitas & Inklusif) | Membuka jalan bagi siswa disabilitas netra untuk belajar STEM/sains modern tanpa diskriminasi fasilitas praktikum. |
| **Kelayakan Biaya (*Cost-Efficiency*)** | Berbasis Komponen *Off-The-Shelf* (Raspberry Pi + Modul Kamera + Akrilik) | Jauh lebih murah dan fleksibel dibanding modul braille elektronik khusus luar negeri yang berharga puluhan juta rupiah. |

---

## 🎬 6. Skenario Demo Langsung di Depan Juri (*Live Demo Script*)

### Langkah 1: Pengenalan Awal (Durasi: 1 Menit)
1. Tunjukkan papan LENTERA dan balok-balok taktil di atas meja.
2. Ajak salah satu juri untuk **menutup mata** dan meraba balok baterai serta kubah lampu LED.
3. *Pitching*: *"Bapak/Ibu Juri, silakan rasakan simbol plus dan minus timbul di balok ini. Ini adalah cara siswa tunanetra melihat sirkuit listrik."*

### Langkah 2: Interaksi Tanpa Layar / Tangible Menu (Durasi: 1 Menit)
1. Letakkan balok di kotak **A1**.
2. Sistem langsung mengeluarkan suara: *"Pilihan diterima: Tahap 1, Pengenalan Komponen! Angkat balok dari A1 untuk mulai meraba balok di sel C3."*
3. *Pitching*: *"Siswa tidak perlu menyentuh keyboard, mouse, ataupun layar ponsel. Papan ini sendiri adalah antarmuka navigasinya."*

### Langkah 3: Perakitan Sirkuit & Deteksi Real-Time (Durasi: 1.5 Menit)
1. Rakit rangkaian seri: letakkan Baterai, Kabel, Saklar, dan Lampu di papan.
2. Tunjukkan bahwa tangan yang meraba di atas papan **sama sekali tidak mengganggu deteksi kamera di bawah**.
3. Saat rangkaian tertutup, tunjukkan:
   - Lampu visual di web menyala.
   - Nada *fanfare sukses* berbunyi.
   - Sistem audio mengumumkan: *"Hebat sekali! Rangkaian Seri terhubung dan arus mengalir!"*

### Langkah 4: Uji Coba Cerdas (Simulasi Polaritas Terbalik / Saklar OFF)
1. Putar posisi balok lampu 180° sehingga polaritasnya terbalik.
2. Sistem mengeluarkan nada *clue* dan berkata: *"Lampu belum menyala karena kutub polaritasnya terbalik. Angkat balok lampu dan putar 180 derajat."*
3. *Pitching*: *"Sistem tidak hanya tahu benar atau salah, tetapi paham penyebab fisika di balik kegagalan sirkuit dan membimbing siswa menyelesaikannya."*

### Langkah 5: Penutupan & Buka LENTERA Learn Dashboard (Durasi: 30 Detik)
1. Tunjukkan halaman `/dashboard`: level keterampilan Ahmad langsung naik, XP bertambah, dan materi Paralel terbuka.
2. Klik tombol **Cetak Raport Siswa** untuk memperlihatkan raport format profesional yang siap dibagikan ke orang tua siswa.

---

## ❓ 7. Antisipasi Pertanyaan Kritis Juri (*Q&A Cheat Sheet*)

**T1: Bagaimana jika pencahayaan di ruangan pameran gelap atau terlalu terang?**
> *Jawab*: Kamera LENTERA berada di dalam ruang tertutup (*enclosure*) di bawah papan dengan pencahayaan LED internal yang konstan dan terkontrol. Pencahayaan ruangan pameran dari luar tidak memengaruhi akurasi deteksi ArUco di bawah slot akrilik.

**T2: Mengapa menggunakan marker ArUco, bukan sensor magnetik atau pin pogo elektrik langsung?**
> *Jawab*: 
> 1. *Keamanan*: Sistem optik sepenuhnya bebas dari risiko aus mekanik (*mechanical wear-and-tear*), pin patah, atau kotoran debu yang menyumbat kontak tembaga.
> 2. *Kebebasan Siswa*: Siswa dapat mengangkat, memutar, dan menggeser balok dengan mulus tanpa hambatan magnet yang berat bagi jari anak-anak.
> 3. *Skalabilitas Biaya*: Menambah komponen baru hanya butuh mencetak balok plastik 3D dan menempelkan stiker marker, tanpa sirkuit elektronik mahal di dalam setiap balok.

**T3: Apakah alat ini membutuhkan koneksi internet saat digunakan di kelas?**
> *Jawab*: Tidak sama sekali. Pemrosesan Computer Vision berjalan 100% secara lokal (*Edge Computing*) di Raspberry Pi. Perangkat memancarkan Wi-Fi hotspot lokal sehingga laptop guru atau siswa dapat mengakses web app tanpa perlu kuota internet.

**T4: Bagaimana cara mengukur efektivitas belajarnya bagi siswa tunanetra?**
> *Jawab*: Diukur melalui integrasi **LENTERA Learn**: waktu penyelesaian tugas (*time-on-task*), jumlah kesalahan polaritas sebelum berhasil, dan skor kuis taktil yang dicatat otomatis ke dalam profil dan raport perkembangan siswa.

---
*Dokumen ini dirancang khusus sebagai panduan presentasi, naskah demo, dan argumen keunggulan kompetisi LENTERA.*
