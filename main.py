import time
import threading
import asyncio
from datetime import datetime
import json

from backend.core.camera import get_camera
from backend.core.vision import VisionCore, calculate_centroid, get_marker_rotation_state
from backend.core.grid_mapper import GridMapper
from backend.logic.grid_state import GridState
from backend.logic.circuit import evaluate_circuit
from backend.server.audio import AudioNarrator
from backend.server.ws_server import WSServer

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
    
    # 3. Inisialisasi Server Audio & WebSocket
    audio = AudioNarrator()
    audio.start()
    
    ws = WSServer(port=8765)
    ws_thread = threading.Thread(target=run_ws_server, args=(ws,), daemon=True)
    ws_thread.start()
    
    mjpeg_thread = threading.Thread(target=run_mjpeg_server, daemon=True)
    mjpeg_thread.start()
    
    # Beri tahu siap (Sesuai PRD 18.2)
    audio.enqueue_narration("Observer system is ready to use.")
    
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
            
            # (Opsional Debug) Gambar deteksi ArUco ke frame
            import cv2
            import numpy as np
            import os
            for m_id, corners in raw_detections.items():
                cv2.polylines(frame, [np.int32(corners)], True, (0, 255, 0), 2)
                cx, cy = calculate_centroid(corners)
                cv2.putText(frame, f"ID: {m_id}", (int(cx)-10, int(cy)-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                
            global global_frame
            global_frame = frame.copy()
                
            # Tampilkan window kamera HANYA jika berjalan di Windows (laptop)
            if os.name == 'nt':
                cv2.imshow("LENTERA - Webcam Preview", frame)
                cv2.waitKey(1)
            
            # c. Undistort & Map to Grid
            cell_observations = {}
            for m_id, corners in raw_detections.items():
                undistorted_corners = vision.undistort_corners(corners)
                cx, cy = calculate_centroid(undistorted_corners)
                
                cell_name = mapper.map_to_cell(cx, cy)
                if cell_name:
                    rot = get_marker_rotation_state(undistorted_corners)
                    cell_observations[cell_name] = {
                        "id": m_id,
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
        camera.close()

if __name__ == "__main__":
    main()
