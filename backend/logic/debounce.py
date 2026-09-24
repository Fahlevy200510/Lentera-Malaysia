PRESENCE_CONFIRM_FRAMES = 8   # ~360ms pada 22 FPS - penempatan
REMOVAL_CONFIRM_FRAMES = 15   # ~680ms pada 22 FPS - pelepasan
ROTATION_DEADZONE_DEG = 20    # +/- 20 derajat dari batas kuadran diabaikan

def discretize_rotation(raw_angle_deg, previous_bucket):
    """
    Hysteresis rotasi untuk Baterai, Switch, dan Kabel.
    Mencegah state jitter di sekitar batas antar-kuadran (45, 135, 225, 315).
    Mengembalikan 0, 90, 180, atau 270.
    """
    if previous_bucket is None:
        # Jika belum ada state sebelumnya, langsung bulatkan ke kelipatan 90 terdekat
        return round(raw_angle_deg / 90) * 90 % 360
        
    nearest_bucket = round(raw_angle_deg / 90) * 90 % 360
    distance_to_boundary = min(abs(raw_angle_deg % 90), 90 - abs(raw_angle_deg % 90))
    
    if distance_to_boundary < ROTATION_DEADZONE_DEG:
        return previous_bucket # Tunda keputusan, gunakan yang lama
        
    return nearest_bucket

class CellDebouncer:
    def __init__(self):
        self.confirmed = None        # State resmi saat ini (None atau dict {component, rotation})
        self.candidate = None        # State yang sedang diamati
        self.candidate_count = 0     # Berapa frame beruntun candidate konsisten
        
    def update(self, observed):
        """
        observed: hasil deteksi frame ini (None atau dict)
        Mengembalikan tuple (is_changed, confirmed_state)
        """
        # Cek kesamaan
        is_same = False
        if observed is None and self.candidate is None:
            is_same = True
        elif observed is not None and self.candidate is not None:
            if observed.get("component") == self.candidate.get("component") and \
               observed.get("rotation") == self.candidate.get("rotation"):
                is_same = True
                
        if is_same:
            self.candidate_count += 1
        else:
            self.candidate = observed
            self.candidate_count = 1
            
        threshold = REMOVAL_CONFIRM_FRAMES if self.candidate is None else PRESENCE_CONFIRM_FRAMES
        
        is_changed = False
        if self.candidate_count >= threshold:
            # Cek apakah berbeda dari confirmed
            diff = False
            if self.candidate is None and self.confirmed is not None:
                diff = True
            elif self.candidate is not None and self.confirmed is None:
                diff = True
            elif self.candidate is not None and self.confirmed is not None:
                if self.candidate.get("component") != self.confirmed.get("component") or \
                   self.candidate.get("rotation") != self.confirmed.get("rotation"):
                    diff = True
                    
            if diff:
                self.confirmed = self.candidate
                is_changed = True
                
        return is_changed, self.confirmed
