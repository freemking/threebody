@echo off
echo ========================================
echo   Three-Body Learning Space - Dev Server
echo ========================================
echo.
echo Starting server, please wait...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

REM Install API server dependencies if needed
if not exist "server\node_modules" (
    echo Installing API server dependencies...
    cd server
    npm install
    cd ..
)

REM Start API server (provides both API and static file services)
echo Starting API server on port 3000...
echo.
echo Access URL: http://localhost:3000
echo English Game: http://localhost:3000/english/index.html
echo Math Game: http://localhost:3000/math/index.html
echo Sudoku Game: http://localhost:3000/sudoku/magic-sudoku.html
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

start "API Server" cmd /c "cd server && node server.js"
timeout /t 2 /nobreak >nul

echo Opening Edge browser...
start msedge http://localhost:3000

pause