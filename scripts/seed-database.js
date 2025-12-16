import { createClient } from '@libsql/client';
import { config } from 'dotenv';

// 載入環境變數
config({ path: '.env' });

// 讀取 Turso 設定
const tursoUrl = process.env.VITE_TURSO_URL;
const tursoAuthToken = process.env.VITE_TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
  console.error('❌ 找不到 Turso 環境變數');
  console.log('請確保 .env 檔案包含 VITE_TURSO_URL 和 VITE_TURSO_AUTH_TOKEN');
  process.exit(1);
}

// 建立 Turso 客戶端
const db = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

console.log('🔗 已連接到 Turso 資料庫');

// 測試影片資料
const movies = [
  {
    imdb_id: 'tt0111161',
    title: 'The Shawshank Redemption',
    year: 1994,
    genre: 'Drama',
    director: 'Frank Darabont',
    rating: 9.3,
    download_count: 2500000,
    poster_url: 'https://example.com/shawshank.jpg',
    description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
    created_at: new Date().toISOString()
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
    description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
    created_at: new Date().toISOString()
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
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
    created_at: new Date().toISOString()
  },
  {
    imdb_id: 'tt0137523',
    title: 'Fight Club',
    year: 1999,
    genre: 'Drama',
    director: 'David Fincher',
    rating: 8.8,
    download_count: 1800000,
    poster_url: 'https://example.com/fightclub.jpg',
    description: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.',
    created_at: new Date().toISOString()
  },
  {
    imdb_id: 'tt0050083',
    title: '12 Angry Men',
    year: 1957,
    genre: 'Drama',
    director: 'Sidney Lumet',
    rating: 9.0,
    download_count: 900000,
    poster_url: 'https://example.com/12angrymen.jpg',
    description: 'A jury holdout attempts to prevent a miscarriage of justice by forcing his colleagues to reconsider the evidence.',
    created_at: new Date().toISOString()
  }
];

// 測試練習題資料
const exercises = [
  // The Shawshank Redemption exercises
  {
    movie_id: 'tt0111161',
    question_text: "Get busy living, or get busy _____.",
    correct_answer: "dying",
    options: JSON.stringify(["dying", "crying", "trying", "lying"]),
    explanation: "這句經典台詞強調要積極生活，不要消極等待。",
    difficulty_level: "intermediate",
    created_at: new Date().toISOString()
  },
  {
    movie_id: 'tt0111161',
    question_text: "Hope is a good thing, maybe the best of things, and no good thing ever _____.",
    correct_answer: "dies",
    options: JSON.stringify(["dies", "fails", "ends", "leaves"]),
    explanation: "這句話表達了希望永恆不滅的信念。",
    difficulty_level: "intermediate",
    created_at: new Date().toISOString()
  },
  {
    movie_id: 'tt0111161',
    question_text: "I guess I just miss my _____.",
    correct_answer: "friend",
    options: JSON.stringify(["friend", "wife", "home", "freedom"]),
    explanation: "Red 說出這句話時表達了他對 Andy 的深厚友誼。",
    difficulty_level: "beginner",
    created_at: new Date().toISOString()
  },

  // The Godfather exercises
  {
    movie_id: 'tt0068646',
    question_text: "I'm gonna make him an offer he can't _____.",
    correct_answer: "refuse",
    options: JSON.stringify(["refuse", "accept", "ignore", "understand"]),
    explanation: "這句經典台詞的意思是「我要給他一個無法拒絕的提議」。",
    difficulty_level: "intermediate",
    created_at: new Date().toISOString()
  },
  {
    movie_id: 'tt0068646',
    question_text: "Leave the gun. Take the _____.",
    correct_answer: "cannoli",
    options: JSON.stringify(["cannoli", "money", "car", "phone"]),
    explanation: "這句話展現了黑幫家族中人性的一面。",
    difficulty_level: "advanced",
    created_at: new Date().toISOString()
  },
  {
    movie_id: 'tt0068646',
    question_text: "It's not personal, Sonny. It's strictly _____.",
    correct_answer: "business",
    options: JSON.stringify(["business", "personal", "family", "important"]),
    explanation: "這句話表達了黑幫業務的冷酷無情。",
    difficulty_level: "intermediate",
    created_at: new Date().toISOString()
  },

  // The Dark Knight exercises
  {
    movie_id: 'tt0468569',
    question_text: "Why so _____.",
    correct_answer: "serious",
    options: JSON.stringify(["serious", "happy", "sad", "angry"]),
    explanation: "Joker 的經典台詞，展現了他瘋狂的性格。",
    difficulty_level: "beginner",
    created_at: new Date().toISOString()
  },
  {
    movie_id: 'tt0468569',
    question_text: "You either die a hero or you live long enough to see yourself become the _____.",
    correct_answer: "villain",
    options: JSON.stringify(["villain", "hero", "enemy", "legend"]),
    explanation: "這句話探討了英雄與反派的界線。",
    difficulty_level: "advanced",
    created_at: new Date().toISOString()
  },
  {
    movie_id: 'tt0468569',
    question_text: "The night is darkest just before the _____.",
    correct_answer: "dawn",
    options: JSON.stringify(["dawn", "day", "light", "end"]),
    explanation: "這句話表達了希望總是在最黑暗的時刻出現。",
    difficulty_level: "intermediate",
    created_at: new Date().toISOString()
  }
];

