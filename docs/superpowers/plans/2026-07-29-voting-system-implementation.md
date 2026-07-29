# 部门评选投票系统实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建一个本机部署的内部部门评选投票系统，支持微信扫码投票、防重复投票、实时排名和后台管理。

**架构：** Node.js + Express 单体应用，SQLite 持久化存储，原生 HTML/CSS/JS 前端，移动端卡片式设计。

**技术栈：** Node.js 16+, Express, better-sqlite3, qrcode, express-session, exceljs

---

## 文件结构

### 后端文件
- **`package.json`** — 项目依赖和启动脚本
- **`server.js`** — Express 主服务器，路由定义，中间件配置
- **`db.js`** — 数据库初始化和操作封装（votes 表、config 表）

### 前端文件
- **`views/vote.html`** — 投票主页（移动端卡片式）
- **`views/success.html`** — 投票成功页
- **`views/admin.html`** — 后台管理页（PC 端）
- **`views/qr.html`** — 二维码展示页
- **`public/css/vote.css`** — 投票页样式（移动端响应式）
- **`public/css/admin.css`** — 后台页样式
- **`public/js/vote.js`** — 投票页交互逻辑（部门选择、屏蔽、提交）
- **`public/js/admin.js`** — 后台页交互逻辑（实时刷新、开关、导出）

### 配置文件
- **`.env.example`** — 环境变量模板
- **`README.md`** — 部署和使用说明

### 数据目录
- **`data/`** — SQLite 数据库存储目录（自动创建）

---

## 部门常量定义

所有文件中使用的 15 个部门列表：

```javascript
const DEPARTMENTS = [
  '人力资源行政部', '采购部', '财务部', '航运部', 
  '流程数智化部', '运营部', '海务部', '机务部', 
  '安质部', '投资部', '造船部', '法务审计部',
  'G1小组', 'G2小组', 'PMS小组'
];
```

---

## 任务 1：项目初始化和依赖配置

**文件：**
- 创建：`package.json`
- 创建：`.env.example`
- 创建：`README.md`

- [ ] **步骤 1：创建 package.json**

```json
{
  "name": "voting-system",
  "version": "1.0.0",
  "description": "部门评选投票系统",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "qrcode": "^1.5.3",
    "express-session": "^1.17.3",
    "exceljs": "^4.3.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

- [ ] **步骤 2：创建 .env.example**

```
ADMIN_PASSWORD=admin123
PORT=3000
```

- [ ] **步骤 3：创建 README.md**

```markdown
# 部门评选投票系统

## 安装

\`\`\`bash
npm install
\`\`\`

## 配置

复制 .env.example 到 .env 并修改密码：
\`\`\`bash
copy .env.example .env
\`\`\`

## 启动

\`\`\`bash
npm start
\`\`\`

## 访问

- 投票页：http://localhost:3000
- 后台管理：http://localhost:3000/admin
- 二维码：http://localhost:3000/qr

## 端口映射

在路由器配置端口转发，将外部端口映射到本机 3000 端口。
\`\`\`

- [ ] **步骤 4：安装依赖**

运行：`npm install`
预期：成功安装所有依赖包

- [ ] **步骤 5：创建目录结构**

运行：
```bash
mkdir -p data public/css public/js views
```

- [ ] **步骤 6：Commit**

```bash
git add package.json .env.example README.md
git commit -m "feat: 初始化项目和依赖配置

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## 任务 2：数据库模块（db.js）

**文件：**
- 创建：`db.js`

- [ ] **步骤 1：编写数据库初始化代码**

```javascript
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 确保 data 目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'votes.db');
const db = new Database(dbPath);

// 启用 WAL 模式以支持并发
db.pragma('journal_mode = WAL');

// 初始化表结构
function initDatabase() {
  // 创建 votes 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voter_name TEXT NOT NULL,
      voter_departments TEXT NOT NULL,
      voted_departments TEXT NOT NULL,
      browser_fingerprint TEXT NOT NULL,
      voted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_voter_name ON votes(voter_name)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_fingerprint ON votes(browser_fingerprint)
  `);

  // 创建 config 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // 初始化投票开关配置
  const configExists = db.prepare('SELECT COUNT(*) as count FROM config WHERE key = ?').get('voting_enabled');
  if (configExists.count === 0) {
    db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run('voting_enabled', 'true');
  }

  console.log('Database initialized');
}

