import platform
import cv2
import numpy as np

class BaseCamera:
    def get_frame(self):
        raise NotImplementedError
    def close(self):
        pass

class DummyCamera(BaseCamera):
    def __init__(self, resolution=(640, 480)):
        self.resolution = resolution
        # Coba gunakan webcam jika ada
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            print("Peringatan: Webcam tidak ditemukan, menggunakan gambar kosong (blank frame).")
            self.cap = None

    def get_frame(self):
        if self.cap:
            ret, frame = self.cap.read()
            if ret:
                frame = cv2.resize(frame, self.resolution)
                return frame
        
        # Jika tidak ada webcam, kembalikan gambar putih kosong untuk mock
        return np.ones((self.resolution[1], self.resolution[0], 3), dtype=np.uint8) * 255

    def close(self):
        if self.cap:
            self.cap.release()

class PiCamera(BaseCamera):
    def __init__(self, resolution=(640, 480)):
        try:
            from picamera2 import Picamera2
        except ImportError:
            raise RuntimeError("Modul Picamera2 tidak ditemukan. Pastikan berjalan di Raspberry Pi.")
        
        import time
        # Modul OV5647 fisheye tanpa filter IR -> pakai tuning NoIR agar lampu pijar (banyak IR) tidak membuat gambar ungu
        try:
            self.picam2 = Picamera2(tuning=Picamera2.load_tuning_file("ov5647_noir.json"))
        except Exception as e:
            print(f"[CAMERA] Tuning NoIR gagal dimuat ({e}), pakai tuning default.")
            self.picam2 = Picamera2()
        config = self.picam2.create_video_configuration(main={"size": resolution, "format": "RGB888"})  # Picamera2 RGB888 = urutan byte BGR di memori (cocok OpenCV)
        self.picam2.configure(config)
        self.picam2.start()
        time.sleep(1.2)  # Beri waktu bagi sensor AEC/AWB untuk konvergensi pencahayaan alami

    def get_frame(self):
        # Mengembalikan frame numpy BGR 3-channel murni untuk OpenCV
        try:
            frame = self.picam2.capture_array()
            if frame is not None and len(frame.shape) == 3 and frame.shape[2] == 4:
                return frame[:, :, :3]  # Pangkas alpha/padding jika ada XBGR
            return frame
        except Exception as e:
            print(f"[CAMERA CAPTURE ERROR] {e}")
            return None

    def close(self):
        try:
            self.picam2.stop()
        except Exception:
            pass

def get_camera(resolution=(640, 480)):
    """
    Factory method untuk mendapatkan instance kamera yang tepat
    berdasarkan OS yang digunakan.
    """
    if platform.system() == "Windows":
        print("Berjalan di Windows: Menggunakan DummyCamera (Mock/Webcam)")
        return DummyCamera(resolution)
    else:
        try:
            return PiCamera(resolution)
        except Exception as e:
            print(f"Gagal inisialisasi PiCamera: {e}. Fallback ke DummyCamera.")
            return DummyCamera(resolution)
