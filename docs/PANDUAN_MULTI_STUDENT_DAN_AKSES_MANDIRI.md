# PANDUAN FITUR: PROFIL MULTI-SISWA & AKSES MANDIRI TAKTIL

Dokumen ini merangkum seluruh fitur baru dan perubahan arsitektur yang diterapkan pada **LENTERA Portal** untuk mendukung skenario penggunaan nyata di **Sekolah Luar Biasa (SLB)** dan **Penjurian Lomba**, di mana satu laptop/perangkat digunakan secara bergantian oleh banyak siswa tunanetra tanpa merusak progres masing-masing dan tanpa menambah balok fisik baru.

---

## 1. Latar Belakang & Masalah Lapangan

1. **Skenario 1 Laptop untuk Banyak Siswa di SLB**:
   - Di laboratorium atau kelas inklusi, siswa tunanetra sering bergantian menggunakan satu meja lab/laptop.
   - Jika progres belajar (XP, modul yang diselesaikan, dan tingkat kemahiran) disimpan dalam satu variabel global `localStorage`, maka ketika Siswa B belajar setelah Siswa A, materi Siswa B akan langsung dianggap selesai atau skor Siswa A terhapus.
2. **Kemandirian Siswa Tunanetra (Akses Tanpa Layar / Zero-Mouse)**:
   - Siswa tunanetra tidak menggunakan mouse untuk mengklik tombol "Mulai Lab" di layar laptop.
   - Guru atau juri membutuhkan cara cepat untuk langsung membuka lab tanpa terhalang form registrasi/login yang rumit.
3. **Keterbatasan Kit Fisik**:
   - Kit fisik LENTERA memiliki tepat **6 jenis balok komponen** urut (ID 1: Baterai, 2: Kabel Lurus, 3: Kabel Belok/L, 4: Kabel T, 5: Lampu, 6: Saklar).
   - Solusi software **TIDAK BOLEH** menuntut penambahan balok fisik baru atau ID di luar 6 komponen ini.

---

## 2. Fitur Baru yang Ditambahkan

