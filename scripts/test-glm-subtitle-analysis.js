import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env' });

const tursoDB = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

// GLM 4.7 API 配置（智譜AI BigModel.cn）
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_API_KEY = process.env.GLM_API_KEY || ''; // 需要在 .env 中設定

/**
 * 呼叫 GLM 4.7 API 分析字幕
 */
async function analyzeSubtitlesWithGLM(srtContent) {
  console.log('🤖 正在呼叫 GLM 4.7 API 分析字幕...\n');

  const systemPrompt = `你是專業的英文教學助手和語言學專家。請分析以下 SRT 字幕檔案，完成兩個任務：

1. 提取 20 段最重要的對話（根據以下標準選擇）：
   - 對話長度適中（15-50 字）
   - 包含重要劇情或情感表達
   - 不包含純音效或環境描述（如 [LAUGHING]、[SCREAMS]、[SPEAKING IN JAPANESE]）
   - 涵蓋整部電影的不同場景
   - 選擇具有代表性、學習價值高的句子

2. 提取 10-15 個重要生字（根據以下標準）：
   - 中高級難度單字（B2-C1 等級）
   - 在對話中出現的重要詞彙
   - 包含詞性、繁體中文定義、難度等級
   - 提供原電影中的例句和額外例句

請以 JSON 格式回應，結構如下：
{
  "important_dialogues": [
    {
      "content": "對話內容（完整英文）",
      "time_start": "00:02:46,741",
      "time_end": "00:02:56,644",
      "translation_zh": "繁體中文翻譯",
      "explanation": "語法、文化背景或學習重點說明（繁體中文）",
      "difficulty_level": "intermediate 或 advanced"
    }
  ],
  "vocabulary_notes": [
    {
      "word": "subconscious",
      "part_of_speech": "noun (名詞)",
      "definition_zh": "潛意識；指潛藏在意識之下的心理活動",
      "level": "advanced",
      "original_sentence": "That's my subconscious trying to keep the dream intact.",
      "example_sentences": [
        "Your subconscious can affect your decisions without you realizing it.",
        "Dreams are a way to access the subconscious mind."
      ]
    }
  ]
}

重要提醒：
- translation_zh 必須使用繁體中文
- explanation 必須使用繁體中文
- definition_zh 必須使用繁體中文
- 確保 JSON 格式正確，可以被直接解析
- time_start 和 time_end 必須與字幕中的時間戳完全一致`;

  const userPrompt = `請分析以下 Inception 電影的字幕內容，提取重要對話和生字筆記：

${srtContent.substring(0, 15000)}  // 限制長度避免超出 token 限制

請以 JSON 格式回應，不要包含任何其他文字說明。`;

  try {
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GLM API 請求失敗: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('✅ GLM 4.7 API 回應成功\n');

    // 嘗試解析 JSON
    try {
      // 移除可能的 markdown 程式碼區塊標記
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.slice(7);
      }
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.slice(3);
      }
      if (jsonContent.endsWith('```')) {
        jsonContent = jsonContent.slice(0, -3);
      }
      jsonContent = jsonContent.trim();

      const parsed = JSON.parse(jsonContent);

      console.log('📊 分析結果：');
      console.log(`- 重要對話數量: ${parsed.important_dialogues?.length || 0}`);
      console.log(`- 生字筆記數量: ${parsed.vocabulary_notes?.length || 0}\n`);

      return parsed;
    } catch (parseError) {
      console.error('❌ JSON 解析失敗:', parseError.message);
      console.log('原始回應內容：');
      console.log(content);
      throw parseError;
    }

  } catch (error) {
    console.error('❌ GLM API 調用失敗:', error.message);
    throw error;
  }
}

/**
 * 儲存重要對話到資料庫
 */