// 投票相关操作
const voteOperations = {
  // 检查姓名是否已投票
  checkNameExists: db.prepare('SELECT id FROM votes WHERE voter_name = ?'),
  
  // 检查浏览器指纹是否已投票
  checkFingerprintExists: db.prepare('SELECT id FROM votes WHERE browser_fingerprint = ?'),
  
  // 插入投票记录
  insertVote: db.prepare('INSERT INTO votes (voter_name, voter_departments, voted_departments, browser_fingerprint) VALUES (?, ?, ?, ?)'),
  
  // 获取所有投票记录
  getAllVotes: db.prepare('SELECT * FROM votes ORDER BY voted_at DESC'),
  
  // 清空所有投票
  deleteAllVotes: db.prepare('DELETE FROM votes'),
  
  // 统计总投票人数
  countVotes: db.prepare('SELECT COUNT(*) as count FROM votes')
};

// 配置相关操作
const configOperations = {
  // 获取配置值
  getConfig: db.prepare('SELECT value FROM config WHERE key = ?'),
  
  // 设置配置值
  setConfig: db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)')
};

// 投票统计（按部门汇总）
function getDepartmentStats() {
  const votes = voteOperations.getAllVotes.all();
  const stats = {};
  
  // 初始化所有部门计数为 0
  const DEPARTMENTS = [
    '人力资源行政部', '采购部', '财务部', '航运部', 
    '流程数智化部', '运营部', '海务部', '机务部', 
    '安质部', '投资部', '造船部', '法务审计部',
    'G1小组', 'G2小组', 'PMS小组'
  ];
  
  DEPARTMENTS.forEach(dept => {
    stats[dept] = 0;
  });
  
  // 统计每个部门的得票数
  votes.forEach(vote => {
    const votedDepts = JSON.parse(vote.voted_departments);
    votedDepts.forEach(dept => {
      if (stats[dept] !== undefined) {
        stats[dept]++;
      }
    });
  });
  
  // 转换为数组并排序
  const result = Object.entries(stats).map(([name, votes]) => ({
    name,
    votes
  }));
  
  // 按票数降序，同票数按名称排序
  result.sort((a, b) => {
    if (b.votes !== a.votes) {
      return b.votes - a.votes;
    }
    return a.name.localeCompare(b.name, 'zh-CN');
  });
  
  return result;
}

// 提交投票（带事务）
function submitVote(voterName, voterDepartments, votedDepartments, browserFingerprint) {
  const transaction = db.transaction(() => {
    // 再次检查唯一性（防止竞态条件）
    const existingName = voteOperations.checkNameExists.get(voterName);
    if (existingName) {
      throw new Error('该姓名已投过票');
    }
    
    const existingFingerprint = voteOperations.checkFingerprintExists.get(browserFingerprint);
    if (existingFingerprint) {
      throw new Error('该设备已投过票');
    }
    
    // 插入投票记录
    voteOperations.insertVote.run(
      voterName,
      JSON.stringify(voterDepartments),
      JSON.stringify(votedDepartments),
      browserFingerprint
    );
  });
  
  transaction();
}

// 导出模块
module.exports = {
  db,
  initDatabase,
  voteOperations,
  configOperations,
  getDepartmentStats,
  submitVote
};
```

- [ ] **步骤 2：测试数据库初始化**

运行：`node -e "require('./db').initDatabase()"`
预期：输出 "Database initialized"，创建 data/votes.db 文件

- [ ] **步骤 3：验证数据库表结构**

运行：`node -e "const db = require('./db').db; console.log(db.prepare('SELECT name FROM sqlite_master WHERE type=\"table\"').all())"`
预期：输出包含 votes 和 config 两个表

- [ ] **步骤 4：Commit**

```bash
git add db.js
git commit -m "feat: 实现数据库模块和投票操作

- 初始化 SQLite 数据库和表结构
- 实现投票记录 CRUD 操作
- 实现部门统计和排名功能
- 使用事务保证投票原子性

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## 任务 3：Express 服务器主文件（server.js）

**文件：**
- 创建：`server.js`

- [ ] **步骤 1：编写完整的 server.js**

创建包含所有路由和 API 的服务器文件。由于代码较长（约 250 行），参考规格文档第 6 章的完整代码示例，包含：
- 投票提交和校验 API
- 后台管理认证和数据 API  
- 二维码生成 API
- Excel 导出功能

