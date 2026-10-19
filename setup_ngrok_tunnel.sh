#!/bin/bash
# ==============================================================================
# LENTERA MALAYSIA - Ngrok Tunnel Auto-Installer
# Domain Tetap: anchor-scruffy-clerk.ngrok-free.dev
# Port: 8765 (WebSocket LENTERA Edge)
# ==============================================================================

set -e

AUTHTOKEN="${1:-}"
DOMAIN="anchor-scruffy-clerk.ngrok-free.dev"

if [ -z "$AUTHTOKEN" ]; then
    echo "=========================================================="
    echo "[ERROR] Harap sertakan authtoken Ngrok Anda!"
    echo "Penggunaan: ./setup_ngrok_tunnel.sh <AUTHTOKEN>"
    echo "Contoh: ./setup_ngrok_tunnel.sh 3KofK7bML..."
    echo "=========================================================="
    exit 1
fi

echo "=== [1/4] Memeriksa Instalasi Ngrok di Raspberry Pi ==="
if ! command -v ngrok &> /dev/null; then
    echo "Mengunduh dan menginstal Ngrok..."
    curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update
    sudo apt install -y ngrok
else
    echo "Ngrok sudah terpasang di $(which ngrok)."
fi

NGROK_BIN=$(which ngrok)

echo "=== [2/4] Memasang Authtoken Akun Ngrok ==="
$NGROK_BIN config add-authtoken "$AUTHTOKEN"

echo "=== [3/4] Membuat Background Service (Systemd) ==="
SERVICE_FILE="/etc/systemd/system/lentera-tunnel.service"

sudo bash -c "cat > $SERVICE_FILE" << EOF
[Unit]
Description=LENTERA Ngrok Tunnel (anchor-scruffy-clerk.ngrok-free.dev)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${USER:-pilentera}
ExecStart=$NGROK_BIN http 8765 --url=$DOMAIN --log=stdout
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lentera-tunnel

[Install]
WantedBy=multi-user.target
EOF

echo "=== [4/4] Mengaktifkan dan Menjalankan Service ==="
sudo systemctl daemon-reload
sudo systemctl enable lentera-tunnel.service
sudo systemctl restart lentera-tunnel.service

echo ""
echo "=========================================================="
echo " BERHASIL! Tunnel Ngrok LENTERA Aktif & Auto-Start Saat Boot"
echo "=========================================================="
echo "Domain Publik   : https://$DOMAIN"
echo "WebSocket Edge  : wss://$DOMAIN"
echo ""
echo "Perintah Cek Status Tunnel:"
echo "sudo systemctl status lentera-tunnel"
echo ""
echo "Perintah Cek Log Real-Time:"
echo "sudo journalctl -u lentera-tunnel -f"
echo "=========================================================="
