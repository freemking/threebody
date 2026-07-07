@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   上海小学英语单词游戏 - 启动脚本
echo ========================================
echo.

:: 设置项目目录
set "PROJECT_DIR=d:\QBY\game\English"

:: 检查Node.js是否安装
echo [1/4] 检查Node.js环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js 已安装: 
node --version
echo.

:: 切换到项目目录
echo [2/4] 切换到项目目录...
cd /d "%PROJECT_DIR%"
if %errorlevel% neq 0 (
    echo 错误: 无法切换到目录 %PROJECT_DIR%
    pause
    exit /b 1
)
echo 当前目录: %cd%
echo.

:: 检查并安装依赖
echo [3/4] 检查依赖...
if not exist "node_modules" (
    echo 正在安装依赖，请稍候...
    call npm install
    if %errorlevel% neq 0 (
        echo 错误: 依赖安装失败
        pause
        exit /b 1
    )
    echo 依赖安装完成
) else (
    echo 依赖已存在，跳过安装
)
echo.

:: 启动开发服务器
echo [4/4] 启动开发服务器...
echo 正在启动服务器，请稍候...
start "英语游戏服务器" cmd /k "npm start"

:: 等待服务器启动
echo 等待服务器启动...
timeout /t 5 /nobreak >nul

:: 打开浏览器
echo 正在打开浏览器...
start msedge http://localhost:3000

echo.
echo ========================================
echo   服务器已启动！
echo   浏览器应该会自动打开。
echo   如果没有自动打开，请手动访问: http://localhost:3000
echo.
echo   关闭此窗口不会停止服务器。
echo   要停止服务器，请关闭"英语游戏服务器"窗口。
echo ========================================
pause