async function saveImportantDialogues(dialogues, subtitleId) {
  console.log('💬 儲存重要對話到資料庫...\n');

  let savedCount = 0;

  for (const dialogue of dialogues) {
    try {
      const id = `dialogue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await tursoDB.execute({
        sql: `
          INSERT INTO important_dialogues (id, subtitle_id, content, time_start, time_end, explanation, difficulty_level, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `,
        args: [
          id,
          subtitleId,
          dialogue.content,
          dialogue.time_start,
          dialogue.time_end,
          dialogue.explanation || '',
          dialogue.difficulty_level || 'intermediate'
        ]
      });

      savedCount++;
      console.log(`✅ 對話 ${savedCount}/${dialogues.length} 已儲存`);
    } catch (error) {
      console.error(`❌ 儲存對話失敗: ${error.message}`);
    }
  }

  console.log(`\n✨ 成功儲存 ${savedCount}/${dialogues.length} 段重要對話\n`);
}

/**
 * 儲存生字筆記到資料庫
 */
async function saveVocabularyNotes(vocabularies, movieId) {
  console.log('📚 儲存生字筆記到資料庫...\n');

  let savedCount = 0;

  for (const vocab of vocabularies) {
    try {
      const id = `vocab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await tursoDB.execute({
        sql: `
          INSERT INTO vocabulary_notes (id, word, part_of_speech, definition_zh, level, original_sentence, example_sentences, movie_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `,
        args: [
          id,
          vocab.word,
          vocab.part_of_speech,
          vocab.definition_zh,
          vocab.level,
          vocab.original_sentence,
          JSON.stringify(vocab.example_sentences || []),
          movieId
        ]
      });

      savedCount++;
      console.log(`✅ 生字 ${savedCount}/${vocabularies.length} 已儲存: ${vocab.word}`);
    } catch (error) {
      console.error(`❌ 儲生生字失敗: ${error.message}`);
    }
  }

  console.log(`\n✨ 成功儲存 ${savedCount}/${vocabularies.length} 個生字筆記\n`);
}

/**
 * 主函數
 */
async function main() {
  try {
    console.log('🎬 開始測試 GLM 4.7 字幕分析功能\n');
    console.log('=' .repeat(60));

    // 檢查 API Key
    if (!GLM_API_KEY) {
      console.error('❌ 錯誤: 請在 .env 檔案中設定 GLM_API_KEY');
      console.log('格式: GLM_API_KEY=your-api-key-here\n');
      process.exit(1);
    }

    // 獲取 Inception 字幕
    console.log('📝 獲取 Inception 字幕...\n');

    const subtitleResult = await tursoDB.execute({
      sql: `
        SELECT s.*, m.id as movie_id
        FROM subtitles s
        JOIN movies m ON s.movie_id = m.id
        WHERE m.imdb_id = 'tt1375666'
        LIMIT 1
      `
    });

    if (subtitleResult.rows.length === 0) {
      console.error('❌ 找不到 Inception 字幕資料');
      process.exit(1);
    }

    const subtitle = subtitleResult.rows[0];
    console.log(`✅ 找到字幕 ID: ${subtitle.id}\n`);

    // 分析字幕
    const analysisResult = await analyzeSubtitlesWithGLM(subtitle.srt_content);

    // 顯示分析結果範例
    if (analysisResult.important_dialogues && analysisResult.important_dialogues.length > 0) {
      console.log('=' .repeat(60));
      console.log('📋 重要對話範例（前 3 段）：\n');

      analysisResult.important_dialogues.slice(0, 3).forEach((dialogue, index) => {
        console.log(`${index + 1}. ${dialogue.content}`);
        console.log(`   時間: ${dialogue.time_start} - ${dialogue.time_end}`);
        console.log(`   翻譯: ${dialogue.translation_zh}`);
        console.log(`   說明: ${dialogue.explanation}`);
        console.log(`   難度: ${dialogue.difficulty_level}\n`);
      });
    }

    if (analysisResult.vocabulary_notes && analysisResult.vocabulary_notes.length > 0) {
      console.log('=' .repeat(60));
      console.log('📚 生字筆記範例（前 3 個）：\n');

      analysisResult.vocabulary_notes.slice(0, 3).forEach((vocab, index) => {
        console.log(`${index + 1}. ${vocab.word} (${vocab.part_of_speech})`);
        console.log(`   定義: ${vocab.definition_zh}`);
        console.log(`   難度: ${vocab.level}`);
        console.log(`   原句: ${vocab.original_sentence}`);
        console.log(`   例句數: ${vocab.example_sentences?.length || 0}\n`);
      });
    }

    // 詢問是否儲存到資料庫
    console.log('=' .repeat(60));
    console.log('⚠️  分析完成！是否要儲存到資料庫？');
    console.log('正在儲存...\n');

    // 儲存重要對話
    if (analysisResult.important_dialogues && analysisResult.important_dialogues.length > 0) {
      await saveImportantDialogues(analysisResult.important_dialogues, subtitle.id);
    }

    // 儲存生字筆記
    if (analysisResult.vocabulary_notes && analysisResult.vocabulary_notes.length > 0) {
      await saveVocabularyNotes(analysisResult.vocabulary_notes, subtitle.movie_id);
    }

    console.log('=' .repeat(60));
    console.log('✨ 測試完成！\n');

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    process.exit(1);
  }
}

main().then(() => {
  process.exit(0);
});
