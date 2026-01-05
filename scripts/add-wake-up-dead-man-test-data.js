import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env' });

const tursoDB = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

console.log('🎬 為 Wake Up Dead Man: A Knives Out Mystery 添加測試資料');
console.log('IMDb ID: tt14364480');
console.log('');

// 測試資料 - Wake Up Dead Man 對話
const testDialogues = [
  {
    content: "Father, you have to trust me. I'm here to help.",
    time_start: "00:15:30,000",
    time_end: "00:15:35,000",
    translation_zh: "神父，你必須相信我。我是來幫忙的。",
    explanation: "這句話展示了角色之間的信任關係。'Trust' 是重要的動詞，表示相信或依賴某人。",
    difficulty_level: "intermediate"
  },
  {
    content: "There's been a murder. Someone in this congregation is responsible.",
    time_start: "00:20:15,000",
    time_end: "00:20:20,000",
    translation_zh: "這裡發生了謀殺案。這個教區的某人要負責。",
    explanation: "'Congregation' 指教區的會眾或教會成員。這句話建立了懸疑氛圍。",
    difficulty_level: "advanced"
  },
  {
    content: "I didn't do it! You have to believe me!",
    time_start: "00:35:40,000",
    time_end: "00:35:44,000",
    translation_zh: "不是我做的！你必須相信我！",
    explanation: "這句話展現了角色的無助和絕望。常用於否認指控的情境。",
    difficulty_level: "beginner"
  },
  {
    content: "The truth is hidden beneath layers of deception.",
    time_start: "01:10:25,000",
    time_end: "01:10:30,000",
    translation_zh: "真相隱藏在層層欺騙之下。",
    explanation: "'Deception' 意為欺騙、詐騙。這句話使用了比喻手法，形容真相很難發現。",
    difficulty_level: "advanced"
  },
  {
    content: "Everyone here had a motive. But who had the opportunity?",
    time_start: "01:25:50,000",
    time_end: "01:25:55,000",
    translation_zh: "在這裡的每個人都有動機。但是誰有機會？",
    explanation: "'Motive'（動機）和 'opportunity'（機會）是犯罪調查中的兩個關鍵概念。",
    difficulty_level: "intermediate"
  }
];

// 測試資料 - Wake Up Dead Man 生字
const testVocabulary = [
  {
    word: "congregation",
    part_of_speech: "noun (名詞)",
    definition_zh: "（教會的）會眾、教區全體",
    level: "advanced",
    original_sentence: "Someone in this congregation is responsible.",
    example_sentences: [
      "The entire congregation attended the Sunday service.",
      "The priest addressed the congregation about the upcoming event."
    ]
  },
  {
    word: "motive",
    part_of_speech: "noun (名詞)",
    definition_zh: "動機、目的",
    level: "intermediate",
    original_sentence: "Everyone here had a motive.",
    example_sentences: [
      "The police are trying to determine the motive for the crime.",
      "She had no motive to lie to him."
    ]
  },
  {
    word: "deception",
    part_of_speech: "noun (名詞)",
    definition_zh: "欺騙、詐騙、詭計",
    level: "advanced",
    original_sentence: "The truth is hidden beneath layers of deception.",
    example_sentences: [
      "He was shocked by the depth of her deception.",
      "The plot involved deception and betrayal at every turn."
    ]
  },
  {
    word: "suspicion",
    part_of_speech: "noun (名詞)",
    definition_zh: "懷疑、嫌疑",
    level: "intermediate",
    original_sentence: "She fell under suspicion immediately.",
    example_sentences: [
      "His strange behavior aroused suspicion.",
      "There is a suspicion of foul play."
    ]
  },
  {
    word: "evidence",
    part_of_speech: "noun (名詞)",
    definition_zh: "證據、證明",
    level: "intermediate",
    original_sentence: "We need to find the evidence.",
    example_sentences: [
      "The detective found crucial evidence at the scene.",
      "There is no evidence to support his claim."
    ]
  }
];

