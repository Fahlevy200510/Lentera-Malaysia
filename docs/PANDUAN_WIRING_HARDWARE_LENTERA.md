# Panduan Wiring Hardware LENTERA: Detent Switch 4-Pin & Driver Buzzer 2N2222

Dokumen ini adalah panduan teknis resmi pengkabelan (*wiring*) perangkat keras LENTERA pada header 40-pin Raspberry Pi, mencakup:
1. **Push Button Stainless 4-Pin (Tipe Detent / Latching)** lengkap dengan cincin LED indikator.
2. **Active / Passive Piezo Buzzer** dengan proteksi sirkuit **Transistor NPN 2N2222** dan resistor basis 1kΩ.

---

## 1. Daftar Komponen yang Dibutuhkan

| No | Komponen | Spesifikasi / Keterangan | Fungsi Utama |
| :---: | :--- | :--- | :--- |
| 1 | **Raspberry Pi** | Raspberry Pi 4 Model B atau 3B+ (Header 40-Pin) | Otak utama pemroses visi komputer & audio |
| 2 | **Tombol Detent** | Push Button Stainless 4-Pin (16mm atau 22mm, tipe Latching/Mengunci) | Saklar daya program ON/OFF & indikator LED |
| 3 | **Piezo Buzzer** | 5V Active Buzzer (SFM-27/SFM-20) atau Passive Buzzer | Penghasil nada melodi siap & haptic earcon |
| 4 | **Transistor NPN** | **2N2222** (Kemasan TO-92) | Saklar elektronik (*driver*) penguat arus buzzer |
| 5 | **Resistor** | **1 kΩ** (Warna: Cokelat - Hitam - Merah - Emas) | Pembatas arus basis pelindung GPIO 17 |
| 6 | **Kabel Jumper** | DuPont Cable Female-to-Female & Female-to-Male | Jalur koneksi header |

---

## 2. Pinout Transistor 2N2222 (Kemasan TO-92)

Pegang transistor dengan **sisi datar (yang bertuliskan "2N2222") menghadap ke arah mata Anda**, dengan kaki-kaki menghadap ke bawah:

```
      ┌───────────────┐
      │ 2 N 2 2 2 2   │   <-- Sisi Datar (Flat Face)
      └──────┬────────┘
        │    │    │
        1    2    3
        │    │    │
        E    B    C
```

- **Kaki 1 (Kiri)  = Emitter (E)** ➔ Sambungkan ke **GND** (Ground Raspberry Pi).
- **Kaki 2 (Tengah)= Base (B)**    ➔ Sambungkan ke **Resistor 1kΩ**, lalu ke **GPIO 17**.
- **Kaki 3 (Kanan) = Collector (C)**➔ Sambungkan ke **Kaki Negatif (-) Buzzer**.

---

## 3. Skema Sirkuit Driver Buzzer (Low-Side NPN Switch)

### Mengapa Membutuhkan Transistor 2N2222?
- Pin GPIO Raspberry Pi hanya mampu mengalirkan arus maksimal ±16 mA pada tegangan 3.3V. Menghubungkan buzzer langsung ke GPIO berisiko membebani chip SoC Raspberry Pi.
- Transistor 2N2222 berfungsi sebagai *low-side switch*: GPIO 17 hanya perlu menyuplai arus basis sangat kecil (~2.6 mA) yang sangat aman, sementara buzzer mendapat suplai daya 5V penuh sehingga suara melodi terdengar nyaring, jernih, dan tidak membebani Pi.

### Diagram Skematik Sirkuit Buzzer:
```
                       +5V (Pin Fisik 2 Header Pi)
                           │
                           ▼
                     ┌───────────┐
                     │  [ + ]    │
                     │  BUZZER   │  Piezo Buzzer 5V
                     │  [ - ]    │
                     └─────┬─────┘
                           │
                           ▼
                     Collector (C) [Kaki 3]
                   ┌─────────────────┐
GPIO 17 ──[1kΩ]───┤ Base (B)        │  Transistor 2N2222 (NPN)
(Pin 11)           │ [Kaki 2]        │
                   │                 │
                   └───────┬─────────┘
                     Emitter (E) [Kaki 1]
                           │
                           ▼
                       GND (Pin Fisik 6 atau 14 Header Pi)
```

---

## 4. Skema Tombol Detent 4-Pin

Di bagian belakang tombol terdapat 4 terminal:
- **`+`** : Positif lampu cincin LED tombol.
- **`-`** : Negatif lampu cincin LED tombol.
- **Kontak NO 1 & Kontak NO 2** : Dua kaki saklar yang saling terhubung saat tombol tertekan mengunci (ON), dan terputus saat tombol dilepas (OFF).

```
                ┌─────────────────────────────────┐
                │   TOMBOL DETENT 4-PIN LENTERA   │
                │                                 │
                │   [Kontak 1]       [Kontak 2]   │
                │       │                │        │
                │     [LED +]          [LED -]    │
                └───────┬────────────────┬────────┘
                        │                │
 ┌──────────────────────┼────────────────┼──────────────────────┐
 │                      │                │                      │
 ▼                      ▼                ▼                      ▼
Pin 5 (GPIO 3)        Pin 36 (GPIO 16)   Pin 39 (GND)          Pin 34 (GND)
(Deteksi & Wake-Up)   (Lampu LED Saklar) (Ground Kontak)       (Ground LED)
```

---

