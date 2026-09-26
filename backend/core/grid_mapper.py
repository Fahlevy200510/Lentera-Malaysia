import json
import os
import math

class GridMapper:
    def __init__(self, roi_file="grid_roi.json"):
        self.roi_file = roi_file
        self.grid_rois = {} # { "A1": {"centroid": (x,y), "radius": r}, ... }
        self.load_roi()

    def load_roi(self):
        if os.path.exists(self.roi_file):
            try:
                with open(self.roi_file, 'r') as f:
                    self.grid_rois = json.load(f)
            except Exception as e:
                print(f"Gagal memuat {self.roi_file}: {e}")
        else:
            # Fallback mock ROI jika belum dikalibrasi (khusus testing lokal)
            print("Peringatan: grid_roi.json tidak ditemukan. Menggunakan mock ROI.")
            self._create_mock_roi()

    def _create_mock_roi(self):
        # Asumsikan resolusi 640x480, grid 5x5 tersebar di tengah
        cell_w = 80
        cell_h = 80
        start_x = 120
        start_y = 40
        cols = ['A', 'B', 'C', 'D', 'E']
        
        for r in range(5):
            for c in range(5):
                cell_name = f"{cols[c]}{r+1}"
                cx = start_x + (c * cell_w) + (cell_w // 2)
                cy = start_y + (r * cell_h) + (cell_h // 2)
                self.grid_rois[cell_name] = {
                    "centroid": [cx, cy],
                    "radius": min(cell_w, cell_h) * 0.4
                }
        
        # Simpan mock untuk tes
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
            return False, "Please place 4 components at the four corners of the board to calibrate."
            
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
        
        cols = ['A', 'B', 'C', 'D', 'E']
        for r in range(5):
            # r=0 (Baris 1) harusnya di BAWAH (bl, br)
            # r=4 (Baris 5) harusnya di ATAS (tl, tr)
            left_x = bl[0] + (tl[0] - bl[0]) * (r / 4.0)
            left_y = bl[1] + (tl[1] - bl[1]) * (r / 4.0)
            
            right_x = br[0] + (tr[0] - br[0]) * (r / 4.0)
            right_y = br[1] + (tr[1] - br[1]) * (r / 4.0)
            
            for c in range(5):
                cx = left_x + (right_x - left_x) * (c / 4.0)
                cy = left_y + (right_y - left_y) * (c / 4.0)
                
                cell_name = f"{cols[c]}{r+1}"
                dist_x = math.hypot(right_x - left_x, right_y - left_y) / 4.0
                
                self.grid_rois[cell_name] = {
                    "centroid": [cx, cy],
                    "radius": dist_x * 0.4
                }
                
        with open(self.roi_file, 'w') as f:
            json.dump(self.grid_rois, f, indent=2)
            
        return True, "Calibration successful. The board is now mapped."
