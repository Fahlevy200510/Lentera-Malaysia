import json
import asyncio
import websockets

class WSServer:
    def __init__(self, host="0.0.0.0", port=8080):
        self.host = host
        self.port = port
        self.clients = set()
        self._is_sending_frame = False
        
    async def handler(self, websocket, path=None): # websockets 12.0 signature
        # Accept connection
        self.clients.add(websocket)
        print(f"[WS] Client connected. Total: {len(self.clients)}")
        try:
            # Tetap terhubung menunggu pesan dari client (jika ada)
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if data.get("type") == "command":
                        action = data.get("action")
                        if action == "calibrate" and hasattr(self, 'on_calibrate'):
                            self.on_calibrate()
                        elif action == "shutdown" and hasattr(self, 'on_shutdown'):
                            self.on_shutdown()
                except Exception as e:
                    print(f"[WS] Error parsing message: {e}")
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.clients.discard(websocket)
            print(f"[WS] Client disconnected. Total: {len(self.clients)}")

    async def _broadcast(self, message_str):
        if not self.clients:
            return
            
        disconnected = set()
        for ws in list(self.clients):
            try:
                await ws.send(message_str)
            except Exception:
                disconnected.add(ws)
                
        for ws in disconnected:
            self.clients.discard(ws)

    async def _broadcast_frame(self, message_str):
        try:
            if self.clients:
                disconnected = set()
                for ws in list(self.clients):
                    try:
                        await ws.send(message_str)
                    except Exception:
                        disconnected.add(ws)
                for ws in disconnected:
                    self.clients.discard(ws)
        finally:
            self._is_sending_frame = False

    def broadcast_sync(self, message_dict):
        """
        Fungsi broadcast untuk data teks sirkuit (prioritas tinggi).
        """
        if not self.clients or not hasattr(self, 'loop'):
            return
            
        msg = json.dumps(message_dict)
        try:
            asyncio.run_coroutine_threadsafe(self._broadcast(msg), self.loop)
        except Exception as e:
            print(f"WS Broadcast error: {e}")

    def broadcast_frame_sync(self, message_dict):
        """
        Khusus frame kamera: batasi maksimal ~5 FPS (interval 0.20s) dan lewati frame
        jika antrean sebelumnya masih berjalan agar buffer hotspot 4G tidak tersumbat.
        Ini menghentikan masalah WebSocket putus-nyambung secara tuntas.
        """
        if not self.clients or not hasattr(self, 'loop') or self._is_sending_frame:
            return
            
        import time
        now = time.time()
        if now - getattr(self, '_last_frame_sent', 0) < 0.20:
            return

        self._last_frame_sent = now
        self._is_sending_frame = True
        msg = json.dumps(message_dict)
        try:
            asyncio.run_coroutine_threadsafe(self._broadcast_frame(msg), self.loop)
        except Exception:
            self._is_sending_frame = False

    async def _run_server(self):
        # ping_interval=None mencegah pemutusan sepihak saat lalu lintas frame padat
        async with websockets.serve(
            self.handler,
            self.host,
            self.port,
            ping_interval=None,
            ping_timeout=None,
            max_size=2**22,
            max_queue=32
        ):
            print(f"[WS] WebSocket server berjalan di ws://{self.host}:{self.port}")
            await asyncio.Future()  # run forever

    # Agar mudah di-embed dalam thread terpisah di main.py
    def start_server(self, loop):
        self.loop = loop
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self._run_server())
