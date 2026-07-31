const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { DEFAULT_VOTING_DURATION_SECONDS } = require('./voting-duration');

// 数据库文件路径
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'votes.db');

// 确保 data 目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

// 完整部门列表（15个，用于所属部门选择）
const ALL_DEPARTMENTS = [
  '人力资源行政部', '采购部', '财务部', '航运部',
  '流程数智化部', '运营部', '海务部', '机务部',
  '安质部', '投资部', '造船部', '法务审计部',
  'G1小组', 'G2小组', 'PMS小组'
];

// 参选部门列表（10个，用于投票选择）
const VOTING_DEPARTMENTS = [
  '人力资源行政部', '采购部', '财务部', '航运部',
  'G2小组', '流程数智化部', '运营部', '海务部',
  '机务部', 'G1小组'
];

// 初始化数据库
async function initDatabase() {
  const SQL = await initSqlJs();

  // 尝试加载现有数据库
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // 创建表结构
  db.run(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voter_name TEXT NOT NULL UNIQUE,
      voter_departments TEXT NOT NULL,
      voted_departments TEXT NOT NULL,
      browser_fingerprint TEXT NOT NULL,
      voted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_fingerprint ON votes(browser_fingerprint)
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // 初始化投票开关配置
  const configCheck = db.exec('SELECT COUNT(*) as count FROM config WHERE key = "voting_enabled"');
  if (configCheck.length === 0 || configCheck[0].values[0][0] === 0) {
    db.run('INSERT INTO config (key, value) VALUES ("voting_enabled", "true")');
  }

  const durationCheck = db.exec('SELECT COUNT(*) as count FROM config WHERE key = "voting_duration_seconds"');
  if (durationCheck.length === 0 || durationCheck[0].values[0][0] === 0) {
    db.run('INSERT INTO config (key, value) VALUES ("voting_duration_seconds", ?)', [String(DEFAULT_VOTING_DURATION_SECONDS)]);
  }

  // 保存数据库到文件
  saveDatabase();

  console.log('Database initialized');
}

// 保存数据库到文件
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// 投票相关操作
const voteOperations = {
  checkNameExists: (voterName) => {
    const result = db.exec('SELECT id FROM votes WHERE voter_name = ?', [voterName]);
    return result.length > 0 && result[0].values.length > 0;
  },

  checkFingerprintExists: (fingerprint) => {
    const result = db.exec('SELECT id FROM votes WHERE browser_fingerprint = ?', [fingerprint]);
    return result.length > 0 && result[0].values.length > 0;
  },

  insertVote: (voterName, voterDepartments, votedDepartments, fingerprint) => {
    db.run(
      'INSERT INTO votes (voter_name, voter_departments, voted_departments, browser_fingerprint) VALUES (?, ?, ?, ?)',
      [voterName, JSON.stringify(voterDepartments), JSON.stringify(votedDepartments), fingerprint]
    );
    saveDatabase();
  },

  getAllVotes: () => {
    const result = db.exec('SELECT * FROM votes ORDER BY voted_at DESC');
    if (result.length === 0) return [];

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  },

  deleteAllVotes: () => {
    db.run('DELETE FROM votes');
    saveDatabase();
  },

  countVotes: () => {
    const result = db.exec('SELECT COUNT(*) as count FROM votes');
    if (result.length === 0) return { count: 0 };
    return { count: result[0].values[0][0] };
  },

  // 添加别名，保持兼容性
  get countVoters() {
    return this.countVotes;
  }
};

// 配置相关操作
const configOperations = {
  getConfig: (key) => {
    const result = db.exec('SELECT value FROM config WHERE key = ?', [key]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    return { value: result[0].values[0][0] };
  },

  setConfig: (key, value) => {
    db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [key, value]);
    saveDatabase();
  }
};

// 投票统计（按部门汇总）
function getDepartmentStats() {
  const votes = voteOperations.getAllVotes();
  const stats = {};

  // 初始化所有部门计数为 0
  VOTING_DEPARTMENTS.forEach(dept => {
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

// 提交投票（带检查）
function submitVote(voterName, voterDepartments, votedDepartments, browserFingerprint) {
  // 检查唯一性
  if (voteOperations.checkNameExists(voterName)) {
    throw new Error('该姓名已投过票');
  }

  if (voteOperations.checkFingerprintExists(browserFingerprint)) {
    throw new Error('该设备已投过票');
  }

  // 插入投票记录
  voteOperations.insertVote(voterName, voterDepartments, votedDepartments, browserFingerprint);
}

// 导出模块
module.exports = {
  db,
  initDatabase,
  voteOperations,
  configOperations,
  getDepartmentStats,
  submitVote,
  ALL_DEPARTMENTS,
  VOTING_DEPARTMENTS,
  DEPARTMENTS: VOTING_DEPARTMENTS
};
