import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env' });

const tursoDB = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

/**
 * 模擬 GLM 分析結果（用於測試）
 */
function mockGLMAnalysis() {
  return {
    important_dialogues: [
      {
        content: "What is the most resilient parasite? A bacteria? A virus? An intestinal worm?",
        time_start: "00:02:46,741",
        time_end: "00:02:55,076",
        translation_zh: "最強韌的寄生蟲是什麼？細菌？病毒？還是腸道寄生蟲？",
        explanation: "這段對話引出了電影的核心概念——想法是最強韌的寄生蟲。使用寄生蟲的比喻來說明想法一旦植入就很難消除。",
        difficulty_level: "advanced"
      },
      {
        content: "An idea. Resilient. Highly contagious. Once an idea has taken hold of the brain, it's almost impossible to eradicate.",
        time_start: "00:02:55,077",
        time_end: "00:03:07,784",
        translation_zh: "一個點子。強韌且高度傳染。一旦一個點子在腦中生根，就幾乎不可能根除。",
        explanation: "這段話定義了電影中「點子」的特性：強韌、傳染性強、難以根除。這是 Inception 植入想法概念的核心理論基礎。",
        difficulty_level: "advanced"
      },
      {
        content: "You mustn't be afraid to dream a little bigger, darling.",
        time_start: "00:12:34,567",
        time_end: "00:12:38,890",
        translation_zh: "親愛的，你不該害怕夢想得更宏大一點。",
        explanation: "這是 Eames 對 Arthur 說的台詞，展現了角色間的默契和幽默感。同時也暗示了夢境設計需要更大膽的想像力。",
        difficulty_level: "intermediate"
      },
      {
        content: "The dream is collapsing!",
        time_start: "00:45:23,456",
        time_end: "00:45:26,789",
        translation_zh: "夢境正在崩塌！",
        explanation: "這是電影中的經典台詞，當夢境不穩定或受到威脅時會崩塌。這個概念贯穿整部電影。",
        difficulty_level: "beginner"
      },
      {
        content: "I can't stay with her anymore because she doesn't exist.",
        time_start: "01:23:45,678",
        time_end: "01:23:50,123",
        translation_zh: "我不能再和她在一起了，因為她不存在。",
        explanation: "這是 Cobb 對已故妻子 Mal 的痛心告白。Mal 在夢境中以投射（projection）的形式存在，並非真實的人。這句話展現了 Cobb 的內心糾結和痛苦。",
        difficulty_level: "intermediate"
      }
    ],
    vocabulary_notes: [
      {
        word: "subconscious",
        part_of_speech: "noun (名詞)",
        definition_zh: "潛意識；指潛藏在意識之下的心理活動",
        level: "advanced",
        original_sentence: "That's my subconscious trying to keep the dream intact.",
        example_sentences: [
          "Your subconscious can affect your decisions without you realizing it.",
          "Dreams are a way to access the subconscious mind.",
          "He tapped into his subconscious to find creative inspiration."
        ]
      },
      {
        word: "parasite",
        part_of_speech: "noun (名詞)",
        definition_zh: "寄生蟲；比喻依賴他人生存的事物",
        level: "intermediate",
        original_sentence: "What is the most resilient parasite? An idea.",
        example_sentences: [
          "The parasite lives inside the host's body.",
          "Some plants are parasites that feed on other plants.",
          "Negative thoughts can be like parasites that destroy your confidence."
        ]
      },
      {
        word: "resilient",
        part_of_speech: "adjective (形容詞)",
        definition_zh: "有彈性的；能快速恢復的",
        level: "advanced",
        original_sentence: "An idea is resilient, highly contagious.",
        example_sentences: [
          "Children are often more resilient than adults.",
          "The resilient material can withstand extreme temperatures.",
          "She showed a resilient spirit after the setback."
        ]
      },
      {
        word: "eradicate",
        part_of_speech: "verb (動詞)",
        definition_zh: "根除；消滅",
        level: "advanced",
        original_sentence: "Once an idea has taken hold, it's almost impossible to eradicate.",
        example_sentences: [
          "We must eradicate poverty from our society.",
          "The disease was completely eradicated.",
          "It's difficult to eradicate bad habits."
        ]
      },
      {
        word: "collapse",
        part_of_speech: "verb (動詞)",
        definition_zh: "崩塌；倒塌",
        level: "beginner",
        original_sentence: "The dream is collapsing!",
        example_sentences: [
          "The building collapsed during the earthquake.",
          "Her plans collapsed when funding was cut.",
          "After working all day, he collapsed on the sofa."
        ]
      }
    ]
  };
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
          INSERT INTO important_dialogues (id, subtitle_id, content, time_start, time_end, translation_zh, explanation, difficulty_level, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `,
        args: [
          id,
          subtitleId,
          dialogue.content,
          dialogue.time_start,
          dialogue.time_end,
          dialogue.translation_zh || '',
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
    console.log('🎬 開始測試模擬 GLM 分析功能（測試模式）\n');
    console.log('=' .repeat(60));
    console.log('⚠️  注意：這是測試模式，使用模擬數據\n');

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

    // 使用模擬數據
    console.log('🤖 使用模擬數據（不調用真實 API）...\n');
    const analysisResult = mockGLMAnalysis();

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

    // 儲存到資料庫
    console.log('=' .repeat(60));
    console.log('💾 開始儲存到資料庫...\n');

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
    console.log('📝 下一步：');
    console.log('1. 檢查資料庫中的數據');
    console.log('2. 啟動前端驗證顯示');
    console.log('   npm run dev\n');

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    process.exit(1);
  }
}

main().then(() => {
  process.exit(0);
});
