import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env' });

const db = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function checkAllTables() {
  try {
    console.log('🔍 檢查所有資料表...\n');

    const result = await db.execute(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      ORDER BY name
    `);

    console.log('📋 所有資料表:');
    result.rows.forEach(row => {
      console.log(`  - ${row.name}`);
    });
    console.log();

    // 檢查 subtitles 表的結構和內容
    const subtitlesSchema = await db.execute("PRAGMA table_info(subtitles)");
    console.log('📋 subtitles 資料表欄位:');
    subtitlesSchema.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });
    console.log();

    // 檢查 Inception 的字幕內容樣本
    const sampleSubtitles = await db.execute(`
      SELECT srt_content FROM subtitles
      WHERE movie_id = '804bee4b-d3e6-4958-a8ed-c88339b3525d'
      LIMIT 1
    `);

    if (sampleSubtitles.rows.length > 0) {
      const content = sampleSubtitles.rows[0].srt_content;
      console.log('📝 Inception 字幕樣本（前 2000 字元）:');
      console.log(content.substring(0, 2000));
      console.log('...\n');
    }

  } catch (error) {
    console.error('❌ 查詢失敗:', error);
  }
}

checkAllTables().then(() => {
  console.log('\n✨ 檢查完成');
  process.exit(0);
});
