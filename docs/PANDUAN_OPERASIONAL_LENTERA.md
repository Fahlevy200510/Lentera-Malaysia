# PANDUAN OPERASIONAL CEPAT LENTERA
### Petunjuk Pengoperasian Alat di Lapangan

---

## ALUR PENGOPERASIAN LENGKAP (LANGKAH DEMI LANGKAH)

```
[1. Nyalakan Hotspot HP: LENTERA / qwerty123]
                      │
                      ▼
[2. Colokkan Adaptor Daya]
                      │
                      ▼
[3. Tekan Tombol Power & Tunggu Buzzer Berbunyi]
                      │
                      ▼
[4. Buka Web di Browser (Klik Layar 1x untuk Suara)]
                      │
                      ▼
[5. Letakkan Blok Identitas Siswa untuk Login Otomatis]
                      │
                      ▼
[6. Pilih Materi & Belajar Mandiri via Papan Grid]
                      │
                      ▼
[7. Selesai: Tekan Tombol Power untuk Mematikan]
```

---

### Langkah 1: Nyalakan Hotspot (HP / Laptop)
* Aktifkan Hotspot Pribadi di HP atau laptop guru dengan konfigurasi:
  * **Nama Hotspot (SSID)**: `LENTERA`
  * **Password**: `qwerty123`
* *Raspberry Pi di dalam alat LENTERA akan otomatis tersambung ke hotspot ini saat menyala.*

### Langkah 2: Colokkan Adaptor Daya
* Tancapkan adaptor daya USB-C resmi ke alat LENTERA dan hubungkan ke stopkontak listrik.

### Langkah 3: Tekan Tombol Power & Tunggu Buzzer
* Tekan **Tombol Power Stainless** di panel depan sekali (terdengar klik mengunci).
* Lampu tombol dan lampu internal di bawah papan akan menyala.
* Tunggu beberapa saat (±20–30 detik) sampai **buzzer membunyikan nada melodi terakhir** (tanda sistem pengamat sudah siap).

### Langkah 4: Buka Web
* Buka browser (Chrome atau Edge) di HP atau laptop.
* Buka alamat web resmi LENTERA: **https://lenteraa.netlify.app**
* **Klik sembarang area layar sekali** agar browser mengaktifkan suara narator.

### Langkah 5: Login dengan Blok Identitas Siswa
* Siswa meletakkan **Blok Identitas pribadinya** (ID 35: Via, ID 36: Amira, atau ID 37: Ajib) di atas papan grid.
* Sistem otomatis mendeteksi, menyapa nama siswa secara personal (*"Halo [Nama Siswa]! Selamat datang..."*), dan langsung masuk ke ruang praktikum LENTERA Lab.

---

## FITUR-FITUR PEMBELAJARAN (NAVIGASI MANDIRI TANPA MOUSE)

Siswa tunanetra memilih materi cukup dengan **meletakkan 1 balok apa saja** di kotak berikut:

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

### 1. Baris Bawah (Dekat Siswa) — 5 Modul Pembelajaran:
* **Kotak A1 $\to$ Pengenalan Komponen**:
  * Siswa meraba balok yang diminta, lalu meletakkannya di **sel C3 (tepat di tengah papan)**.
  * Jika salah kotak, narator memberi panduan pergeseran (*"geser N kotak ke atas/bawah/kiri/kanan"*).
* **Kotak B1 $\to$ Kuis Taktil**:
  * Siswa menjawab tebakan fungsi komponen dengan meletakkan balok di kotak target ($B3$, $D3$, $C4$, atau $C2$).
* **Kotak C1 $\to$ Rangkaian Seri**:
  * Siswa merakit sirkuit seri langkah demi langkah mengikuti arahan suara narator.
  * Di langkah terakhir (langkah 13), siswa memutar tuas saklar ke posisi **ON** hingga kedua lampu menyala.
* **Kotak D1 $\to$ Rangkaian Paralel**:
  * Siswa merakit sirkuit cabang paralel dengan kabel cabang T.
  * Di langkah terakhir, siswa menyalakan saklar cabang untuk menguji kemandirian masing-masing lampu.
* **Kotak E1 $\to$ Tantangan Detektif Sirkuit**:
  * Misi pemecahan masalah (merangkai bebas hingga nyala, memutus saklar ke OFF, dan paralel 2 lampu).

### 2. Baris Atas — Fitur Tambahan & Kontrol:
* **Kotak A5 $\to$ Tanya AI Live Tutor**:
  * Letakkan balok di A5 untuk membuka fitur tanya-jawab suara.
  * **Cara Bertanya (Push-To-Talk)**: Letakkan balok di **kotak A1**, langsung bicara mengajukan pertanyaan. Jika sudah selesai bicara, segera **angkat balok dari A1** $\to$ AI Tutor akan langsung menjawab via suara.
* **Kotak C5 $\to$ Mode Eksplorasi Bebas**:
  * Siswa bebas merakit rangkaian apa saja di papan. AI Tutor mengamati dan memberi petunjuk jika sirkuit belum menyala atau korslet.
* **Kotak E5 $\to$ Keluar Sesi / Kembali ke Menu Utama**:
  * Letakkan balok di E5 untuk kembali ke menu panduan.

### 3. Transisi Selesai Modul:
* Setiap kali suatu modul selesai dirakit:
  1. Narator meminta: *"Silakan angkat semua balok dari papan hingga bersih."*
  2. Saat papan kosong, narator menyajikan pilihan taktil:
     * Letakkan balok di **A1** untuk **LANJUT** ke materi berikutnya.
     * Letakkan balok di **E1** untuk **ISTIRAHAT** / kembali ke menu utama.

---

## CARA MEMATIKAN ALAT (SAFE SHUTDOWN)

1. Tekan kembali **Tombol Power Stainless** di panel depan sekali lagi (hingga tombol terlepas / *pop out*).
2. Buzzer akan membunyikan melodi pamit.
3. Tunggu hingga cincin lampu LED pada tombol padam sepenuhnya (±10 detik).
4. Cabut adaptor daya dari stopkontak.
