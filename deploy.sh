#!/bin/bash

echo "=== 部门评选投票系统 - 一键部署脚本 ==="
echo ""

# 1. 安装依赖
echo "📦 安装依赖..."
npm install

# 2. 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ 错误：.env 文件不存在"
    exit 1
fi

echo "✅ 配置文件已就绪"

# 3. 启动服务
echo ""
echo "🚀 启动服务..."

# 检查是否安装 PM2
if command -v pm2 &> /dev/null; then
    echo "使用 PM2 启动服务..."
    pm2 delete voting-system 2>/dev/null
    pm2 start server.js --name voting-system
    pm2 save
    echo ""
    echo "✅ 服务已启动（PM2）"
    echo "查看日志：pm2 logs voting-system"
    echo "停止服务：pm2 stop voting-system"
else
    echo "PM2 未安装，使用普通模式启动..."
    echo "建议安装 PM2：npm install -g pm2"
    npm start &
    echo ""
    echo "✅ 服务已启动"
fi

echo ""
echo "=== 访问地址 ==="
echo "投票页：https://vote.ruicogd.com"
echo "后台管理：https://vote.ruicogd.com/admin （密码：admin123）"
echo "二维码：https://vote.ruicogd.com/qr"
echo ""
echo "🎉 部署完成！"
