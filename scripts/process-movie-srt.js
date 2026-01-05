import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: '.env' });

const tursoDB = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

// Google Gemini API 配置
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

/**
 * 處理指定的電影 SRT 檔案
 * 用法: node scripts/process-movie-srt.js <IMDb_ID> <SRT_FILE_PATH>
 * 例如: node scripts/process-movie-srt.js tt14364480 ./wake-up-dead-man.srt
 */

async function processMovieSRT(imdbId, srtFilePath) {
  console.log('🎬 開始處理電影字幕...');
  console.log('IMDb ID:', imdbId);
  console.log('SRT 檔案:', srtFilePath);
  console.log('');

  // 讀取 SRT 檔案
  let srtContent;
  try {
    srtContent = readFileSync(srtFilePath, 'utf-8');
    console.log('✅ SRT 檔案讀取成功');
    console.log('檔案大小:', (srtContent.length / 1024).toFixed(2), 'KB');
  } catch (error) {
    console.error('❌ 無法讀取 SRT 檔案:', error.message);
    process.exit(1);
  }

  // 限制 SRT 長度給 Gemini 分析（前 15000 字）
  const srtForAnalysis = srtContent.substring(0, 15000);
  console.log('送給 Gemini 分析的字數:', srtForAnalysis.length);

  console.log('\n🤖 正在呼叫 Google Gemini API 分析字幕...\n');

  const systemPrompt = `你是專業的英文教學助手和語言學專家。請分析以下 SRT 字幕檔案，完成兩個任務：

1. 提取 20 段最重要的對話（根據以下標準選擇）：
   - 對話長度適中（15-50 字）
   - 包含重要劇情或情感表達
   - 不包含純音效或環境描述（如 [LAUGHING]、[SCREAMS]）
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

  const userPrompt = `請分析以下電影的字幕內容，提取重要對話和生字筆記：\\n\\n${srtForAnalysis}\\n\\n請以 JSON 格式回應，不要包含任何其他文字說明。`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\\n\\n${userPrompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API 錯誤 ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini API 沒有回應');
    }

    const content = data.candidates[0].content.parts[0].text;

    // 解析 JSON
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

    console.log('✅ Gemini API 回應成功');
    console.log('📊 分析結果：');
    console.log('- 重要對話數量:', parsed.important_dialogues?.length || 0);
    console.log('- 生字筆記數量:', parsed.vocabulary_notes?.length || 0);
    console.log('');

    // 儲存到資料庫
    await saveToDatabase(imdbId, parsed);

    console.log('\n✨ 處理完成！');
    console.log('📝 下一步：');
    console.log('1. 檢查資料庫中的數據');
    console.log('2. 在前端選擇這部電影查看內容');

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
  }
}

async function saveToDatabase(imdbId, analysisResult) {
  console.log('💾 開始儲存到資料庫...');

  const movieId = `movie_${imdbId}`;
  const subtitleId = `subtitle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 1. 儲存 movie（如果不存在）
  try {
    await tursoDB.execute({
      sql: 'INSERT OR REPLACE INTO movies (id, imdb_id, title, year, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
      args: [movieId, imdbId, 'Wake Up Dead Man: A Knives Out Mystery', 2025]
    });
    console.log('✅ 電影資訊已儲存');
  } catch (error) {
    console.log('⚠️ 儲存電影資訊時出錯:', error.message);
  }

  // 2. 儲存 subtitle
  try {
    await tursoDB.execute({
      sql: 'INSERT INTO subtitles (id, movie_id, language, srt_content, file_name, download_count, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))',
      args: [subtitleId, movieId, 'en', 'SRT content from file', 'subtitle.srt', 0]
    });
    console.log('✅ 字幕資訊已儲存');
  } catch (error) {
    console.log('⚠️ 儲存字幕資訊時出錯:', error.message);
  }

  // 3. 儲存重要對話
  console.log('\n💬 儲存重要對話到資料庫...');
  let dialoguesSaved = 0;
  for (const dialogue of analysisResult.important_dialogues || []) {
    try {
      const dialogueId = `dialogue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await tursoDB.execute({
        sql: 'INSERT INTO important_dialogues (id, subtitle_id, content, time_start, time_end, translation_zh, explanation, difficulty_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))',
        args: [
          dialogueId,
          subtitleId,
          dialogue.content,
          dialogue.time_start || '00:00:00,000',
          dialogue.time_end || '00:00:00,000',
          dialogue.translation_zh || '',
          dialogue.explanation || '',
          dialogue.difficulty_level || 'intermediate'
        ]
      });
      dialoguesSaved++;
      process.stdout.write(`\r✅ 對話 ${dialoguesSaved}/${analysisResult.important_dialogues.length} 已儲存`);
    } catch (error) {
      console.log(`\n❌ 儲存對話失敗: ${error.message}`);
    }
  }
  console.log(`\n✨ 成功儲存 ${dialoguesSaved}/${analysisResult.important_dialogues.length} 段重要對話`);

  // 4. 儲存生字筆記
  console.log('\n📚 儲存生字筆記到資料庫...');
  let vocabSaved = 0;
  for (const vocab of (analysisResult.vocabulary_notes || [])) {
    try {
      const vocabId = `vocab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await tursoDB.execute({
        sql: 'INSERT INTO vocabulary_notes (id, word, part_of_speech, definition_zh, level, original_sentence, example_sentences, movie_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))',
        args: [
          vocabId,
          vocab.word,
          vocab.part_of_speech || '',
          vocab.definition_zh || '',
          vocab.level || 'intermediate',
          vocab.original_sentence || '',
          JSON.stringify(vocab.example_sentences || []),
          movieId
        ]
      });
      vocabSaved++;
      process.stdout.write(`\r✅ 生字 ${vocabSaved}/${analysisResult.vocabulary_notes.length} 已儲存: ${vocab.word}`);
    } catch (error) {
      console.log(`\n❌ 儲存生字失敗: ${error.message}`);
    }
  }
  console.log(`\n✨ 成功儲存 ${vocabSaved}/${analysisResult.vocabulary_notes.length} 個生字筆記`);
}

// 執行
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('用法: node scripts/process-movie-srt.js <IMDb_ID> <SRT_FILE_PATH>');
  console.log('例如: node scripts/process-movie-srt.js tt14364480 ./wake-up-dead-man.srt');
  process.exit(1);
}

processMovieSRT(args[0], args[1]);
