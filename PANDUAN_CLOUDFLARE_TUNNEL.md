# Panduan Lengkap: Menghubungkan Kamera & WebSocket Raspberry Pi ke Web Publik (Cloudflare Tunnel)

Dokumen ini adalah panduan langkah-demi-langkah praktis untuk menghubungkan Raspberry Pi LENTERA ke web publik (`https://...`) secara otomatis (**Zero-Configuration**) tanpa perlu repot mencari alamat IP lokal atau menyalakan hotspot HP.

---

## DAFTAR ISI
1. [Metode 1: Cloudflare Zero Trust (Rekomendasi Utama - Domain Tetap Permanen)](#metode-1-cloudflare-zero-trust-permanen)
2. [Metode 2: TryCloudflare / Quick Tunnel (Instan - Tanpa Akun & Tanpa Kartu)](#metode-2-trycloudflare-quick-tunnel-instan)
3. [Pengaturan di Web Portal LENTERA](#pengaturan-di-web-portal-lentera)
4. [Perintah Berguna di Raspberry Pi](#perintah-berguna-di-raspberry-pi)

---

## METODE 1: Cloudflare Zero Trust (Permanen)
*Cocok untuk:* Lomba, pameran, dan penggunaan sekolah jangka panjang karena alamat web **selalu sama selamanya**.

### Langkah 1: Aktivasi Paket Free di Dashboard Cloudflare
1. Di layar dashboard Cloudflare Zero Trust ([dash.cloudflare.com](https://dash.cloudflare.com)), klik tombol biru **"Get started"**.
2. Masukkan **Team Name** (nama tim/organisasi), contoh: `lentera-lab` atau `lentera-sains` $\rightarrow$ klik **Next**.
3. **Pilih Paket:** Pilih paket **Free ($0.00 / month)** $\rightarrow$ klik **Proceed to payment / Confirm**.
   > *Catatan:* Total tagihan adalah **$0 / Rp 0 gratis selamanya**. Jika diminta memasukkan metode pembayaran, ini hanya protokol anti-bot Cloudflare, saldo Anda tidak akan dipotong.

---

### Langkah 2: Membuat Tunnel Baru
1. Di bilah menu sebelah kiri, masuk ke: **Networks** $\rightarrow$ **Tunnels** (atau *Tunnels & Mesh*).
2. Klik tombol **Add a tunnel** (atau *Create a tunnel*).
3. Pilih opsi **Cloudflared** $\rightarrow$ klik **Next**.
4. Beri nama terowongan, misalnya: `lentera-pi` $\rightarrow$ klik **Save tunnel**.

---

### Langkah 3: Dapatkan Token & Pasang di Raspberry Pi
1. Pada bagian *Choose your environment*, pilih:
   * **Operating System:** Debian
   * **Architecture:** ARM64 *(untuk Raspberry Pi 3/4/5 dengan OS 64-bit)*
2. Di kotak hitam bawahnya, Cloudflare akan menampilkan perintah instalasi seperti ini:
   ```bash
   sudo cloudflared service install eyJhIjoiYmNmZj...TEKS_TOKEN_PANJANG...
   ```
3. Salin teks token panjang setelah kata `service install` (yang diawali dengan `eyJhI...`).
4. Buka terminal Raspberry Pi Anda (bisa lewat SSH atau layar monitor Pi), masuk ke folder proyek LENTERA dan jalankan:
   ```bash
   sudo ./install_tunnel.sh <TEMPELKAN_TOKEN_DI_SINI>
   ```
   *Contoh:*
   ```bash
   sudo ./install_tunnel.sh eyJhIjoiYmNmZj...TEKS_TOKEN_PANJANG...
   ```
5. Skrip otomatis mengunduh, menginstal, dan mengaktifkan service di Pi agar **menyala otomatis saat listrik dicolokkan**.

---

### Langkah 4: Hubungkan Port Kamera & WebSocket ke Domain
Kembali ke layar browser Cloudflare di laptop Anda, klik **Next** menuju tab **Public Hostnames**:

1. **Tambahkan Subdomain untuk WebSocket (Port 8765):**
   * **Subdomain:** `ws` (misal domain utama Anda `lentera.id`, maka jadinya `ws.lentera.id`)
   * **Domain:** Pilih domain Anda di dropdown.
   * **Type:** `HTTP`
   * **URL:** `localhost:8765`
   * Klik **Save Hostname**.

2. **Tambahkan Subdomain untuk Video Kamera Stream (Port 8766):**
   * Klik tombol **Add a public hostname**.
   * **Subdomain:** `edge` (jadinya `edge.lentera.id`)
   * **Domain:** Pilih domain Anda.
   * **Type:** `HTTP`
   * **URL:** `localhost:8766`
   * Klik **Save Hostname**.

🎉 **Selesai!** Raspberry Pi Anda kini resmi online di internet dengan sertifikat SSL resmi gratis.

---

## METODE 2: TryCloudflare / Quick Tunnel (Instan)
*Cocok untuk:* Uji coba mendadak jika Anda belum memiliki domain sendiri, tidak ingin mendaftar Zero Trust, atau butuh demo instan dalam 30 detik.

1. Di Raspberry Pi, pastikan `cloudflared` sudah terpasang.
2. Jalankan perintah ini di terminal:
   ```bash
   cloudflared tunnel --url http://localhost:8765
   ```
3. Cloudflare akan langsung mencetak tautan acak gratis di terminal, contoh:
   ```
   https://random-word-abc.trycloudflare.com
   ```
4. Salin URL tersebut, buka web Anda, dan masukkan URL tersebut ke pengaturan endpoint.

---

## PENGATURAN DI WEB PORTAL LENTERA

Web portal LENTERA sudah kita lengkapi dengan sistem **Zero-Configuration Resolver**:

1. **Pengaturan Otomatis:**
   * Di file `Lentera-Portal/.env.local`, tambahkan baris berikut:
     ```env
     NEXT_PUBLIC_LENTERA_TUNNEL_DOMAIN=edge.lentera.id
     ```
   * Begitu diset, siapapun (guru, siswa, juri) yang membuka web Anda akan **otomatis tersambung ke Raspberry Pi** tanpa melihat kotak input IP lagi.

2. **Pengaturan Manual / Pengujian Lokal:**
   * Jika sewaktu-waktu ingin menguji di laptop tanpa internet, buka halaman **Edge Lab (`/aruco`)**.
   * Klik ikon **⚙️ (Penggeser Pengaturan)** di samping tombol Kalibrasi.
   * Anda bisa memilih preset **"Localhost (127.0.0.1)"** atau memasukkan IP manual kapan pun dibutuhkan.

---

## PERINTAH BERGUNA DI RASPBERRY PI

Jika ingin memeriksa apakah terowongan tunnel sedang berjalan di Raspberry Pi:

* **Mengecek status service:**
  ```bash
  sudo systemctl status cloudflared
  ```
* **Melihat log koneksi tunnel secara langsung:**
  ```bash
  sudo journalctl -u cloudflared -f
  ```
* **Merestart service tunnel:**
  ```bash
  sudo systemctl restart cloudflared
  ```
* **Mengecek service deteksi utama LENTERA:**
  ```bash
  sudo systemctl status lentera.service
  ```
