# Panduan Koneksi Edge LENTERA via Ngrok (Zero-Config)

Dokumen ini berisi panduan menghubungkan **Raspberry Pi (Computer Vision)** dengan **Portal Web LENTERA** di internet secara permanen, otomatis, dan gratis tanpa butuh kartu kredit.

---

## 1. Spesifikasi Koneksi

| Parameter | Nilai | Keterangan |
| :--- | :--- | :--- |
| **Domain Tetap** | `anchor-scruffy-clerk.ngrok-free.dev` | Disediakan akun Ngrok Anda (Statis) |
| **Port WebSocket** | `8765` | Menghubungkan deteksi sirkuit & suara |
| **Protokol Web** | `wss://anchor-scruffy-clerk.ngrok-free.dev` | Enkripsi SSL/TLS, aman dari Mixed-Content |
| **Auto-Connect Web** | **Aktif** | Web otomatis terhubung saat dibuka |

---

## 2. Cara Cepat: Instalasi Otomatis (1 Perintah di Raspberry Pi)

Di terminal Raspberry Pi Anda, masuk ke folder proyek dan jalankan script:

```bash
cd ~/Lentera-Malaysia
chmod +x setup_ngrok_tunnel.sh
./setup_ngrok_tunnel.sh
```

Script ini otomatis:
1. Memasang `ngrok` di Raspberry Pi.
2. Memasukkan authtoken akun Anda.
3. Membuat service background (`lentera-tunnel.service`) agar **langsung aktif otomatis setiap kali Raspberry Pi dinyalakan**.

---

## 3. Cara Manual (Jika Ingin Uji Coba Langsung di Terminal)

Jika Anda ingin melihat tampilan terminal interaktif Ngrok secara langsung:

```bash
# 1. Pasang token akun
ngrok config add-authtoken 3KofK7bML5heCvHm9qEPFsq8PEh_2eQ2nj4G3VJTpmyYkFChL

# 2. Buka tunnel ke domain statis Anda
ngrok http 8765 --url=anchor-scruffy-clerk.ngrok-free.dev
```

Terminal akan menampilkan:
```text
Session Status                online
Account                       (Plan: Free)
Forwarding                    https://anchor-scruffy-clerk.ngrok-free.dev -> http://localhost:8765
```

---

## 4. Perintah Pemeliharaan di Raspberry Pi

| Kebutuhan | Perintah Terminal |
| :--- | :--- |
| **Cek status tunnel** | `sudo systemctl status lentera-tunnel` |
| **Lihat traffic koneksi** | `sudo journalctl -u lentera-tunnel -f` |
| **Restart tunnel** | `sudo systemctl restart lentera-tunnel` |
| **Hentikan tunnel** | `sudo systemctl stop lentera-tunnel` |