## 5. Tabel Terpadu Pengkabelan Header Raspberry Pi (40-Pin)

Semua komponen terhubung ke pin header tanpa ada yang tumpang tindih:

| Pin Fisik Header | Label Pin | Terhubung Ke | Keterangan Fungsi |
| :---: | :---: | :--- | :--- |
| **Pin 2** | **5V Power** | **Kaki Positif (+) Buzzer** | Sumber tegangan 5V utama buzzer |
| **Pin 5** | **GPIO 3** | **Kontak Saklar NO 1 Tombol** | Input sensor saklar ON/OFF & Hardware Wake-up |
| **Pin 6** atau **14** | **GND** | **Emitter (Kaki 1) 2N2222** | Ground untuk rangkaian transistor buzzer |
| **Pin 11** | **GPIO 17** | **Salah satu ujung Resistor 1kΩ** | Sinyal kontrol audio buzzer (PWM / Logika HIGH) |
| — | — | *Ujung Resistor 1kΩ lainnya ke Base (Kaki 2) 2N2222* | Pembatas arus pengaman GPIO |
| — | — | *Collector (Kaki 3) 2N2222 ke Kaki Negatif (-) Buzzer* | Jalur saklar arus buzzer |
| **Pin 34** | **GND** | **Kaki LED (-) Tombol** | Ground lampu ring LED tombol |
| **Pin 36** | **GPIO 16** | **Kaki LED (+) Tombol** | Pengendali nyala LED tombol saat sistem aktif |
| **Pin 39** | **GND** | **Kontak Saklar NO 2 Tombol** | Ground kontak saklar tombol |

---

## 6. Prosedur Uji Coba Hardware Mandiri

Setelah selesai menyolder atau memasang kabel jumper, lakukan pengujian bertahap melalui SSH Raspberry Pi:

### Uji 1: Tes Melodi Buzzer & Driver 2N2222
Jalankan perintah ini di terminal Raspberry Pi:
```bash
python3 -c "from backend.hardware.buzzer import BuzzerController; b = BuzzerController(pin=17); b.play_ready_melody()"
```
- **Hasil yang benar:** Buzzer langsung melantunkan melodi khas ceria 5 nada bertingkat: *Do ➔ Mi ➔ Sol ... Sol ➔ Do Tinggi* (C5 ➔ E5 ➔ G5 ➔ G5 ➔ C6).

### Uji 2: Tes Nyala Ring LED Tombol
Jalankan perintah ini untuk menyalakan LED tombol selama 3 detik:
```bash
python3 -c "import RPi.GPIO as G, time; G.setwarnings(False); G.setmode(G.BCM); G.setup(16, G.OUT); G.output(16, G.HIGH); print('LED ON'); time.sleep(3); G.output(16, G.LOW); print('LED OFF'); G.cleanup()"
```
- **Hasil yang benar:** Cincin LED tombol menyala terang selama 3 detik lalu padam.

### Uji 3: Tes Respon Tombol Detent & Service
Jalankan monitor log service:
```bash
sudo journalctl -u lentera-switch -f
```
1. **Tekan tombol ke dalam (posisi ON mengunci):**
   - LED tombol menyala dan buzzer langsung berbunyi *chirp* 2-nada konfirmasi (*G5 ➔ C6*).
   - Terminal menampilkan: `[SWITCH DAEMON] Tombol DETENT ON ditekan! Menyalakan sistem Lentera...`
   - Setelah WiFi & kamera siap (~15 detik), **Buzzer otomatis memainkan melodi signature siap (Do-Mi-Sol...Sol-Do')**.
2. **Tekan tombol sekali lagi (posisi OFF lepas):**
   - LED tombol padam.
   - Buzzer memainkan melodi turun konfirmasi shutdown (*C6 ➔ G5 ➔ C5*).
   - Terminal menampilkan: `[SWITCH DAEMON] Tombol DETENT OFF dilepas! Mengeksekusi shutdown aman Raspberry Pi...`
   - Raspberry Pi mengeksekusi `poweroff` secara aman dan OS mati total.
3. **Menyalakan kembali dari kondisi mati:**
   - Tekan tombol ke dalam (posisi ON mengunci).
   - Karena terhubung ke Pin 5 (GPIO 3), Raspberry Pi **otomatis BANGUN (*Wake up*) dan BOOTING kembali** tanpa cabut adaptor!

---

## 7. Troubleshooting Praktis

1. **Buzzer Berbunyi Lemah atau Terus Menjerit Saat Boot:**
   - Pastikan kabel Emitter dan Collector 2N2222 tidak tertukar.
   - Pastikan GPIO 17 tidak terhubung langsung ke basis 2N2222 tanpa resistor 1kΩ.
2. **LED Tombol Tidak Menyala:**
   - Periksa polaritas terminal LED: kaki bertanda `(+)` wajib ke Pin 36 (GPIO 16) dan kaki `(-)` ke Pin 34 (GND).
   - Jika tombol stainless Anda memiliki resistor internal 12V bawaan pabrik dan redup pada 3.3V, kaki `(+)` dapat dipindahkan ke pin daya **5V (Pin Fisik 4)**.
3. **Log Menunjukkan Switch Bolak-Balik Terpicu Sendiri (*Bouncing*):**
   - Di file `backend/hardware/switch_daemon.py` sudah disertakan perangkat lunak *software debouncing* 200 ms untuk meredam lompatan kontak mekanik tombol.
