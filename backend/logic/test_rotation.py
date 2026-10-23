"""Self-check rotasi ArUco. Jalankan: python -m backend.logic.test_rotation (dari root repo)."""
import cv2
import numpy as np

from backend.core.vision import VisionCore, get_marker_rotation_state
from backend.logic.debounce import discretize_rotation
from backend.logic.circuit import get_open_sides, evaluate_circuit


def pipeline_rotation(marker_id, student_cw_deg):
    # Kamera di bawah papan: putaran CW dilihat siswa = putaran CCW di citra kamera (np.rot90 positif = CCW)
    d = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    canvas = np.full((300, 300), 255, np.uint8)
    canvas[90:210, 90:210] = cv2.aruco.generateImageMarker(d, marker_id, 120)
    img = np.rot90(canvas, student_cw_deg // 90).copy()
    (_, corners), = VisionCore().detect_markers(cv2.cvtColor(img, cv2.COLOR_GRAY2BGR))
    raw = get_marker_rotation_state(corners)
    return discretize_rotation((360 - raw) % 360, None)  # sama dengan grid_state.py


for deg in (0, 90, 180, 270):
    assert pipeline_rotation(3, deg) == deg, deg

# Kabel L default └, diputar CW
assert get_open_sides("l_cable", 0) == ["Atas", "Kanan"]
assert get_open_sides("l_cable", 90) == ["Kanan", "Bawah"]
assert get_open_sides("t_cable", 0) == ["Kiri", "Kanan", "Bawah"]
assert sorted(get_open_sides("straight_cable", 90)) == ["Atas", "Bawah"]

# Hysteresis: penempatan rapi 90 derajat harus diterima, goyangan dekat batas 45 ditahan
assert discretize_rotation(88, 0) == 90
assert discretize_rotation(50, 0) == 0
assert discretize_rotation(355, 0) == 0
assert discretize_rotation(275, 0) == 270

# Preset "closed" dari CircuitDiagram.tsx harus menyala, "open" harus saklar mati
closed = {
    "C4": {"component": "battery", "rotation": 270},
    "B4": {"component": "l_cable", "rotation": 90},
    "D4": {"component": "l_cable", "rotation": 180},
    "B2": {"component": "l_cable", "rotation": 0},
    "D2": {"component": "l_cable", "rotation": 270},
    "B3": {"component": "straight_cable", "rotation": 90},
    "D3": {"component": "switch", "rotation": 90},
    "C2": {"component": "lamp", "rotation": 180},
}
assert evaluate_circuit(closed)["status"] == "success"
assert evaluate_circuit({**closed, "D3": {"component": "switch", "rotation": 0}})["status"] == "switch_off"

print("OK: semua cek rotasi lolos")
