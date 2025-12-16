/**
 * 八字计算核心模块
 * 包含天干地支、五行、八字排盘、大运计算等
 */

// 天干
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
// 地支
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
// 六十甲子
const JIAZI = [];
for (let i = 0; i < 60; i++) {
  JIAZI.push(TIANGAN[i % 10] + DIZHI[i % 12]);
}

// 天干五行
const TIANGAN_WUXING = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

// 地支五行
const DIZHI_WUXING = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// 地支藏干
const DIZHI_CANGGAN = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲']
};

// 十神
const SHISHEN_MAP = {
  '同我同性': '比肩', '同我异性': '劫财',
  '生我同性': '偏印', '生我异性': '正印',
  '我生同性': '食神', '我生异性': '伤官',
  '克我同性': '偏官', '克我异性': '正官',
  '我克同性': '偏财', '我克异性': '正财'
};

// 五行相生相克
const WUXING_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
const WUXING_BEISHENG = { '火': '木', '土': '火', '金': '土', '水': '金', '木': '水' };
const WUXING_BEIKE = { '土': '木', '水': '土', '火': '水', '金': '火', '木': '金' };

// 天干阴阳
const TIANGAN_YINYANG = {
  '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳',
  '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴'
};

// 节气数据（简化版，用于确定月柱）
const JIEQI = [
  { name: '小寒', month: 1 }, { name: '立春', month: 1 },
  { name: '惊蛰', month: 2 }, { name: '清明', month: 3 },
  { name: '立夏', month: 4 }, { name: '芒种', month: 5 },
  { name: '小暑', month: 6 }, { name: '立秋', month: 7 },
  { name: '白露', month: 8 }, { name: '寒露', month: 9 },
  { name: '立冬', month: 10 }, { name: '大雪', month: 11 }
];

// 时辰对应地支
const HOUR_TO_DIZHI = [
  '子', '丑', '寅', '卯', '辰', '巳',
  '午', '未', '申', '酉', '戌', '亥'
];

/**
 * 公历转农历（简化算法）
 */
function solarToLunar(year, month, day) {
  // 这里使用简化算法，实际项目应使用完整的农历库
  // 返回近似值用于演示
  return {
    year: year,
    month: month,
    day: day,
    isLeap: false
  };
}

/**
 * 计算年柱
 */
function getYearPillar(year, month, day) {
  // 立春前算上一年
  let y = year;
  // 简化处理：2月4日前算上一年
  if (month < 2 || (month === 2 && day < 4)) {
    y -= 1;
  }
  // 1984年为甲子年
  const index = ((y - 1984) % 60 + 60) % 60;
  return JIAZI[index];
}

/**
 * 计算月柱
 */
function getMonthPillar(year, month, day) {
  // 确定月份（以节气为准，简化处理）
  let m = month;
  // 每月约5日前为上月
  if (day < 6) {
    m = m - 1;
    if (m === 0) m = 12;
  }

  // 年干决定月干起点
  const yearPillar = getYearPillar(year, month, day);
  const yearGan = yearPillar[0];
  const yearGanIndex = TIANGAN.indexOf(yearGan);

  // 年上起月：甲己之年丙作首
  const monthGanStart = [2, 4, 6, 8, 0][Math.floor(yearGanIndex / 2)];

  // 月支从寅开始（正月建寅）
  const monthZhiIndex = (m + 1) % 12; // 正月为寅(2)
  const monthGanIndex = (monthGanStart + m - 1) % 10;

  return TIANGAN[monthGanIndex] + DIZHI[monthZhiIndex];
}

/**
 * 计算日柱（简化算法）
 */
function getDayPillar(year, month, day) {
  // 使用公式计算日柱
  // 基准：1900年1月31日为甲辰日
  const baseDate = new Date(1900, 0, 31);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
  const index = ((diffDays % 60) + 60 + 40) % 60; // 40是甲辰的偏移
  return JIAZI[index];
}

