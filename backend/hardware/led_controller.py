import platform

class LEDController:
    def __init__(self, pins=None):
        if pins is None:
            self.pins = [18, 23, 24, 25]  # Default 4 pin untuk 4 lampu
        else:
            self.pins = pins
            
        # Deteksi otomatis apakah berjalan di Raspberry Pi atau laptop
        self.is_pi = platform.machine() in ["armv7l", "armv6l", "aarch64"]
        
        if self.is_pi:
            try:
                import RPi.GPIO as GPIO
                GPIO.setwarnings(False)
                GPIO.setmode(GPIO.BCM)
                for pin in self.pins:
                    GPIO.setup(pin, GPIO.OUT)
                    GPIO.output(pin, GPIO.LOW) # Pastikan mati saat awal
                self.gpio = GPIO
                print(f"[LED] GPIO Controller aktif di pin BCM {self.pins}")
            except ImportError:
                print("[LED] Peringatan: Pustaka RPi.GPIO tidak ditemukan. Fitur lampu asli dinonaktifkan.")
                self.is_pi = False
        else:
            print(f"[LED] Berjalan di simulator. GPIO dinonaktifkan untuk {self.pins}.")

    def turn_on(self):
        if self.is_pi:
            for pin in self.pins:
                self.gpio.output(pin, self.gpio.HIGH)

    def turn_off(self):
        if self.is_pi:
            for pin in self.pins:
                self.gpio.output(pin, self.gpio.LOW)

    def cleanup(self):
        if self.is_pi:
            self.gpio.cleanup()
