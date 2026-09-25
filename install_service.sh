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

# Reload systemd, enable, dan start service
sudo systemctl daemon-reload
sudo systemctl enable lentera.service
sudo systemctl restart lentera.service

echo ""
echo "Selesai! LENTERA MVP sekarang akan berjalan otomatis setiap kali Raspberry Pi dinyalakan."
echo "Untuk melihat log langsung (jika ada error), gunakan perintah:"
echo "sudo journalctl -u lentera -f"
echo "=========================================="
