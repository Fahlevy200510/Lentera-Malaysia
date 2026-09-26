import platform

class LEDController:
    def __init__(self, pin=18):
        self.pin = pin
        # Deteksi otomatis apakah berjalan di Raspberry Pi atau laptop
        self.is_pi = platform.machine() in ["armv7l", "armv6l", "aarch64"]
        
        if self.is_pi:
            try:
                import RPi.GPIO as GPIO
                GPIO.setwarnings(False)
                GPIO.setmode(GPIO.BCM)
                GPIO.setup(self.pin, GPIO.OUT)
                self.gpio = GPIO
                print(f"[LED] GPIO Controller aktif di pin BCM {self.pin}")
            except ImportError:
                print("[LED] Peringatan: Pustaka RPi.GPIO tidak ditemukan. Fitur lampu asli dinonaktifkan.")
                self.is_pi = False
        else:
            print("[LED] Berjalan di simulator/laptop. Fitur lampu asli dinonaktifkan.")

    def turn_on(self):
        if self.is_pi:
            self.gpio.output(self.pin, self.gpio.HIGH)

    def turn_off(self):
        if self.is_pi:
            self.gpio.output(self.pin, self.gpio.LOW)

    def cleanup(self):
        if self.is_pi:
            self.gpio.cleanup()
