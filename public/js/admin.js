// 登录处理
document.getElementById('loginBtn').addEventListener('click', async () => {
  const password = document.getElementById('passwordInput').value;

  try {
    const response = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (response.ok) {
      document.getElementById('loginPanel').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'block';
      loadStats();
      loadVotingStatus();
      startAutoRefresh();
    } else {
      document.getElementById('loginError').textContent = '密码错误';
      document.getElementById('loginError').style.display = 'block';
    }
  } catch (error) {
    alert('登录失败');
  }
});

// 加载统计数据
async function loadStats() {
  try {
    const response = await fetch('/admin/stats');
    const data = await response.json();

    // 更新统计数字
    document.getElementById('totalVoters').textContent = data.totalVoters;
    document.getElementById('totalVotes').textContent = data.totalVotes;

    // 渲染排名表
    const tbody = document.getElementById('rankingBody');
    tbody.innerHTML = '';

    if (data.stats.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">暂无投票数据</td></tr>';
      return;
    }

    data.stats.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.votes}</td>
        <td>${item.percentage}%</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

// 加载投票状态
async function loadVotingStatus() {
  try {
    const response = await fetch('/api/voting-status');
    const data = await response.json();

    if (data.enabled && data.hasTimer) {
      document.getElementById('startVotingBtn').disabled = true;
      document.getElementById('stopVotingBtn').disabled = false;
    } else {
      document.getElementById('startVotingBtn').disabled = false;
      document.getElementById('stopVotingBtn').disabled = true;
    }
  } catch (error) {
    console.error('加载投票状态失败:', error);
  }
}

// 开始投票（3分钟倒计时）
document.getElementById('startVotingBtn').addEventListener('click', async () => {
  if (!confirm('确认开始投票？将启动3分钟倒计时。')) {
    return;
  }

  try {
    const response = await fetch('/admin/start-voting', {
      method: 'POST'
    });

    if (response.ok) {
      alert('投票已开始！3分钟倒计时启动，3分钟后自动关闭投票。');
      loadVotingStatus();

      // 打开新标签页显示二维码页面
      window.open('https://vote.ruicogd.com/qr', '_blank');
    } else {
      alert('操作失败');
    }
  } catch (error) {
    alert('操作失败');
  }
});

// 立即结束投票
document.getElementById('stopVotingBtn').addEventListener('click', async () => {
  if (!confirm('确认立即结束投票？')) {
    return;
  }

  try {
    const response = await fetch('/admin/stop-voting', {
      method: 'POST'
    });

    if (response.ok) {
      alert('投票已结束');
      loadVotingStatus();
    } else {
      alert('操作失败');
    }
  } catch (error) {
    alert('操作失败');
  }
});

// 重置数据
document.getElementById('resetBtn').addEventListener('click', async () => {
  if (!confirm('确认清空所有投票？此操作不可恢复！')) {
    return;
  }

  try {
    const response = await fetch('/admin/reset', {
      method: 'POST'
    });

    if (response.ok) {
      alert('数据已清空');
      loadStats();
    } else {
      alert('操作失败');
    }
  } catch (error) {
    alert('操作失败');
  }
});

// 导出 Excel
document.getElementById('exportBtn').addEventListener('click', () => {
  window.location.href = '/admin/export';
});

// 展开/收起投票明细
document.getElementById('toggleDetailsBtn').addEventListener('click', async () => {
  const panel = document.getElementById('detailsPanel');

  if (panel.style.display === 'none') {
    await loadVoteDetails();
    panel.style.display = 'block';
  } else {
    panel.style.display = 'none';
  }
});

// 加载投票明细
async function loadVoteDetails() {
  try {
    const response = await fetch('/admin/votes');
    const data = await response.json();

    const tbody = document.getElementById('detailsBody');
    tbody.innerHTML = '';

    if (data.votes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">暂无数据</td></tr>';
      return;
    }

    data.votes.forEach(vote => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${vote.id}</td>
        <td>${vote.voter_name}</td>
        <td>${vote.voter_departments}</td>
        <td>${vote.voted_departments}</td>
        <td>${vote.voted_at || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('加载明细失败:', error);
  }
}

// 每 5 秒自动刷新
function startAutoRefresh() {
  setInterval(loadStats, 5000);
}