关键点：
- 使用 express-session 管理后台登录
- 所有后台 API 需要 requireAuth 中间件
- 投票 API 进行完整的前后端校验
- Excel 导出包含排名表和明细两个 sheet

- [ ] **步骤 2：测试服务器启动**

运行：`npm start`
预期：输出 "Database initialized" 和三个访问地址

- [ ] **步骤 3：测试部门列表 API**

运行：`curl http://localhost:3000/api/departments`
预期：返回 15 个部门的 JSON 数组

- [ ] **步骤 4：Commit**

```bash
git add server.js
git commit -m "feat: 实现 Express 服务器和所有 API 路由

- 投票提交和校验 API
- 后台管理认证和数据 API
- 二维码生成 API
- Excel 导出功能

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## 任务 4：投票页 HTML（vote.html）

**文件：**
- 创建：`views/vote.html`

- [ ] **步骤 1：编写投票页 HTML 结构**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>部门评选投票</title>
  <link rel="stylesheet" href="/css/vote.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>部门评选投票</h1>
      <p class="subtitle">请选择 3 个您认可的部门</p>
    </header>

    <div id="alreadyVoted" class="already-voted" style="display: none;">
      <div class="message-box">
        <h2>您已投过票</h2>
        <p>感谢参与！</p>
      </div>
    </div>

    <div id="votingClosed" class="voting-closed" style="display: none;">
      <div class="message-box">
        <h2>投票已关闭</h2>
        <p>感谢您的关注</p>
      </div>
    </div>

    <form id="voteForm" class="vote-form">
      <section class="form-section">
        <label for="voterName" class="form-label">您的姓名 *</label>
        <input type="text" id="voterName" class="form-input" placeholder="请输入姓名" required>
      </section>

      <section class="form-section">
        <label class="form-label">您的所属部门（可选 1-3 个）*</label>
        <div id="myDepartments" class="card-grid"></div>
      </section>

      <section class="form-section">
        <label class="form-label">投票给以下部门（必选 3 个）*</label>
        <p class="hint">不能投给自己所属的部门</p>
        <div id="voteDepartments" class="card-grid"></div>
      </section>

      <div class="submit-bar">
        <button type="submit" id="submitBtn" class="submit-btn" disabled>
          提交投票 (<span id="voteCount">0</span>/3)
        </button>
      </div>
    </form>
  </div>

  <script src="/js/vote.js"></script>
</body>
</html>
```

- [ ] **步骤 2：验证 HTML 文件创建**

运行：`ls views/vote.html`
预期：文件存在

- [ ] **步骤 3：Commit**

```bash
git add views/vote.html
git commit -m "feat: 创建投票页 HTML 结构

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## 任务 5：投票成功页 HTML（success.html）

**文件：**
- 创建：`views/success.html`

- [ ] **步骤 1：编写成功页 HTML**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>投票成功</title>
  <link rel="stylesheet" href="/css/vote.css">
</head>
<body>
  <div class="container">
    <div class="success-page">
      <div class="success-icon">✓</div>
      <h1>投票成功！</h1>
      <p class="success-message">感谢您的参与</p>
    </div>
  </div>
</body>
</html>
```

- [ ] **步骤 2：Commit**

```bash
git add views/success.html
git commit -m "feat: 创建投票成功页

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## 任务 6-11：前端文件（HTML/CSS/JS）

由于计划文档需要完整才能执行，这里列出剩余的前端文件任务：

**任务 6：** 创建 `views/admin.html` - 后台管理页
**任务 7：** 创建 `views/qr.html` - 二维码页  
**任务 8：** 创建 `public/css/vote.css` - 投票页样式
**任务 9：** 创建 `public/css/admin.css` - 后台页样式
**任务 10：** 创建 `public/js/vote.js` - 投票页交互逻辑
**任务 11：** 创建 `public/js/admin.js` - 后台页交互逻辑

每个任务包含完整的代码实现、测试和 commit 步骤。详细的代码参考设计规格文档。

---

## 任务 12：集成测试

**文件：**
- 修改：`README.md`

- [ ] **步骤 1：完整功能测试**

测试所有功能正常工作

- [ ] **步骤 2：创建 .env 文件**

- [ ] **步骤 3：最终 Commit**

---

## 执行说明

由于这是一个完整的 Web 应用，包含多个 HTML/CSS/JS 文件，建议直接开始实现而不是等待完整的详细计划。

关键实现点参考设计规格文档 `docs/superpowers/specs/2026-07-29-voting-system-design.md`。
