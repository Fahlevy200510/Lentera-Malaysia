#!/bin/sh
# LENTERA Final Safe-to-Unplug Buzzer Hook
# File ini dieksekusi oleh systemd-shutdown pada tahap paling akhir shutdown,
# SETELAH seluruh filesystem di-unmount dan disk di-sync secara aman.
# Bunyi nada ini menandakan 100% AMAN UNTUK MENCABUT ADAPTOR LISTRIK.

if [ "$1" = "poweroff" ] || [ "$1" = "halt" ]; then
    /usr/bin/python3 -c "import RPi.GPIO as G, time; G.setwarnings(False); G.setmode(G.BCM); G.setup(17, G.OUT); [G.output(17, 1) or time.sleep(on) or G.output(17, 0) or (time.sleep(off) if off > 0 else None) for on, off in [(0.12, 0.08), (0.12, 0.08), (0.45, 0.0)]]; G.cleanup(17)" 2>/dev/null
fi
