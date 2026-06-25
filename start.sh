#!/bin/bash
# start.sh - One-command local development startup script
set -e

echo "=========================================================="
echo "      PolicySync - Policy as Code Security Platform      "
echo "=========================================================="

# Check if docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running or not installed."
    echo "Starting local development services without Docker..."
    echo ""
    
    # Run backend
    echo "[*] Starting FastAPI Backend on http://localhost:8000..."
    if [ ! -d "backend/venv" ]; then
        python3 -m venv backend/venv
    fi
    source backend/venv/bin/activate
    pip install -r backend/requirements.txt
    python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    
    # Run frontend
    echo "[*] Starting Next.js Frontend on http://localhost:3000..."
    cd frontend
    npm install
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Handle shutdown
    trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
    wait
else
    echo "[*] Docker detected. Running orchestration via docker-compose..."
    docker-compose up --build
fi
