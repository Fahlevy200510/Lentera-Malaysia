from backend.logic.debounce import CellDebouncer, discretize_rotation

MARKER_ID_MAP = {
    1: "battery",
    2: "straight_cable",
    3: "l_cable",
    4: "t_cable",
    5: "lamp",
    6: "resistor",
    7: "switch"
}

COMPONENTS_WITH_ROTATION = ["battery", "straight_cable", "l_cable", "t_cable", "switch", "lamp"]

class GridState:
    def __init__(self):
        self.cells = {}
        self.debouncers = {}
        
        # Inisialisasi 25 sel kosong A1-E5
        cols = ['A', 'B', 'C', 'D', 'E']
        for c in cols:
            for r in range(1, 6):
                cell_name = f"{c}{r}"
                self.cells[cell_name] = None
                self.debouncers[cell_name] = CellDebouncer()
                
    def process_frame_detections(self, cell_observations):
        """
        cell_observations: dict { "A1": {"id": 1, "raw_angle": 105}, ... }
        Kembalikan list event (perubahan) yang terjadi di frame ini.
        """
        events = []
        
        for cell_name in self.cells.keys():
            obs = cell_observations.get(cell_name)
            
            parsed_obs = None
            if obs is not None:
                marker_id = obs["id"]
                raw_angle = obs["raw_angle"]
                
                if marker_id in MARKER_ID_MAP:
                    comp_name = MARKER_ID_MAP[marker_id]
                    rot = 0
                    
                    if comp_name in COMPONENTS_WITH_ROTATION:
                        # Dapatkan rotasi sebelumnya untuk hysteresis
                        prev_bucket = None
                        prev_state = self.debouncers[cell_name].confirmed
                        if prev_state and prev_state.get("component") == comp_name:
                            prev_bucket = prev_state.get("rotation")
                            
                        rot = discretize_rotation(raw_angle, prev_bucket)
                        
                        # Rumus final berdasarkan kalibrasi empiris (A1):
                        # Fisik 0 (Kanan) -> Kamera 270
                        # Fisik 90 (Bawah) -> Kamera 180
                        # Oleh karena itu: rotasi_asli = (270 - rotasi_kamera) % 360
                        rot = (270 - rot) % 360
                        if comp_name in ["switch", "straight_cable"]:
                            rot = rot % 180
                            
                    parsed_obs = {
                        "component": comp_name,
                        "rotation": rot
                    }
            
            # Update debouncer
            is_changed, confirmed_state = self.debouncers[cell_name].update(parsed_obs)
            
            if is_changed:
                old_state = self.cells[cell_name]
                self.cells[cell_name] = confirmed_state
                
                # Buat event sederhana dulu
                if confirmed_state is None:
                    events.append({
                        "type": "component_removed",
                        "cell": cell_name,
                        "narration": f"Component at {cell_name} removed."
                    })
                else:
                    comp = confirmed_state["component"]
                    rot = confirmed_state["rotation"]
                    
                    # Bedakan diletakkan vs diubah (toggle)
                    if old_state is not None and old_state.get("component") == comp:
                        # Berarti hanya rotasinya yang berubah
                        if comp == "switch":
                            status = "ON" if rot == 90 else "OFF"
                            events.append({
                                "type": "switch_toggled",
                                "cell": cell_name,
                                "state": status,
                                "narration": f"Switch at {cell_name} toggled to {status}."
                            })
                        else:
                            events.append({
                                "type": "component_rotated",
                                "cell": cell_name,
                                "component": comp,
                                "rotation": rot,
                                "narration": f"Rotation of {comp.replace('_', ' ')} at {cell_name} changed."
                            })
                    else:
                        # Komponen baru diletakkan
                        events.append({
                            "type": "component_placed",
                            "cell": cell_name,
                            "component": comp,
                            "rotation": rot,
                            "narration": f"{comp.replace('_', ' ').capitalize()} placed at {cell_name}."
                        })
                        
        return events
