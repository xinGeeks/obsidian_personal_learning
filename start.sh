#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Shutting down..."
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  wait
  echo "Done."
}
trap cleanup EXIT INT TERM

echo "========================================="
echo "  Personal Learning Hub"
echo "========================================="
echo ""

# Backend
echo "[1/2] Starting backend (FastAPI + uvicorn :8000)..."
cd "$SCRIPT_DIR/backend"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Frontend
echo "[2/2] Starting frontend (Vite :5173)..."
cd "$SCRIPT_DIR/frontend"
npx vite --host 0.0.0.0 &
FRONTEND_PID=$!

echo ""
echo "Backend  : http://localhost:8000"
echo "Frontend : http://localhost:5173"
echo "API docs : http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services."
echo ""

wait
