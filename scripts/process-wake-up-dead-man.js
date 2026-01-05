import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: '.env' });

const tursoDB = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const OPENSUBTITLES_API_KEY = 'vSuOAURoDGadtGk6End40nf6Eah0bVOF';

console.log('🎬 開始處理 Wake Up Dead Man: A Knives Out Mystery');
console.log('IMDb ID: tt14364480');
console.log('');

// 步驟 1: 下載字幕
async function downloadSubtitle() {
  console.log('📥 步驟 1: 搜尋字幕...');

  const searchResponse = await fetch(
    `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=tt14364480&languages=en`,
    {
      headers: {
        'Api-Key': OPENSUBTITLES_API_KEY,
        'User-Agent': 'SubtitleLingo v1.0.0'
      }
    }
  );

  const searchData = await searchResponse.json();

  if (!searchData.data || searchData.data.length === 0) {
    throw new Error('找不到字幕');
  }

  // 選擇下載量最多的
  const bestSubtitle = searchData.data.reduce((best, current) => {
    const currentDownloads = (current.attributes.download_count || 0) + (current.attributes.new_download_count || 0);
    const bestDownloads = best ? (best.attributes.download_count || 0) + (best.attributes.new_download_count || 0) : 0;
    return currentDownloads > bestDownloads ? current : best;
  });

  const fileId = bestSubtitle.attributes.files[0].file_id;
  console.log(`✅ 找到最佳字幕: ${bestSubtitle.attributes.release}`);
  console.log(`下載量: ${bestSubtitle.attributes.download_count}`);
  console.log('');

  // 取得下載連結
  console.log('📥 步驟 2: 取得下載連結...');
  const downloadResponse = await fetch(
    'https://api.opensubtitles.com/api/v1/download',
    {
      method: 'POST',
      headers: {
        'Api-Key': OPENSUBTITLES_API_KEY,
        'User-Agent': 'SubtitleLingo v1.0.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file_id: fileId })
    }
  );

  const downloadData = await downloadResponse.json();

  if (!downloadData.link) {
    throw new Error('無法取得下載連結');
  }

  console.log('✅ 下載連結取得成功');
  console.log('');

  // 下載 SRT 檔案
  console.log('📥 步驟 3: 下載 SRT 檔案...');
  const srtResponse = await fetch(downloadData.link);
  const srtContent = await srtResponse.text();

  console.log(`✅ SRT 下載完成 (${(srtContent.length / 1024).toFixed(2)} KB)`);
  console.log('');

  return srtContent;
}

// 步驟 2: 使用 Gemini 分析
async function analyzeWithGemini(srtContent) {
  console.log('🤖 步驟 4: 使用 Gemini AI 分析字幕...');

  const srtForAnalysis = srtContent.substring(0, 15000);

  const systemPrompt = `你是專業的英文教學助手和語言學專家。請分析以下 SRT 字幕檔案，完成兩個任務：

1. 提取 20 段最重要的對話（根據以下標準選擇）：
   - 對話長度適中（15-50 字）
   - 包含重要劇情或情感表達
   - 不包含純音效或環境描述
   - 涵蓋整部電影的不同場景
   - 選擇具有代表性、學習價值高的句子

2. 提取 10-15 個重要生字：
   - 中高級難度單字（B2-C1 等級）
   - 在對話中出現的重要詞彙
   - 包含詞性、繁體中文定義、難度等級
   - 提供原電影中的例句和額外例句

請以 JSON 格式回應。`;

  const userPrompt = `請分析以下 Wake Up Dead Man: A Knives Out Mystery 的字幕：\\n\\n${srtForAnalysis}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\\n\\n${userPrompt}` }]
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
    throw new Error(`Gemini API 錯誤: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;

  // 解析 JSON
  let jsonContent = content.trim();
  if (jsonContent.startsWith('```json')) jsonContent = jsonContent.slice(7);
  if (jsonContent.startsWith('```')) jsonContent = jsonContent.slice(3);
  if (jsonContent.endsWith('```')) jsonContent = jsonContent.slice(0, -3);
  jsonContent = jsonContent.trim();

  const parsed = JSON.parse(jsonContent);

  console.log('✅ Gemini 分析完成');
  console.log(`- 重要對話: ${parsed.important_dialogues?.length || 0} 段`);
  console.log(`- 生字筆記: ${parsed.vocabulary_notes?.length || 0} 個`);
  console.log('');

  return parsed;
}

// 步驟 3: 儲存到資料庫
async function saveToDatabase(analysisResult) {
  console.log('💾 步驟 5: 儲存到 Turso 資料庫...');

  const movieId = 'movie_tt14364480';
  const subtitleId = `subtitle_${Date.now()}`;

  // 儲存 movie
  await tursoDB.execute({
    sql: 'INSERT OR REPLACE INTO movies (id, imdb_id, title, year, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
    args: [movieId, 'tt14364480', 'Wake Up Dead Man: A Knives Out Mystery', 2025]
  });
  console.log('✅ 電影資訊已儲存');

  // 儲存 subtitle
  await tursoDB.execute({
    sql: 'INSERT INTO subtitles (id, movie_id, language, srt_content, file_name, download_count, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))',
    args: [subtitleId, movieId, 'en', 'SRT from OpenSubtitles', 'Wake.Up.Dead.Man.srt', 146981]
  });
  console.log('✅ 字幕資訊已儲存');

  // 儲存對話
  console.log('');
  console.log('💬 儲存重要對話...');
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
      process.stdout.write(`\r✅ ${dialoguesSaved}/${analysisResult.important_dialogues.length} 已儲存`);
    } catch (error) {
      console.log(`\n❌ 儲存對話失敗: ${error.message}`);
    }
  }
  console.log(`\n✨ 成功儲存 ${dialoguesSaved} 段對話`);

  // 儲存生字
  console.log('');
  console.log('📚 儲存生字筆記...');
  let vocabSaved = 0;
  for (const vocab of analysisResult.vocabulary_notes || []) {
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
      process.stdout.write(`\r✅ ${vocabSaved}/${analysisResult.vocabulary_notes.length} 已儲存: ${vocab.word}`);
    } catch (error) {
      console.log(`\n❌ 儲存生字失敗: ${error.message}`);
    }
  }
  console.log(`\n✨ 成功儲存 ${vocabSaved} 個生字`);
}

// 執行
async function main() {
  try {
    const srtContent = await downloadSubtitle();
    const analysisResult = await analyzeWithGemini(srtContent);
    await saveToDatabase(analysisResult);

    console.log('');
    console.log('✨ 處理完成！');
    console.log('');
    console.log('📝 下一步：');
    console.log('1. 重新載入前端頁面');
    console.log('2. 點擊 "Wake Up Dead Man: A Knives Out Mystery"');
    console.log('3. 查看對話和生字筆記');

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
  }
}

main();
