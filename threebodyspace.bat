@echo off
setlocal EnableDelayedExpansion

echo ========================================
echo   Three-Body Learning Space - Dev Server
echo ========================================
echo.

REM --- Detect Node.js ---
set "NODE_CMD="

REM Method 1: direct check (works if node is in PATH)
where node >nul 2>nul
if !errorlevel! equ 0 (
    set "NODE_CMD=node"
    goto :node_found
)

REM Method 2: nvm4w symlink (C:\nvm4w\nodejs is the default)
if exist "C:\nvm4w\nodejs\node.exe" (
    set "NODE_CMD=C:\nvm4w\nodejs\node.exe"
    set "PATH=C:\nvm4w\nodejs;!PATH!"
    goto :node_found
)

REM Method 3: NVM_SYMLINK environment variable
if defined NVM_SYMLINK (
    if exist "!NVM_SYMLINK!\node.exe" (
        set "NODE_CMD=!NVM_SYMLINK!\node.exe"
        set "PATH=!NVM_SYMLINK!;!PATH!"
        goto :node_found
    )
)

REM Method 4: NVM_HOME + nvm use current
if defined NVM_HOME (
    if exist "!NVM_HOME!\nodejs\node.exe" (
        set "NODE_CMD=!NVM_HOME!\nodejs\node.exe"
        set "PATH=!NVM_HOME!\nodejs;!PATH!"
        goto :node_found
    )
)

REM Method 5: Program Files fallback
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
    set "PATH=%ProgramFiles%\nodejs;!PATH!"
    goto :node_found
)

REM Method 6: common install paths
for %%P in ("%LOCALAPPDATA%\nvm\v*\node.exe" "%APPDATA%\nvm\v*\node.exe" "%USERPROFILE%\scoop\apps\nodejs\current\node.exe") do (
    if exist %%P (
        for %%D in (%%~dpP.) do set "NODE_CMD=%%~dpPnode.exe"
        for %%D in (%%~dpP.) do set "PATH=%%~dpP;!PATH!"
        goto :node_found
    )
)

REM Node.js not found
echo [ERR] Node.js not found.
echo.
echo   Download: https://nodejs.org/
echo.
echo   If already installed, try:
echo     1. Reopen this terminal and retry
echo     2. Run: nvm use [version]
echo.
pause
exit /b 1

:node_found
for /f "tokens=*" %%v in ('!NODE_CMD! --version 2^>nul') do set "NODE_VER=%%v"
echo [OK] Node.js !NODE_VER! detected.

REM --- Switch to script directory ---
cd /d "%~dp0"

REM --- Check port ---
set "PORT=3000"
set "SERVER_RUNNING=0"

netstat -ano | findstr ":!PORT!.*LISTENING" >nul 2>nul
if !errorlevel! equ 0 (
    set "SERVER_RUNNING=1"
    echo [OK] Server already running on port !PORT!
    goto :open_browser
)

REM --- Install dependencies ---
if not exist "server\node_modules" (
    echo [..] Installing server dependencies...
    cd /d "%~dp0server"
    call npm install
    if !errorlevel! neq 0 (
        echo [ERR] npm install failed. Check your network.
        pause
        exit /b 1
    )
    cd /d "%~dp0"
    echo [OK] Dependencies installed.
)

REM --- Start server ---
echo [..] Starting server on port !PORT!...
cd /d "%~dp0server"
start "ThreeBody-Server" /min cmd /c "!NODE_CMD! server.js"
cd /d "%~dp0"

REM Wait for server to be ready
set /a "retry=0"
:wait_loop
timeout /t 1 /nobreak >nul
netstat -ano | findstr ":!PORT!.*LISTENING" >nul 2>nul
if !errorlevel! equ 0 (
    echo [OK] Server started.
    goto :open_browser
)
set /a "retry+=1"
if !retry! lss 10 goto :wait_loop

echo [WARN] Server startup timed out. Check manually.

:open_browser
echo.
echo ========================================
echo   URLs:
echo   - Home:    http://localhost:!PORT!
echo   - English: http://localhost:!PORT!/english/index.html
echo   - Math:    http://localhost:!PORT!/math/index.html
echo   - Sudoku:  http://localhost:!PORT!/sudoku/magic-sudoku.html
echo ========================================
echo.

REM --- Open browser ---
if !SERVER_RUNNING! equ 1 (
    echo [..] Opening browser...
) else (
    echo [..] Opening browser...
)

where msedge >nul 2>nul
if !errorlevel! equ 0 (
    start msedge http://localhost:!PORT!
    goto :done
)
where chrome >nul 2>nul
if !errorlevel! equ 0 (
    start chrome http://localhost:!PORT!
    goto :done
)
start http://localhost:!PORT!

:done
echo.
echo Press any key to close this window (server keeps running).
pause >nul
