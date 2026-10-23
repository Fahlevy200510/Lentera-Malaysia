# Panduan Instalasi & Uji Coba Tombol Power Fisik (Stainless 4-Pin) LENTERA

Dokumen ini disusun sebagai panduan *trial & error* pengkabelan (*wiring*) dan konfigurasi tombol *push button* stainless 4-pin (dengan ring LED) pada Raspberry Pi.

---

## 1. Identifikasi Pin pada Tombol Stainless 4-Pin

Di bagian belakang saklar terdapat 4 kaki terminal:
1. **`+` (LED Anoda)**: Kaki positif untuk lampu cincin LED tombol.
2. **`-` (LED Katoda)**: Kaki negatif untuk lampu cincin LED tombol.
3. **Kontak Saklar A (NO / Pin 1)**: Kaki saklar (bebas polaritas bolak-balik).
4. **Kontak Saklar B (C / Pin 2)**: Kaki saklar (bebas polaritas bolak-balik).

*(Gunakan multimeter mode kontinuitas/beep untuk memastikan kedua kaki saklar terhubung saat ditekan).*

---

## 2. Metode 1 (Rekomendasi Utama): GPIO 3 Safe Wake-Up & Status LED

Metode ini menggunakan fitur bawaan chip Broadcom Raspberry Pi. 
- **Kelebihan**: 100% aman untuk kartu memori MicroSD (bebas risiko file *corrupt*), tidak perlu memotong kabel adaptor daya.
- **Cara Kerja**: Adaptor tetap tercolok. Saat Pi dalam kondisi mati (*halt/standby*), menekan tombol akan menghubungkan GPIO 3 ke Ground sehingga Pi otomatis **bangun & booting**. LED tombol menyala hanya saat sistem aktif.

### A. Skema Pengkabelan (Wiring Pinout)

| Kaki Tombol | Sambungkan ke Pin Raspberry Pi | Nomor Pin Fisik Header | Fungsi |
| :--- | :--- | :---: | :--- |
| **Kontak Saklar 1** | **GPIO 3 (SCL)** | **Pin 5** | Pemicu Bangun (*Wake-up*) / Shutdown |
| **Kontak Saklar 2** | **GND (Ground)** | **Pin 6** | Ground Tombol |
| **LED (+)** | **GPIO 14 (UART TXD)** | **Pin 8** | Indikator Status Nyala/Mati Otomatis |
| **LED (-)** | **GND (Ground)** | **Pin 9** | Ground Lampu LED |

```
                       ┌───────────────────────────────┐
                       │   TOMBOL STAINLESS 4-PIN      │
                       │                               │
                       │   [Kontak 1]     [Kontak 2]   │
                       │       │              │        │
                       │     [LED +]        [LED -]    │
                       └───────┬──────────────┬────────┘
                               │              │
        ┌──────────────────────┼──────────────┼─────────────────────┐
        │                      │              │                     │
        ▼                      ▼              ▼                     ▼
  Pin Fisik 5            Pin Fisik 8     Pin Fisik 6           Pin Fisik 9
 (BCM 3 / SCL)         (GPIO 14 / TXD)     (GND)                 (GND)
```

> **Catatan Pin Fisik 8 (UART TXD):**
> Pin ini secara hardware otomatis bertegangan 3.3V ketika Raspberry Pi sedang aktif/booting, dan otomatis 0V (mati) ketika OS selesai melakukan shutdown. Ini membuat LED tombol menjadi indikator daya yang akurat tanpa perlu kode python tambahan.

---

### B. Konfigurasi Software di Raspberry Pi

1. Buka file konfigurasi boot kernel melalui terminal SSH:
   ```bash
   sudo nano /boot/firmware/config.txt
   ```
   *(Untuk Raspberry Pi OS versi lama, gunakan `sudo nano /boot/config.txt`)*.

2. Tambahkan 2 baris berikut di baris paling bawah:
   ```ini
   # LENTERA Power Button & Status LED
   dtoverlay=gpio-shutdown,gpio_pin=3
   enable_uart=1
   ```

3. Simpan perubahan: Tekan `Ctrl + O`, lalu `Enter`. Keluar dengan `Ctrl + X`.
4. Muat ulang sistem:
   ```bash
   sudo reboot
   ```

---

### C. Prosedur Uji Coba (Trial & Error Checklist)

1. **Uji Nyala LED Tombol:**
   - Saat Raspberry Pi selesai booting, perhatikan apakah ring LED pada tombol menyala.
2. **Uji Shutdown Aman:**
   - Buka Web Portal dan klik tombol **Matikan Alat** (atau tekan tombol fisik sekali).
   - Perhatikan LED tombol: setelah sistem menutup semua proses (~5–8 detik), LED tombol harus **padam total**.
3. **Uji Wake-Up (Menyalakan Kembali):**
   - Dengan adaptor tetap tercolok dan LED tombol dalam keadaan padam, tekan tombol fisik sekali.
   - Raspberry Pi harus langsung bangun, LED tombol menyala kembali, dan buzzer berbunyi saat aplikasi siap.

---

## 3. Metode 2 (Alternatif): Pemutus Daya Fisik Jalur 5V (*Hard Cut*)

*Hanya gunakan metode ini jika tombol Anda adalah tipe **Latching (Klik mengunci ON, klik lagi lepas OFF)** dan Anda ingin listrik benar-benar terputus dari stopkontak.*

### A. Skema Pengkabelan
- Potong kabel positif (+5V, kabel warna merah) dari adaptor daya USB.
- Sambungkan ujung kabel merah dari adaptor ke **Kontak Saklar 1**.
- Sambungkan ujung kabel merah menuju Raspberry Pi ke **Kontak Saklar 2**.
- Sambungkan kaki **LED (+)** ke Kontak Saklar 2 (+5V setelah saklar).
- Sambungkan kaki **LED (-)** ke kabel Ground (kabel warna hitam).

### B. Prosedur Aman Menggunakan Metode 2
> [!CAUTION]
> Mematikan paksa dengan memutus listrik 5V saat sistem sedang menulis data berisiko merusak sistem file MicroSD.
> 
> **Aturan Matikan:** Selalu klik tombol **"Matikan Alat"** di Web Portal terlebih dahulu. Tunggu sampai lampu indikator aktivitas di Raspberry Pi padam, **baru tekan tombol fisik untuk melepas aliran daya**.

---

## 4. Troubleshooting & Catatan Praktis

- **LED Tombol Terlihat Redup di 3.3V:**
  Sebagian tombol stainless 22mm memiliki resistor internal untuk 12V. Jika di Pin 8 (3.3V) cahayanya terlalu redup, kaki **LED (+)** dapat dipindahkan ke **Pin Fisik 2 (5V)** (pada kondisi ini LED menyala konstan selama adaptor tercolok).
- **Cara Membatalkan / Rollback Konfigurasi:**
  Jika ingin menghapus fungsi tombol, cukup hapus baris `dtoverlay=gpio-shutdown,gpio_pin=3` dari file `/boot/firmware/config.txt` lalu reboot.
