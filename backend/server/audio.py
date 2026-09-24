import queue
import threading
import time

class AudioNarrator:
    def __init__(self):
        self.q = queue.Queue(maxsize=5)
        self.running = True
        self.thread = threading.Thread(target=self._worker, daemon=True)
        
        # Inisialisasi engine TTS (Opsional, gunakan print jika gagal)
        try:
            import pyttsx3
            self.engine = pyttsx3.init()
            # Set kecepatan bicara agak cepat agar responsif
            rate = self.engine.getProperty('rate')
            self.engine.setProperty('rate', 150)
            self.has_tts = True
        except Exception as e:
            print(f"Peringatan: Gagal memuat pyttsx3 ({e}). Audio lokal akan menggunakan print.")
            self.has_tts = False

    def start(self):
        self.thread.start()

    def stop(self):
        self.running = False
        # Push empty event to unblock
        try:
            self.q.put_nowait(None)
        except queue.Full:
            pass

    def enqueue_narration(self, text):
        if not text:
            return
            
        try:
            self.q.put_nowait(text)
        except queue.Full:
            # Jika antrean penuh, sesuai PRD 9.3: gabungkan atau buang yang lama
            # Untuk simpelnya, kita bisa clear antrean dan taruh yang paling baru (ringkasan)
            # Di sini kita drop event lama
            while not self.q.empty():
                try:
                    self.q.get_nowait()
                except queue.Empty:
                    break
            self.q.put_nowait("Multiple changes detected. " + text)

    def _worker(self):
        while self.running:
            try:
                text = self.q.get(timeout=1.0)
                if text is None: continue
                
                print(f"[LOCAL AUDIO] {text}")
                if self.has_tts:
                    self.engine.say(text)
                    self.engine.runAndWait()
                    
                self.q.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Error pada TTS: {e}")
                time.sleep(1)
