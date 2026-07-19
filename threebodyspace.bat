@echo off
chcp 65001 >nul 2>nul
setlocal EnableDelayedExpansion

echo ========================================
echo   三体学习空间 - 开发服务器
echo ========================================
echo.

REM --- 检测 Node.js ---
set "NODE_CMD="

REM 方法1: 直接检测 node
where node >nul 2>nul
if !errorlevel! equ 0 (
    set "NODE_CMD=node"
    goto :node_found
)

REM 方法2: 检测 nvm4w 默认安装路径
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
    set "PATH=%ProgramFiles%\nodejs;!PATH!"
    goto :node_found
)

REM 方法3: 检测 nvm4w 用户目录
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v NVM_SYMLINK 2^>nul') do (
    if exist "%%b\node.exe" (
        set "NODE_CMD=%%b\node.exe"
        set "PATH=%%b;!PATH!"
        goto :node_found
    )
)

REM 方法4: 检测常见安装路径
for %%P in ("%LOCALAPPDATA%\nvm\v*\node.exe" "%APPDATA%\nvm\v*\node.exe" "%USERPROFILE%\scoop\apps\nodejs\current\node.exe") do (
    if exist %%P (
        for %%D in (%%~dpP.) do set "NODE_CMD=%%~dpPnode.exe"
        for %%D in (%%~dpP.) do set "PATH=%%~dpP;!PATH!"
        goto :node_found
    )
)

REM Node.js 未找到
echo [错误] 未找到 Node.js，请先安装 Node.js
echo 下载地址: https://nodejs.org/
echo.
echo 如果已安装但无法识别，请尝试:
echo   1. 重新打开终端后重试
echo   2. 运行 nvm use [版本号] 激活 Node.js
echo.
pause
exit /b 1

:node_found
for /f "tokens=*" %%v in ('!NODE_CMD! --version 2^>nul') do set "NODE_VER=%%v"
echo [√] Node.js 已就绪: !NODE_VER!

REM --- 切换到脚本所在目录 ---
cd /d "%~dp0"

REM --- 检测端口占用 ---
set "PORT=3000"
set "SERVER_RUNNING=0"

REM 检查端口是否已被占用
netstat -ano | findstr ":!PORT!.*LISTENING" >nul 2>nul
if !errorlevel! equ 0 (
    set "SERVER_RUNNING=1"
    echo [√] 检测到服务器已在运行 (端口 !PORT!)
    goto :open_browser
)

REM --- 安装依赖 ---
if not exist "server\node_modules" (
    echo [i] 正在安装服务器依赖...
    cd /d "%~dp0server"
    call npm install
    if !errorlevel! neq 0 (
        echo [错误] 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
    cd /d "%~dp0"
    echo [√] 依赖安装完成
)

REM --- 启动服务器 ---
echo [i] 正在启动服务器 (端口 !PORT!)...
cd /d "%~dp0server"
start "三体学习空间-服务器" /min cmd /c "node server.js"
cd /d "%~dp0"

REM 等待服务器启动
set /a "retry=0"
:wait_loop
timeout /t 1 /nobreak >nul
netstat -ano | findstr ":!PORT!.*LISTENING" >nul 2>nul
if !errorlevel! equ 0 (
    echo [√] 服务器启动成功
    goto :open_browser
)
set /a "retry+=1"
if !retry! lss 10 goto :wait_loop

echo [警告] 服务器启动超时，可能需要手动检查
echo        尝试手动访问: http://localhost:!PORT!

:open_browser
echo.
echo ========================================
echo   访问地址:
echo   - 主页:     http://localhost:!PORT!
echo   - 英语游戏: http://localhost:!PORT!/english/index.html
echo   - 数学游戏: http://localhost:!PORT!/math/index.html
echo   - 数独游戏: http://localhost:!PORT!/sudoku/magic-sudoku.html
echo ========================================
echo.

REM --- 打开浏览器 ---
if !SERVER_RUNNING! equ 1 (
    echo [i] 服务器已在运行，直接打开浏览器...
) else (
    echo [i] 正在打开浏览器...
)

REM 尝试 Edge -> Chrome -> 默认浏览器
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
echo 按任意键关闭此窗口（服务器将继续在后台运行）
pause >nul