require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const { initDatabase, voteOperations, configOperations, getDepartmentStats, submitVote, ALL_DEPARTMENTS, VOTING_DEPARTMENTS } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// 投票倒计时相关变量
let votingEndTime = null; // 投票结束时间（时间戳）
let votingTimer = null;   // 倒计时定时器

// 初始化数据库（异步）
initDatabase().then(() => {
  console.log('Database ready');
});

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'voting-system-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// 投票页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'vote.html'));
});

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'success.html'));
});

// 获取完整部门列表 API（用于所属部门选择）
app.get('/api/all-departments', (req, res) => {
  res.json({ departments: ALL_DEPARTMENTS });
});

// 获取参选部门列表 API（用于投票选择）
app.get('/api/voting-departments', (req, res) => {
  res.json({ departments: VOTING_DEPARTMENTS });
});

// 兼容旧版客户端
app.get('/api/departments', (req, res) => {
  res.json({ departments: VOTING_DEPARTMENTS });
});

// 检查投票状态 API（包含倒计时）
app.get('/api/voting-status', (req, res) => {
  const result = configOperations.getConfig('voting_enabled');
  const enabled = result ? result.value === 'true' : true;

  let remainingSeconds = 0;
  if (enabled && votingEndTime) {
    const now = Date.now();
    remainingSeconds = Math.max(0, Math.floor((votingEndTime - now) / 1000));
  }

  res.json({
    enabled,
    remainingSeconds,
    hasTimer: votingEndTime !== null
  });
});

// 提交投票 API
app.post('/api/vote', (req, res) => {
  try {
    const { voter_name, voter_departments, voted_departments, browser_fingerprint } = req.body;

    // 校验输入
    if (!voter_name || !voter_name.trim()) {
      return res.status(400).json({ error: '请填写姓名' });
    }

    if (!Array.isArray(voter_departments) || voter_departments.length === 0 || voter_departments.length > 3) {
      return res.status(400).json({ error: '请选择 1-3 个所属部门' });
    }

    if (!Array.isArray(voted_departments) || voted_departments.length !== 3) {
      return res.status(400).json({ error: '请选择 3 个投票部门' });
    }

    if (!browser_fingerprint) {
      return res.status(400).json({ error: '缺少浏览器标识' });
    }

    // 检查投票是否开启
    const votingStatus = configOperations.getConfig('voting_enabled');
    if (votingStatus && votingStatus.value !== 'true') {
      return res.status(403).json({ error: '投票已关闭' });
    }

    // 检查投票部门是否与所属部门重复
    const overlap = voted_departments.some(dept => voter_departments.includes(dept));
    if (overlap) {
      return res.status(400).json({ error: '不能投给自己所属的部门' });
    }

    // 提交投票
    submitVote(voter_name.trim(), voter_departments, voted_departments, browser_fingerprint);

    res.json({ success: true });
  } catch (error) {
    console.error('投票错误:', error);
    res.status(500).json({ error: error.message || '投票失败，请重试' });
  }
});

// 二维码页面路由
app.get('/qr', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'qr.html'));
});

// 投票结果展示页（公开访问）
app.get('/results', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'results.html'));
});

// 公开统计数据 API（无需认证）
app.get('/api/public-stats', (req, res) => {
  try {
    const stats = getDepartmentStats();
    const totalVoters = voteOperations.countVoters().count;
    const totalVotes = totalVoters * 3;

    const statsWithPercentage = stats.map(item => ({
      ...item,
      percentage: totalVotes > 0 ? ((item.votes / totalVotes) * 100).toFixed(1) : '0.0'
    }));

    res.json({
      stats: statsWithPercentage,
      totalVoters,
      totalVotes
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 生成二维码 API
app.get('/api/qrcode', async (req, res) => {
  try {
    // 从环境变量或请求头获取实际访问地址
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const qrDataURL = await QRCode.toDataURL(baseUrl, { width: 300 });
    res.json({ qrcode: qrDataURL, url: baseUrl });
  } catch (error) {
    res.status(500).json({ error: '生成二维码失败' });
  }
});

// 后台管理页面路由
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// 后台登录 API
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: '密码错误' });
  }
});

// 后台认证中间件
function requireAuth(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    res.status(401).json({ error: '未授权' });
  }
}

