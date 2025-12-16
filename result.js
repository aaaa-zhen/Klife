/**
 * 结果页逻辑
 */

let reportData = null;
let klineChart = null;
let currentChartType = 'total';

document.addEventListener('DOMContentLoaded', function() {
  const baziData = sessionStorage.getItem('baziData');

  if (!baziData) {
    window.location.href = 'index.html';
    return;
  }

  const data = JSON.parse(baziData);

  // 显示加载状态
  showLoading();

  // 调用 AI 生成报告
  generateAIReport(data);
});

// 显示加载状态
function showLoading() {
  document.querySelector('.container').innerHTML = `
    <nav class="topbar">
      <a href="index.html" class="back-btn">← 返回</a>
      <span class="topbar-title">命盘分析</span>
      <span></span>
    </nav>
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在生成命理报告...</p>
      <p class="loading-subtext">AI 正在分析您的八字命盘，请稍候</p>
    </div>
  `;
}

// 调用 AI 生成报告
async function generateAIReport(data) {
  const { name, gender, year, month, day, hour } = data;

  try {
    // 计算八字
    const bazi = BaziCalculator.calculateBazi(year, month, day, hour);
    const dayun = BaziCalculator.calculateDaYun(bazi, gender, year);

    // 构建 prompt 并调用 AI
    const prompt = AI_API.buildPrompt({
      bazi,
      gender,
      birthYear: year,
      dayun
    });

    console.log('Calling AI API...');
    const aiResult = await AI_API.generateReport(prompt);
    console.log('AI Result:', aiResult);

    if (aiResult.error || aiResult.rawContent) {
      console.error('AI returned invalid data, using fallback');
      // 使用本地计算作为后备
      generateLocalReport(data);
      return;
    }

    // 使用 AI 返回的数据
    reportData = {
      name,
      gender,
      year,
      bazi,
      ...aiResult,
      dayun
    };

    // 计算平均分
    if (aiResult.chartPoints && aiResult.chartPoints.length > 0) {
      reportData.avgScores = {
        total: Math.round(aiResult.chartPoints.reduce((s, p) => s + (p.scores?.total || p.score || 60), 0) / aiResult.chartPoints.length),
        wealth: Math.round(aiResult.chartPoints.reduce((s, p) => s + (p.scores?.wealth || 60), 0) / aiResult.chartPoints.length),
        career: Math.round(aiResult.chartPoints.reduce((s, p) => s + (p.scores?.career || 60), 0) / aiResult.chartPoints.length),
        marriage: Math.round(aiResult.chartPoints.reduce((s, p) => s + (p.scores?.marriage || 60), 0) / aiResult.chartPoints.length),
        health: Math.round(aiResult.chartPoints.reduce((s, p) => s + (p.scores?.health || 60), 0) / aiResult.chartPoints.length)
      };
    }

    // 重新渲染页面
    renderFullPage();

  } catch (error) {
    console.error('AI API Error:', error);
    // 使用本地计算作为后备
    generateLocalReport(data);
  }
}

// 本地生成报告（后备方案）
function generateLocalReport(data) {
  const { name, gender, year, month, day, hour } = data;

  // 计算八字
  const bazi = BaziCalculator.calculateBazi(year, month, day, hour);
  const dayMaster = BaziCalculator.getDayMaster(bazi);
  const strength = BaziCalculator.getDayMasterStrength(bazi);
  const pattern = BaziCalculator.analyzePattern(bazi);
  const dayun = BaziCalculator.calculateDaYun(bazi, gender, year);

  // 生成K线数据
  const chartPoints = generateChartPoints(bazi, year, dayun, strength);

  // 计算平均分
  const avgScores = {
    total: Math.round(chartPoints.reduce((s, p) => s + p.scores.total, 0) / chartPoints.length),
    wealth: Math.round(chartPoints.reduce((s, p) => s + p.scores.wealth, 0) / chartPoints.length),
    career: Math.round(chartPoints.reduce((s, p) => s + p.scores.career, 0) / chartPoints.length),
    marriage: Math.round(chartPoints.reduce((s, p) => s + p.scores.marriage, 0) / chartPoints.length),
    health: Math.round(chartPoints.reduce((s, p) => s + p.scores.health, 0) / chartPoints.length)
  };

  reportData = {
    name,
    gender,
    year,
    bazi,
    dayMaster,
    strength,
    patternType: pattern.type,
    patternDescription: pattern.description,
    dayun,
    chartPoints,
    avgScores,
    baseLevelScore: avgScores.total,
    summaryScore: avgScores.total,
    industryAnalysis: generateIndustryAnalysis(dayMaster, strength, pattern),
    wealthAnalysis: generateWealthAnalysis(strength),
    marriageAnalysis: generateMarriageAnalysis(gender),
    healthAnalysis: generateHealthAnalysis(bazi),
    suggestions: generateSuggestions(dayMaster, strength)
  };

  renderFullPage();
}

