#!/bin/bash

echo "=== 推送代码到 GitHub ==="
echo ""
echo "仓库地址：https://github.com/pwj2333/vote.git"
echo "分支：main"
echo ""

# 推送代码
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo "查看仓库：https://github.com/pwj2333/vote"
else
    echo ""
    echo "❌ 推送失败，请检查："
    echo "1. 网络连接是否正常"
    echo "2. 是否已接受 GitHub 协作者邀请"
    echo "3. Git 凭证是否正确"
fi
