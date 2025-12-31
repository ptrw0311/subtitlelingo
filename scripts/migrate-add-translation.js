import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env' });

const db = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function migrate() {
  try {
    console.log('🔄 開始資料庫遷移...\n');

    // 1. 添加 translation_zh 欄位到 important_dialogues
    console.log('📝 添加 translation_zh 欄位到 important_dialogues 表...');

    try {
      await db.execute(`
        ALTER TABLE important_dialogues
        ADD COLUMN translation_zh TEXT
      `);
      console.log('✅ translation_zh 欄位添加成功\n');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('⚠️ translation_zh 欄位已存在，跳過\n');
      } else {
        throw error;
      }
    }

    // 2. 驗證欄位是否添加成功
    console.log('🔍 驗證欄位...');
    const result = await db.execute("PRAGMA table_info(important_dialogues)");
    const hasTranslation = result.rows.some(row => row.name === 'translation_zh');

    if (hasTranslation) {
      console.log('✅ translation_zh 欄位驗證成功\n');
    } else {
      console.log('❌ translation_zh 欄位驗證失敗\n');
      return;
    }

    // 3. 檢查現有資料並顯示統計
    console.log('📊 檢查現有資料...');
    const dialoguesResult = await db.execute('SELECT COUNT(*) as count FROM important_dialogues');
    const count = dialoguesResult.rows[0].count;
    console.log(`目前資料庫中有 ${count} 段重要對話\n`);

    if (count > 0) {
      console.log('⚠️ 注意：現有的重要對話沒有翻譯，需要重新執行 GLM 分析來生成翻譯\n');
    }

    console.log('✨ 遷移完成！\n');
    console.log('下一步：');
    console.log('1. 執行 node scripts/test-glm-subtitle-analysis.js 來生成帶翻譯的重要對話');
    console.log('2. 或者運行 n8n workflow 來自動處理\n');

  } catch (error) {
    console.error('❌ 遷移失敗:', error.message);
    process.exit(1);
  }
}

migrate().then(() => {
  process.exit(0);
});
