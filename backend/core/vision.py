import cv2
import numpy as np
import math

class VisionCore:
    def __init__(self, dictionary_id=cv2.aruco.DICT_4X4_50):
        # Setup ArUco Detector
        self.aruco_dict = cv2.aruco.getPredefinedDictionary(dictionary_id)
        self.aruco_params = cv2.aruco.DetectorParameters()
        # Parameter adaptif, toleran terhadap silau/pantulan dan gradasi bayangan
        self.aruco_params.polygonalApproxAccuracyRate = 0.04
        self.aruco_params.adaptiveThreshWinSizeMin = 3
        self.aruco_params.adaptiveThreshWinSizeMax = 43  # Diperluas dari 23 ke 43 agar tahan gradasi terang-gelap
        self.aruco_params.adaptiveThreshWinSizeStep = 8  # Langkah lebih rapat (3, 11, 19, 27, 35, 43)
        self.aruco_params.minDistanceToBorder = 1
        self.aruco_params.errorCorrectionRate = 0.6  # Lebih toleran terhadap noise
        self.aruco_params.maxErroneousBitsInBorderRate = 0.35  # Toleransi 35% jika ada pantulan/silau kecil di border
        self.aruco_params.minMarkerPerimeterRate = 0.03  # Mampu mendeteksi marker sedikit lebih jauh/kecil
        self.aruco_params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
        self.aruco_params.cornerRefinementWinSize = 5
        self.aruco_params.cornerRefinementMaxIterations = 20
        self.aruco_params.cornerRefinementMinAccuracy = 0.05
        
        self.detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_params)
        self.clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        self.valid_ids = {1, 2, 3, 4, 5, 6, 7}  # 6 Komponen resmi Lentera urut 1-6 (Baterai=1, Lurus=2, L=3, T=4, Lampu=5, Saklar=6, fallback=7)
        
        # Kamera parameters (Intrinsic), default mock
        self.camera_matrix = np.eye(3)
        self.dist_coeffs = np.zeros(4)

    def load_calibration(self, calibration_file):
        # Di Fase 1 MVP, kita bisa me-load json dari hasil kalibrasi 14.1
        # Untuk sementara (mock lokal), biarkan default
        pass

    def detect_markers(self, frame):
        """
        Deteksi marker ArUco yang cepat, adaptif, dan tahan terhadap distorsi inframerah/ungu.
        Menggabungkan pembacaan Green Channel (kebal banjir IR) dan CLAHE untuk kontras maksimal.
        """
        has_channels = len(frame.shape) == 3 and frame.shape[2] >= 3
        # Saluran hijau (channel 1) paling tahan terhadap radiasi inframerah pada sensor NoIR / bohlam filamen
        green = frame[:, :, 1] if has_channels else frame

        corners, ids, _ = self.detector.detectMarkers(green)
        
        detected_map = {}
        if ids is not None:
            flat_ids = np.ravel(ids)
            for i in range(len(flat_ids)):
                m_id = int(flat_ids[i])
                if m_id in self.valid_ids:
                    detected_map[m_id] = corners[i][0]

        # Jika belum semua komponen terdeteksi, coba bantu dengan CLAHE kontras tinggi
        if len(detected_map) < len(self.valid_ids):
            enhanced = self.clahe.apply(green)
            e_corners, e_ids, _ = self.detector.detectMarkers(enhanced)
            if e_ids is not None:
                e_flat_ids = np.ravel(e_ids)
                for i in range(len(e_flat_ids)):
                    m_id = int(e_flat_ids[i])
                    if m_id in self.valid_ids and m_id not in detected_map:
                        detected_map[m_id] = e_corners[i][0]

        # Fallback terakhir ke grayscale standar jika green channel melewatkan marker
        if len(detected_map) == 0 and has_channels:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            g_corners, g_ids, _ = self.detector.detectMarkers(gray)
            if g_ids is not None:
                g_flat_ids = np.ravel(g_ids)
                for i in range(len(g_flat_ids)):
                    m_id = int(g_flat_ids[i])
                    if m_id in self.valid_ids and m_id not in detected_map:
                        detected_map[m_id] = g_corners[i][0]

        return list(detected_map.items())

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
