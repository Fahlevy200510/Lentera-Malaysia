import time
import platform

class BuzzerController:
    """
    Controller untuk Active Piezo Buzzer (SFM-27 / SFM-20) pada pin GPIO Raspberry Pi.
    Active buzzer memiliki osilator transistor internal berfrekuensi tetap (~2.7 kHz).
    Agar suara bulat, keras, nyaring, dan tidak serak/seret akibat distorsi PWM,
    modulasi menggunakan pulsa digital DC murni (HIGH/LOW) berirama staccato.
    """
    def __init__(self, pin=17):
        self.pin = pin
        self.is_pi = platform.machine() in ["armv7l", "armv6l", "aarch64"]
        
        if self.is_pi:
            try:
                import RPi.GPIO as GPIO
                GPIO.setwarnings(False)
                GPIO.setmode(GPIO.BCM)
                self.gpio = GPIO
                print(f"[BUZZER] Driver RPi.GPIO siap untuk pin BCM {self.pin} (Pin Fisik 11).")
            except Exception as e:
                print(f"[BUZZER] Gagal import RPi.GPIO: {e}")
                self.is_pi = False
        else:
            print(f"[BUZZER] Berjalan di simulator ({platform.system()}). Buzzer menggunakan console/audio.")

    def play_pattern(self, pulses):
        """
        Memainkan pola pulsa [(durasi_on_detik, jeda_off_detik), ...].
        Menggunakan tegangan DC murni (GPIO.HIGH / LOW) agar active buzzer
        bergetar pada volume maksimal 100% jernih, lantang, dan bebas bunyi seret.
        """
        if not self.is_pi or not hasattr(self, 'gpio'):
            pulse_str = " -> ".join([f"ON({int(on*1000)}ms)/OFF({int(off*1000)}ms)" for on, off in pulses])
            print(f"[BUZZER SIM] Pola Pulsa: {pulse_str}")

            if platform.system() == "Windows":
                try:
                    import winsound
                    for on, off in pulses:
                        winsound.Beep(2700, int(on * 1000))
                        if off > 0:
                            time.sleep(off)
                    return
                except Exception:
                    pass

            for on, off in pulses:
                time.sleep(on + off)
            return

        try:
            self.gpio.setwarnings(False)
            self.gpio.setmode(self.gpio.BCM)
            self.gpio.setup(self.pin, self.gpio.OUT)
            for on_time, off_time in pulses:
                self.gpio.output(self.pin, self.gpio.HIGH)
                time.sleep(on_time)
                self.gpio.output(self.pin, self.gpio.LOW)
                if off_time > 0:
                    time.sleep(off_time)
            self.gpio.cleanup(self.pin)
        except Exception as e:
            print(f"[BUZZER ERROR] Gagal akses pin {self.pin}: {e}")
            try:
                self.gpio.output(self.pin, self.gpio.LOW)
                self.gpio.cleanup(self.pin)
            except Exception:
                pass

    def play_melody(self, notes):
        """Kompatibilitas: mengonversi nada (freq, durasi) ke pola pulsa durasi."""
        pulses = []
        for freq, duration in notes:
            if freq > 0:
                pulses.append((duration, 0.04))
            else:
                if pulses:
                    last_on, _ = pulses[-1]
                    pulses[-1] = (last_on, duration)
                else:
                    pulses.append((0.01, duration))
        self.play_pattern(pulses)

    def play_note(self, freq, duration):
        """Membunyikan satu pulsa suara."""
        self.play_pattern([(duration, 0.0)])

    def beep(self, times=2, duration=0.08, interval=0.06):
        """Membunyikan nada bip dengan jumlah dan durasi tertentu."""
        pulses = [(duration, interval) for _ in range(times)]
        self.play_pattern(pulses)

    def play_ready_melody(self):
        """
        Irama Ceria Khas LENTERA: Penanda Sistem Siap & Kamera Online!
        Ritme: pip (70ms) - pip (70ms) - piip (100ms) - pi (60ms) - PIIIP (350ms)!
        """
        pulses = [
            (0.07, 0.05),
            (0.07, 0.05),
            (0.10, 0.08),
            (0.06, 0.04),
            (0.35, 0.00),
        ]
        self.play_pattern(pulses)

    def play_power_on_chirp(self):
        """Chirp cepat konfirmasi saklar ON ditekan (pip-PIIP!)."""
        pulses = [
            (0.06, 0.04),
            (0.14, 0.00),
        ]
        self.play_pattern(pulses)

    def play_power_off_melody(self):
        """Pola turun penanda shutdown sistem aman (tiiit - tiit - tit!)."""
        pulses = [
            (0.16, 0.06),
            (0.10, 0.06),
            (0.06, 0.00),
        ]
        self.play_pattern(pulses)

    def play_victory_melody(self):
        """Fanfare kemenangan modul sirkuit selesai (ta-ta-ta-TAA... ta-TAA!)."""
        pulses = [
            (0.07, 0.04),
            (0.07, 0.04),
            (0.07, 0.05),
            (0.14, 0.08),
            (0.08, 0.04),
            (0.38, 0.00),
        ]
        self.play_pattern(pulses)

    def play_step_success(self):
        """Chime 2 nada saat satu langkah atau balok berhasil terpasang tepat (pip-PIIP!)."""
        pulses = [
            (0.05, 0.04),
            (0.12, 0.00),
        ]
        self.play_pattern(pulses)

    def cleanup(self):
        if self.is_pi and hasattr(self, 'gpio'):
            try:
                self.gpio.output(self.pin, self.gpio.LOW)
                self.gpio.cleanup(self.pin)
            except Exception:
                pass
