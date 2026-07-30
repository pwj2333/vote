# 部门评选投票系统 - 手动推送指南

## 当前状态

✅ 所有代码已完成并提交到本地 Git
✅ 已修复所属部门和参选部门的区分问题
✅ 代码已配置远程仓库：https://github.com/pwj2333/vote.git

## 手动推送到 GitHub

### 方式 1：使用命令行（推荐）

打开你的终端，确保代理可用，然后运行：

```bash
# 如果需要配置代理
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy http://127.0.0.1:7897

# 推送代码
git push -u origin main
```

### 方式 2：使用 GitHub Desktop

1. 打开 GitHub Desktop
2. 添加本地仓库（File → Add Local Repository）
3. 选择这个项目目录
4. 点击 "Push origin" 推送

### 方式 3：直接在 GitHub 网页上传

1. 访问 https://github.com/pwj2333/vote
2. 点击 "Add file" → "Upload files"
3. 上传以下文件和文件夹：
   - db.js
   - server.js
   - package.json
   - deploy.sh
   - views/
   - public/
   - docs/
   - README.md
   - DEPLOY.md
   - .gitignore
   - .env.example

## 推送后的部署步骤

1. SSH 登录到阿里云服务器
2. 克隆代码：
   ```bash
   git clone https://github.com/pwj2333/vote.git
   cd vote
   ```
3. 运行部署脚本：
   ```bash
   bash deploy.sh
   ```

## 访问地址

部署后访问：
- 二维码页面：https://vote.ruicogd.com/qr
- 后台管理：https://vote.ruicogd.com/admin
- 投票结果：https://vote.ruicogd.com/results

---

## 项目完整功能清单

✅ 15个完整部门（所属部门选择）
✅ 10个参选部门（投票选择）
✅ 3分钟倒计时自动关闭
✅ 一站式二维码页面
✅ 实时投票结果展示
✅ 防重复投票
✅ 完整后台管理

祝投票活动圆满成功！🎉
