import time
import platform

class BuzzerController:
    """
    Controller untuk Active Piezo Buzzer (SFM-27 / SFM-20) pada pin GPIO Raspberry Pi.
    Menggunakan BCM 17 (Pin Fisik 11) yang secara hardware memiliki status default Pull-Down (LOW)
    saat power-on untuk mencegah jeritan buzzer sebelum OS/aplikasi siap.
    """
    def __init__(self, pin=17):
        self.pin = pin
        self.is_pi = platform.machine() in ["armv7l", "armv6l", "aarch64"]
        
        if self.is_pi:
            try:
                import RPi.GPIO as GPIO
                GPIO.setwarnings(False)
                GPIO.setmode(GPIO.BCM)
                GPIO.setup(self.pin, GPIO.OUT)
                GPIO.output(self.pin, GPIO.LOW)  # Pastikan mati saat inisialisasi
                self.gpio = GPIO
                print(f"[BUZZER] Buzzer aktif di pin BCM {self.pin} (Pin Fisik 11).")
            except ImportError:
                print("[BUZZER] Peringatan: Pustaka RPi.GPIO tidak ditemukan. Mode simulasi aktif.")
                self.is_pi = False
        else:
            print(f"[BUZZER] Berjalan di simulator ({platform.system()}). Buzzer menggunakan console beep.")

    def beep(self, times=2, duration=0.08, interval=0.06):
        """
        Membunyikan nada bip dengan jumlah dan durasi tertentu.
        Default: 2x bip pendek (0.08s) sebagai penanda sistem siap (ready signal).
        """
        if not self.is_pi:
            print(f"[BUZZER SIM] Beep {times}x (durasi: {duration}s, jeda: {interval}s)")
            return

        for _ in range(times):
            self.gpio.output(self.pin, self.gpio.HIGH)
            time.sleep(duration)
            self.gpio.output(self.pin, self.gpio.LOW)
            time.sleep(interval)

    def cleanup(self):
        if self.is_pi:
            self.gpio.output(self.pin, self.gpio.LOW)
