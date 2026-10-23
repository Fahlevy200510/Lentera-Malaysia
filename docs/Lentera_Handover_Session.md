# Catatan Serah Terima (Handover) LENTERA
*Dibuat untuk melanjutkan sesi kerja di obrolan (chat) baru.*

## 1. Status Terkini (Sudah Teruji & Tersimpan Aman di GitHub)
*   **Rotasi & Arah Komponen ArUco (100% Final):**
    - Alur visi telah diselaraskan dengan kamera di bawah papan (*under-board mirror compensation*).
    - Rumus rotasi: `rot = (360 - raw_angle) % 360` tanpa offset membingungkan.
    - Hysteresis rotasi di `debounce.py` diperbaiki (rotasi baru 90° diterima lancar tanpa harus mengangkat blok).
    - Live video preview di `main.py` dibalik vertikal (`cv2.flip(frame, 0)`) sehingga A1 tampil di kiri bawah, persis sesuai sudut pandang siswa.
*   **6 Komponen Resmi & ID Fisik Terkunci (Urut 1 s.d. 6):**
    - Filter kamera `valid_ids` di `vision.py` dan `MARKER_ID_MAP` di `grid_state.py` dikunci rapi ke 6 ID urut:
      1: **Baterai** (+ Atas, − Bawah pada 0°)
      2: **Kabel Lurus** (─)
      3: **Kabel Siku L** (└)
      4: **Kabel Simpang T** (┬)
      5: **Lampu** (+ Kiri, − Kanan pada 0°)
      6: **Saklar** (0°/180° = OFF, 90°/270° = ON, fallback ID 7 tetap didukung toleransi)
*   **Logika Fisika Rangkaian & Deteksi Korsleting (`circuit.py`):**
    - Pembatasan terminal fisik: arus hanya bisa masuk/keluar melalui sisi terminal komponen (bukan bebas 4 arah).
    - Deteksi korsleting (*short circuit*) sebagai prioritas tertinggi: buzzer berbunyi 3x alarm, banner merah web berkedip.
    - Pengecekan polaritas lampu (*forward bias*): kutub `+` baterai harus mengalir ke `+` lampu (anoda). Jika terbalik, dilaporkan status `polarity_reversed`.
*   **Hardware Output:**
    - Modul lampu LED fisik 4-pin telah dihapus dari kode. Hanya buzzer aktif di pin BCM 17.
    - Telah dibuat panduan uji coba tombol power fisik di `PANDUAN_POWER_BUTTON.md`.

## 2. Peringatan Penting
*   **Git Status:** Repositori bersih dan tersinkronisasi penuh dengan `main` di `github.com/Fahlevy200510/Lentera-Malaysia`.
*   **Raspberry Pi:** Perlu menjalankan `git pull` dan me-restart service (`sudo systemctl restart lentera.service`) untuk menerapkan semua pembaruan ini ke hardware alat fisik.

## 3. Rencana Sesi Selanjutnya (To-Do List)
1.  **Raspberry Pi Live Field Testing:** Menjalankan sistem di Raspberry Pi dan menguji coba dengan 6 balok fisik nyata di papan akrilik.
2.  **Trial Tombol Power Fisik:** Uji coba skema pengkabelan tombol 4-pin sesuai petunjuk di `PANDUAN_POWER_BUTTON.md`.
