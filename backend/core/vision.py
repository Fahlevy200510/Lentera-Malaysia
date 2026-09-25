import cv2
import numpy as np
import math

class VisionCore:
    def __init__(self, dictionary_id=cv2.aruco.DICT_4X4_50):
        # Setup ArUco Detector
        self.aruco_dict = cv2.aruco.getPredefinedDictionary(dictionary_id)
        self.aruco_params = cv2.aruco.DetectorParameters()
        self.detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_params)
        
        # Kamera parameters (Intrinsic), default mock
        self.camera_matrix = np.eye(3)
        self.dist_coeffs = np.zeros(4)

    def load_calibration(self, calibration_file):
        # Di Fase 1 MVP, kita bisa me-load json dari hasil kalibrasi 14.1
        # Untuk sementara (mock lokal), biarkan default
        pass

    def detect_markers(self, frame):
        """
        Mendeteksi marker ArUco. Mengembalikan dictionary {id: corners}.
        Sesuai PRD (Strategi A), ini dipanggil di frame mentah.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        corners, ids, rejected = self.detector.detectMarkers(gray)
        
        results = []
        if ids is not None:
            flat_ids = np.ravel(ids)
            for i in range(len(flat_ids)):
                results.append((int(flat_ids[i]), corners[i][0]))
        return results

    def undistort_corners(self, corners):
        """
        Meng-undistort titik corners. Sesuai PRD 9.2 (Point-space undistort).
        """
        # Jika belum ada kalibrasi lensa, kembalikan apa adanya
        if np.all(self.dist_coeffs == 0):
            return corners
            
        # OpenCV butuh bentuk array tertentu untuk fisheye undistort
        reshaped = np.array(corners).reshape(-1, 1, 2).astype(np.float32)
        # Asumsikan menggunakan fisheye model sesuai PRD
        undistorted = cv2.fisheye.undistortPoints(reshaped, self.camera_matrix, self.dist_coeffs, P=self.camera_matrix)
        return undistorted.reshape(4, 2)

def calculate_centroid(corners):
    """Menghitung titik tengah dari 4 corner"""
    x = sum([c[0] for c in corners]) / 4
    y = sum([c[1] for c in corners]) / 4
    return (x, y)

def get_marker_rotation_state(corners):
    """
    Menghitung rotasi marker berdasarkan sudut corner.
    Corners ArUco selalu terurut: Top-Left, Top-Right, Bottom-Right, Bottom-Left relatif terhadap orientasi asli marker.
    Kita gunakan vektor Top-Left -> Top-Right untuk menentukan sudut.
    """
    tl, tr, br, bl = corners
    dx = tr[0] - tl[0]
    dy = tr[1] - tl[1]
    
    # Sudut dalam radian, konversi ke derajat (0-360)
    angle_rad = math.atan2(dy, dx)
    angle_deg = math.degrees(angle_rad) % 360
    
    return angle_deg
