import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env' });

const db = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function checkSchema() {
  try {
    console.log('🔍 檢查 important_dialogues 資料表結構...\n');

    const result = await db.execute("PRAGMA table_info(important_dialogues)");
    console.log('📋 important_dialogues 資料表欄位:');
    result.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });

    console.log('\n檢查是否有 translation_zh 欄位...');
    const hasTranslation = result.rows.some(row => row.name === 'translation_zh');
    console.log(hasTranslation ? '✅ 有 translation_zh 欄位' : '❌ 沒有 translation_zh 欄位');

  } catch (error) {
    console.error('❌ 查詢失敗:', error);
  }
}

checkSchema().then(() => {
  console.log('\n✨ 檢查完成');
  process.exit(0);
});