// 測試生字筆記資料
const vocabularyNotes = [
  {
    movie_id: 'tt0111161',
    word: "redemption",
    definition: "救贖，償還",
    pronunciation: "/rɪˈdempʃn/",
    example_sentence: "The story is about redemption and hope.",
    difficulty_level: "advanced",
    context: "影片主題關於救贖",
    created_at: new Date().toISOString()
  },
  {
    movie_id: 'tt0111161',
    word: "institutionalized",
    definition: "制度化的，習慣於機構生活的",
    pronunciation: "/ˌɪnstɪˈtjuːʃənaɪzd/",
    example_sentence: "After so many years in prison, he became institutionalized.",
    difficulty_level: "advanced",
    context: "描述長期監禁對人的影響",
    created_at: new Date().toISOString()
  },
  {
    movie_id: 'tt0068646',
    word: "godfather",
    definition: "教父，黑幫首領",
    pronunciation: "/ˈɡɒdfɑːðər/",
    example_sentence: "Don Corleone was the godfather of the family.",
    difficulty_level: "intermediate",
    context: "電影標題和核心角色",
    created_at: new Date().toISOString()
  },
  {
    movie_id: 'tt0468569',
    word: "chaos",
    definition: "混亂，無秩序",
    pronunciation: "/ˈkeɪɒs/",
    example_sentence: "The Joker wants to create chaos in Gotham.",
    difficulty_level: "intermediate",
    context: "Joker 的目標是製造混亂",
    created_at: new Date().toISOString()
  },
  {
    movie_id: 'tt0468569',
    word: "vigilante",
    definition: "義警，私刑者",
    pronunciation: "/ˌvɪdʒɪˈlænti/",
    example_sentence: "Batman is often described as a vigilante.",
    difficulty_level: "advanced",
    context: "描述 Batman 的角色性質",
    created_at: new Date().toISOString()
  }
];

// 測試學習記錄資料
const learningRecords = [];
const userId = 'demo_user';

// 生成過去 30 天的學習記錄
for (let i = 29; i >= 0; i--) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const dateString = date.toISOString().split('T')[0];

  // 隨機決定這天是否有學習（70% 機率）
  if (Math.random() < 0.7) {
    const studyMinutes = Math.floor(Math.random() * 90) + 15; // 15-105 分鐘
    const moviesStudied = Math.random() < 0.3 ? Math.floor(Math.random() * 2) + 1 : 0; // 30% 機率學習電影
    const wordsLearned = Math.floor(Math.random() * 25) + (moviesStudied > 0 ? 10 : 0); // 學習電影時會學更多生字
    const exercisesCompleted = Math.floor(Math.random() * 15) + 5;
    const exercisesCorrect = Math.floor(exercisesCompleted * (0.6 + Math.random() * 0.35)); // 60-95% 正確率

    learningRecords.push({
      user_id: userId,
      movie_id: moviesStudied > 0 ? movies[Math.floor(Math.random() * movies.length)].imdb_id : null,
      study_date: dateString,
      study_minutes: studyMinutes,
      movies_studied: moviesStudied,
      words_learned: wordsLearned,
      exercises_completed: exercisesCompleted,
      exercises_correct: exercisesCorrect,
      created_at: new Date().toISOString()
    });
  }
}