/**
 * 计算时柱
 */
function getHourPillar(dayPillar, hour) {
  const dayGan = dayPillar[0];
  const dayGanIndex = TIANGAN.indexOf(dayGan);

  // 日上起时：甲己还加甲
  const hourGanStart = [0, 2, 4, 6, 8][Math.floor(dayGanIndex / 2)];
  const hourGanIndex = (hourGanStart + hour) % 10;

  return TIANGAN[hourGanIndex] + DIZHI[hour];
}

/**
 * 计算完整八字
 */
function calculateBazi(year, month, day, hour) {
  const yearPillar = getYearPillar(year, month, day);
  const monthPillar = getMonthPillar(year, month, day);
  const dayPillar = getDayPillar(year, month, day);
  const hourPillar = getHourPillar(dayPillar, hour);

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    bazi: [yearPillar, monthPillar, dayPillar, hourPillar]
  };
}

/**
 * 解析八字字符串
 */
function parseBaziString(baziStr) {
  if (baziStr.length === 2) {
    return { gan: baziStr[0], zhi: baziStr[1] };
  }
  return null;
}

/**
 * 获取日主（日干）
 */
function getDayMaster(bazi) {
  return bazi.day[0];
}

/**
 * 计算五行统计
 */
function countWuxing(bazi) {
  const count = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };

  bazi.bazi.forEach(pillar => {
    const gan = pillar[0];
    const zhi = pillar[1];
    count[TIANGAN_WUXING[gan]]++;
    count[DIZHI_WUXING[zhi]]++;

    // 计算藏干
    DIZHI_CANGGAN[zhi].forEach(cg => {
      count[TIANGAN_WUXING[cg]] += 0.3;
    });
  });

  return count;
}

/**
 * 判断日主强弱
 */
function getDayMasterStrength(bazi) {
  const dayMaster = getDayMaster(bazi);
  const dayWuxing = TIANGAN_WUXING[dayMaster];
  const wuxingCount = countWuxing(bazi);

  // 日主五行 + 生日主的五行
  const helpWuxing = WUXING_BEISHENG[dayWuxing];
  const strength = wuxingCount[dayWuxing] + wuxingCount[helpWuxing] * 0.7;

  // 克泄耗
  const keWuxing = WUXING_BEIKE[dayWuxing];
  const xieWuxing = WUXING_SHENG[dayWuxing];
  const haoWuxing = WUXING_KE[dayWuxing];
  const weakness = wuxingCount[keWuxing] + wuxingCount[xieWuxing] * 0.5 + wuxingCount[haoWuxing] * 0.5;

  if (strength > weakness + 2) return '身强';
  if (strength < weakness - 1) return '身弱';
  return '中和';
}

/**
 * 分析格局
 */
function analyzePattern(bazi) {
  const dayMaster = getDayMaster(bazi);
  const monthZhi = bazi.month[1];
  const monthCanggan = DIZHI_CANGGAN[monthZhi];

  // 简化格局判断
  const patterns = ['正官格', '七杀格', '正印格', '偏印格', '正财格', '偏财格',
                   '食神格', '伤官格', '比肩格', '劫财格', '建禄格', '羊刃格'];

  // 根据月令藏干与日主关系判断
  const mainCanggan = monthCanggan[0];
  const relation = getShishen(dayMaster, mainCanggan);

  let patternType = relation + '格';
  if (!patterns.includes(patternType)) {
    patternType = '正官格'; // 默认
  }

  return {
    type: patternType,
    description: getPatternDescription(patternType, bazi)
  };
}

/**
 * 获取十神
 */
