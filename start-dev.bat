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

REM Start HTTP server
echo Starting HTTP server...
echo.
echo Access URL: http://localhost:8080
echo English Game: http://localhost:8080/english/index.html
echo Math Game: http://localhost:8080/math/index.html
echo Sudoku Game: http://localhost:8080/sudoku/magic-sudoku.html
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Use Node.js http-server module
npx http-server . -p 8080 -c-1 --cors

pause