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
            except Exception as e:
                print(f"[BUZZER] Gagal inisialisasi Buzzer: {e}")
                self.is_pi = False
        else:
            print(f"[BUZZER] Berjalan di simulator ({platform.system()}). Buzzer menggunakan console beep.")

    def play_note(self, freq, duration):
        """Membunyikan frekuensi nada menggunakan PWM hardware jika didukung."""
        if not self.is_pi or not hasattr(self, 'gpio'):
            print(f"[BUZZER SIM] Tone {freq}Hz for {duration}s")
            time.sleep(duration)
            return

        try:
            pwm = self.gpio.PWM(self.pin, freq)
            pwm.start(50)
            time.sleep(duration)
            pwm.stop()
        except Exception:
            # Fallback untuk active buzzer fixed-oscillator
            self.gpio.output(self.pin, self.gpio.HIGH)
            time.sleep(duration)
            self.gpio.output(self.pin, self.gpio.LOW)

    def beep(self, times=2, duration=0.08, interval=0.06):
        """
        Membunyikan nada bip dengan jumlah dan durasi tertentu.
        Default: 2x bip pendek (0.08s) sebagai penanda sistem siap (ready signal).
        """
        if not self.is_pi or not hasattr(self, 'gpio'):
            print(f"[BUZZER SIM] Beep {times}x (durasi: {duration}s, jeda: {interval}s)")
            return

        try:
            for _ in range(times):
                self.gpio.output(self.pin, self.gpio.HIGH)
                time.sleep(duration)
                self.gpio.output(self.pin, self.gpio.LOW)
                time.sleep(interval)
        except Exception:
            pass

    def play_ready_melody(self):
        """
        Melodi ceria penanda sistem LENTERA siap & WiFi terhubung:
        Nada naik ceria C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz).
        """
        notes = [
            (523, 0.08),  # C5
            (659, 0.08),  # E5
            (784, 0.10),  # G5
            (1046, 0.22), # C6
        ]
        for freq, dur in notes:
            self.play_note(freq, dur)
            time.sleep(0.03)

    def play_victory_melody(self):
        """
        Fanfare kemenangan modul sirkuit selesai:
        C5 -> E5 -> G5 -> C6 -> E6 sustain
        """
        notes = [
            (523, 0.10),
            (659, 0.10),
            (783, 0.12),
            (1046, 0.28),
            (1318, 0.35),
        ]
        for freq, dur in notes:
            self.play_note(freq, dur)
            time.sleep(0.04)

    def cleanup(self):
        if self.is_pi and hasattr(self, 'gpio'):
            try:
                self.gpio.output(self.pin, self.gpio.LOW)
            except Exception:
                pass
