/**
 * AI API 调用模块
 */

const AI_API = {
  baseURL: 'https://aihubmix.com/v1/chat/completions',
  apiKey: 'sk-RTun0gYxmx2hSCeKAc414b844d2d4aE494B89298244731E0',
  model: 'gpt-4o',

  /**
   * 调用 AI 生成命理报告
   */
  async generateReport(prompt) {
    try {
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一位世界顶级的八字命理大师，精通四柱八字、大运流年分析。请严格按照用户要求的JSON格式输出，不要添加任何额外文字。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      };

      console.log('Calling API:', this.baseURL);
      console.log('Model:', this.model);

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      const content = data.choices[0].message.content;

      // 尝试解析 JSON
      try {
        // 提取 JSON 部分（可能被 markdown 代码块包裹）
        let jsonStr = content;
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        } else {
          // 尝试找到 JSON 对象
          const startIndex = content.indexOf('{');
          const endIndex = content.lastIndexOf('}');
          if (startIndex !== -1 && endIndex !== -1) {
            jsonStr = content.substring(startIndex, endIndex + 1);
          }
        }
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.log('Raw content:', content);
        // 返回原始内容
        return { rawContent: content, error: 'JSON解析失败' };
      }

    } catch (error) {
      console.error('API Call Error:', error);
      throw error;
    }
  },

  /**
   * 构建命理分析 prompt
   */
  buildPrompt(baziInfo) {
    const { bazi, gender, birthYear, dayun } = baziInfo;

    const genderText = gender === 'male' ? '男' : '女';
    const directionText = dayun.direction;
    const firstDayun = dayun.list[0]?.ganzhi || '';
    const startAge = dayun.startAge || 3;

    return `根据以下八字信息，生成人生K线图数据和命理报告。

**用户信息:**
- 性别: ${genderText}
- 出生年份: ${birthYear}年
- 四柱八字: ${bazi.bazi.join(' ')}
- 年柱: ${bazi.year}
- 月柱: ${bazi.month}
- 日柱: ${bazi.day}
- 时柱: ${bazi.hour}

**大运信息:**
- 大运排序方向: ${directionText}
- 起运年龄: ${startAge}岁
- 第一步大运: ${firstDayun}

**要求:**
1. 年龄采用虚岁，从1岁开始
2. 每年的reason提供30字左右的流年运势精要
3. 每年包含6个维度评分(0-100): total, wealth, career, marriage, family, health
4. chartPoints必须包含完整的70个数据点(1-70岁)
5. 大运每10年一步，起运前为"童限"

**输出JSON格式:**
{
  "bazi": ["${bazi.year}", "${bazi.month}", "${bazi.day}", "${bazi.hour}"],
  "baseLevelScore": 75,
  "patternType": "格局名称",
  "patternDescription": "格局描述...",
  "summary": "命理总评...",
  "summaryScore": 75,
  "industryAnalysis": "事业分析...",
  "wealthAnalysis": "财运分析...",
  "marriageAnalysis": "婚姻分析...",
  "healthAnalysis": "健康分析...",
  "familyAnalysis": "六亲分析...",
  "suggestions": {
    "favorableDirections": ["方位1", "方位2"],
    "favorableColors": ["颜色1", "颜色2"],
    "favorableNumbers": ["数字1", "数字2"],
    "noblePeople": ["属相1", "属相2"]
  },
  "chartPoints": [
    {"age": 1, "year": ${birthYear}, "daYun": "童限", "ganZhi": "干支", "score": 60, "reason": "流年批语...", "scores": {"total": 60, "wealth": 60, "career": 60, "marriage": 60, "family": 60, "health": 60}},
    ...共70个数据点
  ]
}`;
  }
};

window.AI_API = AI_API;