// 重新渲染完整页面
function renderFullPage() {
  // 重建页面结构
  document.querySelector('.container').innerHTML = `
    <nav class="topbar">
      <a href="index.html" class="back-btn">← 返回</a>
      <span class="topbar-title">命盘分析</span>
      <span></span>
    </nav>

    <section class="user-section">
      <div class="user-info">
        <span id="userName" class="user-name">-</span>
        <span id="userMeta" class="user-meta">-</span>
      </div>
      <div id="baziFour" class="bazi-four"></div>
    </section>

    <section class="score-section">
      <div class="main-score">
        <div class="score-ring">
          <svg viewBox="0 0 100 100">
            <circle class="ring-bg" cx="50" cy="50" r="45"/>
            <circle id="scoreRing" class="ring-fill" cx="50" cy="50" r="45"/>
          </svg>
          <div class="score-inner">
            <span id="mainScore" class="score-num">--</span>
            <span class="score-label">综合评分</span>
          </div>
        </div>
      </div>
      <div class="sub-scores">
        <div class="sub-score-item">
          <span class="sub-label">财运</span>
          <span id="wealthScore" class="sub-value">--</span>
        </div>
        <div class="sub-score-item">
          <span class="sub-label">事业</span>
          <span id="careerScore" class="sub-value">--</span>
        </div>
        <div class="sub-score-item">
          <span class="sub-label">感情</span>
          <span id="marriageScore" class="sub-value">--</span>
        </div>
        <div class="sub-score-item">
          <span class="sub-label">健康</span>
          <span id="healthScore" class="sub-value">--</span>
        </div>
      </div>
    </section>

    <section class="card">
      <h3 class="card-title">格局</h3>
      <div class="pattern-content">
        <span id="patternType" class="pattern-tag">-</span>
        <p id="patternDesc" class="pattern-desc">-</p>
      </div>
    </section>

    <section class="card chart-card">
      <h3 class="card-title">人生K线</h3>
      <div class="chart-tabs">
        <button class="chart-tab active" data-type="total">总运</button>
        <button class="chart-tab" data-type="wealth">财运</button>
        <button class="chart-tab" data-type="career">事业</button>
        <button class="chart-tab" data-type="marriage">感情</button>
        <button class="chart-tab" data-type="health">健康</button>
      </div>
      <div class="chart-wrapper">
        <canvas id="klineChart"></canvas>
      </div>
      <div class="chart-hint">点击图表查看流年详情</div>
    </section>

    <div class="result-grid">
      <section class="card">
        <h3 class="card-title">大运</h3>
        <div id="dayunList" class="dayun-list"></div>
      </section>

      <section class="card">
        <h3 class="card-title">详批</h3>
        <div class="report-tabs">
          <button class="report-tab active" data-tab="career">事业</button>
          <button class="report-tab" data-tab="wealth">财运</button>
          <button class="report-tab" data-tab="marriage">婚姻</button>
          <button class="report-tab" data-tab="health">健康</button>
        </div>
        <div id="reportText" class="report-text">-</div>
      </section>
    </div>

    <section class="card">
      <h3 class="card-title">开运指南</h3>
      <div id="suggestions" class="suggestions"></div>
    </section>

    <button id="downloadBtn" class="download-report-btn">保存为图片</button>

    <footer class="footer">
      <p>仅供娱乐 · 命由己造</p>
    </footer>
  `;

  // 添加弹窗
  const modal = document.createElement('div');
  modal.id = 'yearModal';
  modal.className = 'modal hidden';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h4 id="modalTitle">-</h4>
        <button class="modal-close">×</button>
      </div>
      <div id="modalScores" class="modal-scores"></div>
      <p id="modalReason" class="modal-reason">-</p>
    </div>
  `;
  document.body.appendChild(modal);

  // 渲染数据
  renderPage();
}

// 渲染页面数据
function renderPage() {
  const { name, gender, year, bazi, patternType, patternDescription, dayun, chartPoints, avgScores } = reportData;

  // 用户信息
  document.getElementById('userName').textContent = name;
  document.getElementById('userMeta').textContent = `${gender === 'male' ? '男' : '女'} · ${year}年生`;

  // 四柱 - 兼容数组和对象两种格式
  const baziArray = Array.isArray(bazi) ? bazi : (bazi.bazi || [bazi.year, bazi.month, bazi.day, bazi.hour]);
  const baziObj = Array.isArray(bazi) ? { year: bazi[0], month: bazi[1], day: bazi[2], hour: bazi[3] } : bazi;

  document.getElementById('baziFour').innerHTML = ['year', 'month', 'day', 'hour'].map((key, i) => {
    const pillar = baziObj[key] || baziArray[i] || '--';
    return `
      <div class="bazi-col">
        <div class="bazi-label">${['年', '月', '日', '时'][i]}柱</div>
        <div class="bazi-chars">
          <div class="bazi-char gan">${pillar[0] || '-'}</div>
          <div class="bazi-char zhi">${pillar[1] || '-'}</div>
        </div>
      </div>
    `;
  }).join('');

  // 评分
  const mainScore = avgScores?.total || reportData.summaryScore || 60;
  document.getElementById('mainScore').textContent = mainScore;
  document.getElementById('wealthScore').textContent = avgScores?.wealth || 60;
  document.getElementById('careerScore').textContent = avgScores?.career || 60;
  document.getElementById('marriageScore').textContent = avgScores?.marriage || 60;
  document.getElementById('healthScore').textContent = avgScores?.health || 60;

  // 分数环动画
  setTimeout(() => {
    const ring = document.getElementById('scoreRing');
    const offset = 283 - (283 * mainScore / 100);
    ring.style.strokeDashoffset = offset;
  }, 100);

  // 格局
  document.getElementById('patternType').textContent = patternType || '待分析';
  document.getElementById('patternDesc').textContent = patternDescription || reportData.summary || '';

  // 初始化图表
  if (chartPoints && chartPoints.length > 0) {
    initChart();
  }

  // 大运
  renderDayun();

  // 报告
  document.getElementById('reportText').textContent = reportData.industryAnalysis || '';

  // 建议
  renderSuggestions();

  // 绑定事件
  bindEvents();
}

// 初始化图表
function initChart() {
  const ctx = document.getElementById('klineChart').getContext('2d');
  const { chartPoints } = reportData;

  const data = chartPoints.map(p => p.scores?.total || p.score || 60);
  const labels = chartPoints.map(p => p.age + '岁');

  klineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (ctx) => {
              const i = ctx[0].dataIndex;
              const p = chartPoints[i];
              return `${p.year}年 (${p.age}岁)`;
            },
            label: (ctx) => {
              const typeNames = { total: '总运', wealth: '财运', career: '事业', marriage: '感情', health: '健康' };
              return `${typeNames[currentChartType]}: ${ctx.raw}分`;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            maxTicksLimit: 8,
            font: { size: 11 },
            color: '#a1a1aa'
          }
        },
        y: {
          display: true,
          min: 0,
          max: 100,
          grid: { color: '#f4f4f5' },
          ticks: {
            stepSize: 25,
            font: { size: 11 },
            color: '#a1a1aa'
          }
        }
      },
      onClick: (e, elements) => {
        if (elements.length > 0) {
          showYearModal(chartPoints[elements[0].index]);
        }
      }
    }
  });
}

// 更新图表
function updateChart(type) {
  currentChartType = type;
  const { chartPoints } = reportData;
  klineChart.data.datasets[0].data = chartPoints.map(p => p.scores?.[type] || p.score || 60);
  klineChart.update();
}

// 渲染大运
function renderDayun() {
  const { dayun, chartPoints } = reportData;
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - reportData.year + 1;

  document.getElementById('dayunList').innerHTML = dayun.list.map(dy => {
    const points = chartPoints?.filter(p => p.age >= dy.startAge && p.age <= dy.endAge) || [];
    const avg = points.length > 0
      ? Math.round(points.reduce((s, p) => s + (p.scores?.total || p.score || 60), 0) / points.length)
      : 60;
    const scoreClass = avg >= 70 ? 'good' : avg >= 55 ? 'normal' : 'bad';
    const isCurrent = currentAge >= dy.startAge && currentAge <= dy.endAge;

    return `
      <div class="dayun-item${isCurrent ? ' current' : ''}">
        <span class="dayun-ages">${dy.startAge}-${dy.endAge}岁</span>
        <span class="dayun-ganzhi">${dy.ganzhi}</span>
        <span class="dayun-score ${scoreClass}">${avg}分</span>
      </div>
    `;
  }).join('');
}

// 渲染建议
function renderSuggestions() {
  const suggestions = reportData.suggestions;

  if (suggestions && suggestions.favorableDirections) {
    document.getElementById('suggestions').innerHTML = `
      <div class="suggestion-item">
        <div class="suggestion-label">有利方位</div>
        <div class="suggestion-value">${suggestions.favorableDirections?.join('、') || '-'}</div>
      </div>
      <div class="suggestion-item">
        <div class="suggestion-label">幸运颜色</div>
        <div class="suggestion-value">${suggestions.favorableColors?.join('、') || '-'}</div>
      </div>
      <div class="suggestion-item">
        <div class="suggestion-label">幸运数字</div>
        <div class="suggestion-value">${suggestions.favorableNumbers?.join('、') || '-'}</div>
      </div>
      <div class="suggestion-item">
        <div class="suggestion-label">贵人属相</div>
        <div class="suggestion-value">${suggestions.noblePeople?.join('、') || '-'}</div>
      </div>
    `;
  } else {
    // 使用本地生成的建议
    const dayMaster = reportData.dayMaster || reportData.bazi?.day?.[0];
    const wuxing = dayMaster ? BaziCalculator.TIANGAN_WUXING[dayMaster] : '木';

    const directionMap = { '金': '西', '木': '东', '水': '北', '火': '南', '土': '中' };
    const colorMap = { '金': '白/金', '木': '绿/青', '水': '黑/蓝', '火': '红/紫', '土': '黄/棕' };
    const numberMap = { '金': '4、9', '木': '3、8', '水': '1、6', '火': '2、7', '土': '5、0' };

    document.getElementById('suggestions').innerHTML = `
      <div class="suggestion-item">
        <div class="suggestion-label">有利方位</div>
        <div class="suggestion-value">${directionMap[wuxing] || '东'}方</div>
      </div>
      <div class="suggestion-item">
        <div class="suggestion-label">幸运颜色</div>
        <div class="suggestion-value">${colorMap[wuxing] || '绿/青'}</div>
      </div>
      <div class="suggestion-item">
        <div class="suggestion-label">幸运数字</div>
        <div class="suggestion-value">${numberMap[wuxing] || '3、8'}</div>
      </div>
      <div class="suggestion-item">
        <div class="suggestion-label">日主五行</div>
        <div class="suggestion-value">${wuxing}</div>
      </div>
    `;
  }
}

// 显示流年详情
function showYearModal(point) {
  const modal = document.getElementById('yearModal');

  document.getElementById('modalTitle').textContent =
    `${point.year}年 (${point.age}岁) · ${point.ganZhi}`;

  const scores = point.scores || { total: point.score || 60, wealth: 60, career: 60, marriage: 60, health: 60, family: 60 };

  document.getElementById('modalScores').innerHTML = `
    <div class="modal-score-item">
      <div class="modal-score-label">总运</div>
      <div class="modal-score-value">${scores.total}</div>
    </div>
    <div class="modal-score-item">
      <div class="modal-score-label">财运</div>
      <div class="modal-score-value">${scores.wealth}</div>
    </div>
    <div class="modal-score-item">
      <div class="modal-score-label">事业</div>
      <div class="modal-score-value">${scores.career}</div>
    </div>
    <div class="modal-score-item">
      <div class="modal-score-label">感情</div>
      <div class="modal-score-value">${scores.marriage}</div>
    </div>
    <div class="modal-score-item">
      <div class="modal-score-label">健康</div>
      <div class="modal-score-value">${scores.health}</div>
    </div>
    <div class="modal-score-item">
      <div class="modal-score-label">大运</div>
      <div class="modal-score-value" style="font-size:14px">${point.daYun}</div>
    </div>
  `;

  document.getElementById('modalReason').textContent = point.reason || '暂无详细批语';
  modal.classList.remove('hidden');
}

// 绑定事件
function bindEvents() {
  // 图表切换
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      updateChart(tab.dataset.type);
    });
  });

  // 报告切换
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      const contents = {
        career: reportData.industryAnalysis,
        wealth: reportData.wealthAnalysis,
        marriage: reportData.marriageAnalysis,
        health: reportData.healthAnalysis
      };
      document.getElementById('reportText').textContent = contents[tabName] || '暂无内容';
    });
  });

  // 弹窗关闭
  const modal = document.getElementById('yearModal');
  if (modal) {
    modal.querySelector('.modal-close')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    modal.querySelector('.modal-overlay')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  // 下载图片按钮
  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadAsImage);
  }
}

// 下载为图片
async function downloadAsImage() {
  const btn = document.getElementById('downloadBtn');
  const originalText = btn.textContent;
  btn.textContent = '生成中...';
  btn.disabled = true;

  try {
    const container = document.querySelector('.container');

    // 隐藏不需要截图的元素
    const downloadBtnEl = document.getElementById('downloadBtn');
    const topbar = document.querySelector('.topbar');
    downloadBtnEl.style.display = 'none';
    topbar.style.display = 'none';

    const canvas = await html2canvas(container, {
      backgroundColor: '#f4f4f5',
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 420
    });

    // 恢复显示
    downloadBtnEl.style.display = '';
    topbar.style.display = '';

    // 下载
    const link = document.createElement('a');
    link.download = `${reportData.name}-命盘分析-${new Date().toLocaleDateString()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

  } catch (error) {
    console.error('截图失败:', error);
    alert('生成图片失败，请重试');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

// ==================== 本地计算后备函数 ====================

function generateChartPoints(bazi, birthYear, dayun, strength) {
  const points = [];
  const dayMaster = BaziCalculator.getDayMaster(bazi);

  for (let age = 1; age <= 80; age++) {
    const year = birthYear + age - 1;
    const ganZhi = BaziCalculator.getLiuNianGanzhi(year);

    let currentDayun = '童限';
    for (const dy of dayun.list) {
      if (age >= dy.startAge && age <= dy.endAge) {
        currentDayun = dy.ganzhi;
        break;
      }
    }

    const scores = calculateYearScores(bazi, ganZhi, currentDayun, age, strength);
    const reason = generateYearReason(ganZhi, currentDayun, scores, age);

    points.push({ age, year, daYun: currentDayun, ganZhi, scores, reason, score: scores.total });
  }

  return points;
}

function calculateYearScores(bazi, liuNian, dayun, age, strength) {
  const dayMaster = BaziCalculator.getDayMaster(bazi);
  const dayWuxing = BaziCalculator.TIANGAN_WUXING[dayMaster];

  let baseScore = 60;
  const lnGan = liuNian[0];
  const lnWuxing = BaziCalculator.TIANGAN_WUXING[lnGan];

  let dyBonus = 0;
  if (dayun !== '童限') {
    const dyGan = dayun[0];
    const dyWuxing = BaziCalculator.TIANGAN_WUXING[dyGan];
    if (strength === '身强') {
      if (dyWuxing === dayWuxing) dyBonus -= 3;
      else dyBonus += 5;
    } else if (strength === '身弱') {
      if (dyWuxing === dayWuxing) dyBonus += 8;
    } else {
      dyBonus += 3;
    }
  }

  let lnBonus = 0;
  if (strength === '身强' && lnWuxing !== dayWuxing) lnBonus += 4;
  else if (strength === '身弱' && lnWuxing === dayWuxing) lnBonus += 5;

  let ageBonus = 0;
  if (age >= 25 && age <= 45) ageBonus += 5;
  if (age >= 60) ageBonus -= 3;

  const seed = (age * 7 + liuNian.charCodeAt(0)) % 20 - 10;
  const total = Math.min(95, Math.max(30, baseScore + dyBonus + lnBonus + ageBonus + seed));

  return {
    total,
    wealth: Math.min(95, Math.max(25, total + (seed % 7) - 3)),
    career: Math.min(95, Math.max(25, total + ((seed + 3) % 8) - 4)),
    marriage: Math.min(95, Math.max(25, total + ((seed + 5) % 6) - 2)),
    family: Math.min(95, Math.max(30, total + ((seed + 2) % 5))),
    health: Math.min(95, Math.max(20, total - Math.floor(age / 15) + (seed % 4)))
  };
}

function generateYearReason(ganZhi, dayun, scores, age) {
  const total = scores.total;
  let fortune = total >= 80 ? '大吉之年' : total >= 70 ? '顺遂之年' :
    total >= 60 ? '平稳之年' : total >= 50 ? '小有波折' : '需谨慎行事';

  const events = [];
  if (scores.wealth >= 75) events.push('财运亨通');
  else if (scores.wealth < 50) events.push('财务宜守');
  if (scores.career >= 75) events.push('事业有成');
  else if (scores.career < 50) events.push('工作压力大');
  if (scores.marriage >= 75) events.push(age <= 35 ? '桃花旺盛' : '家庭和睦');
  else if (scores.marriage < 50) events.push('感情需经营');
  if (scores.health < 55) events.push('注意健康');

  const advice = total >= 70 ? '可适度进取' : total < 55 ? '宜守成待机' : '稳中求进';
  return `${ganZhi}年，${dayun}运。${fortune}。${events.slice(0, 2).join('，')}。${advice}。`;
}

function generateIndustryAnalysis(dayMaster, strength, pattern) {
  const wuxing = BaziCalculator.TIANGAN_WUXING[dayMaster];
  return `日主${wuxing}${strength === '身强' ? '旺' : strength === '身弱' ? '弱' : '平'}，${pattern.type}成格。${pattern.description}宜把握大运吉年积极拓展事业。`;
}

function generateWealthAnalysis(strength) {
  if (strength === '身强') return '身强能担财，具备良好的求财能力。正财稳定，偏财亦有机缘。宜正道经营，中年后财运渐入佳境。';
  if (strength === '身弱') return '身弱财重，需借助贵人和团队之力求财。不宜独立创业，合伙经营更佳。理财宜稳健保守。';
  return '身财两停，财运平顺。正财为主，偏财为辅。宜脚踏实地，稳步积累财富。';
}

function generateMarriageAnalysis(gender) {
  return gender === 'male'
    ? '配偶宫稳固，婚姻根基扎实。配偶性格务实，持家有方。建议在25-35岁间择良缘。'
    : '配偶宫安稳，婚姻运势平顺。配偶忠厚可靠，家庭责任感强。30岁前后为最佳婚配时机。';
}

function generateHealthAnalysis(bazi) {
  return '五行需注意调和，宜养成良好生活习惯。流年逢冲克之年更需关注身体状况，建议定期体检。';
}

function generateSuggestions(dayMaster, strength) {
  const wuxing = BaziCalculator.TIANGAN_WUXING[dayMaster];
  const directionMap = { '金': ['西方'], '木': ['东方'], '水': ['北方'], '火': ['南方'], '土': ['中央'] };
  const colorMap = { '金': ['白色', '金色'], '木': ['绿色'], '水': ['黑色', '蓝色'], '火': ['红色'], '土': ['黄色'] };
  const numberMap = { '金': ['4', '9'], '木': ['3', '8'], '水': ['1', '6'], '火': ['2', '7'], '土': ['5', '0'] };

  // 天乙贵人查询表
  const nobleMap = {
    '甲': ['属牛', '属羊'],
    '乙': ['属鼠', '属猴'],
    '丙': ['属猪', '属鸡'],
    '丁': ['属猪', '属鸡'],
    '戊': ['属牛', '属羊'],
    '己': ['属鼠', '属猴'],
    '庚': ['属牛', '属羊'],
    '辛': ['属马', '属虎'],
    '壬': ['属蛇', '属兔'],
    '癸': ['属蛇', '属兔']
  };

  return {
    favorableDirections: directionMap[wuxing] || ['东方'],
    favorableColors: colorMap[wuxing] || ['绿色'],
    favorableNumbers: numberMap[wuxing] || ['3', '8'],
    noblePeople: nobleMap[dayMaster] || ['属龙', '属马']
  };
}
