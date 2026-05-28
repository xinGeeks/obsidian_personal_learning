@echo off
setlocal

set "ROOT=%~dp0"

echo =========================================
echo   Personal Learning Hub
echo =========================================
echo.

echo [1/2] Starting backend (FastAPI + uvicorn :8000)...
start "LearningHub-Backend" cmd /c "cd /d "%ROOT%backend" && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting frontend (Vite :5173)...
start "LearningHub-Frontend" cmd /c "cd /d "%ROOT%frontend" && npx vite --host 0.0.0.0"

echo.
echo Backend  : http://localhost:8000
echo Frontend : http://localhost:5173
echo API docs : http://localhost:8000/docs
echo.
echo Services started in separate windows.
echo Close each window to stop the service, or press any key to exit this launcher.
pause >nul
