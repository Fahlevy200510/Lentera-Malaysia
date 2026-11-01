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
        # Koordinat terkalibrasi memperhitungkan distorsi barel lensa fisheye pada 640x480
        calib_cells = {
            "A1": [153.0, 95.0], "B1": [230.0, 90.0], "C1": [310.0, 87.0], "D1": [393.0, 90.0], "E1": [469.0, 95.0],
            "A2": [149.0, 165.0], "B2": [228.0, 165.0], "C2": [309.0, 164.0], "D2": [396.0, 165.0], "E2": [473.0, 165.0],
            "A3": [147.0, 241.0], "B3": [228.0, 241.0], "C3": [309.0, 241.0], "D3": [398.0, 241.0], "E3": [477.0, 241.0],
            "A4": [149.0, 313.0], "B4": [228.0, 313.0], "C4": [309.0, 314.0], "D4": [396.0, 313.0], "E4": [473.0, 313.0],
            "A5": [153.0, 381.0], "B5": [230.0, 386.0], "C5": [310.0, 389.0], "D5": [393.0, 386.0], "E5": [469.0, 381.0],
        }
        for cell_name, pt in calib_cells.items():
            self.grid_rois[cell_name] = {
                "centroid": pt,
                "radius": 48.0
            }
        with open(self.roi_file, 'w') as f:
            json.dump(self.grid_rois, f, indent=2)

    def map_to_cell(self, centroid_x, centroid_y):
        """
        Mencari sel terdekat berdasarkan jarak Euclidean.
        Mengembalikan nama sel (mis. "A1") atau None jika di luar semua radius.
        """
        if not self.grid_rois:
            return None
            
        best_cell = None
        min_dist = float('inf')
        
        for cell_name, roi in self.grid_rois.items():
            if cell_name == "_camera_corners":
                continue
            cx, cy = roi["centroid"]
            radius = roi["radius"]
            
            dist = math.hypot(centroid_x - cx, centroid_y - cy)
            if dist <= radius and dist < min_dist:
                min_dist = dist
                best_cell = cell_name
                
        return best_cell

    def auto_calibrate(self, raw_detections):
        """
        Melakukan kalibrasi otomatis berdasarkan deteksi marker di 4 sudut.
        Diasumsikan pengguna meletakkan 4 komponen di sudut terluar: A1, E1, A5, E5.
        """
        if len(raw_detections) < 4:
            return False, "Silakan letakkan 4 komponen di keempat sudut papan untuk kalibrasi."
            
        centroids = []
        for m_id, corners in raw_detections:
            # Hitung centroid dari 4 titik
            cx = sum(p[0] for p in corners) / 4
            cy = sum(p[1] for p in corners) / 4
            centroids.append((cx, cy))
            
        # Urutkan sudut:
        # TL (Top-Left): x+y terkecil
        tl = min(centroids, key=lambda c: c[0] + c[1])
        # BR (Bottom-Right): x+y terbesar
        br = max(centroids, key=lambda c: c[0] + c[1])
        # TR (Top-Right): x-y terbesar
        tr = max(centroids, key=lambda c: c[0] - c[1])
        # BL (Bottom-Left): y-x terbesar
        bl = max(centroids, key=lambda c: c[1] - c[0])
        
        selected = {tl, br, tr, bl}
        if len(selected) < 4:
            return False, "Pastikan 4 komponen berada di 4 sudut terpisah (A1, E1, A5, E5)."
        
        cols = ['A', 'B', 'C', 'D', 'E']
        for r in range(5):
            # Aslinya: Row 1 (r=0) di ATAS kamera, Row 5 (r=4) di BAWAH kamera.
            # Ini sesuai dengan orientasi fisik yang ditaruh siswa.
            left_x = tl[0] + (bl[0] - tl[0]) * (r / 4.0)
            left_y = tl[1] + (bl[1] - tl[1]) * (r / 4.0)
            
            right_x = tr[0] + (br[0] - tr[0]) * (r / 4.0)
            right_y = tr[1] + (br[1] - tr[1]) * (r / 4.0)
            
            for c in range(5):
                cx = left_x + (right_x - left_x) * (c / 4.0)
                cy = left_y + (right_y - left_y) * (c / 4.0)
                
                cell_name = f"{cols[c]}{r+1}"
                dist_x = math.hypot(right_x - left_x, right_y - left_y) / 4.0
                
                self.grid_rois[cell_name] = {
                    "centroid": [float(cx), float(cy)],
                    "radius": float(dist_x * 0.52)
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
            
        return True, "Kalibrasi berhasil. Papan sudah terpetakan."
