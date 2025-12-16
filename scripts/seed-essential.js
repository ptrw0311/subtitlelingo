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

console.log('🌱 新增核心測試資料...');

async function seedEssentialData() {
  try {
    // 新增影片資料
    console.log('📽️ 新增影片資料...');

    const testMovies = [
      {
        id: 'movie_1',
        imdb_id: 'tt0111161',
        title: 'The Shawshank Redemption',
        year: 1994,
        type: 'Drama',
        poster_url: 'https://example.com/shawshank.jpg',
        download_count: 2500000,
        overview: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.'
      },
      {
        id: 'movie_2',
        imdb_id: 'tt0068646',
        title: 'The Godfather',
        year: 1972,
        type: 'Crime, Drama',
        poster_url: 'https://example.com/godfather.jpg',
        download_count: 2200000,
        overview: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.'
      },
      {
        id: 'movie_3',
        imdb_id: 'tt0468569',
        title: 'The Dark Knight',
        year: 2008,
        type: 'Action, Crime, Drama',
        poster_url: 'https://example.com/darkknight.jpg',
        download_count: 2800000,
        overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.'
      },
      {
        id: 'movie_4',
        imdb_id: 'tt0137523',
        title: 'Fight Club',
        year: 1999,
        type: 'Drama',
        poster_url: 'https://example.com/fightclub.jpg',
        download_count: 1800000,
        overview: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.'
      },
      {
        id: 'movie_5',
        imdb_id: 'tt0050083',
        title: '12 Angry Men',
        year: 1957,
        type: 'Drama',
        poster_url: 'https://example.com/12angrymen.jpg',
        download_count: 900000,
        overview: 'A jury holdout attempts to prevent a miscarriage of justice by forcing his colleagues to reconsider the evidence.'
      }
    ];

    for (const movie of testMovies) {
      await db.execute(`
        INSERT OR REPLACE INTO movies (
          id, imdb_id, title, year, type, poster_url,
          download_count, overview, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        movie.id, movie.imdb_id, movie.title, movie.year,
        movie.type, movie.poster_url, movie.download_count,
        movie.overview, new Date().toISOString(), new Date().toISOString()
      ]);
      console.log(`✅ 已新增影片: ${movie.title}`);
    }

    // 新增學習記錄資料
    console.log('\n📊 新增學習記錄資料...');

    const userId = 'demo_user';
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const studyMinutes = Math.floor(Math.random() * 60) + 20; // 20-80 分鐘
      const moviesStudied = Math.random() < 0.4 ? 1 : 0; // 40% 機率學習電影
      const wordsLearned = Math.floor(Math.random() * 15) + (moviesStudied > 0 ? 5 : 0);
      const exercisesCompleted = Math.floor(Math.random() * 10) + 3;
      const exercisesCorrect = Math.floor(exercisesCompleted * (0.65 + Math.random() * 0.25));

      await db.execute(`
        INSERT INTO user_learning_records (
          user_id, movie_id, study_date, study_minutes,
          movies_studied, words_learned, exercises_completed,
          exercises_correct, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        moviesStudied > 0 ? testMovies[Math.floor(Math.random() * testMovies.length)].imdb_id : null,
        dateString,
        studyMinutes,
        moviesStudied,
        wordsLearned,
        exercisesCompleted,
        exercisesCorrect,
        new Date().toISOString()
      ]);
      console.log(`✅ 已新增學習記錄: ${dateString} (${studyMinutes}分鐘, ${exercisesCompleted}題)`);
    }

    console.log('\n🎉 核心測試資料新增完成！');

    // 顯示最終統計
    console.log('\n📈 最終資料庫統計:');
    const stats = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM movies) as movie_count,
        (SELECT COUNT(*) FROM practice_exercises) as exercise_count,
        (SELECT COUNT(*) FROM vocabulary_notes) as vocab_count,
        (SELECT COUNT(*) FROM user_learning_records) as learning_count
    `);

    const statsRow = stats.rows[0];
    console.log(`🎬 影片數量: ${statsRow.movie_count}`);
    console.log(`📝 練習題數量: ${statsRow.exercise_count}`);
    console.log(`📚 生字數量: ${statsRow.vocab_count}`);
    console.log(`📊 學習記錄數量: ${statsRow.learning_count}`);

    // 顯示一些範例資料
    console.log('\n📋 範例資料:');

    const sampleMovies = await db.execute(`SELECT title, year, type FROM movies LIMIT 3`);
    console.log('範例影片:');
    sampleMovies.rows.forEach(movie => {
      console.log(`  - ${movie.title} (${movie.year}) - ${movie.type}`);
    });

    // 顯示學習記錄
    const recentLearning = await db.execute(`
      SELECT study_date, study_minutes, words_learned, exercises_completed
      FROM user_learning_records
      ORDER BY study_date DESC
      LIMIT 5
    `);
    console.log('\n最近學習記錄:');
    recentLearning.rows.forEach(record => {
      console.log(`  - ${record.study_date}: ${record.study_minutes}分鐘, ${record.words_learned}字, ${record.exercises_completed}題`);
    });

    console.log('\n🚀 現在可以測試應用程式了！');
    console.log('💡 提示:');
    console.log('  - HomePage 會顯示影片列表');
    console.log('  - StatsPage 會顯示學習統計');
    console.log('  - PracticePage 沒有練習題時會顯示備用資料');

  } catch (error) {
    console.error('❌ 新增測試資料失敗:', error);
  }
}

seedEssentialData().then(() => {
  console.log('\n✨ 核心種子資料腳本執行完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 核心種子資料腳本執行失敗:', error);
  process.exit(1);
});