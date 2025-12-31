import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env' });

const db = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function checkDialogues() {
  try {
    console.log('🔍 檢查 important_dialogues 資料表...\n');

    // 檢查結構
    const schema = await db.execute("PRAGMA table_info(important_dialogues)");
    console.log('📋 important_dialogues 資料表欄位:');
    schema.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });
    console.log();

    // 檢查所有重要對話
    const allDialogues = await db.execute('SELECT * FROM important_dialogues');
    console.log(`💬 重要對話總數: ${allDialogues.rows.length}\n`);

    if (allDialogues.rows.length > 0) {
      console.log('📝 所有重要對話:');
      allDialogues.rows.forEach((dialogue, index) => {
        console.log(`\n${index + 1}. ${dialogue.movie_title || 'Unknown Movie'}`);
        console.log(`   時間: ${dialogue.time_start} - ${dialogue.time_end}`);
        console.log(`   內容: "${dialogue.content}"`);
        if (dialogue.explanation) {
          console.log(`   說明: ${dialogue.explanation}`);
        }
      });
    } else {
      console.log('⚠️ 資料庫中沒有任何重要對話資料');
    }

    console.log();

    // 檢查 Inception 的對話
    const inceptionDialogues = await db.execute(`
      SELECT * FROM important_dialogues
      WHERE movie_id = '804bee4b-d3e6-4958-a8ed-c88339b3525d'
    `);
    console.log(`🎬 Inception 的重要對話數量: ${inceptionDialogues.rows.length}\n`);

    if (inceptionDialogues.rows.length > 0) {
      console.log('📝 Inception 重要對話:');
      inceptionDialogues.rows.forEach((dialogue, index) => {
        console.log(`\n${index + 1}. 時間: ${dialogue.time_start} - ${dialogue.time_end}`);
        console.log(`   內容: "${dialogue.content}"`);
        if (dialogue.explanation) {
          console.log(`   說明: ${dialogue.explanation}`);
        }
      });
    } else {
      console.log('⚠️ Inception 沒有重要對話資料');
    }

  } catch (error) {
    console.error('❌ 查詢失敗:', error);
  }
}

checkDialogues().then(() => {
  console.log('\n✨ 檢查完成');
  process.exit(0);
});
