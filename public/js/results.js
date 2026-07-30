// 加载统计数据
async function loadStats() {
  try {
    const response = await fetch('/api/public-stats');
    const data = await response.json();

    // 更新统计数字
    document.getElementById('totalVoters').textContent = data.totalVoters;
    document.getElementById('totalVotes').textContent = data.totalVotes;

    // 更新时间
    const now = new Date();
    document.getElementById('updateTime').textContent =
      `最后更新：${now.toLocaleTimeString('zh-CN')}`;

    // 渲染排名表
    const tbody = document.getElementById('rankingBody');
    tbody.innerHTML = '';

    if (data.stats.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="loading">暂无投票数据</td></tr>';
      return;
    }

    data.stats.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="rank-col">${index + 1}</td>
        <td class="dept-col">${item.name}</td>
        <td class="votes-col">${item.votes}</td>
        <td class="percent-col">${item.percentage}%</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

// 每2秒自动刷新
setInterval(loadStats, 2000);

// 初始加载
loadStats();
