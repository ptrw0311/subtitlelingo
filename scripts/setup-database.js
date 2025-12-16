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

async function setupDatabase() {
  try {
    // 測試連線
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Turso 連線成功！');

    // 檢查現有表格
    console.log('\n📋 檢查現有表格...');
    const tablesResult = await db.execute(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      ORDER BY name
    `);

    const existingTables = tablesResult.rows.map(row => row.name);
    console.log('現有表格:', existingTables.length > 0 ? existingTables : '無');

    // 建立必要的表格
    console.log('\n🏗️ 建立資料庫表格...');

    // 建立影片表格
    await db.execute(`
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imdb_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        year INTEGER,
        genre TEXT,
        director TEXT,
        rating REAL,
        download_count INTEGER DEFAULT 0,
        poster_url TEXT,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    console.log('✅ movies 表格已建立');

    // 建立練習題表格
    await db.execute(`
      CREATE TABLE IF NOT EXISTS practice_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id TEXT NOT NULL,
        question_text TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        options TEXT NOT NULL,
        explanation TEXT,
        difficulty_level TEXT DEFAULT 'intermediate',
        created_at TEXT NOT NULL,
        FOREIGN KEY (movie_id) REFERENCES movies (imdb_id)
      )
    `);
    console.log('✅ practice_exercises 表格已建立');

    // 建立生字筆記表格
    await db.execute(`
      CREATE TABLE IF NOT EXISTS vocabulary_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id TEXT NOT NULL,
        word TEXT NOT NULL,
        definition TEXT,
        pronunciation TEXT,
        example_sentence TEXT,
        difficulty_level TEXT DEFAULT 'intermediate',
        context TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (movie_id) REFERENCES movies (imdb_id)
      )
    `);
    console.log('✅ vocabulary_notes 表格已建立');

    // 建立用戶學習記錄表格
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_learning_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        movie_id TEXT,
        study_date TEXT NOT NULL,
        study_minutes INTEGER DEFAULT 0,
        movies_studied INTEGER DEFAULT 0,
        words_learned INTEGER DEFAULT 0,
        exercises_completed INTEGER DEFAULT 0,
        exercises_correct INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (movie_id) REFERENCES movies (imdb_id)
      )
    `);
    console.log('✅ user_learning_records 表格已建立');

    // 建立用戶練習記錄表格
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_exercise_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        exercise_id INTEGER NOT NULL,
        selected_answer TEXT,
        is_correct BOOLEAN DEFAULT FALSE,
        attempted_at TEXT NOT NULL,
        FOREIGN KEY (exercise_id) REFERENCES practice_exercises (id)
      )
    `);
    console.log('✅ user_exercise_attempts 表格已建立');

    // 建立字幕表格
    await db.execute(`
      CREATE TABLE IF NOT EXISTS subtitles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id TEXT NOT NULL,
        sequence_number INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (movie_id) REFERENCES movies (imdb_id),
        UNIQUE(movie_id, sequence_number)
      )
    `);
    console.log('✅ subtitles 表格已建立');

    console.log('\n🎉 所有表格建立完成！');

    // 新增測試資料
    console.log('\n🌱 新增測試資料...');

    // 測試影片資料
    const testMovies = [
      {
        imdb_id: 'tt0111161',
        title: 'The Shawshank Redemption',
        year: 1994,
        genre: 'Drama',
        director: 'Frank Darabont',
        rating: 9.3,
        download_count: 2500000,
        poster_url: 'https://example.com/shawshank.jpg',
        description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.'
      },
      {
        imdb_id: 'tt0068646',
        title: 'The Godfather',
        year: 1972,
        genre: 'Crime, Drama',
        director: 'Francis Ford Coppola',
        rating: 9.2,
        download_count: 2200000,
        poster_url: 'https://example.com/godfather.jpg',
        description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.'
      },
      {
        imdb_id: 'tt0468569',
        title: 'The Dark Knight',
        year: 2008,
        genre: 'Action, Crime, Drama',
        director: 'Christopher Nolan',
        rating: 9.0,
        download_count: 2800000,
        poster_url: 'https://example.com/darkknight.jpg',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.'
      }
    ];

    for (const movie of testMovies) {
      await db.execute(`
        INSERT OR REPLACE INTO movies (
          imdb_id, title, year, genre, director, rating,
          download_count, poster_url, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        movie.imdb_id, movie.title, movie.year, movie.genre,
        movie.director, movie.rating, movie.download_count,
        movie.poster_url, movie.description,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
      console.log(`✅ 已新增影片: ${movie.title}`);
    }

    // 測試練習題資料
    const testExercises = [
      {
        movie_id: 'tt0111161',
        question_text: "Get busy living, or get busy _____.",
        correct_answer: "dying",
        options: JSON.stringify(["dying", "crying", "trying", "lying"]),
        explanation: "這句經典台詞強調要積極生活，不要消極等待。",
        difficulty_level: "intermediate"
      },
      {
        movie_id: 'tt0068646',
        question_text: "I'm gonna make him an offer he can't _____.",
        correct_answer: "refuse",
        options: JSON.stringify(["refuse", "accept", "ignore", "understand"]),
        explanation: "這句經典台詞的意思是「我要給他一個無法拒絕的提議」。",
        difficulty_level: "intermediate"
      },
      {
        movie_id: 'tt0468569',
        question_text: "Why so _____.",
        correct_answer: "serious",
        options: JSON.stringify(["serious", "happy", "sad", "angry"]),
        explanation: "Joker 的經典台詞，展現了他瘋狂的性格。",
        difficulty_level: "beginner"
      }
    ];

    for (const exercise of testExercises) {
      await db.execute(`
        INSERT OR REPLACE INTO practice_exercises (
          movie_id, question_text, correct_answer, options,
          explanation, difficulty_level, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        exercise.movie_id, exercise.question_text, exercise.correct_answer,
        exercise.options, exercise.explanation, exercise.difficulty_level,
        new Date().toISOString()
      ]);
      console.log(`✅ 已新增練習題: ${exercise.question_text.substring(0, 30)}...`);
    }

    // 測試生字資料
    const testVocabulary = [
      {
        movie_id: 'tt0111161',
        word: "redemption",
        definition: "救贖，償還",
        pronunciation: "/rɪˈdempʃn/",
        example_sentence: "The story is about redemption and hope.",
        difficulty_level: "advanced",
        context: "影片主題關於救贖"
      },
      {
        movie_id: 'tt0068646',
        word: "godfather",
        definition: "教父，黑幫首領",
        pronunciation: "/ˈɡɒdfɑːðər/",
        example_sentence: "Don Corleone was the godfather of the family.",
        difficulty_level: "intermediate",
        context: "電影標題和核心角色"
      },
      {
        movie_id: 'tt0468569',
        word: "chaos",
        definition: "混亂，無秩序",
        pronunciation: "/ˈkeɪɒs/",
        example_sentence: "The Joker wants to create chaos in Gotham.",
        difficulty_level: "intermediate",
        context: "Joker 的目標是製造混亂"
      }
    ];

    for (const vocab of testVocabulary) {
      await db.execute(`
        INSERT OR REPLACE INTO vocabulary_notes (
          movie_id, word, definition, pronunciation, example_sentence,
          difficulty_level, context, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        vocab.movie_id, vocab.word, vocab.definition, vocab.pronunciation,
        vocab.example_sentence, vocab.difficulty_level, vocab.context,
        new Date().toISOString()
      ]);
      console.log(`✅ 已新增生字: ${vocab.word}`);
    }

    // 生成過去 7 天的測試學習記錄
    console.log('\n📊 新增學習記錄...');
    const userId = 'demo_user';
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const studyMinutes = Math.floor(Math.random() * 60) + 20; // 20-80 分鐘
      const moviesStudied = Math.random() < 0.5 ? 1 : 0; // 50% 機率學習電影
      const wordsLearned = Math.floor(Math.random() * 15) + (moviesStudied > 0 ? 5 : 0);
      const exercisesCompleted = Math.floor(Math.random() * 10) + 3;
      const exercisesCorrect = Math.floor(exercisesCompleted * (0.65 + Math.random() * 0.25));

      await db.execute(`
        INSERT OR REPLACE INTO user_learning_records (
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
      console.log(`✅ 已新增學習記錄: ${dateString}`);
    }

    console.log('\n🎉 資料庫設定完成！');

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

  } catch (error) {
    console.error('❌ 資料庫設定失敗:', error);
  }
}

setupDatabase().then(() => {
  console.log('\n✨ 資料庫設定腳本執行完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 資料庫設定腳本執行失敗:', error);
  process.exit(1);
});