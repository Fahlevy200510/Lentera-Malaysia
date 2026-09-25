# Catatan Serah Terima (Handover) LENTERA
*Dibuat untuk melanjutkan sesi kerja di obrolan (chat) baru.*

## 1. Pencapaian Sesi Sebelumnya
*   **Logika Grid 5x5 & Auto-Calibration:** Berhasil mengubah pemetaan sirkuit fisik Lentera dari 3x3 menjadi 5x5 yang utuh. Sistem komputer visi (Raspberry Pi) kini dilengkapi fitur kalibrasi matriks 4-titik agar tangkapan kamera tetap akurat meski miring.
*   **Web Portal Interaktif (SVG Dinamis):** Halaman *Edge Lab* (`app/aruco/page.tsx`) dirombak total. Skema sirkuit statis telah diganti menjadi **live SVG diagram** yang kabelnya bisa berubah otomatis secara *real-time* mengikuti letak komponen di dunia nyata.
*   **Text-to-Speech (Suara Asisten):** Karena Raspberry Pi kekurangan mesin suara (pyttsx3 gagal), suara narator AI ("Lamp placed at C1") dialihkan agar diucapkan langsung melalui *browser* pengguna dengan memanfaatkan *Web Speech API*.
*   **Background Daemon (Raspberry Pi):** Dibuatkan `install_service.sh` agar `main.py` berjalan sebagai *service* latar belakang yang menyala otomatis saat Raspberry Pi dicolokkan ke listrik, tanpa perlu mengetik apapun.
*   **Penyatuan Git:** Seluruh repositori berhasil dibersihkan dari *submodule* yang bermasalah dan digabungkan permanen ke `github.com/Fahlevy200510/Lentera-Malaysia`.

## 2. Peringatan Penting (Context Status)
*   **JANGAN LAKUKAN MERGE DARI TEMAN (BirelaMP):** Sempat ada upaya *merge* dari cabang `updated-23-sept` milik teman pengguna, namun hal tersebut menyebabkan `package.json` rusak dan *Internal Server Error* (karena butuh Supabase dll). 
*   **Status Terkini:** Seluruh kode saat ini dijamin **bersih dan stabil** tanpa sentuhan kode teman pengguna. Namun, halaman *Edge Lab* sudah kita desain ulang secara mandiri agar terasa elegan (bergaya Sidebar) seperti desain *Lentera Learn*.

## 3. Rencana Sesi Selanjutnya (To-Do List)
Saat pengguna memulai obrolan baru, lanjutkan dengan agenda berikut:
1.  **Vercel Deployment:** Membantu mempublikasikan / *hosting* web aplikasi `Lentera-Portal` ke layanan Vercel agar dapat diakses dari internet.
2.  **Hardware Field Testing:** Melakukan uji coba menyeluruh ke fisik perangkat keras (Raspberry Pi dan ArUco Marker) untuk menguji keakuratan matriks 5x5 baru.
3.  **Integrasi Lanjutan (Opsional):** Jika teman pengguna (BirelaMP) ingin menyatukan halamannya, arahkan pengguna untuk menyalinnya secara manual per-file, BUKAN melalui *git merge* otomatis.