### A. Sambutan Suara Otomatis & Trigger Interaksi Pertama (Landing Page)
- **Lokasi Kode**: [`Lentera-Portal/app/page.tsx`](file:///l:/LENTERA%20MALAYSIA/Lentera-Portal/app/page.tsx)
- **Cara Kerja**:
  - Saat web pertama kali dibuka, browser modern melarang suara diputar otomatis (*browser autoplay policy*).
  - LENTERA memasang listener klik di seluruh area halaman (*click anywhere*). Begitu pengguna atau guru menyentuh layar atau trackpad sekali saja, narasi pengenalan audio langsung berbicara dalam Bahasa Indonesia yang ramah:
    > *"Halo! Selamat datang di LENTERA — media belajar rangkaian listrik taktil dan inklusif untuk siswa tunanetra. Untuk memulai, kamu bisa menekan tombol Buka LENTERA Lab di layar, atau langsung letakkan balok baterai ke atas papan fisik LENTERA kapan saja."*
  - Dilengkapi tombol toggle suara (*"Dengarkan Panduan"* / *"Matikan Suara"*) di bilah hero.

### B. Auto-Redirect Taktil (Zero-Screen Trigger - Balok Komponen Bebas)
- **Lokasi Kode**: [`Lentera-Portal/app/page.tsx`](file:///l:/LENTERA%20MALAYSIA/Lentera-Portal/app/page.tsx)
- **Cara Kerja**:
  - Halaman landing page membuka koneksi WebSocket di latar belakang ke engine penglihatan komputer (`backend`).
  - Ketika seorang siswa tunanetra meraba kotak komponen dan meletakkan **balok komponen apa saja** (Baterai, Lampu, Saklar, atau Kabel) di posisi mana saja di atas papan grid:
    1. Sistem langsung mengenali balok tersebut dan jenis komponennya.
    2. Suara AI berbicara menyebutkan nama komponen: *"Balok [Nama Komponen] terdeteksi! Membuka LENTERA Lab."*
    3. Halaman web otomatis berpindah ke `/aruco` (LENTERA Lab).
  - Siswa tunanetra dapat membuka materi dengan bebas meletakkan balok apa pun tanpa perlu melihat layar monitor atau meminta tolong orang lain mengklik mouse.

### C. Akses Langsung LENTERA Lab (One-Click Judge/Teacher Access)
- **Lokasi Kode**: [`Lentera-Portal/app/page.tsx`](file:///l:/LENTERA%20MALAYSIA/Lentera-Portal/app/page.tsx)
- Tombol **"Buka LENTERA Lab"** kini hadir secara permanen di navbar atas dan tombol aksi utama (CTA hero) halaman depan.
- Guru dan dewan juri dapat langsung menguji sistem deteksi kamera, evaluasi graf rangkaian, dan panduan suara secara instan tanpa perlu melewati form login manual.

### D. Komponen Profil Multi-Siswa (`StudentProfileSwitcher`)
- **Lokasi Kode**:
  - Komponen UI: [`Lentera-Portal/components/StudentProfileSwitcher.tsx`](file:///l:/LENTERA%20MALAYSIA/Lentera-Portal/components/StudentProfileSwitcher.tsx)
  - Engine Penyimpanan: [`Lentera-Portal/utils/progress.ts`](file:///l:/LENTERA%20MALAYSIA/Lentera-Portal/utils/progress.ts)
  - Terintegrasi di: Header Landing Page (`app/page.tsx`) & Sidebar LENTERA Lab (`app/aruco/page.tsx`).
- **Fitur Utama**:
  1. **Dropdown Pemilih Siswa**:
     - Guru atau siswa cukup mengklik profil aktif untuk memilih siswa yang sedang belajar.
     - Setiap profil menampilkan Avatar, Nama Lengkap, Kelas/Catatan Kebutuhan Khusus, dan Total XP / Lencana.
  2. **Preset Profil Bawaan (Default SLB)**:
     - 👨‍🎓 **Ahmad Fadhil** — Kelas 8 (Tunanetra Total) — Level: Mahir (450 XP, 4 modul selesai).
     - 👩‍🎓 **Siti Rahma** — Kelas 7 (Low Vision) — Level: Pemula (150 XP, modul dasar).
     - 🧑‍🎓 **Dimas Putra** — Kelas 8 (Low Vision) — Level: Menengah (280 XP).
     - ⚖️ **Tamu / Juri Lomba** — Mode Pengujian / Sandbox (0 XP, siap uji coba dari nol).
  3. **Tambah Siswa Baru Mandiri**:
     - Guru dapat menambahkan siswa baru kapan saja dengan memasukkan Nama dan Kelas langsung dari dropdown.
  4. **Feedback Audio Penggantian Profil**:
     - Saat profil diganti, browser langsung menyuarakan: *"Profil aktif diubah ke [Nama Siswa]"*, memastikan siswa tunanetra mengetahui identitas siapa yang aktif di sistem.
  5. **Reset Progres Per Siswa**:
     - Tombol reset progres hanya menghapus riwayat siswa yang sedang aktif, tanpa mengganggu progres milik teman sekelasnya.

### E. Narasi Masuk LENTERA Lab & Auto-Start Pengenalan Komponen (Opsi B)
- **Lokasi Kode**: [`Lentera-Portal/app/aruco/page.tsx`](file:///l:/LENTERA%20MALAYSIA/Lentera-Portal/app/aruco/page.tsx) & [`VoiceGuide.tsx`](file:///l:/LENTERA%20MALAYSIA/Lentera-Portal/components/aruco/VoiceGuide.tsx)
- **Cara Kerja Cerdas (Berdasarkan Profil Siswa)**:
  - **Siswa Pemula (Belum Menyelesaikan Tahap 1)**:
    1. Sistem menyambut dan mengarahkan: *"Selamat datang di LENTERA Lab! ... Sebelum memulai eksperimen, silakan angkat terlebih dahulu balok komponen yang terpasang di papan fisik agar grid bersih dan siap digunakan."*
    2. Begitu arahan selesai (jeda 1,8 detik), sistem **secara otomatis memulai Tahap 1: Pengenalan Balok Komponen** tanpa perlu klik mouse!
    3. Suara langsung memandu: *"Mari berkenalan dengan komponen listrik! Pertama, raba dan cari balok Baterai. Letakkan balok Baterai di posisi C3, tepat di tengah papan."*
    4. Siswa meletakkan balok di C3 ➔ sistem menjelaskan karakteristik dan terminal balok ➔ otomatis berlanjut ke balok berikutnya hingga ke-6 balok selesai.
  - **Siswa Mahir / Guru / Juri (Sudah Menguasai Tahap 1)**:
    1. Sistem menyambut: *"Selamat datang kembali di LENTERA Lab! ... Papan siap digunakan. Kamu dapat langsung merangkai bebas di atas papan fisik, atau memilih modul bimbingan di bilah samping. Selamat bereksplorasi!"*
    2. Sistem tidak memaksakan masuk ke Tahap 1, memberikan kebebasan merangkai bebas (*sandbox*).
  - Dilengkapi tombol toggle suara **"Dengarkan Arahan Lab"** di samping badge status agar pengguna dapat memutar ulang atau menghentikan narasi kapan saja.

---

## 3. Arsitektur Data: Isolasi Progres di LocalStorage

Sistem tidak lagi menggunakan satu kunci global `lentera_progress`. Progres kini diisolasi per identitas siswa:

```
localStorage
├── "lentera_student_profiles"       -> [ { id: "std-1", name: "Ahmad Fadhil", ... }, { ... } ]
├── "lentera_active_student_id"      -> "std-1"
├── "lentera_progress_std-1"         -> { completedModules: ["intro", "series"], xp: 450, ... }
├── "lentera_progress_std-2"         -> { completedModules: ["intro"], xp: 150, ... }
└── "lentera_progress_std-guest"     -> { completedModules: [], xp: 0, ... }
```

Dengan isolasi ini:
- Jika Ahmad Fadhil menyelesaikan modul Rangkaian Seri, progres hanya tersimpan di `lentera_progress_std-1`.
- Saat giliran Siti Rahma belajar, sistem memuat `lentera_progress_std-2`. Tantangan dan modul Siti tetap berada di level pemula tanpa tertumpuk pencapaian Ahmad.

---

## 4. Keutuhan Core Logic & Hardware

| Komponen | Status | Keterangan |
|---|:---:|---|
| **Kamera & Under-board Vision** | **Tidak Berubah** | Tetap menggunakan model deteksi ArUco `DICT_4X4_50` 1080p under-board. |
| **Grid Calibration (5x5)** | **Tidak Berubah** | Kalibrasi 4 sudut grid tetap dilakukan sekali saja saat posisi kamera fix. |
| **Circuit Graph Solver** | **Tidak Berubah** | Algoritma Breadth-First Search (BFS) dan deteksi polaritas kutub baterai tetap utuh. |
| **Rotasi & Orientasi Sakelar** | **Terintegrasi** | Fitur Smart Switch Alignment (sakelar menyesuaikan kawat horizontal vs vertikal) tetap aktif normal. |
| **Jumlah Balok Fisik** | **Tepat 6 Balok** | Tidak ada penambahan balok baru maupun perubahan ID ArUco. |

---

## 5. Cara Uji Coba (Testing Guide)

1. **Uji Sambutan Suara & Baterai Taktil**:
   - Buka halaman utama: `http://localhost:3000/`.
   - Klik di mana saja pada halaman -> dengarkan sambutan suara panduan LENTERA.
   - Letakkan balok Baterai (ID 1) di papan grid fisik -> dengarkan konfirmasi suara dan amati layar otomatis beralih ke `/aruco`.
2. **Uji Ganti Profil Siswa**:
   - Di bilah navigasi atas atau di sidebar `/aruco`, klik tombol profil (misal: "Ahmad Fadhil").
   - Pilih "Siti Rahma" -> dengarkan suara pemberitahuan *"Profil aktif diubah ke Siti Rahma"*.
   - Amati indikator XP berubah sesuai histori belajar Siti Rahma.
3. **Uji Tambah Siswa Baru**:
   - Buka dropdown profil, klik **"+ Tambah Siswa Baru"**.
   - Masukkan nama siswa (misal: "Budi Santoso") dan kelas (misal: "Kelas 7 SLB").
   - Klik Simpan -> Budi Santoso langsung menjadi profil aktif dengan 0 XP.
