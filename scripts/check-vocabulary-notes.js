import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env' });

const db = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function checkVocabularyNotes() {
  try {
    console.log('🔍 檢查 vocabulary_notes 資料表...\n');

    // 檢查結構
    const schema = await db.execute("PRAGMA table_info(vocabulary_notes)");
    console.log('📋 vocabulary_notes 資料表欄位:');
    schema.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });
    console.log();

    // 檢查所有生字筆記
    const allVocab = await db.execute('SELECT * FROM vocabulary_notes');
    console.log(`📚 生字筆記總數: ${allVocab.rows.length}\n`);

    if (allVocab.rows.length > 0) {
      console.log('📝 所有生字筆記:');
      allVocab.rows.forEach((vocab, index) => {
        console.log(`\n${index + 1}. ${vocab.word || 'Unknown Word'}`);
        console.log(`   字彙: ${vocab.word}`);
        console.log(`   詞性: ${vocab.part_of_speech || 'N/A'}`);
        console.log(`   定義: ${vocab.definition_zh || 'N/A'}`);
        console.log(`   難度: ${vocab.difficulty_level || 'N/A'}`);
      });
    } else {
      console.log('⚠️ 資料庫中沒有任何生字筆記資料');
    }

  } catch (error) {
    console.error('❌ 查詢失敗:', error);
  }
}

checkVocabularyNotes().then(() => {
  console.log('\n✨ 檢查完成');
  process.exit(0);
});
