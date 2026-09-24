@echo off
echo Memulai LENTERA MVP...

echo Memulai Backend Python...
start cmd /k "backend\.venv\Scripts\python.exe main.py"

echo Memulai Frontend Vite...
start cmd /k "cd frontend && npm run dev"

echo Selesai! Buka http://localhost:5173 di browser Anda.