// 主要的種子資料函數
async function seedDatabase() {
  console.log('🌱 開始新增測試資料到 Turso 資料庫...');

  try {
    // 新增影片資料
    console.log('📽️ 新增影片資料...');
    for (const movie of movies) {
      try {
        await db.execute(`
          INSERT OR REPLACE INTO movies (
            imdb_id, title, year, genre, director, rating,
            download_count, poster_url, description, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          movie.imdb_id, movie.title, movie.year, movie.genre,
          movie.director, movie.rating, movie.download_count,
          movie.poster_url, movie.description, movie.created_at
        ]);
        console.log(`✅ 已新增影片: ${movie.title}`);
      } catch (error) {
        console.error(`❌ 新增影片失敗 ${movie.title}:`, error.message);
      }
    }

    // 新增練習題資料
    console.log('\n📝 新增練習題資料...');
    for (const exercise of exercises) {
      try {
        await db.execute(`
          INSERT OR REPLACE INTO practice_exercises (
            movie_id, question_text, correct_answer, options,
            explanation, difficulty_level, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          exercise.movie_id, exercise.question_text, exercise.correct_answer,
          exercise.options, exercise.explanation, exercise.difficulty_level,
          exercise.created_at
        ]);
        console.log(`✅ 已新增練習題: ${exercise.question_text.substring(0, 30)}...`);
      } catch (error) {
        console.error(`❌ 新增練習題失敗:`, error.message);
      }
    }

    // 新增生字筆記資料
    console.log('\n📚 新增生字筆記資料...');
    for (const vocab of vocabularyNotes) {
      try {
        await db.execute(`
          INSERT OR REPLACE INTO vocabulary_notes (
            movie_id, word, definition, pronunciation, example_sentence,
            difficulty_level, context, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          vocab.movie_id, vocab.word, vocab.definition, vocab.pronunciation,
          vocab.example_sentence, vocab.difficulty_level, vocab.context,
          vocab.created_at
        ]);
        console.log(`✅ 已新增生字: ${vocab.word}`);
      } catch (error) {
        console.error(`❌ 新增生字失敗 ${vocab.word}:`, error.message);
      }
    }

    // 新增學習記錄資料
    console.log('\n📊 新增學習記錄資料...');
    for (const record of learningRecords) {
      try {
        await db.execute(`
          INSERT OR REPLACE INTO user_learning_records (
            user_id, movie_id, study_date, study_minutes,
            movies_studied, words_learned, exercises_completed,
            exercises_correct, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          record.user_id, record.movie_id, record.study_date,
          record.study_minutes, record.movies_studied, record.words_learned,
          record.exercises_completed, record.exercises_correct,
          record.created_at
        ]);
      } catch (error) {
        console.error(`❌ 新增學習記錄失敗 ${record.study_date}:`, error.message);
      }
    }

    console.log('\n🎉 測試資料新增完成！');

    // 顯示統計資訊
    const stats = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM movies) as movie_count,
        (SELECT COUNT(*) FROM practice_exercises) as exercise_count,
        (SELECT COUNT(*) FROM vocabulary_notes) as vocab_count,
        (SELECT COUNT(*) FROM user_learning_records) as learning_count
    `);

    console.log('\n📈 資料庫統計:');
    console.log(`🎬 影片數量: ${stats.rows[0].movie_count}`);
    console.log(`📝 練習題數量: ${stats.rows[0].exercise_count}`);
    console.log(`📚 生字數量: ${stats.rows[0].vocab_count}`);
    console.log(`📊 學習記錄數量: ${stats.rows[0].learning_count}`);

  } catch (error) {
    console.error('❌ 新增測試資料失敗:', error);
  }
}

// 清理資料庫函數（如果需要的話）
async function clearDatabase() {
  console.log('🧹 清理資料庫...');

  try {
    await db.execute('DELETE FROM user_learning_records');
    await db.execute('DELETE FROM vocabulary_notes');
    await db.execute('DELETE FROM practice_exercises');
    await db.execute('DELETE FROM movies');
    console.log('✅ 資料庫清理完成');
  } catch (error) {
    console.error('❌ 清理資料庫失敗:', error);
  }
}

// 如果直接執行這個腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (command === 'clear') {
    await clearDatabase();
  } else if (command === 'seed') {
    await seedDatabase();
  } else {
    console.log('使用方法:');
    console.log('  node scripts/seed-database.js seed   # 新增測試資料');
    console.log('  node scripts/seed-database.js clear  # 清理資料庫');
  }
}

export { seedDatabase, clearDatabase };