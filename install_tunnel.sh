#!/bin/bash
# ==============================================================================
# LENTERA Edge Tunnel Installer (Cloudflare Zero-Config)
# Script ini menginstal dan mengonfigurasi cloudflared sebagai service otomatis
# di Raspberry Pi, sehingga kamera dan WebSocket terhubung ke domain publik
# tanpa perlu input alamat IP manual.
# ==============================================================================

set -e

echo "========================================================"
echo "    Menginstal LENTERA Cloudflare Tunnel Service       "
echo "========================================================"

if [ "$EUID" -ne 0 ]; then
  echo "[ERROR] Harap jalankan script ini dengan sudo: sudo ./install_tunnel.sh <TUNNEL_TOKEN>"
  exit 1
fi

TUNNEL_TOKEN="$1"

# 1. Deteksi Arsitektur Sistem
ARCH=$(uname -m)
echo "[1/4] Mendeteksi arsitektur perangkat: $ARCH..."

DEB_URL=""
if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
  DEB_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb"
elif [ "$ARCH" = "armv7l" ] || [ "$ARCH" = "armhf" ]; then
  DEB_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm.deb"
elif [ "$ARCH" = "x86_64" ]; then
  DEB_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
else
  echo "[ERROR] Arsitektur $ARCH tidak didukung otomatis."
  exit 1
fi

# 2. Unduh dan Instal cloudflared
echo "[2/4] Mengunduh cloudflared dari $DEB_URL..."
TMP_DEB="/tmp/cloudflared.deb"
curl -sL "$DEB_URL" -o "$TMP_DEB"
dpkg -i "$TMP_DEB" || apt-get install -f -y
rm -f "$TMP_DEB"

echo "Cloudflared versi terinstal: $(cloudflared --version)"

# 3. Konfigurasi Service Tunnel
if [ -z "$TUNNEL_TOKEN" ]; then
  echo ""
  echo "========================================================"
  echo "[PERHATIAN] Anda belum menyertakan TUNNEL_TOKEN."
  echo "Untuk menghubungkan ke Cloudflare Zero Trust, jalankan:"
  echo "  sudo cloudflared service install <TOKEN_DARI_CLOUDFLARE>"
  echo "========================================================"
else
  echo "[3/4] Mendaftarkan cloudflared service dengan token..."
  cloudflared service install "$TUNNEL_TOKEN" || true
  systemctl daemon-reload
  systemctl enable cloudflared
  systemctl restart cloudflared
  echo "[4/4] Service cloudflared berhasil diaktifkan!"
fi

echo ""
echo "========================================================"
echo "Status Service Cloudflared:"
systemctl status cloudflared --no-pager || true
echo "========================================================"
echo "Selesai! Terowongan LENTERA Edge kini otomatis aktif saat boot."
echo "========================================================"
