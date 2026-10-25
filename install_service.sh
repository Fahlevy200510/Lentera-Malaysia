#!/bin/bash

# Lentera Background Service Installer
echo "=========================================="
echo "Menginstal LENTERA MVP sebagai service..."
echo "=========================================="

SERVICE_FILE="/etc/systemd/system/lentera.service"

# Buat file service systemd
sudo bash -c "cat > $SERVICE_FILE" << 'EOF'
[Unit]
Description=LENTERA Computer Vision Observer Service
After=network.target

[Service]
Type=simple
User=pilentera
WorkingDirectory=/home/pilentera/Lentera-Malaysia
Environment="XDG_RUNTIME_DIR=/run/user/1000"
ExecStartPre=-/usr/bin/pulseaudio -D
ExecStartPre=-/usr/bin/bluetoothctl connect DF:7F:21:02:F8:59
ExecStart=/home/pilentera/Lentera-Malaysia/lentera_env/bin/python3 main.py
# Proteksi Bootloop: Hanya restart jika error, maksimal 3 kali dalam 30 detik
Restart=on-failure
RestartSec=5
StartLimitIntervalSec=30
StartLimitBurst=3
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=lentera

[Install]
WantedBy=multi-user.target
EOF

# Buat file service tunnel auto-sync
TUNNEL_SERVICE_FILE="/etc/systemd/system/lentera-tunnel.service"
sudo bash -c "cat > $TUNNEL_SERVICE_FILE" << 'EOF'
[Unit]
Description=LENTERA Cloudflare Auto-Sync Tunnel
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pilentera
WorkingDirectory=/home/pilentera/Lentera-Malaysia
ExecStart=/home/pilentera/Lentera-Malaysia/start_tunnel_autosync.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Konfigurasi izin shutdown aman tanpa password untuk service lentera
echo "$USER ALL=(ALL) NOPASSWD: /sbin/poweroff, /sbin/shutdown, /bin/systemctl" | sudo tee /etc/sudoers.d/lentera_shutdown > /dev/null
# Pasang hook nada safe-to-unplug pada systemd-shutdown
sudo mkdir -p /lib/systemd/system-shutdown
sudo cp scripts/lentera_poweroff_buzzer.sh /lib/systemd/system-shutdown/lentera_poweroff_buzzer.sh 2>/dev/null || true
sudo chmod +x /lib/systemd/system-shutdown/lentera_poweroff_buzzer.sh 2>/dev/null || true

# Pasang switch daemon service
sudo cp lentera-switch.service /etc/systemd/system/ 2>/dev/null || true

# Reload systemd
sudo systemctl daemon-reload
# Nonaktifkan autostart lentera.service (dikontrol sepenuhnya oleh switch daemon saat tombol ON ditekan)
sudo systemctl disable lentera.service 2>/dev/null || true
# Aktifkan switch daemon & tunnel
sudo systemctl enable lentera-switch.service lentera-tunnel.service
sudo systemctl restart lentera-switch.service lentera-tunnel.service

echo ""
echo "=========================================================="
echo "Selesai! LENTERA MVP & Tunnel sekarang otomatis berjalan"
echo "setiap kali Raspberry Pi dinyalakan."
echo "Untuk melihat log tunnel: sudo journalctl -u lentera-tunnel -f"
echo "Untuk melihat log kamera: sudo journalctl -u lentera -f"
echo "=========================================================="
