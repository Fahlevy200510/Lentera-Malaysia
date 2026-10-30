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
from backend.hardware.buzzer import BuzzerController

import socket

# Tangani sinyal dari systemd untuk mencegah hang saat shutdown
def signal_handler(sig, frame):
    print(f"Menerima sinyal {sig}, menutup LENTERA dengan aman...")
    raise KeyboardInterrupt

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def check_wifi_connection(timeout=1.5):
    """Memeriksa apakah Raspberry Pi telah terhubung ke jaringan / WiFi dan mendapatkan IP."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(timeout)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return True, local_ip
    except Exception:
        return False, None

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
    
    # Inisialisasi Hardware (Buzzer di BCM 17)
    buzzer = BuzzerController(pin=17)
    
    # 3. Inisialisasi Server Audio & WebSocket
    audio = AudioNarrator()
    audio.start()
    
    ws = WSServer(port=8765)
    ws_thread = threading.Thread(target=run_ws_server, args=(ws,), daemon=True)
    ws_thread.start()
    
    mjpeg_thread = threading.Thread(target=run_mjpeg_server, daemon=True)
    mjpeg_thread.start()
    
    # Verifikasi WiFi dan kesiapan sensor kamera sebelum membunyikan tanda siap
    print("Memverifikasi kesiapan jaringan WiFi dan sensor kamera...")
    wifi_ok = False
    local_ip = None
    for _ in range(8):  # Toleransi koneksi WiFi hingga 8 detik
        wifi_ok, local_ip = check_wifi_connection(timeout=1.0)
        if wifi_ok:
            break
        time.sleep(1.0)

    warmup_frame = camera.get_frame()
    camera_ok = warmup_frame is not None and getattr(warmup_frame, "size", 0) > 0

    if camera_ok and wifi_ok:
        print(f"[READY] Sistem & WiFi Aktif! IP: {local_ip}")
        buzzer.play_ready_melody()
        audio.enqueue_narration("Sistem pengamat siap digunakan.")
    elif camera_ok:
        print("[WARNING] Kamera siap, namun WiFi belum terhubung.")
        buzzer.beep(times=2, duration=0.12, interval=0.08)
        audio.enqueue_narration("Sistem pengamat aktif. Perhatian: Jaringan WiFi belum terhubung.")
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
                ret = os.system("sudo -n /sbin/poweroff || sudo -n /sbin/shutdown -h now || sudo -n poweroff || systemctl poweroff || sudo poweroff")
                print(f"[SYSTEM] Eksekusi shutdown selesai dengan kode: {ret}")
            else:
                print("[SIMULATOR] Perintah shutdown disimulasikan.")

        shutdown_thread = threading.Thread(target=execute_shutdown, daemon=True)
        shutdown_thread.start()

    ws.on_shutdown = handle_shutdown

    def handle_buzzer(pattern="step"):
        print(f"[BUZZER CMD] Menerima trigger buzzer: {pattern}")
        def run_beep():
            try:
                if pattern == "step":
                    buzzer.play_step_success()
                elif pattern in ["ready", "startup"]:
                    buzzer.play_ready_melody()
                elif pattern in ["success", "victory"]:
                    buzzer.play_victory_melody()
                elif pattern in ["warning", "short_circuit"]:
                    buzzer.beep(times=3, duration=0.15, interval=0.08)
                elif pattern == "wrong":
                    buzzer.beep(times=2, duration=0.18, interval=0.08)
                elif pattern == "clear":
                    buzzer.beep(times=2, duration=0.05, interval=0.05)
                elif pattern in ["clue", "hint"]:
                    buzzer.beep(times=1, duration=0.15, interval=0.05)
                else:
                    buzzer.beep(times=1, duration=0.08, interval=0.05)
            except Exception as e:
                print(f"[BUZZER CMD] Gagal beep: {e}")

        threading.Thread(target=run_beep, daemon=True).start()

    ws.on_buzzer = handle_buzzer
    
    print("Memasuki loop utama...")
    prev_circuit_status = None
    frame_count = 0
    
    try:
        while True:
            frame_count += 1
            # a. Ambil frame
            frame = camera.get_frame()
            if frame is None or getattr(frame, "size", 0) == 0:
                time.sleep(0.08)
                continue
            
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
            
            # Kamera di bawah papan -> citra tercermin. Balik vertikal agar preview = tampilan siswa dari atas (A1 kiri bawah).
            # Deteksi tetap memakai frame mentah; hanya koordinat overlay yang dicerminkan.
            frame_h = frame.shape[0]
            display = cv2.flip(frame, 0)
            fy = lambda y: int(frame_h - 1 - y)

            # Gambar deteksi ArUco ke frame (anti-kedip)
            for m in active_markers:
                pts = np.int32([[x, fy(y)] for x, y in m["corners"]])
                cv2.polylines(display, [pts], True, (0, 255, 0), 2)
                cx, cy = m["centroid"]
                cv2.putText(display, f"ID: {m['id']}", (int(cx)-10, fy(cy)-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                
            # Gambar Grid 5x5 ke frame
            if hasattr(mapper, 'grid_rois') and mapper.grid_rois:
                for cell_name, roi in mapper.grid_rois.items():
                    if cell_name == "_camera_corners":
                        continue
                    gcx, gcy = int(roi["centroid"][0]), fy(roi["centroid"][1])
                    gr = int(roi["radius"])
                    # Gambar lingkaran pembatas
                    cv2.circle(display, (gcx, gcy), gr, (255, 0, 0), 1)
                    # Tulis nama sel (A1, B2, dst)
                    cv2.putText(display, cell_name, (gcx - 12, gcy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
                
            global global_frame
            global_frame = display
            
            # Broadcast frame kamera via WebSocket (terproteksi anti-clogging & anti-disconnect)
            if hasattr(ws, 'clients') and ws.clients and frame_count % 4 == 0:
                try:
                    small_frame = cv2.resize(display, (320, 240))
                    ret, jpg_buf = cv2.imencode('.jpg', small_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 30])
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
                cv2.imshow("LENTERA - Webcam Preview", display)
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
            
            # e. Jika ada perubahan status sirkuit, tambahkan ke list event
            if status_code != prev_circuit_status:
                prev_circuit_status = status_code
                if status_code == "short_circuit":
                    try:
                        buzzer.beep(times=3, duration=0.15, interval=0.08)
                    except Exception:
                        pass
                elif status_code == "success":
                    try:
                        buzzer.beep(times=2, duration=0.10, interval=0.07)
                    except Exception:
                        pass
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
                    if "narration" in event and not ws.clients:
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
            camera.close()
        except Exception:
            pass

if __name__ == "__main__":
    main()
