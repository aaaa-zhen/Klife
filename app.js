/**
 * 首页应用逻辑
 */

document.addEventListener('DOMContentLoaded', function() {
  initDateSelects();
  initToggle();
  initCalendarToggle();
  initPreview();
  initForm();
});

// 初始化日期选择器
function initDateSelects() {
  const yearSelect = document.getElementById('year');
  const daySelect = document.getElementById('day');
  const monthSelect = document.getElementById('month');

  // 生成年份选项 (1940-2024)
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1940; y--) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    if (y === 1996) option.selected = true;
    yearSelect.appendChild(option);
  }

  // 生成日期选项
  updateDayOptions();

  // 月份变化时更新日期选项
  monthSelect.addEventListener('change', updateDayOptions);
  yearSelect.addEventListener('change', updateDayOptions);
}

// 更新日期选项（根据年月）
function updateDayOptions() {
  const yearSelect = document.getElementById('year');
  const monthSelect = document.getElementById('month');
  const daySelect = document.getElementById('day');

  const year = parseInt(yearSelect.value);
  const month = parseInt(monthSelect.value);

  // 计算该月天数
  const daysInMonth = new Date(year, month, 0).getDate();

  // 保存当前选中的日期
  const currentDay = parseInt(daySelect.value) || 20;

  // 清空并重新生成
  daySelect.innerHTML = '';
  for (let d = 1; d <= daysInMonth; d++) {
    const option = document.createElement('option');
    option.value = d;
    option.textContent = d;
    if (d === Math.min(currentDay, daysInMonth)) option.selected = true;
    daySelect.appendChild(option);
  }
}

// 性别切换
function initToggle() {
  const btns = document.querySelectorAll('.toggle-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// 日历类型切换
function initCalendarToggle() {
  const btns = document.querySelectorAll('.calendar-btn');
  const lunarLeap = document.getElementById('lunarLeap');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 农历时显示闰月选项
      if (btn.dataset.type === 'lunar') {
        lunarLeap.classList.remove('hidden');
      } else {
        lunarLeap.classList.add('hidden');
      }

      updatePreview();
    });
  });
}

// 八字预览
function initPreview() {
  const inputs = ['year', 'month', 'day', 'hour'];
  inputs.forEach(id => {
    document.getElementById(id).addEventListener('change', updatePreview);
  });
}

function updatePreview() {
  const year = parseInt(document.getElementById('year').value);
  const month = parseInt(document.getElementById('month').value);
  const day = parseInt(document.getElementById('day').value);
  const hour = document.getElementById('hour').value;
  const isLunar = document.querySelector('.calendar-btn.active').dataset.type === 'lunar';

  const preview = document.getElementById('baziPreview');

  if (!year || !month || !day || hour === '') {
    preview.innerHTML = '<span class="preview-placeholder">选择时辰后显示八字</span>';
    return;
  }

  // 如果是农历，需要转换为公历（简化处理，实际应用需完整农历库）
  let solarYear = year, solarMonth = month, solarDay = day;
  if (isLunar) {
    const converted = lunarToSolar(year, month, day, document.getElementById('isLeapMonth')?.checked);
    solarYear = converted.year;
    solarMonth = converted.month;
    solarDay = converted.day;
  }

  const bazi = BaziCalculator.calculateBazi(solarYear, solarMonth, solarDay, parseInt(hour));

  preview.innerHTML = `
    <div class="bazi-pillars">
      ${['year', 'month', 'day', 'hour'].map((key, i) => `
        <div class="pillar">
          <div class="pillar-label">${['年', '月', '日', '时'][i]}柱</div>
          <div class="pillar-chars">
            <div class="pillar-char gan">${bazi[key][0]}</div>
            <div class="pillar-char zhi">${bazi[key][1]}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 简化的农历转公历（实际项目应使用完整库如 lunar-javascript）
function lunarToSolar(year, month, day, isLeap) {
  // 简化处理：农历日期大致对应公历后推一个月
  // 实际应用需要完整的农历算法
  let solarMonth = month + 1;
  let solarYear = year;
  if (solarMonth > 12) {
    solarMonth = 1;
    solarYear++;
  }
  return { year: solarYear, month: solarMonth, day: day };
}

// 表单提交
function initForm() {
  document.getElementById('baziForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const gender = document.querySelector('.toggle-btn.active').dataset.value;
    const year = parseInt(document.getElementById('year').value);
    const month = parseInt(document.getElementById('month').value);
    const day = parseInt(document.getElementById('day').value);
    const hour = document.getElementById('hour').value;
    const calendarType = document.querySelector('.calendar-btn.active').dataset.type;
    const isLeapMonth = document.getElementById('isLeapMonth')?.checked || false;

    // 验证姓名
    if (!name) {
      alert('请输入姓名');
      document.getElementById('name').focus();
      return;
    }

    if (!year || !month || !day || hour === '') {
      alert('请填写完整的出生信息');
      return;
    }

    // 如果是农历，转换为公历
    let solarYear = year, solarMonth = month, solarDay = day;
    if (calendarType === 'lunar') {
      const converted = lunarToSolar(year, month, day, isLeapMonth);
      solarYear = converted.year;
      solarMonth = converted.month;
      solarDay = converted.day;
    }

    // 存储数据到 sessionStorage
    const data = {
      name,
      gender,
      year: solarYear,
      month: solarMonth,
      day: solarDay,
      hour: parseInt(hour),
      originalYear: year,
      originalMonth: month,
      originalDay: day,
      calendarType,
      isLeapMonth
    };
    sessionStorage.setItem('baziData', JSON.stringify(data));

    // 跳转到结果页
    window.location.href = 'result.html';
  });
}
