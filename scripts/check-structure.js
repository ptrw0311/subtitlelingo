import { createClient } from '@libsql/client';
import { config } from 'dotenv';

// 載入環境變數
config({ path: '.env' });

// 讀取 Turso 設定
const tursoUrl = process.env.VITE_TURSO_URL;
const tursoAuthToken = process.env.VITE_TURSO_AUTH_TOKEN;

// 建立 Turso 客戶端
const db = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

console.log('🔍 檢查現有資料庫結構...');

async function checkDatabaseStructure() {
  try {
    // 檢查表格結構
    const tables = ['movies', 'practice_exercises', 'vocabulary_notes', 'user_learning_records'];

    for (const tableName of tables) {
      console.log(`\n📋 表格: ${tableName}`);

      try {
        const schemaResult = await db.execute(`PRAGMA table_info(${tableName})`);
        const columns = schemaResult.rows;

        console.log('欄位結構:');
        columns.forEach(col => {
          console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
        });

        // 檢查資料數量
        const countResult = await db.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`資料筆數: ${countResult.rows[0].count}`);

      } catch (error) {
        console.log(`❌ 無法檢查表格 ${tableName}: ${error.message}`);
      }
    }

    // 嘗試新增簡單的測試資料
    console.log('\n🌱 嘗試新增基本測試資料...');

    // 檢查 movies 表格的實際結構
    console.log('\n🔍 檢查 movies 表格詳細結構...');
    const movieSchema = await db.execute(`PRAGMA table_info(movies)`);
    console.log('movies 表格欄位:');
    movieSchema.rows.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} (pk: ${col.pk}, notnull: ${col.notnull})`);
    });

    // 根據實際結構新增資料
    try {
      // 先檢查是否有資料
      const existingMovies = await db.execute(`SELECT COUNT(*) as count FROM movies`);
      console.log(`\n現有影片數量: ${existingMovies.rows[0].count}`);

      if (existingMovies.rows[0].count === 0) {
        // 根據實際欄位新增資料
        await db.execute(`
          INSERT INTO movies (imdb_id, title, year, rating)
          VALUES ('tt0111161', 'The Shawshank Redemption', 1994, 9.3)
        `);
        console.log('✅ 已新增測試影片');

        await db.execute(`
          INSERT INTO movies (imdb_id, title, year, rating)
          VALUES ('tt0068646', 'The Godfather', 1972, 9.2)
        `);
        console.log('✅ 已新增測試影片');
      }

    } catch (error) {
      console.log('❌ 新增影片失敗:', error.message);
    }

    // 檢查 practice_exercises 表格
    console.log('\n🔍 檢查 practice_exercises 表格詳細結構...');
    try {
      const exerciseSchema = await db.execute(`PRAGMA table_info(practice_exercises)`);
      console.log('practice_exercises 表格欄位:');
      exerciseSchema.rows.forEach(col => {
        console.log(`  - ${col.name}: ${col.type} (pk: ${col.pk}, notnull: ${col.notnull})`);
      });

      const existingExercises = await db.execute(`SELECT COUNT(*) as count FROM practice_exercises`);
      console.log(`現有練習題數量: ${existingExercises.rows[0].count}`);

      if (existingExercises.rows[0].count === 0) {
        // 嘗試新增練習題
        await db.execute(`
          INSERT INTO practice_exercises (movie_id, question_text, correct_answer)
          VALUES ('tt0111161', 'Get busy living, or get busy _____.', 'dying')
        `);
        console.log('✅ 已新增測試練習題');
      }

    } catch (error) {
      console.log('❌ 檢查練習題表格失敗:', error.message);
    }

    // 顯示最終統計
    console.log('\n📈 最終資料庫統計:');
    const finalStats = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM movies) as movie_count,
        (SELECT COUNT(*) FROM practice_exercises) as exercise_count
    `);

    const finalRow = finalStats.rows[0];
    console.log(`🎬 影片數量: ${finalRow.movie_count}`);
    console.log(`📝 練習題數量: ${finalRow.exercise_count}`);

  } catch (error) {
    console.error('❌ 檢查資料庫結構失敗:', error);
  }
}

checkDatabaseStructure().then(() => {
  console.log('\n✨ 資料庫結構檢查完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 檢查失敗:', error);
  process.exit(1);
});