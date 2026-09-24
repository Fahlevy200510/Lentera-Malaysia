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
WorkingDirectory=/home/pilentera/lentera_cv
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=5
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