// 获取统计数据 API
app.get('/admin/stats', requireAuth, (req, res) => {
  try {
    const stats = getDepartmentStats();
    const totalVoters = voteOperations.countVotes().count;
    const totalVotes = totalVoters * 3;

    // 计算占比
    const statsWithPercentage = stats.map(item => ({
      ...item,
      percentage: totalVotes > 0 ? ((item.votes / totalVotes) * 100).toFixed(1) : '0.0'
    }));

    res.json({
      stats: statsWithPercentage,
      totalVoters,
      totalVotes
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 获取投票明细 API
app.get('/admin/votes', requireAuth, (req, res) => {
  try {
    const votes = voteOperations.getAllVotes();
    const formattedVotes = votes.map(vote => ({
      id: vote.id,
      voter_name: vote.voter_name,
      voter_departments: JSON.parse(vote.voter_departments).join('、'),
      voted_departments: JSON.parse(vote.voted_departments).join('、'),
      voted_at: vote.voted_at
    }));
    res.json({ votes: formattedVotes });
  } catch (error) {
    res.status(500).json({ error: '获取投票明细失败' });
  }
});

// 开启投票（3分钟倒计时）
app.post('/admin/start-voting', requireAuth, (req, res) => {
  try {
    // 开启投票
    configOperations.setConfig('voting_enabled', 'true');

    // 设置3分钟后结束
    votingEndTime = Date.now() + 3 * 60 * 1000; // 3分钟

    // 清除旧的计时器
    if (votingTimer) {
      clearTimeout(votingTimer);
    }

    // 设置新的计时器，3分钟后自动关闭投票
    votingTimer = setTimeout(() => {
      configOperations.setConfig('voting_enabled', 'false');
      votingEndTime = null;
      console.log('投票已自动关闭（3分钟倒计时结束）');
    }, 3 * 60 * 1000);

    res.json({ success: true, endTime: votingEndTime });
  } catch (error) {
    res.status(500).json({ error: '启动投票失败' });
  }
});

// 手动关闭投票
app.post('/admin/stop-voting', requireAuth, (req, res) => {
  try {
    configOperations.setConfig('voting_enabled', 'false');

    // 清除计时器
    if (votingTimer) {
      clearTimeout(votingTimer);
      votingTimer = null;
    }
    votingEndTime = null;

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '关闭投票失败' });
  }
});

// 重置数据 API
app.post('/admin/reset', requireAuth, (req, res) => {
  try {
    voteOperations.deleteAllVotes();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '重置数据失败' });
  }
});

// 导出 Excel API
app.get('/admin/export', requireAuth, async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: 排名表
    const statsSheet = workbook.addWorksheet('排名表');
    statsSheet.columns = [
      { header: '排名', key: 'rank', width: 10 },
      { header: '部门名称', key: 'name', width: 20 },
      { header: '得票数', key: 'votes', width: 10 },
      { header: '占比', key: 'percentage', width: 10 }
    ];

    const stats = getDepartmentStats();
    const totalVoters = voteOperations.countVotes().count;
    const totalVotes = totalVoters * 3;

    stats.forEach((item, index) => {
      statsSheet.addRow({
        rank: index + 1,
        name: item.name,
        votes: item.votes,
        percentage: totalVotes > 0 ? `${((item.votes / totalVotes) * 100).toFixed(1)}%` : '0.0%'
      });
    });

    // Sheet 2: 投票明细
    const votesSheet = workbook.addWorksheet('投票明细');
    votesSheet.columns = [
      { header: '编号', key: 'id', width: 10 },
      { header: '投票人', key: 'voter_name', width: 15 },
      { header: '所属部门', key: 'voter_departments', width: 30 },
      { header: '投给部门', key: 'voted_departments', width: 30 },
      { header: '投票时间', key: 'voted_at', width: 20 }
    ];

    const votes = voteOperations.getAllVotes();
    votes.forEach(vote => {
      votesSheet.addRow({
        id: vote.id,
        voter_name: vote.voter_name,
        voter_departments: JSON.parse(vote.voter_departments).join('、'),
        voted_departments: JSON.parse(vote.voted_departments).join('、'),
        voted_at: vote.voted_at
      });
    });

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=voting-results.xlsx');

    // 写入响应
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('导出错误:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`QR code: http://localhost:${PORT}/qr`);
});
