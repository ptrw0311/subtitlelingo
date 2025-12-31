import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env' });

const tursoUrl = process.env.VITE_TURSO_URL;
const tursoAuthToken = process.env.VITE_TURSO_AUTH_TOKEN;

const db = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

async function checkSchema() {
  try {
    console.log('🔍 檢查 subtitles 資料表結構...\n');

    const result = await db.execute("PRAGMA table_info(subtitles)");
    console.log('📋 subtitles 資料表欄位:');
    result.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})${row.notnull ? ' NOT NULL' : ''}${row.pk ? ' PRIMARY KEY' : ''}`);
    });
    console.log();

    // 查看實際的字幕資料
    const sampleResult = await db.execute('SELECT * FROM subtitles LIMIT 1');
    if (sampleResult.rows.length > 0) {
      console.log('📝 樣本字幕資料:');
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    } else {
      console.log('⚠️ 資料庫中沒有字幕資料');
    }

  } catch (error) {
    console.error('❌ 查詢失敗:', error);
  }
}

checkSchema().then(() => {
  console.log('\n✨ 檢查完成');
  process.exit(0);
});
