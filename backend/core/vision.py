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
        self.aruco_params.adaptiveThreshWinSizeMin = 5
        self.aruco_params.adaptiveThreshWinSizeMax = 35  # 4 window (5, 15, 25, 35): 2x lebih cepat di Raspi namun tetap tahan gradasi
        self.aruco_params.adaptiveThreshWinSizeStep = 10
        self.aruco_params.adaptiveThreshConstant = 5  # Lebih sensitif pada area tengah papan yang redup
        self.aruco_params.minDistanceToBorder = 1
        self.aruco_params.minOtsuStdDev = 2.5  # Tetap baca bit di area tengah papan yang kontrasnya tipis
        self.aruco_params.errorCorrectionRate = 0.70  # Toleran terhadap bayangan dinding slot
        self.aruco_params.maxErroneousBitsInBorderRate = 0.38  # Toleransi pantulan tipis di tepi border hitam
        self.aruco_params.perspectiveRemoveIgnoredMarginPerCell = 0.22  # Fokus ke tengah tiap bit agar tidak terpengaruh tepi
        self.aruco_params.minMarkerPerimeterRate = 0.03  # Mampu mendeteksi marker sedikit lebih jauh/kecil
        self.aruco_params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
        self.aruco_params.cornerRefinementWinSize = 5
        self.aruco_params.cornerRefinementMaxIterations = 20
        self.aruco_params.cornerRefinementMinAccuracy = 0.05
        
        self.detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_params)
        self.clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        # ID 1-7: Komponen resmi Lentera | ID 35: Via, ID 36: Amira, ID 37: Ajib (Kelas 11 SMA)
        self.valid_ids = {1, 2, 3, 4, 5, 6, 7, 35, 36, 37}
        
        # Kamera parameters (Intrinsic), default mock
        self.camera_matrix = np.eye(3)
        self.dist_coeffs = np.zeros(4)

    def load_calibration(self, calibration_file):
        # Di Fase 1 MVP, kita bisa me-load json dari hasil kalibrasi 14.1
        # Untuk sementara (mock lokal), biarkan default
        pass

    def _is_valid_marker(self, ref_gray, corners):
        """
        Tolak ghost marker akibat silau LED pada lubang slot kosong (seperti ID 37 di B3):
        1. Di pusat lensa (C3), marker tampak lebih besar (~66-75px pada 480p) dibanding sudut (~50px),
           sehingga batas ukuran dibuat longgar (25% tinggi frame = 120px) agar C3 tidak pernah ditolak.
        2. Keempat tepi bingkai luar (top, bottom, left, right) tidak boleh berupa sorotan lampu LED
           putih sebelah (pada ghost B3, tepi bawah = 200 > p90 dan selisih tepi > 100).
        """
        pts = np.asarray(corners, dtype=np.float32).reshape(4, 2)
        sides = [float(np.linalg.norm(pts[(i + 1) % 4] - pts[i])) for i in range(4)]
        min_side, max_side = min(sides), max(sides)
        h, w = ref_gray.shape[:2]
        if min_side < 12 or max_side > min(h, w) * 0.25 or (max_side / max(min_side, 1.0)) > 1.85:
            return False

        dst = np.array([[0, 0], [35, 0], [35, 35], [0, 35]], dtype=np.float32)
        M = cv2.getPerspectiveTransform(pts, dst)
        patch = cv2.warpPerspective(ref_gray, M, (36, 36))

        inner = patch[6:30, 6:30]
        p90 = float(np.percentile(inner, 90))
        p10 = float(np.percentile(inner, 10))
        if p90 - p10 < 20:
            return False

        edges = [
            float(patch[1:5, 4:32].mean()),   # Top border
            float(patch[31:35, 4:32].mean()), # Bottom border
            float(patch[4:32, 1:5].mean()),   # Left border
            float(patch[4:32, 31:35].mean()), # Right border
        ]
        # Pada stiker asli, ke-4 sisi bingkai hitam lebih gelap dari bit putih (p90) dan seragam.
        # Pada lubang kosong B3 yang disorot LED, salah satu tepi sangat terang (>= p90) dan timpang (> 65).
        if max(edges) > p90 or (max(edges) - min(edges)) > 90:
            return False
        return True

    def detect_markers(self, frame):
        """
        Deteksi marker ArUco yang cepat, adaptif, dan tahan terhadap distorsi inframerah/ungu.
        Menggabungkan pembacaan Green Channel (kebal banjir IR), CLAHE, Grayscale, dan Blue Channel
        dengan deduplikasi spasial serta filter anti-ghosting silau LED.
        """
        has_channels = len(frame.shape) == 3 and frame.shape[2] >= 3
        green = frame[:, :, 1] if has_channels else frame
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if has_channels else frame

        detections = []  # [(m_id, corners, (cx, cy))]

        def collect(img_channel):
            corners, ids, _ = self.detector.detectMarkers(img_channel)
            if ids is None:
                return
            flat_ids = np.ravel(ids)
            for i in range(len(flat_ids)):
                m_id = int(flat_ids[i])
                if m_id not in self.valid_ids:
                    continue
                c = corners[i][0]
                if not self._is_valid_marker(gray, c):
                    continue
                cx, cy = calculate_centroid(c)
                if not any(math.hypot(cx - ex, cy - ey) < 25 for _, _, (ex, ey) in detections):
                    detections.append((m_id, c, (cx, cy)))

        collect(green)
        collect(self.clahe.apply(green))
        if has_channels:
            collect(gray)
            collect(self.clahe.apply(gray))
            collect(frame[:, :, 0])  # Blue channel memiliki kontras tertinggi di bawah lampu LED putih
            collect(frame[:, :, 2])  # Red channel kebal terhadap silau cyan/biru LED pada sudut papan
            collect(self.clahe.apply(frame[:, :, 2]))

        return [(m_id, c) for m_id, c, _ in detections]

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
