import { createClient } from '@libsql/client';
import { config } from 'dotenv';

// 載入環境變數
config({ path: '.env' });

// 讀取 Turso 設定
const tursoUrl = process.env.VITE_TURSO_URL;
const tursoAuthToken = process.env.VITE_TURSO_AUTH_TOKEN;

console.log('🔧 環境變數檢查:');
console.log('TURSO_URL:', tursoUrl ? '✅ 已設定' : '❌ 未設定');
console.log('TURSO_TOKEN:', tursoAuthToken ? '✅ 已設定' : '❌ 未設定');

if (!tursoUrl || !tursoAuthToken) {
  console.error('❌ 找不到 Turso 環境變數');
  process.exit(1);
}

// 建立 Turso 客戶端
const db = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

console.log('🔗 正在連接到 Turso 資料庫...');

async function testDatabase() {
  try {
    // 測試連線
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Turso 連線成功！');

    // 檢查現有資料
    console.log('\n📊 檢查現有資料...');

    const movieCount = await db.execute('SELECT COUNT(*) as count FROM movies');
    console.log(`🎬 影片數量: ${movieCount.rows[0].count}`);

    const exerciseCount = await db.execute('SELECT COUNT(*) as count FROM practice_exercises');
    console.log(`📝 練習題數量: ${exerciseCount.rows[0].count}`);

    const vocabCount = await db.execute('SELECT COUNT(*) as count FROM vocabulary_notes');
    console.log(`📚 生字數量: ${vocabCount.rows[0].count}`);

    const learningCount = await db.execute('SELECT COUNT(*) as count FROM user_learning_records');
    console.log(`📊 學習記錄數量: ${learningCount.rows[0].count}`);

    // 新增測試資料
    console.log('\n🌱 開始新增測試資料...');

    // 新增一部測試影片
    await db.execute(`
      INSERT OR REPLACE INTO movies (
        imdb_id, title, year, genre, director, rating,
        download_count, poster_url, description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'tt0111161',
      'The Shawshank Redemption',
      1994,
      'Drama',
      'Frank Darabont',
      9.3,
      2500000,
      'https://example.com/shawshank.jpg',
      'Two imprisoned men bond over a number of years.',
      new Date().toISOString()
    ]);
    console.log('✅ 已新增測試影片');

    // 新增測試練習題
    await db.execute(`
      INSERT OR REPLACE INTO practice_exercises (
        movie_id, question_text, correct_answer, options,
        explanation, difficulty_level, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'tt0111161',
      "Get busy living, or get busy _____.",
      "dying",
      JSON.stringify(["dying", "crying", "trying", "lying"]),
      "這句經典台詞強調要積極生活。",
      "intermediate",
      new Date().toISOString()
    ]);
    console.log('✅ 已新增測試練習題');

    // 新增測試生字
    await db.execute(`
      INSERT OR REPLACE INTO vocabulary_notes (
        movie_id, word, definition, pronunciation, example_sentence,
        difficulty_level, context, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'tt0111161',
      "redemption",
      "救贖，償還",
      "/rɪˈdempʃn/",
      "The story is about redemption and hope.",
      "advanced",
      "影片主題關於救贖",
      new Date().toISOString()
    ]);
    console.log('✅ 已新增測試生字');

    // 新增測試學習記錄
    await db.execute(`
      INSERT OR REPLACE INTO user_learning_records (
        user_id, movie_id, study_date, study_minutes,
        movies_studied, words_learned, exercises_completed,
        exercises_correct, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'demo_user',
      'tt0111161',
      '2025-12-16',
      45,
      1,
      8,
      10,
      8,
      new Date().toISOString()
    ]);
    console.log('✅ 已新增測試學習記錄');

    console.log('\n🎉 測試資料新增完成！');

    // 再次檢查資料
    console.log('\n📈 新的資料庫統計:');

    const newMovieCount = await db.execute('SELECT COUNT(*) as count FROM movies');
    console.log(`🎬 影片數量: ${newMovieCount.rows[0].count}`);

    const newExerciseCount = await db.execute('SELECT COUNT(*) as count FROM practice_exercises');
    console.log(`📝 練習題數量: ${newExerciseCount.rows[0].count}`);

    const newVocabCount = await db.execute('SELECT COUNT(*) as count FROM vocabulary_notes');
    console.log(`📚 生字數量: ${newVocabCount.rows[0].count}`);

    const newLearningCount = await db.execute('SELECT COUNT(*) as count FROM user_learning_records');
    console.log(`📊 學習記錄數量: ${newLearningCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ 資料庫操作失敗:', error);
  }
}

testDatabase().then(() => {
  console.log('\n✨ 腳本執行完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 腳本執行失敗:', error);
  process.exit(1);
});