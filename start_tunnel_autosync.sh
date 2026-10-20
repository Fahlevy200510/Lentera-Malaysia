#!/bin/bash
# ==============================================================================
# LENTERA MALAYSIA - Cloudflare Quick Tunnel Auto-Sync
# Tanpa Limit Kuota (Unlimited) & Otomatis Terhubung ke Web Tanpa Ketik IP
# ==============================================================================

RELAY_TOPIC="lentera_malaysia_edge_tunnel"
LOG_FILE="/tmp/cloudflared_quick.log"

echo "Memulai Cloudflare Quick Tunnel ke port 8765..."
# Hentikan proses quick tunnel lama jika ada
pkill -f "cloudflared tunnel --url" 2>/dev/null || true
rm -f "$LOG_FILE"

# Jalankan cloudflared di background dan catat log-nya
cloudflared tunnel --url http://localhost:8765 > "$LOG_FILE" 2>&1 &

echo "Menunggu Cloudflare menerbitkan link publik..."
TUNNEL_URL=""
for i in {1..25}; do
    sleep 1
    if [ -f "$LOG_FILE" ]; then
        TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' "$LOG_FILE" 2>/dev/null | head -n 1 | sed 's#https://##' || true)
        if [ -n "$TUNNEL_URL" ]; then
            break
        fi
    fi
done

if [ -z "$TUNNEL_URL" ]; then
    echo "[ERROR] Gagal mendapatkan URL dari Cloudflare. Periksa koneksi internet."
    cat "$LOG_FILE" 2>/dev/null || true
    exit 1
fi

echo "=========================================================="
echo " BERHASIL! Tunnel Aktif: $TUNNEL_URL"
echo " Mengirim alamat otomatis ke Web Portal Lentera..."
echo "=========================================================="

# Kirim ke relay global (bebas CORS, realtime)
curl -s -X POST -d "$TUNNEL_URL" "https://ntfy.sh/$RELAY_TOPIC" > /dev/null 2>&1 || true

echo "Selesai! Web Lentera sekarang otomatis terhubung ke:"
echo "wss://$TUNNEL_URL"
echo "=========================================================="

# Biarkan tetap berjalan
wait