async function saveTestData() {
  console.log('💾 儲存測試資料到資料庫...');

  const movieId = 'movie_tt14364480';
  const subtitleId = `subtitle_tt14364480_${Date.now()}`;

  // 1. 儲存 movie
  await tursoDB.execute({
    sql: 'INSERT OR REPLACE INTO movies (id, imdb_id, title, year, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
    args: [movieId, 'tt14364480', 'Wake Up Dead Man: A Knives Out Mystery', 2025]
  });
  console.log('✅ 電影資訊已儲存');

  // 2. 儲存 subtitle
  await tursoDB.execute({
    sql: 'INSERT INTO subtitles (id, movie_id, language, srt_content, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
    args: [subtitleId, movieId, 'en', 'Test SRT content']
  });
  console.log('✅ 字幕資訊已儲存');

  // 3. 儲存對話
  console.log('');
  console.log('💬 儲存重要對話...');
  let dialoguesSaved = 0;
  for (const dialogue of testDialogues) {
    try {
      const dialogueId = `dialogue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await tursoDB.execute({
        sql: 'INSERT INTO important_dialogues (id, subtitle_id, content, time_start, time_end, translation_zh, explanation, difficulty_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))',
        args: [
          dialogueId,
          subtitleId,
          dialogue.content,
          dialogue.time_start,
          dialogue.time_end,
          dialogue.translation_zh,
          dialogue.explanation,
          dialogue.difficulty_level
        ]
      });
      dialoguesSaved++;
      console.log(`✅ 對話 ${dialoguesSaved}/${testDialogues.length} 已儲存`);
    } catch (error) {
      console.log(`❌ 儲存對話失敗: ${error.message}`);
    }
  }
  console.log(`✨ 成功儲存 ${dialoguesSaved} 段對話`);

  // 4. 儲存生字
  console.log('');
  console.log('📚 儲存生字筆記...');
  let vocabSaved = 0;
  for (const vocab of testVocabulary) {
    try {
      const vocabId = `vocab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await tursoDB.execute({
        sql: 'INSERT INTO vocabulary_notes (id, word, part_of_speech, definition_zh, level, original_sentence, example_sentences, movie_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))',
        args: [
          vocabId,
          vocab.word,
          vocab.part_of_speech,
          vocab.definition_zh,
          vocab.level,
          vocab.original_sentence,
          JSON.stringify(vocab.example_sentences),
          movieId
        ]
      });
      vocabSaved++;
      console.log(`✅ 生字 ${vocabSaved}/${testVocabulary.length} 已儲存: ${vocab.word}`);
    } catch (error) {
      console.log(`❌ 儲存生字失敗: ${error.message}`);
    }
  }
  console.log(`✨ 成功儲存 ${vocabSaved} 個生字`);
}

async function verifyData() {
  console.log('');
  console.log('🔍 驗證資料...');

  const result = await tursoDB.execute({
    sql: 'SELECT COUNT(*) as count FROM important_dialogues WHERE subtitle_id LIKE ?',
    args: ['%tt14364480%']
  });

  console.log(`✅ 找到 ${result.rows[0].count} 段對話`);
}

async function main() {
  try {
    await saveTestData();
    await verifyData();

    console.log('');
    console.log('✨ 測試資料已成功儲存！');
    console.log('');
    console.log('📝 已完成：');
    console.log('✅ 5 段重要對話（英文 + 繁體中文翻譯）');
    console.log('✅ 5 個生字筆記（含定義和例句）');
    console.log('✅ 電影資訊和字幕資訊');
    console.log('');
    console.log('🌐 下一步：');
    console.log('1. 重新載入前端頁面');
    console.log('2. 點擊 "Wake Up Dead Man: A Knives Out Mystery"');
    console.log('3. 查看對話和生字筆記');

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
  }
}

main();
