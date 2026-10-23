import cv2
import numpy as np
import math

class VisionCore:
    def __init__(self, dictionary_id=cv2.aruco.DICT_4X4_50):
        # Setup ArUco Detector
        self.aruco_dict = cv2.aruco.getPredefinedDictionary(dictionary_id)
        self.aruco_params = cv2.aruco.DetectorParameters()
        # Parameter stabil & akurat (bebas kedip dan anti-ghosting) untuk Raspberry Pi 3B
        self.aruco_params.polygonalApproxAccuracyRate = 0.03
        self.aruco_params.adaptiveThreshWinSizeMin = 3
        self.aruco_params.adaptiveThreshWinSizeMax = 23
        self.aruco_params.adaptiveThreshWinSizeStep = 10
        self.aruco_params.minDistanceToBorder = 2
        self.aruco_params.errorCorrectionRate = 0.5  # Cegah halusinasi bit pada bayangan/tekstur
        self.aruco_params.maxErroneousBitsInBorderRate = 0.25  # Wajibkan border hitam yang bersih
        self.aruco_params.minMarkerPerimeterRate = 0.04  # Tolak bintik noise kecil
        self.aruco_params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
        self.aruco_params.cornerRefinementWinSize = 3
        self.aruco_params.cornerRefinementMaxIterations = 15
        self.aruco_params.cornerRefinementMinAccuracy = 0.1
        
        self.detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_params)
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        self.valid_ids = {1, 2, 3, 5, 6, 7}  # 6 Komponen resmi Lentera: Baterai, Kabel Lurus, Kabel L, Lampu, Kabel T, Saklar
        
        # Kamera parameters (Intrinsic), default mock
        self.camera_matrix = np.eye(3)
        self.dist_coeffs = np.zeros(4)

    def load_calibration(self, calibration_file):
        # Di Fase 1 MVP, kita bisa me-load json dari hasil kalibrasi 14.1
        # Untuk sementara (mock lokal), biarkan default
        pass

    def detect_markers(self, frame):
        """
        Deteksi marker ArUco yang cepat dan stabil.
        Menyaring ID acak (> 9) agar bayangan atau pantulan akrilik tidak memunculkan ghost marker.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        corners, ids, _ = self.detector.detectMarkers(gray)
        
        results = []
        if ids is not None:
            flat_ids = np.ravel(ids)
            for i in range(len(flat_ids)):
                m_id = int(flat_ids[i])
                if m_id in self.valid_ids:
                    results.append((m_id, corners[i][0]))
        else:
            # Fallback ke CLAHE hanya jika sama sekali tidak ada marker yang terdeteksi
            enhanced = self.clahe.apply(gray)
            e_corners, e_ids, _ = self.detector.detectMarkers(enhanced)
            if e_ids is not None:
                e_flat_ids = np.ravel(e_ids)
                for i in range(len(e_flat_ids)):
                    m_id = int(e_flat_ids[i])
                    if m_id in self.valid_ids:
                        results.append((m_id, e_corners[i][0]))
        
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

def get_marker_rotation_state(corners, H=None):
    """
    Menghitung rotasi marker berdasarkan sudut corner.
    Jika ada matriks Homografi (H), unwarp perspektifnya dulu.
    """
    if H is not None:
        pts = np.array(corners, dtype=np.float32).reshape(-1, 1, 2)
        transformed_pts = cv2.perspectiveTransform(pts, H)
        tl, tr, br, bl = transformed_pts.reshape(4, 2)
    else:
        tl, tr, br, bl = corners
        
    dx = tr[0] - tl[0]
    dy = tr[1] - tl[1]
    
    # Sudut dalam radian, konversi ke derajat (0-360)
    angle_rad = math.atan2(dy, dx)
    angle_deg = math.degrees(angle_rad) % 360
    
    return angle_deg

def compute_homography(camera_corners_dict):
    """
    Menghitung matriks Homography dari 4 sudut fisik ke persegi sempurna.
    camera_corners_dict: {"tl": [x,y], "tr": [x,y], "bl": [x,y], "br": [x,y]}
    """
    src_pts = np.array([
        camera_corners_dict["tl"],
        camera_corners_dict["tr"],
        camera_corners_dict["br"],
        camera_corners_dict["bl"]
    ], dtype=np.float32)
    
    # Map ke bidang 500x500
    dst_pts = np.array([
        [0, 0],
        [500, 0],
        [500, 500],
        [0, 500]
    ], dtype=np.float32)
    
    H, _ = cv2.findHomography(src_pts, dst_pts)
    return H