function getShishen(dayMaster, target) {
  const dayWuxing = TIANGAN_WUXING[dayMaster];
  const targetWuxing = TIANGAN_WUXING[target];
  const daySex = TIANGAN_YINYANG[dayMaster];
  const targetSex = TIANGAN_YINYANG[target];
  const sameSex = daySex === targetSex;

  if (dayWuxing === targetWuxing) {
    return sameSex ? '比肩' : '劫财';
  } else if (WUXING_BEISHENG[dayWuxing] === targetWuxing) {
    return sameSex ? '偏印' : '正印';
  } else if (WUXING_SHENG[dayWuxing] === targetWuxing) {
    return sameSex ? '食神' : '伤官';
  } else if (WUXING_BEIKE[dayWuxing] === targetWuxing) {
    return sameSex ? '偏官' : '正官';
  } else if (WUXING_KE[dayWuxing] === targetWuxing) {
    return sameSex ? '偏财' : '正财';
  }
  return '比肩';
}

/**
 * 获取格局描述
 */
function getPatternDescription(patternType, bazi) {
  const descriptions = {
    '正官格': '正官透出，为人正直守信，适合从政或管理工作，一生多得贵人相助。',
    '七杀格': '七杀有制，性格刚强果断，具有领导才能，适合开拓性事业。',
    '正印格': '印星得力，学识渊博，品性温和，适合学术研究或教育工作。',
    '偏印格': '偏印透出，思维独特，富有创造力，适合技术或艺术领域。',
    '正财格': '正财旺相，勤劳务实，财运稳定，适合经商或理财工作。',
    '偏财格': '偏财透出，善于投资，社交广泛，适合销售或金融行业。',
    '食神格': '食神泄秀，才华横溢，性格温和，适合文艺或餐饮行业。',
    '伤官格': '伤官生财，聪明机智，口才出众，适合演艺或法律行业。',
    '比肩格': '比肩帮身，独立自主，适合合伙创业或自由职业。',
    '劫财格': '劫财透出，竞争意识强，适合销售或体育竞技。',
    '建禄格': '月令建禄，根基稳固，一生平顺，适合稳定职业。',
    '羊刃格': '羊刃当令，性格刚毅，宜从武职或执法部门。'
  };
  return descriptions[patternType] || '格局清正，五行流通，一生运势平稳。';
}

/**
 * 计算大运
 */
function calculateDaYun(bazi, gender, birthYear) {
  const yearGan = bazi.year[0];
  const yearGanIndex = TIANGAN.indexOf(yearGan);
  const isYangYear = yearGanIndex % 2 === 0;
  const isMale = gender === 'male';

  // 阳年男命、阴年女命顺行；阴年男命、阳年女命逆行
  const isForward = (isYangYear && isMale) || (!isYangYear && !isMale);

  // 月柱为起点
  const monthPillarIndex = JIAZI.indexOf(bazi.month);

  const dayunList = [];

  // 计算起运年龄（简化为3岁起运）
  const startAge = 3;

  // 计算8步大运
  for (let i = 0; i < 8; i++) {
    let index;
    if (isForward) {
      index = (monthPillarIndex + i + 1) % 60;
    } else {
      index = (monthPillarIndex - i - 1 + 60) % 60;
    }

    const startYear = birthYear + startAge + i * 10;
    dayunList.push({
      ganzhi: JIAZI[index],
      startAge: startAge + i * 10,
      endAge: startAge + (i + 1) * 10 - 1,
      startYear: startYear,
      endYear: startYear + 9
    });
  }

  return {
    direction: isForward ? '顺行' : '逆行',
    startAge: startAge,
    list: dayunList
  };
}

/**
 * 计算流年干支
 */
function getLiuNianGanzhi(year) {
  const index = ((year - 1984) % 60 + 60) % 60;
  return JIAZI[index];
}

/**
 * 导出模块
 */
window.BaziCalculator = {
  TIANGAN,
  DIZHI,
  JIAZI,
  TIANGAN_WUXING,
  DIZHI_WUXING,
  calculateBazi,
  getDayMaster,
  getDayMasterStrength,
  countWuxing,
  analyzePattern,
  calculateDaYun,
  getLiuNianGanzhi,
  getShishen,
  parseBaziString
};
