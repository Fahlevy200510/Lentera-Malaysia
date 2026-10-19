@echo off
echo Memulai LENTERA MVP...

echo Memulai Backend Python...
start cmd /k "backend\.venv\Scripts\python.exe main.py"

echo Memulai Portal Web (Lentera-Portal)...
start cmd /k "cd Lentera-Portal && npm run dev"

echo Selesai! Buka http://localhost:3000 di browser Anda.
