import json
import asyncio
import websockets

class WSServer:
    def __init__(self, host="0.0.0.0", port=8080):
        self.host = host
        self.port = port
        self.clients = set()
        
    async def handler(self, websocket, path=None): # websockets 12.0 signature
        # Accept connection
        self.clients.add(websocket)
        print(f"[WS] Client connected. Total: {len(self.clients)}")
        try:
            # Tetap terhubung menunggu pesan dari client (jika ada)
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if data.get("type") == "command" and data.get("action") == "calibrate":
                        if hasattr(self, 'on_calibrate'):
                            self.on_calibrate()
                except Exception as e:
                    print(f"[WS] Error parsing message: {e}")
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.clients.remove(websocket)
            print(f"[WS] Client disconnected. Total: {len(self.clients)}")

    async def _broadcast(self, message_str):
        if not self.clients:
            return
            
        # Kirim ke semua client yang terhubung
        disconnected = set()
        for ws in self.clients:
            try:
                await ws.send(message_str)
            except Exception:
                disconnected.add(ws)
                
        for ws in disconnected:
            self.clients.remove(ws)

    def broadcast_sync(self, message_dict):
        """
        Fungsi yang dipanggil dari thread non-async (main loop OpenCV).
        Menjadwalkan coroutine _broadcast ke dalam event loop asyncio.
        """
        if not self.clients or not hasattr(self, 'loop'):
            return
            
        msg = json.dumps(message_dict)
        try:
            asyncio.run_coroutine_threadsafe(self._broadcast(msg), self.loop)
        except Exception as e:
            print(f"WS Broadcast error: {e}")

    async def _run_server(self):
        async with websockets.serve(self.handler, self.host, self.port):
            print(f"[WS] WebSocket server berjalan di ws://{self.host}:{self.port}")
            await asyncio.Future()  # run forever

    # Agar mudah di-embed dalam thread terpisah di main.py
    def start_server(self, loop):
        self.loop = loop
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self._run_server())
