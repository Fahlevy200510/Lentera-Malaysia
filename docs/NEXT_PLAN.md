# LENTERA MALAYSIA — Roadmap & Next Action Plan
*Dokumen Rencana Tindak Lanjut & Panduan Teknis Fitur LENTERA*
*Terakhir Diperbarui: 20 Oktober 2026*

---

## 1. Status Terkini & Fitur yang Baru Selesai (Current Accomplishments)

Sistem LENTERA telah berhasil mencapai kestabilan operasional *plug-and-play* tanpa perlu layar monitor atau keyboard:

### A. Fitur Auto-Discovery Cloudflare Quick Tunnel (Zero-Config Relay)
- **Problem Sebelumnya**: Pengguna/guru harus mengetik IP lokal atau domain ngrok manual setiap kali IP berganti.
- **Implementasi**:
  - Script [`start_tunnel_autosync.sh`](file:///l:/LENTERA%20MALAYSIA/start_tunnel_autosync.sh) otomatis menjalankan `cloudflared` tanpa token/akun berbayar.
  - Alamat publik `*.trycloudflare.com` dikirim secara otomatis ke relay aman `https://ntfy.sh/lentera_malaysia_edge_tunnel`.
  - Komponen [`ArUcoDetector.tsx`](file:///l:/LENTERA%20MALAYSIA/Lentera-Portal/components/aruco/ArUcoDetector.tsx) di Web Portal otomatis mengambil domain terbaru dari relay tersebut saat halaman dibuka.
  - Berjalan sebagai service otomatis saat boot via `lentera-tunnel.service`.

### B. Stabilisasi Jaringan WebSocket & Anti-Disconnect
- **Problem Sebelumnya**: Koneksi web putus-nyambung tiap 30–50 detik karena stream kamera ukuran besar menyumbat antrean hotspot 4G, memicu *WebSocket ping timeout*.
- **Implementasi**:
  - Di [`WSServer`](file:///l:/LENTERA%20MALAYSIA/backend/server/ws_server.py), `ping_interval` dan `ping_timeout` dinonaktifkan (`None`) agar server tidak memutus sambungan secara sepihak.
  - Frame kamera dibatasi ke ~5 FPS (resolusi 400x300, JPEG quality 48), menekan bandwidth ke ~50 KB/s (sangat ringan untuk hotspot seluler).

### C. Pembersihan Noise & Anti-Ghosting ArUco
- **Problem Sebelumnya**: Muncul ID acak (37, 41, dll.) yang bergerak-gerak akibat bayangan/pantulan akrilik, dan pembacaan sudut berkedip-kedip.
- **Implementasi**:
  - Di [`VisionCore`](file:///l:/LENTERA%20MALAYSIA/backend/core/vision.py), parameter deteksi dikembalikan ke `CORNER_REFINE_SUBPIX` yang presisi dan hemat CPU (beban CPU turun dari 200% ke <45%).
  - Memasang filter ketat: hanya menerima ID resmi Lentera (ID 1 s.d. 9). Semua noise bayangan yang menghasilkan ID di luar itu otomatis dibuang.
  - Mengetatkan validasi border hitam (`maxErroneousBitsInBorderRate = 0.25`) agar pantulan cahaya tidak terdeteksi sebagai marker.
  - Di [`main.py`](file:///l:/LENTERA%20MALAYSIA/main.py), diterapkan *spatial tracker* dengan toleransi dropout 0.5 detik sehingga marker tidak pernah berkedip (*zero flicker*).

### D. Kalibrasi Spasial 4 Sudut Bebas ID
- **Problem Sebelumnya**: Jika 4 sudut papan kalibrasi dipasang balok sejenis (misal kabel yang ID-nya sama), sistem hanya mengenali 1–3 marker sehingga kalibrasi gagal.
- **Implementasi**:
  - Algoritma kalibrasi dirombak berbasis koordinat fisik spasial (*Euclidean clustering* jarak < 30px), bukan ID marker. Komponen apa pun (bahkan jika semua sudut memakai kabel ber-ID sama) akan langsung berhasil terkalibrasi.

### E. Remote Safe Shutdown dari Web Portal
- **Problem Sebelumnya**: Raspberry Pi rawan rusak/corrupt kartu MicroSD jika kabel adaptor langsung dicabut paksa tanpa perintah `sudo shutdown`.
- **Implementasi**:
  - Tombol **"Matikan Alat"** berikon Power ditambahkan di antarmuka web.
  - Dilengkapi dialog konfirmasi untuk mencegah ketidaksengajaan.
  - Raspberry Pi menerima sinyal WebSocket `{ "type": "command", "action": "shutdown" }`, memutar suara panduan di speaker, membunyikan 3x bip buzzer, lalu mengeksekusi shutdown bersih (`sudo poweroff || sudo shutdown -h now`) untuk meng-unmount MicroSD secara aman.

### F. Eliminasi Layar Verifikasi Macet (`/aruco`)
- **Problem Sebelumnya**: Halaman web sempat tertahan di layar *"Memverifikasi akun LENTERA..."* jika dibuka di tab/browser tanpa sesi tersimpan.
- **Implementasi**:
  - Di [`app/aruco/page.tsx`](file:///l:/LENTERA%20MALAYSIA/Lentera-Portal/app/aruco/page.tsx), pengecekan sesi yang memblokir render telah dihapus. Sesi tamu/siswa otomatis aktif sehingga halaman kamera langsung terbuka instan.

---

## 2. Rencana Tindak Lanjut (Next Action Plan)

### Tahap 1: Pengujian Lapangan Fisik (Physical Field Testing)
1. **Cetak Ulang Marker ArUco (Matte / Non-Glare)**:
   - Cetak marker ID 1 sampai 7 pada kertas doff/matte (hindari kertas glossy yang memantulkan lampu LED).
   - Ukuran ideal: 2.5 cm – 3.5 cm sesuai ukuran kotak cekung (*pocket*) akrilik.
   - Pasang marker pada bagian bawah balok komponen tactile.
2. **Uji Coba Kalibrasi 4 Sudut**:
   - Nyalakan alat LENTERA.
   - Letakkan 4 komponen di sel paling luar: A1, E1, A5, dan E5.
   - Buka Web Portal dan klik tombol **Kalibrasi**.
   - Pastikan terdengar konfirmasi audio *"Kalibrasi berhasil. Papan sudah terpetakan"* dan lingkaran grid 5x5 sejajar dengan kotak fisik.
3. **Uji Coba Performa Baterai & Rangkaian Tertutup**:
   - Letakkan Baterai di sel A1, Lampu di C1, Saklar di E1, dan hubungkan dengan kabel lurus/siku.
   - Tutup saklar dan pastikan:
     - LED fisik di papan menyala (GPIO BCM 18/23/24/25).
     - Diagram SVG di web menampilkan garis bercahaya (status *Circuit Complete*).
     - Speaker mengeluarkan narasi keberhasilan sirkuit tertutup.

---

### Tahap 2: Implementasi Solusi Tombol Fisik (Opsi 2 — Hardware Power Button)
*Tujuan: Memungkinkan alat dimatikan DAN dinyalakan kembali cukup dengan menekan tombol fisik di casing, tanpa perlu buka web.*

1. **Rangkaian Hardware**:
   - Pasang 1 buah *push button (momentary)* di panel casing.
   - Sambungkan 2 kaki tombol ke:
     - **Pin Fisik 5 (BCM GPIO 3 / SCL)**
     - **Pin Fisik 6 (GND / Ground)**
2. **Konfigurasi Linux Kernel**:
   - Buka file `/boot/firmware/config.txt` (atau `/boot/config.txt` pada OS versi lama) di Raspberry Pi:
     ```bash
     sudo nano /boot/firmware/config.txt
     ```
   - Tambahkan baris berikut di baris paling bawah:
     ```ini
     dtoverlay=gpio-shutdown,gpio_pin=3
     ```
   - Simpan (`Ctrl+O`, `Enter`) dan keluar (`Ctrl+X`).
3. **Mekanisme Kerja**:
   - **Saat menyala**: Tekan tombol 1 detik $\rightarrow$ OS Linux otomatis mengeksekusi *clean safe shutdown*.
   - **Saat mati (adaptor tetap dicolok)**: Tekan tombol 1 detik $\rightarrow$ Hardware Pi otomatis terbangun (*wake up*) dan booting ulang tanpa perlu mencabut kabel!

---

### Tahap 3: Optimasi Startup Audio Bluetooth / Speaker
- **Kondisi Saat Ini**: Di file `install_service.sh`, ada baris `ExecStartPre=-/usr/bin/bluetoothctl connect DF:7F:21:02:F8:59` yang memakan waktu timeout 6 detik jika speaker bluetooth sedang mati.
- **Rencana Peningkatan**:
  - Tambahkan timeout agresif (2 detik) atau pengecekan latar belakang *asynchronous*.
  - Buat mekanisme fallback instan: jika Bluetooth tidak ditemukan dalam 2 detik, sistem otomatis mengalihkan output ke jack audio 3.5mm onboard tanpa memperlambat waktu boot.

---

### Tahap 4: Integrasi Modul Evaluasi Kurikulum (Lentera Learn & LIDM)
1. **Mode Tantangan / Lab Lessons**:
   - Menghubungkan pembacaan grid fisik dengan tantangan materi (misal: *"Buatlah rangkaian paralel dengan 2 lampu"*).
   - Evaluasi graf sirkuit di [`circuit.py`](file:///l:/LENTERA%20MALAYSIA/backend/logic/circuit.py) mencocokkan susunan fisik siswa dengan kunci jawaban lesson dan memberikan skor XP.
2. **Dokumentasi & Video Demo**:
   - Merekam alur *end-to-end* (Alat dicolok listrik $\rightarrow$ bip siap $\rightarrow$ buka web portal $\rightarrow$ rakit komponen $\rightarrow$ lampu menyala $\rightarrow$ matikan alat via web/tombol).

---

## 3. Ringkasan Perintah Penting (Cheat Sheet)

| Kebutuhan | Perintah di Terminal Raspberry Pi |
| :--- | :--- |
| **Tarik Update Kode Terbaru** | `cd ~/Lentera-Malaysia && git pull origin main` |
| **Restart Service Pengamat** | `sudo systemctl restart lentera.service` |
| **Restart Service Tunnel** | `sudo systemctl restart lentera-tunnel.service` |
| **Cek Status Kamera & Visi** | `sudo systemctl status lentera.service` |
| **Lihat Log Kamera Live** | `sudo journalctl -u lentera -f` |
| **Lihat Log Alamat Tunnel** | `sudo journalctl -u lentera-tunnel -n 20 --no-pager` |
| **Matikan Pi Secara Manual** | `sudo poweroff` atau `sudo shutdown -h now` |
