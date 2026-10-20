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
            except Exception as e:
                print(f"[LED] Gagal inisialisasi GPIO: {e}")
                self.is_pi = False
        else:
            print(f"[LED] Berjalan di simulator. GPIO dinonaktifkan untuk {self.pins}.")

    def turn_on(self):
        if self.is_pi and hasattr(self, 'gpio'):
            try:
                for pin in self.pins:
                    self.gpio.output(pin, self.gpio.HIGH)
            except Exception:
                pass

    def turn_off(self):
        if self.is_pi and hasattr(self, 'gpio'):
            try:
                for pin in self.pins:
                    self.gpio.output(pin, self.gpio.LOW)
            except Exception:
                pass

    def cleanup(self):
        if self.is_pi and hasattr(self, 'gpio'):
            try:
                self.turn_off()
                self.gpio.cleanup()
            except Exception:
                pass
