## 🚀 一键部署到阿里云服务器

所有配置文件已准备就绪，你只需要：

### 1. 上传代码到服务器
```bash
# 方式1：通过 Git
git clone <你的仓库地址>
cd vote

# 方式2：直接上传整个文件夹到服务器
```

### 2. 运行一键部署脚本
```bash
bash deploy.sh
```

**就这么简单！** 脚本会自动：
- ✅ 安装依赖
- ✅ 检查配置文件
- ✅ 启动服务（自动检测 PM2）

### 3. 访问地址

- **投票页**：https://vote.ruicogd.com
- **后台管理**：https://vote.ruicogd.com/admin （密码：`admin123`）
- **二维码**：https://vote.ruicogd.com/qr

---

## 📋 已配置文件

所有配置文件都已经创建好了：

- ✅ `.env` - 环境变量配置（域名、密码、端口）
- ✅ `deploy.sh` - 一键部署脚本
- ✅ `deployment-config.txt` - 详细部署说明

## 🔧 手动启动（如果需要）

如果你不想用脚本，也可以手动启动：

```bash
npm install
npm start
```

或使用 PM2：
```bash
pm2 start server.js --name voting-system
```

---

**一切都准备好了，直接在服务器上运行 `bash deploy.sh` 即可！** 🎉
