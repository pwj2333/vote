# 部门评选投票系统

一个用于内部部门评选的投票系统，支持微信扫码投票、防重复投票、实时排名和后台管理。

## 功能特点

- ✅ 微信扫码投票（生成二维码）
- ✅ 防重复投票（姓名 + 浏览器指纹）
- ✅ 所属部门自动屏蔽
- ✅ 移动端响应式设计
- ✅ 实时排名统计（每 5 秒刷新）
- ✅ 后台管理（开关投票、重置数据、导出 Excel）
- ✅ SQLite 数据持久化

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置

复制 `.env.example` 到 `.env` 并修改配置：

```bash
copy .env.example .env
```

编辑 `.env` 文件：
```env
ADMIN_PASSWORD=your_secure_password
PORT=3000
BASE_URL=https://your-domain.com
```

部署到域名或 HTTPS 反向代理时，将 `BASE_URL` 设置为实际访问地址，用于生成二维码；直接通过 IP 和端口访问时可以不设置。

### 3. 启动服务

```bash
npm start
```

服务将在 http://localhost:3000 启动。

## 访问地址

- **投票页**：http://localhost:3000
- **后台管理**：http://localhost:3000/admin（密码见 .env 文件）
- **二维码**：http://localhost:3000/qr

## 端口映射（外网访问）

### 路由器配置

1. 登录路由器管理页面
2. 找到"端口转发"或"虚拟服务器"设置
3. 添加规则：
   - 外部端口：8080（或其他端口）
   - 内部 IP：你的电脑局域网 IP（如 192.168.1.100）
   - 内部端口：3000
   - 协议：TCP

### 获取公网 IP

```bash
curl https://api.ipify.org
```

外网访问地址：`http://你的公网IP:8080`

## 使用说明

### 投票流程

1. 用户扫描二维码进入投票页
2. 填写姓名
3. 选择所属部门（1-3 个）
4. 从其他部门中选择 3 个投票
5. 提交投票

### 后台管理

1. 访问 http://localhost:3000/admin
2. 输入管理员密码登录
3. 查看实时排名（每 5 秒自动刷新）
4. 可以：
   - 开关投票通道
   - 重置所有数据
   - 导出 Excel 报表
   - 查看投票明细

## 数据备份

数据存储在 `data/votes.db` 文件中。备份方法：

```bash
copy data\votes.db data\votes_backup_20260729.db
```

## 故障排查

### 服务器无法启动

检查端口是否被占用：
```bash
netstat -ano | findstr :3000
```

### 依赖安装失败

确保 Node.js 版本 >= 16.0.0：
```bash
node --version
```

## 技术栈

- **后端**：Node.js + Express
- **数据库**：SQLite (sql.js)
- **前端**：原生 HTML/CSS/JavaScript
- **其他**：qrcode, exceljs, express-session

## 注意事项

1. 管理员密码务必修改为强密码
2. 投票期间定期备份数据库文件
3. 活动结束后关闭端口映射
4. 数据库文件不会自动备份，请手动备份

## License

MIT
