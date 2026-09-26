import queue
import threading
import time

class AudioNarrator:
    def __init__(self):
        # maxsize=1 agar tidak menumpuk antrean suara lama
        self.q = queue.Queue(maxsize=1)
        self.running = True
        self.thread = threading.Thread(target=self._worker, daemon=True)
        
        # Inisialisasi engine TTS dengan subprocess espeak (lebih robust di Linux)
        import subprocess
        try:
            # Cek apakah espeak terinstal
            subprocess.run(['espeak', '--version'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            self.has_tts = True
        except Exception as e:
            print(f"Peringatan: Gagal menemukan espeak ({e}). Audio lokal akan menggunakan print.")
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
                    import subprocess
                    subprocess.run(['espeak', '-s', '150', text], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    
                self.q.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Error pada TTS: {e}")
                time.sleep(1)
