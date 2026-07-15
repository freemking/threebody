#!/bin/bash
# ========================================
#   Three-Body Learning Space - Dev Server
# ========================================

echo "========================================"
echo "  Three-Body Learning Space - Dev Server"
echo "========================================"
echo ""
echo "Starting server, please wait..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found. Please install Node.js first."
    echo "Download: https://nodejs.org/"
    exit 1
fi

# Navigate to script directory (so it works regardless of where it's called from)
cd "$(dirname "$0")" || exit 1

# Install API server dependencies if needed
if [ ! -d "server/node_modules" ]; then
    echo "Installing API server dependencies..."
    cd server && npm install && cd ..
fi

# Start API server (provides both API and static file services)
echo "Starting API server on port 3000..."
echo ""
echo "Access URL:        http://localhost:3000"
echo "English Game:      http://localhost:3000/english/index.html"
echo "Math Game:         http://localhost:3000/math/index.html"
echo "Sudoku Game:       http://localhost:3000/sudoku/magic-sudoku.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Start server in background, open browser, then bring server to foreground
cd server && node server.js &
SERVER_PID=$!
sleep 2

# Open default browser (macOS: open, Linux: xdg-open)
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi

# Wait for server process (Ctrl+C will kill it)
wait $SERVER_PID
