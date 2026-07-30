let ALL_DEPARTMENTS = [];
let VOTING_DEPARTMENTS = [];
let mySelectedDepts = [];
let voteSelectedDepts = [];

// 生成或获取浏览器指纹
function getBrowserFingerprint() {
  let fingerprint = localStorage.getItem('voter_id');
  if (!fingerprint) {
    fingerprint = crypto.randomUUID();
    localStorage.setItem('voter_id', fingerprint);
  }
  return fingerprint;
}

// 渲染所属部门卡片
function renderMyDepartments(departments) {
  const container = document.getElementById('myDepartments');
  container.innerHTML = '';

  departments.forEach(dept => {
    const card = document.createElement('div');
    card.className = 'card';
    card.textContent = dept;
    card.onclick = () => toggleMyDepartment(dept, card);
    container.appendChild(card);
  });
}

// 切换所属部门选择
function toggleMyDepartment(dept, card) {
  const index = mySelectedDepts.indexOf(dept);

  if (index > -1) {
    mySelectedDepts.splice(index, 1);
    card.classList.remove('selected');
  } else {
    if (mySelectedDepts.length >= 3) {
      alert('最多只能选择 3 个所属部门');
      return;
    }
    mySelectedDepts.push(dept);
    card.classList.add('selected');
  }

  // 刷新投票区
  renderVoteDepartments(VOTING_DEPARTMENTS);
}

// 渲染投票部门卡片（屏蔽所属部门）
function renderVoteDepartments(departments) {
  const container = document.getElementById('voteDepartments');
  container.innerHTML = '';

  departments.forEach(dept => {
    const card = document.createElement('div');
    card.className = 'card';
    card.textContent = dept;

    // 屏蔽所属部门
    if (mySelectedDepts.includes(dept)) {
      card.classList.add('blocked');
      card.onclick = null;
    } else {
      // 如果已选满且当前卡片未选中，则禁用
      if (voteSelectedDepts.length >= 3 && !voteSelectedDepts.includes(dept)) {
        card.classList.add('disabled');
      }
      // 如果已选中，显示选中状态
      if (voteSelectedDepts.includes(dept)) {
        card.classList.add('selected');
      }
      card.onclick = () => toggleVoteDepartment(dept, card);
    }

    container.appendChild(card);
  });
}

// 切换投票部门选择
function toggleVoteDepartment(dept, card) {
  const index = voteSelectedDepts.indexOf(dept);

  if (index > -1) {
    voteSelectedDepts.splice(index, 1);
  } else {
    if (voteSelectedDepts.length >= 3) {
      return;
    }
    voteSelectedDepts.push(dept);
  }

  // 重新渲染投票区以更新所有卡片状态
  renderVoteDepartments(VOTING_DEPARTMENTS);
  updateSubmitButton();
}

// 更新提交按钮状态
function updateSubmitButton() {
  const count = voteSelectedDepts.length;
  document.getElementById('voteCount').textContent = count;
  document.getElementById('submitBtn').disabled = count !== 3;
}

// 表单提交
document.getElementById('voteForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const voterName = document.getElementById('voterName').value.trim();

  if (!voterName) {
    alert('请填写姓名');
    return;
  }

  if (mySelectedDepts.length === 0) {
    alert('请至少选择 1 个所属部门');
    return;
  }

  if (voteSelectedDepts.length !== 3) {
    alert('请选择 3 个投票部门');
    return;
  }

  // 二次确认
  const confirmed = confirm(`确认投给：${voteSelectedDepts.join('、')}？`);
  if (!confirmed) return;

  try {
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voter_name: voterName,
        voter_departments: mySelectedDepts,
        voted_departments: voteSelectedDepts,
        browser_fingerprint: getBrowserFingerprint()
      })
    });

    const data = await response.json();

    if (response.ok) {
      window.location.href = '/success';
    } else {
      alert(data.error || '投票失败');
    }
  } catch (error) {
    alert('网络错误，请重试');
  }
});

// 页面初始化
async function init() {
  try {
    // 检查投票状态
    const statusRes = await fetch('/api/voting-status');
    const statusData = await statusRes.json();

    if (!statusData.enabled) {
      document.getElementById('votingClosed').style.display = 'block';
      document.getElementById('voteForm').style.display = 'none';
      return;
    }

    // 加载完整部门列表（所属部门）
    const allDeptRes = await fetch('/api/all-departments');
    const allDeptData = await allDeptRes.json();
    ALL_DEPARTMENTS = allDeptData.departments;

    // 加载参选部门列表（投票）
    const votingDeptRes = await fetch('/api/voting-departments');
    const votingDeptData = await votingDeptRes.json();
    VOTING_DEPARTMENTS = votingDeptData.departments;

    renderMyDepartments(ALL_DEPARTMENTS);
    renderVoteDepartments(VOTING_DEPARTMENTS);

  } catch (error) {
    alert('加载失败，请刷新页面');
  }
}

init();
