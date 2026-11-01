import json
import os
import math

class GridMapper:
    def __init__(self, roi_file="grid_roi.json"):
        self.roi_file = roi_file
        self.grid_rois = {} # { "A1": {"centroid": (x,y), "radius": r}, ... }
        self.H = None
        self.load_roi()

    def load_roi(self):
        if os.path.exists(self.roi_file):
            try:
                with open(self.roi_file, 'r') as f:
                    content = f.read().strip()
                    if content:
                        self.grid_rois = json.loads(content)
                if "_camera_corners" in self.grid_rois:
                    from backend.core.vision import compute_homography
                    self.H = compute_homography(self.grid_rois["_camera_corners"])
            except Exception as e:
                print(f"Gagal memuat {self.roi_file}: {e}")
                self.grid_rois = {}
                self.H = None
        else:
            # Fallback mock ROI jika belum dikalibrasi (khusus testing lokal)
            print("Peringatan: grid_roi.json tidak ditemukan. Menggunakan mock ROI.")
            self._create_mock_roi()

    def _create_mock_roi(self):
        # Koordinat default fisik terkalibrasi untuk lensa fisheye LENTERA pada resolusi 640x480
        calib_cells = {
            "A1": [155.0, 61.0],  "B1": [233.0, 58.0],  "C1": [311.0, 58.0],  "D1": [393.0, 58.0],  "E1": [475.0, 61.0],
            "A2": [155.0, 139.0], "B2": [233.0, 139.0], "C2": [311.0, 139.0], "D2": [393.0, 139.0], "E2": [475.0, 139.0],
            "A3": [155.0, 219.0], "B3": [233.0, 219.0], "C3": [311.0, 219.0], "D3": [393.0, 219.0], "E3": [475.0, 219.0],
            "A4": [155.0, 299.0], "B4": [233.0, 299.0], "C4": [311.0, 299.0], "D4": [393.0, 299.0], "E4": [475.0, 299.0],
            "A5": [155.0, 373.0], "B5": [233.0, 377.0], "C5": [311.0, 377.0], "D5": [393.0, 377.0], "E5": [475.0, 373.0],
        }
        for cell_name, pt in calib_cells.items():
            self.grid_rois[cell_name] = {
                "centroid": pt,
                "radius": 50.0
            }
        with open(self.roi_file, 'w') as f:
            json.dump(self.grid_rois, f, indent=2)

    def map_to_cell(self, centroid_x, centroid_y):
        """
        Mencari sel terdekat berdasarkan jarak Euclidean.
        Mengembalikan nama sel terdekat (A1-E5) di atas papan fisik.
        Toleransi 75px memastikan semua balok di atas papan terbaca di sel terdekatnya,
        bahkan jika peletakan sedikit bergeser atau sedang persiapan kalibrasi ulang.
        """
        if not self.grid_rois:
            return None
            
        best_cell = None
        min_dist = float('inf')
        
        for cell_name, roi in self.grid_rois.items():
            if cell_name == "_camera_corners":
                continue
            cx, cy = roi["centroid"]
            
            dist = math.hypot(centroid_x - cx, centroid_y - cy)
            if dist < min_dist:
                min_dist = dist
                best_cell = cell_name
                
        # Jarak maksimal toleransi (75px) mencakup seluruh area slot
        if min_dist <= 75.0:
            return best_cell
        return None

    def auto_calibrate(self, raw_detections):
        """
        Melakukan kalibrasi otomatis berdasarkan deteksi marker di 4 sudut.
        Diasumsikan pengguna meletakkan 4 komponen di sudut terluar: A1, E1, A5, E5.
        Menggunakan rasio fisik lensa fisheye agar seluruh baris dan kolom 5x5 melengkung pas.
        """
        if len(raw_detections) < 4:
            count = len(raw_detections)
            return False, f"Kalibrasi membutuhkan 4 balok di 4 sudut luar. Saat ini baru terdeteksi {count} balok."
            
        centroids = []
        for m_id, corners in raw_detections:
            cx = sum(p[0] for p in corners) / 4.0
            cy = sum(p[1] for p in corners) / 4.0
            centroids.append((cx, cy))
            
        # Urutkan sudut dalam sistem koordinat kamera mentah:
        # TL (Top-Left): x+y terkecil (A1 di kamera mentah)
        tl = min(centroids, key=lambda c: c[0] + c[1])
        # BR (Bottom-Right): x+y terbesar (E5 di kamera mentah)
        br = max(centroids, key=lambda c: c[0] + c[1])
        # TR (Top-Right): x-y terbesar (E1 di kamera mentah)
        tr = max(centroids, key=lambda c: c[0] - c[1])
        # BL (Bottom-Left): y-x terbesar (A5 di kamera mentah)
        bl = max(centroids, key=lambda c: c[1] - c[0])
        
        selected = {tl, br, tr, bl}
        if len(selected) < 4:
            return False, "Pastikan 4 balok berada di 4 sudut terpisah (A1, E1, A5, E5)."
        
        # Rasio relatif non-linear untuk mengompensasi distorsi cembung lensa fisheye
        u_ratios = [0.0, 0.244, 0.488, 0.744, 1.0]
        v_ratios = [0.0, 0.254, 0.505, 0.755, 1.0]
        cols = ['A', 'B', 'C', 'D', 'E']
        
        for r_idx in range(5):
            v = v_ratios[r_idx]
            left_x = tl[0] + (bl[0] - tl[0]) * v
            left_y = tl[1] + (bl[1] - tl[1]) * v
            right_x = tr[0] + (br[0] - tr[0]) * v
            right_y = tr[1] + (br[1] - tr[1]) * v
            
            for c_idx in range(5):
                u = u_ratios[c_idx]
                cx = left_x + (right_x - left_x) * u
                cy = left_y + (right_y - left_y) * u
                
                # Koreksi barel tambahan pada 4 sudut terluar
                if r_idx == 0 and (c_idx == 0 or c_idx == 4):
                    cy += 3.0
                elif r_idx == 4 and (c_idx == 0 or c_idx == 4):
                    cy -= 4.0
                
                cell_name = f"{cols[c_idx]}{r_idx+1}"
                dist_x = math.hypot(right_x - left_x, right_y - left_y) / 4.0
                
                self.grid_rois[cell_name] = {
                    "centroid": [round(float(cx), 1), round(float(cy), 1)],
                    "radius": float(dist_x * 0.58)
                }
                
        self.grid_rois["_camera_corners"] = {
            "tl": [float(tl[0]), float(tl[1])], 
            "tr": [float(tr[0]), float(tr[1])], 
            "br": [float(br[0]), float(br[1])], 
            "bl": [float(bl[0]), float(bl[1])]
        }
        
        from backend.core.vision import compute_homography
        self.H = compute_homography(self.grid_rois["_camera_corners"])
                
        with open(self.roi_file, 'w') as f:
            json.dump(self.grid_rois, f, indent=2)
            
        return True, "Kalibrasi berhasil. Papan 5x5 sudah terpetakan sempurna."
