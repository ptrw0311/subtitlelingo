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

console.log('🌱 根據實際資料庫結構新增測試資料...');

async function seedCorrectData() {
  try {
    // 新增影片資料（根據實際表格結構）
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

    // 新增練習題資料（根據實際表格結構）
    console.log('\n📝 新增練習題資料...');

    const testExercises = [
      {
        id: 'ex_1',
        movie_id: 'tt0111161',
        dialogue_id: 'dialogue_1',
        question_type: 'fill_blank',
        question: "Get busy living, or get busy _____.",
        correct_answer: "dying",
        options: JSON.stringify(["dying", "crying", "trying", "lying"]),
        explanation: "這句經典台詞強調要積極生活，不要消極等待。",
        difficulty_level: "intermediate"
      },
      {
        id: 'ex_2',
        movie_id: 'tt0111161',
        dialogue_id: 'dialogue_2',
        question_type: 'fill_blank',
        question: "Hope is a good thing, maybe the best of things, and no good thing ever _____.",
        correct_answer: "dies",
        options: JSON.stringify(["dies", "fails", "ends", "leaves"]),
        explanation: "這句話表達了希望永恆不滅的信念。",
        difficulty_level: "intermediate"
      },
      {
        id: 'ex_3',
        movie_id: 'tt0068646',
        dialogue_id: 'dialogue_3',
        question_type: 'fill_blank',
        question: "I'm gonna make him an offer he can't _____.",
        correct_answer: "refuse",
        options: JSON.stringify(["refuse", "accept", "ignore", "understand"]),
        explanation: "這句經典台詞的意思是「我要給他一個無法拒絕的提議」。",
        difficulty_level: "intermediate"
      },
      {
        id: 'ex_4',
        movie_id: 'tt0068646',
        dialogue_id: 'dialogue_4',
        question_type: 'fill_blank',
        question: "Leave the gun. Take the _____.",
        correct_answer: "cannoli",
        options: JSON.stringify(["cannoli", "money", "car", "phone"]),
        explanation: "這句話展現了黑幫家族中人性的一面。",
        difficulty_level: "advanced"
      },
      {
        id: 'ex_5',
        movie_id: 'tt0468569',
        dialogue_id: 'dialogue_5',
        question_type: 'fill_blank',
        question: "Why so _____.",
        correct_answer: "serious",
        options: JSON.stringify(["serious", "happy", "sad", "angry"]),
        explanation: "Joker 的經典台詞，展現了他瘋狂的性格。",
        difficulty_level: "beginner"
      },
      {
        id: 'ex_6',
        movie_id: 'tt0468569',
        dialogue_id: 'dialogue_6',
        question_type: 'fill_blank',
        question: "You either die a hero or you live long enough to see yourself become the _____.",
        correct_answer: "villain",
        options: JSON.stringify(["villain", "hero", "enemy", "legend"]),
        explanation: "這句話探討了英雄與反派的界線。",
        difficulty_level: "advanced"
      }
    ];

    for (const exercise of testExercises) {
      await db.execute(`
        INSERT OR REPLACE INTO practice_exercises (
          id, movie_id, dialogue_id, question_type, question,
          correct_answer, options, explanation, difficulty_level, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        exercise.id, exercise.movie_id, exercise.dialogue_id,
        exercise.question_type, exercise.question, exercise.correct_answer,
        exercise.options, exercise.explanation, exercise.difficulty_level,
        new Date().toISOString()
      ]);
      console.log(`✅ 已新增練習題: ${exercise.question.substring(0, 30)}...`);
    }

    // 新增生字筆記資料（根據實際表格結構）
    console.log('\n📚 新增生字筆記資料...');

    const testVocabulary = [
      {
        id: 'vocab_1',
        word: "redemption",
        part_of_speech: "noun",
        definition_zh: "救贖，償還",
        level: "advanced",
        original_sentence: "Hope is a good thing, maybe the best of things, and no good thing ever dies.",
        example_sentences: JSON.stringify([
          "The story is about redemption and hope.",
          "He found redemption through helping others."
        ]),
        movie_id: 'tt0111161',
        dialogue_id: 'dialogue_1'
      },
      {
        id: 'vocab_2',
        word: "institutionalized",
        part_of_speech: "adjective",
        definition_zh: "制度化的，習慣於機構生活的",
        level: "advanced",
        original_sentence: "These walls are funny. First you hate 'em, then you get used to 'em.",
        example_sentences: JSON.stringify([
          "After so many years in prison, he became institutionalized.",
          "The institutionalized system needed reform."
        ]),
        movie_id: 'tt0111161',
        dialogue_id: 'dialogue_2'
      },
      {
        id: 'vocab_3',
        word: "godfather",
        part_of_speech: "noun",
        definition_zh: "教父，黑幫首領",
        level: "intermediate",
        original_sentence: "I'm gonna make him an offer he can't refuse.",
        example_sentences: JSON.stringify([
          "Don Corleone was the godfather of the family.",
          "The godfather controlled the entire organization."
        ]),
        movie_id: 'tt0068646',
        dialogue_id: 'dialogue_3'
      },
      {
        id: 'vocab_4',
        word: "cannoli",
        part_of_speech: "noun",
        definition_zh: "奶油甜餅，西西里甜點",
        level: "advanced",
        original_sentence: "Leave the gun. Take the cannoli.",
        example_sentences: JSON.stringify([
          "She brought homemade cannoli to the party.",
          "The cannoli was filled with sweet ricotta cheese."
        ]),
        movie_id: 'tt0068646',
        dialogue_id: 'dialogue_4'
      },
      {
        id: 'vocab_5',
        word: "chaos",
        part_of_speech: "noun",
        definition_zh: "混亂，無秩序",
        level: "intermediate",
        original_sentence: "Some men just want to watch the world burn.",
        example_sentences: JSON.stringify([
          "The Joker wants to create chaos in Gotham.",
          "The city descended into chaos after the earthquake."
        ]),
        movie_id: 'tt0468569',
        dialogue_id: 'dialogue_5'
      },
      {
        id: 'vocab_6',
        word: "vigilante",
        part_of_speech: "noun",
        definition_zh: "義警，私刑者",
        level: "advanced",
        original_sentence: "He's the hero Gotham deserves, but not the one it needs right now.",
        example_sentences: JSON.stringify([
          "Batman is often described as a vigilante.",
          "The vigilante justice system is controversial."
        ]),
        movie_id: 'tt0468569',
        dialogue_id: 'dialogue_6'
      }
    ];

    for (const vocab of testVocabulary) {
      await db.execute(`
        INSERT OR REPLACE INTO vocabulary_notes (
          id, word, part_of_speech, definition_zh, level,
          original_sentence, example_sentences, movie_id, dialogue_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        vocab.id, vocab.word, vocab.part_of_speech, vocab.definition_zh,
        vocab.level, vocab.original_sentence, vocab.example_sentences,
        vocab.movie_id, vocab.dialogue_id, new Date().toISOString()
      ]);
      console.log(`✅ 已新增生字: ${vocab.word}`);
    }

    // 新增學習記錄資料
    console.log('\n📊 新增學習記錄資料...');

    const userId = 'demo_user';
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const studyMinutes = Math.floor(Math.random() * 90) + 20; // 20-110 分鐘
      const moviesStudied = Math.random() < 0.4 ? 1 : 0; // 40% 機率學習電影
      const wordsLearned = Math.floor(Math.random() * 20) + (moviesStudied > 0 ? 8 : 0);
      const exercisesCompleted = Math.floor(Math.random() * 12) + 3;
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
      console.log(`✅ 已新增學習記錄: ${dateString} (${studyMinutes}分鐘, ${exercisesCompleted}題)`);
    }

    console.log('\n🎉 測試資料新增完成！');

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

    const sampleExercises = await db.execute(`SELECT question, difficulty_level FROM practice_exercises LIMIT 3`);
    console.log('\n範例練習題:');
    sampleExercises.rows.forEach(exercise => {
      console.log(`  - ${exercise.question.substring(0, 40)}... (${exercise.difficulty_level})`);
    });

  } catch (error) {
    console.error('❌ 新增測試資料失敗:', error);
  }
}

seedCorrectData().then(() => {
  console.log('\n✨ 種子資料腳本執行完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 種子資料腳本執行失敗:', error);
  process.exit(1);
});