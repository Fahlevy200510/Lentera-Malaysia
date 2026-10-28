# PANDUAN OPERASIONAL & PETUNJUK PENGGUNAAN LENTERA
### Prosedur Standar Operasional (SOP) Pengoperasian Alat di Kelas & Laboratorium
**Fokus Khusus: Langkah Kerja Lapangan untuk Guru, Pendamping, dan Siswa Tunanetra**

---

## DAFTAR ISI CEPAT
1. [BAGIAN 1: PERSIAPAN & MENYALAKAN ALAT (STARTUP)](#bagian-1-persiapan--menyalakan-alat-startup)
2. [BAGIAN 2: PANDUAN OPERASIONAL SISWA (PENGGUNAAN MANDIRI TANPA LAYAR)](#bagian-2-panduan-operasional-siswa-penggunaan-mandiri-tanpa-layar)
3. [BAGIAN 3: PANDUAN OPERASIONAL TANYA AI LIVE TUTOR (PUSH-TO-TALK)](#bagian-3-panduan-operasional-tanya-ai-live-tutor-push-to-talk)
4. [BAGIAN 4: PANDUAN OPERASIONAL GURU & PENDAMPING (DASHBOARD KENDALI)](#bagian-4-panduan-operasional-guru--pendamping-dashboard-kendali)
5. [BAGIAN 5: PROSEDUR MEMATIKAN PERANGKAT (SAFE SHUTDOWN)](#bagian-5-prosedur-mematikan-perangkat-safe-shutdown)
6. [BAGIAN 6: TINDAKAN CEPAT KENDALA OPERASIONAL (QUICK ACTION)](#bagian-6-tindakan-cepat-kendala-operasional-quick-action)

---

# BAGIAN 1: PERSIAPAN & MENYALAKAN ALAT (STARTUP)

Lakukan 4 langkah berikut setiap kali akan memulai sesi pembelajaran:

```
[ Colok Adaptor 5V/3A ] ──> [ Tekan Tombol Stainless ] ──> [ Tunggu Melodi Siap ] ──> [ Buka Web & Klik Layar ]
```

### Langkah 1: Pemasangan Daya
1. Pastikan permukaan meja LENTERA dalam keadaan bersih dan bebas dari balok sisa sesi sebelumnya.
2. Pasang kabel adaptor daya USB-C resmi (5V / 3A) ke port daya pada panel samping bodi alat, lalu tancapkan ke stopkontak listrik.

### Langkah 2: Menyalakan Alat
1. Tekan **Tombol Stainless Steel** pada panel depan sekali hingga terdengar bunyi klik mekanis (*mengunci/latching*).
2. Cincin lampu LED pada tombol akan langsung menyala berwarna biru/hijau, menandakan suplai daya aktif.
3. Lampu strip LED internal di dalam ruang bawah akrilik akan otomatis menyala menerangi area deteksi.

### Langkah 3: Konfirmasi Kesiapan Sistem
1. Tunggu proses booting selama ±20–30 detik.
2. Indikator kesiapan:
   * **Buzzer berbunyi melodi siap** (nada pendek naik: *tut-tut-ti-tung*).
   * **Speaker mengeluarkan suara ramah**: *"Sistem pengamat siap digunakan."*
3. Jika terdengar bunyi peringatan beep ganda (*tit-tit*), alat tetap aktif namun koneksi Wi-Fi belum tersambung (alat siap dalam mode offline).

### Langkah 4: Membuka Dashboard Pengamat (Di Laptop/Tablet Guru)
1. Sambungkan laptop atau tablet guru ke Wi-Fi alat:
   * **Nama Wi-Fi (SSID)**: `LENTERA-AP` (atau Wi-Fi lokal yang sama dengan Raspberry Pi).
   * **Password**: `lentera123`
2. Buka browser (disarankan Google Chrome / Microsoft Edge), lalu buka alamat:
   * Jika lokal di alat: `http://localhost:3000`
   * Jika via laptop guru: `http://192.168.4.1:3000` (atau URL Cloudflare Tunnel jika online).
3. **PENTING (Buka Kunci Suara Browser)**:
   * Browser modern melarang audio otomatis (*autoplay policy*).
   * **Klik satu kali di sembarang area layar laptop** atau tekan tombol spasi agar narasi suara langsung aktif menyapa.

---

# BAGIAN 2: PANDUAN OPERASIONAL SISWA (PENGGUNAAN MANDIRI TANPA LAYAR)

Siswa tunanetra dapat mengoperasikan 100% alur belajar secara mandiri menggunakan tangan mereka.

## 2.1 Prosedur Login Taktil Siswa (Zero-Password & Zero-Screen Login dengan Blok Identitas)
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

## 2.2 Orientasi Awal Siswa pada Papan Fisik
Ajak siswa meraba papan dan kenalkan patokan orientasi tubuh mereka:
* **Tepi Bawah (Paling Dekat dengan Dada Siswa)**: Merupakan **Baris 1** (kotak $A1, B1, C1, D1, E1$).
* **Tepi Atas (Paling Jauh dari Siswa)**: Merupakan **Baris 5** (kotak $A5, B5, C5, D5, E5$).
* **Tepi Kiri**: Merupakan **Kolom A**.
* **Tepi Kanan**: Merupakan **Kolom E**.
* **Pusat Papan**: Kotak **$C3$** berada tepat di tengah-tengah papan.

---

## 2.3 Peta Pintasan Taktil (*Tangible Shortcuts*)
Untuk memilih menu atau materi, siswa **cukup meletakkan 1 balok apa saja** di kotak pintasan berikut:

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

| Kotak | Aksi / Menu yang Terbuka | Umpan Balik Suara Narator |
| :---: | :--- | :--- |
| **A1** | **Tahap 1: Pengenalan Komponen** | *"Membuka Tahap 1: Pengenalan Bentuk Taktil..."* |
| **B1** | **Tahap 2: Kuis Taktil** | *"Membuka Tahap 2: Kuis Taktil Interaktif..."* |
| **C1** | **Tahap 3: Rangkaian Seri** | *"Membuka Tahap 3: Panduan Rangkaian Seri..."* |
| **D1** | **Tahap 4: Rangkaian Paralel** | *"Membuka Tahap 4: Panduan Rangkaian Paralel..."* |
| **E1** | **Tahap 5: Detektif Sirkuit** | *"Membuka Tahap 5: Tantangan Detektif Sirkuit..."* |
| **A5** | **Tanya AI Tutor** | *"Membuka Tanya AI Tutor. Silakan angkat balok dari A5..."* |
| **C5** | **Mode Eksplorasi Bebas** | *"Selamat datang di Mode Eksplorasi Bebas LENTERA..."* |
| **E5** | **Kembali ke Menu Utama / Keluar** | *"Kembali ke menu utama LENTERA Lab..."* |

---

## 2.4 Operasional Tahap 1: Pengenalan Komponen (Fokus di Sel C3)
1. Dengarkan instruksi narator yang meminta mencari komponen tertentu (contoh: *"Cari balok baterai dengan tanda plus dan minus timbul"*).
2. Raba balok di meja, temukan bentuk yang diminta, lalu letakkan di **sel C3 tepat di tengah papan**.
3. **Jika Peletakan Tepat**:
   * Terdengar suara *ding* sukses.
   * Narator menjelaskan fungsi komponen tersebut.
   * Narator menginstruksikan: *"Sekarang angkat balok dari papan untuk lanjut ke komponen berikutnya."*
4. **Jika Salah Kotak (Misal diletakkan di C1)**:
   * Narator otomatis membimbing arah koreksi:
     > *"Kamu meletakkan balok di kotak C1. Posisi pengenalan ada di sel C3 di tengah papan. Silakan geser 2 kotak ke atas."*
5. Siswa menggeser balok sesuai arahan hingga tepat di $C3$.

---

## 2.5 Operasional Tahap 2: Kuis Taktil Interaktif (B3, D3, C4, C2)
Kuis terdiri dari 4 pertanyaan rabaan seputar fungsi komponen:
1. Dengarkan pertanyaan dari narator (contoh: *"Pertanyaan pertama: Komponen manakah yang berfungsi memutus dan menyambung aliran listrik?"*).
2. Narator menyebutkan kotak target jawaban:
   * Pertanyaan 1 $\to$ Letakkan jawaban di **kotak B3** (sebelah kiri tengah papan, tepat di kiri C3).
   * Pertanyaan 2 $\to$ Letakkan jawaban di **kotak D3** (sebelah kanan tengah papan, tepat di kanan C3).
   * Pertanyaan 3 $\to$ Letakkan jawaban di **kotak C4** (bagian tengah atas papan, tepat satu kotak di atas C3).
   * Pertanyaan 4 $\to$ Letakkan jawaban di **kotak C2** (bagian tengah bawah papan, tepat satu kotak di bawah C3).
3. Raba balok jawaban yang benar di meja, lalu masukkan ke kotak yang ditentukan.
4. Sistem mengevaluasi seketika:
   * **Benar**: Terdengar nada gembira + penjelasan penguatan materi.
   * **Belum Tepat**: Narator memberikan petunjuk rabaan tambahan tanpa memotong suara (*"Cari balok yang memiliki tuas geser di atasnya..."*).
5. Angkat balok jika diminta untuk lanjut ke pertanyaan berikutnya.

---

## 2.6 Operasional Tahap 3 & 4: Merakit Rangkaian Seri & Paralel
Siswa merakit sirkuit lengkap langkah demi langkah:
1. Narator menyebutkan nama balok, posisi kotak, dan orientasi terminal (contoh: *"Langkah 1: Letakkan baterai di posisi B4, tanda plus menghadap ke atas menuju baris 5"*).
2. Raba simbol timbul pada balok untuk memastikan arah kutub/alurnya tidak terbalik.
3. Masukkan balok ke dalam slot grid.
4. Sistem mendeteksi otomatis dan melanjutkan ke langkah berikutnya:
   * **Jika polaritas terbalik (misal Lampu)**: Narator bersuara: *"Kutub lampu terbalik, silakan angkat balok dan putar 180 derajat."*
   * **Jika jalur belum nyambung**: Narator menyebutkan kotak mana yang belum terpasang kabel.
5. **Menyalakan Lampu di Langkah Terakhir**:
   * Pada langkah ke-13, seluruh balok sudah terpasang namun lampu belum menyala karena saklar masih OFF.
   * Raba tuas saklar di atas balok, lalu **putar atau geser tuas 90 derajat ke posisi ON**.
   * Rangkaian tertutup $\to$ Buzzer membunyikan *melodi kemenangan* $\to$ Narator mengumumkan keberhasilan menyelesaikan rangkaian!

---

## 2.7 Operasional Transisi Checkpoint (Pilihan Taktil A1 / E1)
Setelah suatu modul berhasil diselesaikan:
1. Narator menginstruksikan pembersihan papan:
   > *"Hebat sekali! Modul selesai. Silakan angkat semua balok dari papan hingga bersih."*
2. Siswa mengangkat seluruh balok dari papan.
3. Begitu papan kosong, narator menyajikan pilihan di baris bawah:
   > *"Papan sudah bersih. Apakah kamu ingin lanjut ke modul berikutnya? Letakkan balok di A1 untuk LANJUT, atau di E1 untuk ISTIRAHAT."*
4. **Keputusan Siswa**:
   * Letakkan balok di **A1 (Sudut Kiri Bawah)** $\to$ Modul berikutnya langsung dimulai.
   * Letakkan balok di **E1 (Sudut Kanan Bawah)** $\to$ Kembali ke menu eksplorasi/istirahat.
5. Angkat kembali balok konfirmasi untuk mulai merakit materi baru.

---

# BAGIAN 3: PANDUAN OPERASIONAL TANYA AI LIVE TUTOR (PUSH-TO-TALK)

Fitur ini memungkinkan siswa bertanya bebas layaknya berdialog dengan guru privat.

### Cara Membuka Mode Tanya AI Tutor:
* Letakkan balok apa saja di kotak **A5 (Sudut Kiri Atas)**, lalu segera angkat balok dari kotak tersebut.

### Prosedur Bertanya dengan Balok Fisik (Tangible Push-To-Talk):
```
[ Taruh Balok di A1 ] ──> [ Langsung Bicara ] ──> [ Angkat Balok dari A1 ] ──> [ AI Menjawab ]
```
1. **Mulai Bicara**: Letakkan satu balok di kotak **A1 (Sudut Kiri Bawah)**. Terdengar bunyi mikrofon aktif dan indikator perekaman suara menyala.
2. **Ajukan Pertanyaan**: Segera bicaralah dengan jelas menghadap ke arah mikrofon laptop/alat (contoh: *"Kak AI, kenapa lampu seri kedua-duanya mati kalau salah satu saklar saya buka?"*).
3. **Kirim Pertanyaan**: Segera **angkat balok dari kotak A1**.
4. **Mendengarkan Jawaban**: Sistem mentranskripsi pertanyaan via Groq Whisper dalam hitungan detik, lalu AI Tutor menjawab dengan suara ramah menggunakan analogi yang mudah dibayangkan tunanetra.
5. **Alternatif Tombol Keyboard**: Pendamping atau siswa low-vision juga dapat menekan tombol huruf **'V'** pada keyboard laptop untuk mulai dan selesai bicara.
6. **Kembali ke Menu Modul**: Letakkan balok di kotak **E5 (Sudut Kanan Atas)**.

---

# BAGIAN 4: PANDUAN OPERASIONAL GURU & PENDAMPING (DASHBOARD KENDALI)

Guru dapat memantau jalannya pembelajaran melalui laptop tanpa mengintervensi kemandirian siswa.

## 4.1 Memilih & Mengganti Profil Siswa
1. Di bilah menu atas dashboard web, klik nama profil siswa yang sedang aktif (contoh: *Dimas Putra*).
2. Pilih nama siswa yang akan belajar dari daftar dropdown:
   * **Ahmad Fadhil** (Kelas 8 - Mahir)
   * **Siti Rahma** (Kelas 7 - Pemula)
   * **Dimas Putra** (Kelas 8 - Menengah)
   * **Tamu / Juri Lomba** (Mode Sandbox Pengujian)
3. Browser akan menyuarakan konfirmasi: *"Profil aktif diubah ke [Nama Siswa]"*.
4. **Login Taktil via Kartu Siswa**:
   * Jika siswa memiliki kartu identitas fisik (ID 35: Via, ID 36: Amira, ID 37: Ajib), siswa cukup **meletakkan kartu mereka di sel A1**. Sistem akan otomatis mengaktifkan profil siswa tersebut dan membuka data progres belajarnya.

## 4.2 Pemantauan Sirkuit Real-time
* **Visualisasi Grid 5×5**: Menampilkan posisi balok nyata di meja siswa secara 1:1, status arus (garis bercahaya hijau), dan polaritas kutub.
* **Badge Status Sirkuit**:
  * 🟢 **Rangkaian Tertutup (Closed Loop)**: Sirkuit sukses, arus mengalir normal.
  * 🟡 **Rangkaian Terbuka (Open Loop)**: Sirkuit belum lengkap atau saklar masih OFF.
  * 🔴 **Korsleting (Short Circuit)**: Arus positif langsung ke negatif tanpa melewati lampu.

## 4.3 Menjalankan Kalibrasi Kamera Cepat (Jika Dibutuhkan)
Jika alat baru dipindahkan ke ruangan lain dan ada peringatan kotak tidak presisi:
1. Letakkan 4 balok di 4 sudut terluar: **A1, E1, A5, E5**.
2. Di dashboard guru, klik tombol **"Kalibrasi Kamera"** $\to$ klik **"Auto-Calibrate 4 Sudut"**.
3. Tunggu 2 detik hingga terdengar suara: *"Kalibrasi berhasil. Papan sudah terpetakan."*
4. Angkat kembali keempat balok dari sudut papan.

## 4.4 Melihat & Mengunduh Rapor Pembelajaran
1. Klik tombol **"Rapor Siswa"** di dashboard.
2. Rapor menampilkan:
   * Total skor XP dan lencana kompetensi yang diraih.
   * Persentase pemahaman konsep (Rangkaian Seri, Paralel, Polaritas LED, Logika Saklar).
   * Catatan kemandirian navigasi papan fisik siswa.
3. Klik **"Cetak / Simpan PDF"** untuk dokumentasi guru dan laporan wali murid.

---

# BAGIAN 5: PROSEDUR MEMATIKAN PERANGKAT (SAFE SHUTDOWN)

> [!CAUTION]
> Jangan pernah mencabut langsung kabel adaptor dari colokan listrik tanpa prosedur shutdown. Hal ini berisiko merusak sistem file MicroSD Raspberry Pi.

Lakukan salah satu dari 2 metode aman berikut:

### Metode 1: Menggunakan Tombol Fisik Panel Depan (Rekomendasi)
1. Tekan tombol stainless steel di panel depan sekali lagi hingga pengunci terlepas (*pop out*).
2. Sistem otomatis membunyikan melodi pamit pada buzzer.
3. Tunggu hingga cincin lampu LED pada tombol padam sepenuhnya (sekitar 10 detik).
4. Cabut kabel adaptor daya dari stopkontak. Alat telah mati dengan aman.

### Metode 2: Menggunakan Tombol di Dashboard Web
1. Di layar laptop guru, klik tombol merah **"Matikan Sistem"** di pojok header.
2. Narator bersuara: *"Alat LENTERA sedang dimatikan secara aman. Silakan tunggu lampu indikator padam..."*
3. Tunggu hingga cincin LED tombol fisik padam, lalu cabut kabel adaptor.

---

# BAGIAN 6: TINDAKAN CEPAT KENDALA OPERASIONAL (QUICK ACTION)

| Gejala Kendala | Kemungkinan Penyebab | Tindakan Cepat (Solusi 1 Menit) |
| :--- | :--- | :--- |
| **Suara narasi di laptop guru tidak terdengar sama sekali.** | Kebijakan browser menahan audio otomatis (*autoplay blocked*). | **Klik satu kali di sembarang area layar laptop** atau tekan bilah Spasi untuk membuka kunci audio. |
| **Balok diletakkan di kotak tapi sistem tidak merespons suara.** | 1. Stiker marker di bawah balok kotor/berdebu.<br>2. Lampu LED dalam alat belum menyala. | 1. Usap bagian bawah balok dengan kain bersih.<br>2. Intip melalui celah akrilik: pastikan lampu internal menyala terang. |
| **Buzzer berbunyi nada 'tit-tit-tit' cepat 3 kali berturut-turut.** | Terjadi **Korsleting** (baterai terhubung langsung kabel ke kabel tanpa melewati lampu). | Minta siswa mengangkat satu kabel penghubung, lalu pasang balok Lampu atau Saklar di antara jalur kabel tersebut. |
| **Lampu sirkuit tidak menyala padahal semua balok sudah tersambung rapat.** | 1. Tuas saklar masih dalam posisi OFF.<br>2. Kutub lampu LED terbalik. | 1. Raba tuas saklar di C5/C4/E4 dan geser ke posisi ON.<br>2. Angkat balok lampu, putar posisinya 180 derajat, lalu pasang kembali. |
| **Siswa bingung arah koreksi saat salah meletakkan balok.** | Siswa meletakkan balok di luar kotak target panduan. | Dengarkan petunjuk suara narator secara tenang (sistem otomatis menyebutkan: *"geser N kotak ke atas/bawah/kiri/kanan"*). |
| **Web di laptop guru terputus / status WebSocket Offline.** | Koneksi Wi-Fi laptop berpindah ke jaringan lain. | Buka pengaturan Wi-Fi laptop, pastikan tersambung kembali ke SSID: `LENTERA-AP`. |

---

*Panduan Operasional Resmi LENTERA — Siap Digunakan untuk Kegiatan Belajar Mengajar Harian di SLB & Demonstrasi Lomba.*
