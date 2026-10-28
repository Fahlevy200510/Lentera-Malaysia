#!/bin/bash
# ==============================================================================
# LENTERA MALAYSIA - Cloudflare Quick Tunnel Auto-Sync & Self-Healing Auto-Update
# Tanpa Limit Kuota (Unlimited) & Otomatis Terhubung ke Web Tanpa Ketik IP
# ==============================================================================

RELAY_TOPIC="lentera_malaysia_edge_tunnel"
LOG_FILE="/tmp/cloudflared_quick.log"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR" || exit 1

# Fungsi Auto-Sync Git dari GitHub (mencegah Pi tertinggal kode terbaru dari laptop)
sync_latest_code() {
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        echo "[AUTO-SYNC] Memeriksa pembaruan kode dari GitHub..."
        git fetch origin main --quiet 2>/dev/null || true
        LOCAL_HASH=$(git rev-parse HEAD 2>/dev/null || true)
        REMOTE_HASH=$(git rev-parse origin/main 2>/dev/null || true)
        if [ -n "$LOCAL_HASH" ] && [ -n "$REMOTE_HASH" ] && [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
            echo "[AUTO-SYNC] Update baru terdeteksi ($LOCAL_HASH -> $REMOTE_HASH). Menarik pembaruan..."
            git reset --hard HEAD 2>/dev/null || true
            git pull origin main --quiet 2>/dev/null || true
            echo "[AUTO-SYNC] Berhasil diupdate ke commit: $(git rev-parse --short HEAD)"
            # Restart service pengamat kamera agar langsung memuat kode Python terbaru
            if systemctl is-active --quiet lentera.service 2>/dev/null; then
                echo "[AUTO-SYNC] Merestart lentera.service..."
                sudo systemctl restart lentera.service 2>/dev/null || true
            fi
        else
            echo "[AUTO-SYNC] Kode lokal sudah up-to-date ($LOCAL_HASH)."
        fi
    fi
}

# Sinkronkan kode di awal saat tunnel menyala
sync_latest_code

echo "Memulai Cloudflare Quick Tunnel ke port 8765..."
# Hentikan proses quick tunnel lama jika ada
pkill -f "cloudflared tunnel --url" 2>/dev/null || true
rm -f "$LOG_FILE"

# Jalankan cloudflared di background dan catat log-nya
cloudflared tunnel --url http://localhost:8765 > "$LOG_FILE" 2>&1 &

# Catat PID cloudflared
CF_PID=$!

echo "Menunggu Cloudflare menerbitkan link publik..."
TUNNEL_URL=""
for i in {1..25}; do
    sleep 1
    if [ -f "$LOG_FILE" ]; then
        TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' "$LOG_FILE" 2>/dev/null | grep -v 'api\.trycloudflare\.com' | head -n 1 | sed 's#https://##' || true)
        if [ -n "$TUNNEL_URL" ]; then
            break
        fi
    fi
done

if [ -z "$TUNNEL_URL" ]; then
    echo "[ERROR] Gagal mendapatkan URL dari Cloudflare. Periksa koneksi internet."
    cat "$LOG_FILE" 2>/dev/null || true
    kill $CF_PID 2>/dev/null || true
    exit 1
fi

echo "=========================================================="
echo " BERHASIL! Tunnel Aktif: $TUNNEL_URL"
echo " Mengirim alamat otomatis ke Web Portal Lentera..."
echo "=========================================================="

# Kirim pertama kali ke relay global
curl -s -X POST -d "$TUNNEL_URL" "https://ntfy.sh/$RELAY_TOPIC" > /dev/null 2>&1 || true

echo "Selesai! Web Lentera sekarang otomatis terhubung ke:"
echo "wss://$TUNNEL_URL"
echo "=========================================================="

# Keep-alive loop: re-broadcast URL tiap 25 detik & auto-sync kode tiap ~75 detik
LOOP_COUNT=0
while kill -0 "$CF_PID" 2>/dev/null; do
    sleep 25
    LOOP_COUNT=$((LOOP_COUNT + 1))
    
    # Broadcast URL terowongan ke relay
    curl -s -X POST -d "$TUNNEL_URL" "https://ntfy.sh/$RELAY_TOPIC" > /dev/null 2>&1 || true

    # Self-healing: Cek jika lentera.service mati/failed saat saklar ON, hidupkan kembali
    if systemctl is-failed --quiet lentera.service 2>/dev/null; then
        echo "[SELF-HEALING] lentera.service dalam status failed. Me-reset dan merestart..."
        sudo systemctl reset-failed lentera.service 2>/dev/null || true
        sudo systemctl restart lentera.service 2>/dev/null || true
    fi

    # Cek pembaruan Git dari laptop setiap 3 siklus (~75 detik)
    if [ $((LOOP_COUNT % 3)) -eq 0 ]; then
        sync_latest_code
    fi
done

echo "[WARN] Proses cloudflared berhenti. Mengulang service..."
exit 1
