import time
import threading
import asyncio
from datetime import datetime
import json
import signal
import sys
import os
import base64
import numpy as np
import math

from backend.core.camera import get_camera
from backend.core.vision import VisionCore, calculate_centroid, get_marker_rotation_state
from backend.core.grid_mapper import GridMapper
from backend.logic.grid_state import GridState
from backend.logic.circuit import evaluate_circuit
from backend.server.audio import AudioNarrator
from backend.server.ws_server import WSServer
from backend.hardware.led_controller import LEDController
from backend.hardware.buzzer import BuzzerController

# Tangani sinyal dari systemd untuk mencegah hang saat shutdown
def signal_handler(sig, frame):
    print(f"Menerima sinyal {sig}, menutup LENTERA dengan aman...")
    raise KeyboardInterrupt

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def run_ws_server(ws_server):
    loop = asyncio.new_event_loop()
    ws_server.start_server(loop)

global_frame = None

from http.server import BaseHTTPRequestHandler, HTTPServer
import cv2

class MJPEGStreamHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/stream':
            self.send_response(200)
            self.send_header('Age', 0)
            self.send_header('Cache-Control', 'no-cache, private')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
            self.end_headers()
            try:
                while True:
                    if global_frame is not None:
                        ret, buffer = cv2.imencode('.jpg', global_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
                        if ret:
                            header = f"--FRAME\r\nContent-Type: image/jpeg\r\nContent-Length: {len(buffer)}\r\n\r\n"
                            self.wfile.write(header.encode('utf-8'))
                            self.wfile.write(buffer.tobytes())
                            self.wfile.write(b'\r\n')
                            self.wfile.flush()
                    time.sleep(1/15)
            except Exception as e:
                pass
        else:
            self.send_error(404)

def run_mjpeg_server():
    server = HTTPServer(('0.0.0.0', 8766), MJPEGStreamHandler)
    server.serve_forever()

def main():
    print("Memulai LENTERA MVP...")
    
    # 1. Inisialisasi Kamera
    camera = get_camera(resolution=(640, 480))
    
    # 2. Inisialisasi Modul
    vision = VisionCore()
    mapper = GridMapper("grid_roi.json")
    grid_state = GridState()
    
    # Inisialisasi Hardware (4 Lampu Fisik di PIN BCM 18, 23, 24, 25 & Buzzer di BCM 17)
    led = LEDController()
    buzzer = BuzzerController(pin=17)
    
    # 3. Inisialisasi Server Audio & WebSocket
    audio = AudioNarrator()
    audio.start()
    
    ws = WSServer(port=8765)
    ws_thread = threading.Thread(target=run_ws_server, args=(ws,), daemon=True)
    ws_thread.start()
    
    mjpeg_thread = threading.Thread(target=run_mjpeg_server, daemon=True)
    mjpeg_thread.start()
    
    # Verifikasi warm-up sensor kamera sebelum membunyikan tanda siap (mencegah false alarm)
    print("Memverifikasi kesiapan sensor kamera...")
    warmup_frame = camera.get_frame()
    if warmup_frame is not None and getattr(warmup_frame, "size", 0) > 0:
        buzzer.beep(times=2, duration=0.08, interval=0.06)
        audio.enqueue_narration("Sistem pengamat siap digunakan.")
    else:
        print("[WARNING] Kamera belum siap atau menghasilkan frame kosong.")
    
    # Spatial tracker untuk anti-kedip dan memori kalibrasi
    marker_tracker = []  # [{"id": m_id, "corners": corners, "centroid": (cx, cy), "last_seen": timestamp}]

    def handle_calibrate():
        print("[CALIBRATION] Menerima perintah auto-calibrate dari UI...")
        now = time.time()
        # Ambil semua marker yang terdeteksi dalam 2.5 detik terakhir
        valid_markers = [m for m in marker_tracker if (now - m["last_seen"]) < 2.5]
        print(f"[CALIBRATION] Marker valid terkumpul: {len(valid_markers)}")
        
        calib_input = [(m["id"], m["corners"]) for m in valid_markers]
        success, msg = mapper.auto_calibrate(calib_input)
        print(f"[CALIBRATION] {msg}")
        audio.enqueue_narration(msg)
        
    ws.on_calibrate = handle_calibrate

    def handle_shutdown():
        print("[SYSTEM] Menerima sinyal aman untuk mematikan perangkat dari Web...")
        audio.enqueue_narration("Alat LENTERA sedang dimatikan secara aman. Silakan tunggu lampu indikator padam sebelum mencabut kabel daya.")
        ws.broadcast_sync({
            "type": "system_event",
            "event": "shutting_down",
            "message": "Sistem sedang dimatikan secara aman."
        })
        
        def execute_shutdown():
            time.sleep(3.5)  # Beri waktu audio selesai diucapkan dan pesan WS terkirim
            try:
                buzzer.beep(times=3, duration=0.1, interval=0.1)
            except Exception:
                pass
            print("[SYSTEM] Mengeksekusi shutdown aman...")
            if os.name != 'nt':
                os.system("sudo poweroff || sudo shutdown -h now || systemctl poweroff")
            else:
                print("[SIMULATOR] Perintah shutdown disimulasikan.")

        shutdown_thread = threading.Thread(target=execute_shutdown, daemon=True)
        shutdown_thread.start()

    ws.on_shutdown = handle_shutdown
    
    print("Memasuki loop utama...")
    prev_circuit_status = None
    frame_count = 0
    
    try:
        while True:
            frame_count += 1
            # a. Ambil frame
            frame = camera.get_frame()
            
            # b. Deteksi Marker
            raw_detections = vision.detect_markers(frame)
            now = time.time()
            
            # Update spatial tracker (mengeliminasi kedip & mendukung ID duplikat)
            for m_id, corners in raw_detections:
                cx, cy = calculate_centroid(corners)
                matched = False
                for tracker in marker_tracker:
                    tcx, tcy = tracker["centroid"]
                    if math.hypot(cx - tcx, cy - tcy) < 30:
                        tracker["id"] = m_id
                        tracker["corners"] = corners
                        tracker["centroid"] = (cx, cy)
                        tracker["last_seen"] = now
                        matched = True
                        break
                if not matched:
                    marker_tracker.append({
                        "id": m_id,
                        "corners": corners,
                        "centroid": (cx, cy),
                        "last_seen": now
                    })
                    
            # Bersihkan tracker yang sudah tidak aktif > 2.5 detik
            marker_tracker = [m for m in marker_tracker if (now - m["last_seen"]) < 2.5]
            
            # Marker yang aktif saat ini (toleransi dropout 0.5s agar tidak kedip)
            active_markers = [m for m in marker_tracker if (now - m["last_seen"]) < 0.5]
            
            # Gambar deteksi ArUco ke frame (anti-kedip)
            for m in active_markers:
                cv2.polylines(frame, [np.int32(m["corners"])], True, (0, 255, 0), 2)
                cx, cy = m["centroid"]
                cv2.putText(frame, f"ID: {m['id']}", (int(cx)-10, int(cy)-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                
            # Gambar Grid 5x5 ke frame
            if hasattr(mapper, 'grid_rois') and mapper.grid_rois:
                for cell_name, roi in mapper.grid_rois.items():
                    gcx, gcy = int(roi["centroid"][0]), int(roi["centroid"][1])
                    gr = int(roi["radius"])
                    # Gambar lingkaran pembatas
                    cv2.circle(frame, (gcx, gcy), gr, (255, 0, 0), 1)
                    # Tulis nama sel (A1, B2, dst)
                    cv2.putText(frame, cell_name, (gcx - 12, gcy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
                
            global global_frame
            global_frame = frame.copy()
            
            # Broadcast frame kamera via WebSocket (terproteksi anti-clogging & anti-disconnect)
            if hasattr(ws, 'clients') and ws.clients and frame_count % 3 == 0:
                try:
                    small_frame = cv2.resize(frame, (400, 300))
                    ret, jpg_buf = cv2.imencode('.jpg', small_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 48])
                    if ret:
                        b64_img = base64.b64encode(jpg_buf).decode('utf-8')
                        ws.broadcast_frame_sync({
                            "type": "camera_frame",
                            "image": f"data:image/jpeg;base64,{b64_img}"
                        })
                except Exception:
                    pass
                
            # Tampilkan window kamera HANYA jika berjalan di Windows (laptop)
            if os.name == 'nt':
                cv2.imshow("LENTERA - Webcam Preview", frame)
                cv2.waitKey(1)
            
            # c. Undistort & Map to Grid
            cell_observations = {}
            if not mapper.grid_rois:
                # TEST MODE: Jika belum dikalibrasi, petakan setiap marker ke baris tengah berurutan dari kiri ke kanan.
                sorted_detections = sorted(active_markers, key=lambda m: m["centroid"][0])
                cols = ['A', 'B', 'C', 'D', 'E']
                for idx, m in enumerate(sorted_detections):
                    if idx >= 5: break
                    undistorted_corners = vision.undistort_corners(m["corners"])
                    rot = get_marker_rotation_state(undistorted_corners, mapper.H)
                    cell_name = f"{cols[idx]}3"
                    cell_observations[cell_name] = {
                        "id": m["id"],
                        "raw_angle": rot
                    }
            else:
                for m in active_markers:
                    undistorted_corners = vision.undistort_corners(m["corners"])
                    cx, cy = calculate_centroid(undistorted_corners)
                    
                    cell_name = mapper.map_to_cell(cx, cy)
                    if cell_name:
                        rot = get_marker_rotation_state(undistorted_corners, mapper.H)
                        cell_observations[cell_name] = {
                            "id": m["id"],
                            "raw_angle": rot
                        }
                    
            # d. Update Grid State & Hasilkan Event
            events = grid_state.process_frame_detections(cell_observations)
            
            # Selalu evaluasi kelayakan untuk heartbeat
            circuit_eval = evaluate_circuit(grid_state.cells)
            status_code = circuit_eval["status"]
            
            # Kontrol Lampu Fisik via GPIO
            if status_code == "success":
                led.turn_on()
            else:
                led.turn_off()
            
            # e. Jika ada perubahan status sirkuit, tambahkan ke list event
            if status_code != prev_circuit_status:
                prev_circuit_status = status_code
                events.append({
                    "type": "circuit_status",
                    "status": status_code,
                    "cells": circuit_eval.get("cells", []),
                    "narration": circuit_eval["narration"]
                })
            
            # f. Broadcast State (Jika ada event ATAU setiap ~1 detik sebagai heartbeat)
            if events or frame_count % 24 == 0:
                import datetime as dt
                state_msg = {
                    "type": "grid_state",
                    "timestamp": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
                    "cells": grid_state.cells,
                    "circuit_status": circuit_eval
                }
                ws.broadcast_sync(state_msg)
                
                # Kirim dan ucapkan tiap event
                for event in events:
                    ws.broadcast_sync(event)
                    if "narration" in event:
                        audio.enqueue_narration(event["narration"])
                        
            # Delay sedikit untuk simulasi FPS target ~24
            time.sleep(1/24)
            
    except KeyboardInterrupt:
        print("Menghentikan sistem...")
    finally:
        audio.stop()
        try:
            buzzer.cleanup()
        except Exception:
            pass
        try:
            led.cleanup()
        except Exception:
            pass
        try:
            camera.close()
        except Exception:
            pass

if __name__ == "__main__":
    main()
