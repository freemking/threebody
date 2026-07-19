#!/bin/bash
# ========================================
#   三体学习空间 - 开发服务器
# ========================================

set -e

PORT=3000

echo "========================================"
echo "  三体学习空间 - 开发服务器"
echo "========================================"
echo ""

# --- 检测 Node.js ---
# 优先加载 nvm 环境
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh" 2>/dev/null || true
fi

if ! command -v node &> /dev/null; then
    echo "[错误] 未找到 Node.js，请先安装 Node.js"
    echo "下载地址: https://nodejs.org/"
    echo ""
    echo "如果已安装 nvm，请运行: nvm use [版本号]"
    exit 1
fi

NODE_VER=$(node --version)
echo "[√] Node.js 已就绪: $NODE_VER"

# --- 切换到脚本所在目录 ---
cd "$(dirname "$0")" || exit 1

# --- 检测端口占用 ---
if command -v lsof &> /dev/null; then
    if lsof -i :$PORT -sTCP:LISTEN &> /dev/null; then
        echo "[√] 检测到服务器已在运行 (端口 $PORT)"
        SERVER_RUNNING=1
    fi
elif command -v ss &> /dev/null; then
    if ss -tlnp | grep -q ":$PORT "; then
        echo "[√] 检测到服务器已在运行 (端口 $PORT)"
        SERVER_RUNNING=1
    fi
fi

if [ "${SERVER_RUNNING:-0}" = "0" ]; then
    # --- 安装依赖 ---
    if [ ! -d "server/node_modules" ]; then
        echo "[i] 正在安装服务器依赖..."
        cd server && npm install && cd ..
        echo "[√] 依赖安装完成"
    fi

    # --- 启动服务器 ---
    echo "[i] 正在启动服务器 (端口 $PORT)..."
    cd server && node server.js &
    SERVER_PID=$!
    cd ..

    # 等待服务器启动
    RETRY=0
    while [ $RETRY -lt 10 ]; do
        sleep 1
        if command -v lsof &> /dev/null; then
            lsof -i :$PORT -sTCP:LISTEN &> /dev/null && break
        elif command -v ss &> /dev/null; then
            ss -tlnp | grep -q ":$PORT " && break
        else
            break
        fi
        RETRY=$((RETRY + 1))
    done

    if [ $RETRY -lt 10 ]; then
        echo "[√] 服务器启动成功"
    else
        echo "[警告] 服务器启动超时，可能需要手动检查"
    fi
fi

echo ""
echo "========================================"
echo "  访问地址:"
echo "  - 主页:     http://localhost:$PORT"
echo "  - 英语游戏: http://localhost:$PORT/english/index.html"
echo "  - 数学游戏: http://localhost:$PORT/math/index.html"
echo "  - 数独游戏: http://localhost:$PORT/sudoku/magic-sudoku.html"
echo "========================================"
echo ""

# --- 打开浏览器 ---
echo "[i] 正在打开浏览器..."
if command -v open &> /dev/null; then
    open "http://localhost:$PORT"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:$PORT"
elif command -v wslview &> /dev/null; then
    wslview "http://localhost:$PORT"
fi

# 如果是新启动的服务器，等待进程
if [ -n "${SERVER_PID:-}" ]; then
    echo ""
    echo "按 Ctrl+C 停止服务器"
    wait $SERVER_PID
else
    echo "按回车键退出..."
    read -r
fi
