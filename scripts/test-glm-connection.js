import { config } from 'dotenv';

config({ path: '.env' });

const GLM_API_KEY = 'b4df6e149288463fb03903c94cc32ad1.gdjC4fj1TRyhSu19';

async function testGLMConnection() {
  console.log('🔍 測試 GLM 4.7 API 連接...\n');

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GLM_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'glm-4.7',
      messages: [
        { role: 'system', content: '你是一个有用的AI助手。' },
        { role: 'user', content: '请簡單介紹一下人工智能的發展歷程。' }
      ],
      temperature: 1,
      stream: false,
      thinking: {
        type: 'enabled',
        clear_thinking: true
      },
      do_sample: true,
      top_p: 0.95,
      tool_stream: false,
      response_format: { type: 'text' }
    })
  };

  try {
    console.log('發送請求到: https://open.bigmodel.cn/api/paas/v4/chat/completions\n');
    console.log('API Key:', GLM_API_KEY.substring(0, 20) + '...\n');

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', options);

    console.log('HTTP 狀態碼:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('錯誤訊息:', errorText);
      return;
    }

    const res = await response.json();
    console.log('\n✅ API 連接成功！\n');
    console.log('回應內容：');
    console.log(JSON.stringify(res, null, 2));

  } catch (err) {
    console.error('\n❌ 請求失敗:', err.message);
  }
}

testGLMConnection().then(() => {
  console.log('\n✨ 測試完成');
  process.exit(0);
});
