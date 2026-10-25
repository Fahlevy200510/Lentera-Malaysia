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

    def play_melody(self, notes):
        """
        Memainkan rangkaian nada [(frekuensi, durasi), ...].
        Menggunakan single PWM instance dengan ChangeFrequency dan ChangeDutyCycle
        agar transisi nada halus, musikal, dan tanpa letupan (pop/click).
        Jika buzzer berupa active buzzer fixed-oscillator, durasi nada akan menghasilkan irama ceria.
        """
        if not self.is_pi or not hasattr(self, 'gpio'):
            note_names = []
            for f, d in notes:
                if f == 0:
                    note_names.append(f"Pause({int(d*1000)}ms)")
                else:
                    note_names.append(f"{f}Hz({int(d*1000)}ms)")
            print(f"[BUZZER SIM] Melodi: {' -> '.join(note_names)}")

            # Jika di Windows, bunyikan speaker PC agar developer dapat mendengar langsung
            if platform.system() == "Windows":
                try:
                    import winsound
                    for freq, duration in notes:
                        if freq > 0:
                            winsound.Beep(int(freq), int(duration * 1000))
                        else:
                            time.sleep(duration)
                        time.sleep(0.02)
                    return
                except Exception:
                    pass

            for _, duration in notes:
                time.sleep(duration + 0.02)
            return

        try:
            pwm = self.gpio.PWM(self.pin, 1000)
            pwm.start(0)
            for freq, duration in notes:
                if freq > 0:
                    pwm.ChangeFrequency(int(freq))
                    pwm.ChangeDutyCycle(50)
                else:
                    pwm.ChangeDutyCycle(0)
                time.sleep(duration)
                pwm.ChangeDutyCycle(0)
                time.sleep(0.02)
            pwm.stop()
            self.gpio.output(self.pin, self.gpio.LOW)
        except Exception:
            # Fallback untuk active buzzer fixed-oscillator
            try:
                for freq, duration in notes:
                    if freq > 0:
                        self.gpio.output(self.pin, self.gpio.HIGH)
                    time.sleep(duration)
                    self.gpio.output(self.pin, self.gpio.LOW)
                    time.sleep(0.02)
            except Exception:
                pass

    def play_note(self, freq, duration):
        """Membunyikan satu nada frekuensi tertentu."""
        self.play_melody([(freq, duration)])

    def beep(self, times=2, duration=0.08, interval=0.06):
        """Membunyikan nada bip dengan jumlah dan durasi tertentu."""
        notes = []
        for i in range(times):
            notes.append((880, duration))
            if i < times - 1:
                notes.append((0, interval))
        self.play_melody(notes)

    def play_ready_melody(self):
        """
        Melodi ceria penanda sistem LENTERA siap & WiFi terhubung:
        Irama naik khas: Do(C5) -> Mi(E5) -> Sol(G5) ... jeda ... Sol(G5) -> Do Tinggi(C6)!
        """
        notes = [
            (523, 0.08),  # C5 (Do)
            (659, 0.08),  # E5 (Mi)
            (784, 0.10),  # G5 (Sol)
            (0,   0.05),  # jeda staccato
            (784, 0.09),  # G5 (Sol)
            (1046, 0.32), # C6 (Do Tinggi sustained)
        ]
        self.play_melody(notes)

    def play_power_on_chirp(self):
        """Chirp cepat konfirmasi saklar ON ditekan (G5 -> C6)."""
        notes = [
            (784, 0.07),  # G5
            (1046, 0.14), # C6
        ]
        self.play_melody(notes)

    def play_power_off_melody(self):
        """Melodi turun penanda shutdown sistem aman (C6 -> G5 -> C5)."""
        notes = [
            (1046, 0.09), # C6
            (784,  0.09), # G5
            (523,  0.24), # C5
        ]
        self.play_melody(notes)

    def play_victory_melody(self):
        """Fanfare kemenangan modul sirkuit selesai."""
        notes = [
            (523, 0.08),  # C5
            (659, 0.08),  # E5
            (784, 0.08),  # G5
            (1046, 0.12), # C6
            (0, 0.04),
            (784, 0.08),  # G5
            (1046, 0.30), # C6
        ]
        self.play_melody(notes)

    def play_step_success(self):
        """Chime 2 nada saat satu langkah atau balok berhasil terpasang tepat."""
        notes = [
            (659, 0.07),  # E5
            (880, 0.13),  # A5
        ]
        self.play_melody(notes)

    def cleanup(self):
        if self.is_pi and hasattr(self, 'gpio'):
            try:
                self.gpio.output(self.pin, self.gpio.LOW)
            except Exception:
                pass
