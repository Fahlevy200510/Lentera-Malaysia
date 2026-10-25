#!/usr/bin/env python3
"""
LENTERA Detent Switch Daemon
Memantau saklar fisik 4-pin (tipe detent / latching) pada Raspberry Pi.
- Switch ON (tertekan mengunci): Menyalakan LED tombol dan menjalankan lentera.service.
- Switch OFF (terlepas): Mematikan lentera.service dan mematikan LED tombol.
"""

import time
import subprocess
import os
import sys
import threading

SWITCH_PIN = 3  # BCM 3 (Pin Fisik 5 - SCL) - terhubung ke Kontak NO saklar
LED_PIN = 16     # BCM 16 (Pin Fisik 36) - terhubung ke LED (+) saklar
BUZZER_PIN = 17  # BCM 17 (Pin Fisik 11) - Buzzer

def run_cmd(cmd):
    try:
        subprocess.run(cmd, shell=True, check=True)
    except Exception as e:
        print(f"[SWITCH DAEMON] Gagal eksekusi '{cmd}': {e}")

def play_buzzer_pulses(pulses):
    """Memainkan pola pulsa DC murni pada BUZZER_PIN untuk active buzzer SFM-27."""
    try:
        import RPi.GPIO as GPIO
        GPIO.setup(BUZZER_PIN, GPIO.OUT)
        for on_time, off_time in pulses:
            GPIO.output(BUZZER_PIN, GPIO.HIGH)
            time.sleep(on_time)
            GPIO.output(BUZZER_PIN, GPIO.LOW)
            if off_time > 0:
                time.sleep(off_time)
        GPIO.cleanup(BUZZER_PIN)
    except Exception:
        try:
            import RPi.GPIO as GPIO
            GPIO.output(BUZZER_PIN, GPIO.LOW)
            GPIO.cleanup(BUZZER_PIN)
        except Exception:
            pass

def play_buzzer_async(pulses):
    """Memainkan nada buzzer di thread latar belakang agar tidak memblokir respon saklar & LED."""
    threading.Thread(target=play_buzzer_pulses, args=(pulses,), daemon=True).start()

def main():
    try:
        import RPi.GPIO as GPIO
    except ImportError:
        print("[SWITCH DAEMON] RPi.GPIO tidak ditemukan. Berjalan di simulator.")
        return

    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    
    # Switch menggunakan internal pull-up (Tertutup / ON = LOW, Terbuka / OFF = HIGH)
    GPIO.setup(SWITCH_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    
    # LED tombol
    GPIO.setup(LED_PIN, GPIO.OUT)
    GPIO.output(LED_PIN, GPIO.LOW)

    print(f"[SWITCH DAEMON] Aktif. Memantau Switch di GPIO {SWITCH_PIN} (Pin 5) dan LED di GPIO {LED_PIN}...")

    # Cek status awal saklar saat Pi baru boot
    last_state = GPIO.input(SWITCH_PIN)
    
    if last_state == GPIO.LOW:
        # Saklar sudah dalam posisi ON saat Pi menyala
        print("[SWITCH DAEMON] Saklar terdeteksi ON saat boot. Menyalakan LED dan memulai lentera & tunnel service...")
        GPIO.output(LED_PIN, GPIO.HIGH)
        play_buzzer_async([(0.06, 0.04), (0.14, 0.00)])
        run_cmd("sudo systemctl start --no-block lentera.service lentera-tunnel.service")
    else:
        # Saklar posisi OFF saat Pi baru dicolok adaptor (OS siap standby)
        print("[SWITCH DAEMON] OS Raspberry Pi selesai boot (Standby Siap). Menunggu tombol ON ditekan...")
        GPIO.output(LED_PIN, GPIO.LOW)
        play_buzzer_async([(0.08, 0.06), (0.08, 0.00)])
        run_cmd("sudo systemctl stop --no-block lentera.service lentera-tunnel.service")

    try:
        while True:
            current_state = GPIO.input(SWITCH_PIN)
            
            # Jika ada perubahan status saklar (dengan respons cepat debouncing 40ms)
            if current_state != last_state:
                time.sleep(0.04)
                current_state = GPIO.input(SWITCH_PIN)
                if current_state != last_state:
                    last_state = current_state
                    
                    if current_state == GPIO.LOW:
                        # Saklar ditekan masuk (ON): LANGSUNG NYALAKAN LED SEKETIKA!
                        print("[SWITCH DAEMON] Tombol DETENT ON ditekan! Menyalakan LED & sistem Lentera...")
                        GPIO.output(LED_PIN, GPIO.HIGH)
                        play_buzzer_async([(0.06, 0.04), (0.14, 0.00)])
                        run_cmd("sudo systemctl start --no-block lentera.service lentera-tunnel.service")
                    else:
                        # Saklar ditekan lepas (OFF): LANGSUNG PADAMKAN LED SEKETIKA!
                        print("[SWITCH DAEMON] Tombol DETENT OFF dilepas! Menutup layanan Lentera...")
                        GPIO.output(LED_PIN, GPIO.LOW)
                        # 1x bip pendek konfirmasi bahwa tombol OFF telah ditekan
                        play_buzzer_pulses([(0.08, 0.00)])
                        
                        # 1. Hentikan service lentera & tunnel secara bersih
                        run_cmd("sudo systemctl stop lentera.service lentera-tunnel.service")
                        
                        # 2. Sinkronkan seluruh data ke kartu microSD (sync)
                        print("[SWITCH DAEMON] Menyinkronkan seluruh data ke microSD (sync)...")
                        run_cmd("sync")
                        time.sleep(0.5)
                        run_cmd("sync")
                        
                        # 3. Bunyikan nada penutup safe-to-unplug: tiit... tiit... TIIIIIT!
                        # Karena sync sudah tuntas 100%, kartu microSD dijamin aman dari korupsi data!
                        print("[SWITCH DAEMON] Seluruh data aman! Membunyikan nada aman cabut adaptor...")
                        play_buzzer_pulses([(0.14, 0.08), (0.14, 0.08), (0.45, 0.00)])
                        
                        # 4. Matikan sistem operasi (poweroff)
                        time.sleep(0.5)
                        run_cmd("sudo poweroff")
            
            time.sleep(0.04)
    except KeyboardInterrupt:
        print("[SWITCH DAEMON] Berhenti.")
    finally:
        GPIO.cleanup()

if __name__ == "__main__":
    main()
