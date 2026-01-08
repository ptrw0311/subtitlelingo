// Turso API 客戶端 - 使用 Vercel Serverless Functions
// 解決瀏覽器 CORS 問題並保護資料庫憑證

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 顯示當前使用的 API URL
console.log('🔗 Turso API URL:', API_BASE_URL || '(relative path - same domain)');

class TursoAPI {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async query(sql, params = []) {
    try {
      console.log('📤 Sending query:', sql);

      // 如果 baseURL 為空，使用相對路徑（同域名下的 /api/query）
      // 否則使用完整 URL
      const apiUrl = this.baseURL ? `${this.baseURL}/api/query` : '/api/query';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API Error:', error);
        throw new Error(error.error || 'Query failed');
      }

      const result = await response.json();
      console.log('✅ Query result:', result);
      return result;
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  }

  // 格式化查詢結果
  formatResult(result) {
    if (!result || !result.data) return [];
    return result.data;
  }

  // 測試連接
  async testConnection() {
    try {
      const result = await this.query('SELECT COUNT(*) as count FROM movies');
      console.log('✅ API 連接成功，影片數量:', result.data[0]?.count || 0);
      return true;
    } catch (error) {
      console.error('❌ API 連接失敗:', error.message);
      return false;
    }
  }

  // 影片相關操作
  movieDB = {
    getAll: async (limit = 50) => {
      const sql = `SELECT * FROM movies ORDER BY download_count DESC LIMIT ${limit}`;
      const result = await this.query(sql);
      return { data: this.formatResult(result), error: null };
    },

    getByImdbId: async (imdbId) => {
      const sql = 'SELECT * FROM movies WHERE imdb_id = ?';
      const result = await this.query(sql, [imdbId]);
      return { data: this.formatResult(result), error: null };
    },

    search: async (query, limit = 20) => {
      const sql = `SELECT * FROM movies WHERE title LIKE ? ORDER BY download_count DESC LIMIT ?`;
      const result = await this.query(sql, [`%${query}%`, limit]);
      return { data: this.formatResult(result), error: null };
    },

    create: async (movieData) => {
      const columns = Object.keys(movieData).join(', ');
      const placeholders = Object.keys(movieData).map(() => '?').join(', ');
      const values = Object.values(movieData);
      const sql = `INSERT INTO movies (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.query(sql, values);
      return { data: this.formatResult(result), error: null };
    },
  };

  // 字幕相關操作
  subtitleDB = {
    getByMovieId: async (movieId) => {
      const sql = 'SELECT * FROM subtitles WHERE movie_id = ?';
      const result = await this.query(sql, [movieId]);
      return { data: this.formatResult(result), error: null };
    },

    create: async (subtitleData) => {
      const columns = Object.keys(subtitleData).join(', ');
      const placeholders = Object.keys(subtitleData).map(() => '?').join(', ');
      const values = Object.values(subtitleData);
      const sql = `INSERT INTO subtitles (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.query(sql, values);
      return { data: this.formatResult(result), error: null };
    },
  };

  // 生字筆記相關操作
  vocabularyDB = {
    getAll: async (level = null) => {
      let sql = 'SELECT * FROM vocabulary_notes';
      let params = [];
      if (level) {
        sql += ' WHERE level = ?';
        params = [level];
      }
      const result = await this.query(sql, params);
      return { data: this.formatResult(result), error: null };
    },

    getByMovieId: async (movieId) => {
      const sql = 'SELECT * FROM vocabulary_notes WHERE movie_id = ?';
      const result = await this.query(sql, [movieId]);
      return { data: this.formatResult(result), error: null };
    },

    create: async (vocabData) => {
      const dataToInsert = { ...vocabData };
      if (dataToInsert.example_sentences && Array.isArray(dataToInsert.example_sentences)) {
        dataToInsert.example_sentences = JSON.stringify(dataToInsert.example_sentences);
      }
      const columns = Object.keys(dataToInsert).join(', ');
      const placeholders = Object.keys(dataToInsert).map(() => '?').join(', ');
      const values = Object.values(dataToInsert);
      const sql = `INSERT INTO vocabulary_notes (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.query(sql, values);
      return { data: this.formatResult(result), error: null };
    },
  };

  // 重要對話相關操作
  importantDialoguesDB = {
    getBySubtitleId: async (subtitleId) => {
      const sql = 'SELECT * FROM important_dialogues WHERE subtitle_id = ?';
      const result = await this.query(sql, [subtitleId]);
      return { data: this.formatResult(result), error: null };
    },

    getByMovieId: async (movieId) => {
      const sql = `
        SELECT id.*
        FROM important_dialogues id
        JOIN subtitles s ON id.subtitle_id = s.id
        WHERE s.movie_id = ?
        ORDER BY id.time_start ASC
      `;
      const result = await this.query(sql, [movieId]);
      return { data: this.formatResult(result), error: null };
    },

    create: async (dialogueData) => {
      const columns = Object.keys(dialogueData).join(', ');
      const placeholders = Object.keys(dialogueData).map(() => '?').join(', ');
      const values = Object.values(dialogueData);
      const sql = `INSERT INTO important_dialogues (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.query(sql, values);
      return { data: this.formatResult(result), error: null };
    },
  };

  // 練習題相關操作
  exerciseDB = {
    getByMovieId: async (movieId) => {
      const sql = 'SELECT * FROM practice_exercises WHERE movie_id = ?';
      const result = await this.query(sql, [movieId]);
      return { data: this.formatResult(result), error: null };
    },

    create: async (exerciseData) => {
      const dataToInsert = { ...exerciseData };
      if (dataToInsert.options && Array.isArray(dataToInsert.options)) {
        dataToInsert.options = JSON.stringify(dataToInsert.options);
      }
      const columns = Object.keys(dataToInsert).join(', ');
      const placeholders = Object.keys(dataToInsert).map(() => '?').join(', ');
      const values = Object.values(dataToInsert);
      const sql = `INSERT INTO practice_exercises (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.query(sql, values);
      return { data: this.formatResult(result), error: null };
    },

    getRandom: async (movieId, count = 5) => {
      const sql = `SELECT * FROM practice_exercises WHERE movie_id = ? ORDER BY RANDOM() LIMIT ?`;
      const result = await this.query(sql, [movieId, count]);
      return { data: this.formatResult(result), error: null };
    }
  };

  // 用戶學習記錄相關操作
  learningDB = {
    recordSession: async (userId, movieId, sessionData) => {
      const dataToInsert = {
        user_id: userId,
        movie_id: movieId,
        ...sessionData
      };
      const columns = Object.keys(dataToInsert).join(', ');
      const placeholders = Object.keys(dataToInsert).map(() => '?').join(', ');
      const values = Object.values(dataToInsert);
      const sql = `INSERT INTO user_learning_records (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.query(sql, values);
      return { data: this.formatResult(result), error: null };
    },

    getStats: async (userId, days = 7) => {
      const sql = `
        SELECT
          study_date,
          SUM(study_minutes) as total_minutes,
          SUM(words_learned) as total_words,
          SUM(exercises_completed) as total_exercises,
          SUM(exercises_correct) as correct_exercises
        FROM user_learning_records
        WHERE user_id = ? AND study_date >= date('now', '-${days} days')
        GROUP BY study_date
        ORDER BY study_date DESC
      `;
      const result = await this.query(sql, [userId]);
      return { data: this.formatResult(result), error: null };
    }
  };

  // 測驗系統相關操作
  quizDB = {
    createSession: async (userId, quizConfig) => {
      const data = {
        user_id: userId,
        quiz_type: quizConfig.quizType || 'multiple_choice',
        total_questions: quizConfig.totalQuestions || 10,
        movie_id: quizConfig.movieId || null,
        time_limit: quizConfig.timeLimit || null,
      };
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      const sql = `INSERT INTO quiz_sessions (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.query(sql, values);
      return { data: this.formatResult(result), error: null };
    },

    recordAnswer: async (sessionId, answerData) => {
      const data = {
        session_id: sessionId,
        vocabulary_id: answerData.vocabularyId,
        question_type: answerData.questionType,
        question_text: answerData.questionText,
        user_answer: answerData.userAnswer,
        correct_answer: answerData.correctAnswer,
        is_correct: answerData.isCorrect ? 1 : 0,
        time_spent: answerData.timeSpent || null,
      };
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      const sql = `INSERT INTO quiz_answers (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.query(sql, values);
      return { data: this.formatResult(result), error: null };
    },

    completeSession: async (sessionId, results) => {
      const sql = `
        UPDATE quiz_sessions
        SET correct_answers = ?, time_spent = ?, completed_at = datetime('now')
        WHERE id = ?
        RETURNING *
      `;
      const result = await this.query(sql, [results.correctAnswers, results.timeSpent, sessionId]);
      return { data: this.formatResult(result), error: null };
    },

    getUserHistory: async (userId, limit = 20) => {
      const sql = `
        SELECT qs.*, COUNT(qa.id) as answered_questions
        FROM quiz_sessions qs
        LEFT JOIN quiz_answers qa ON qs.id = qa.session_id
        WHERE qs.user_id = ? AND qs.completed_at IS NOT NULL
        GROUP BY qs.id
        ORDER BY qs.created_at DESC
        LIMIT ?
      `;
      const result = await this.query(sql, [userId, limit]);
      return { data: this.formatResult(result), error: null };
    },

    getSessionDetails: async (sessionId) => {
      const sql = `
        SELECT qs.*, json_group_array(
          json_object(
            'id', qa.id,
            'vocabulary_id', qa.vocabulary_id,
            'question_type', qa.question_type,
            'question_text', qa.question_text,
            'user_answer', qa.user_answer,
            'correct_answer', qa.correct_answer,
            'is_correct', qa.is_correct,
            'time_spent', qa.time_spent,
            'answered_at', qa.answered_at
          )
        ) as answers
        FROM quiz_sessions qs
        LEFT JOIN quiz_answers qa ON qs.id = qa.session_id
        WHERE qs.id = ?
        GROUP BY qs.id
      `;
      const result = await this.query(sql, [sessionId]);
      const data = this.formatResult(result);
      if (data && data.length > 0) {
        data[0].answers = JSON.parse(data[0].answers || '[]');
      }
      return { data, error: null };
    }
  };

  // 掌握度相關的資料庫操作
  masteryDB = {
    updateMastery: async (userId, vocabularyId, isCorrect) => {
      const checkSql = 'SELECT * FROM vocabulary_mastery WHERE user_id = ? AND vocabulary_id = ?';
      const checkResult = await this.query(checkSql, [userId, vocabularyId]);
      const existing = this.formatResult(checkResult);

      if (existing && existing.length > 0) {
        const record = existing[0];
        const correctCount = isCorrect ? record.correct_count + 1 : record.correct_count;
        const incorrectCount = isCorrect ? record.incorrect_count : record.incorrect_count + 1;
        const total = correctCount + incorrectCount;
        const masteryLevel = total === 0 ? 0 : (correctCount * 1.5) / (correctCount * 1.5 + incorrectCount * 0.5);

        const updateSql = `
          UPDATE vocabulary_mastery
          SET correct_count = ?, incorrect_count = ?, mastery_level = ?,
              last_reviewed_at = datetime('now'), updated_at = datetime('now')
          WHERE user_id = ? AND vocabulary_id = ?
        `;
        await this.query(updateSql, [correctCount, incorrectCount, masteryLevel, userId, vocabularyId]);
        return { data: { updated: true }, error: null };
      } else {
        const correctCount = isCorrect ? 1 : 0;
        const incorrectCount = isCorrect ? 0 : 1;
        const masteryLevel = isCorrect ? (1 * 1.5) / (1 * 1.5 + 0 * 0.5) : 0;

        const insertSql = `
          INSERT INTO vocabulary_mastery
          (user_id, vocabulary_id, mastery_level, correct_count, incorrect_count, last_reviewed_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
          RETURNING *
        `;
        const result = await this.query(insertSql, [userId, vocabularyId, masteryLevel, correctCount, incorrectCount]);
        return { data: { created: true, ...this.formatResult(result)[0] }, error: null };
      }
    },

    updateLeitnerBox: async (userId, vocabularyId, isCorrect) => {
      const checkSql = 'SELECT srs_box FROM vocabulary_mastery WHERE user_id = ? AND vocabulary_id = ?';
      const checkResult = await this.query(checkSql, [userId, vocabularyId]);
      const existing = this.formatResult(checkResult);

      let currentBox = 0;
      if (existing && existing.length > 0) {
        currentBox = existing[0].srs_box || 0;
      }

      const newBox = isCorrect ? Math.min(5, currentBox + 1) : 0;
      const intervals = { 0: 1, 1: 2, 2: 4, 3: 7, 4: 14, 5: 30 };
      const intervalDays = intervals[newBox];
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

      const upsertSql = `
        INSERT INTO vocabulary_mastery (user_id, vocabulary_id, srs_box, srs_interval, next_review_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(user_id, vocabulary_id) DO UPDATE SET
          srs_box = excluded.srs_box,
          srs_interval = excluded.srs_interval,
          next_review_date = excluded.next_review_date,
          updated_at = datetime('now')
        RETURNING *
      `;
      const result = await this.query(upsertSql, [userId, vocabularyId, newBox, intervalDays, nextReviewDate.toISOString()]);

      return {
        data: {
          box: newBox,
          next_review_date: nextReviewDate.toISOString(),
          interval_days: intervalDays
        },
        error: null
      };
    },

    getMasteryLevel: async (userId, vocabularyId) => {
      const sql = 'SELECT * FROM vocabulary_mastery WHERE user_id = ? AND vocabulary_id = ?';
      const result = await this.query(sql, [userId, vocabularyId]);
      return { data: this.formatResult(result), error: null };
    },

    getDueReviews: async (userId) => {
      const sql = `
        SELECT vm.*, vn.word, vn.meaning, vn.level, vn.movie_id
        FROM vocabulary_mastery vm
        JOIN vocabulary_notes vn ON vm.vocabulary_id = vn.id
        WHERE vm.user_id = ? AND date(vm.next_review_date) <= date('now')
        ORDER BY vm.next_review_date ASC
      `;
      const result = await this.query(sql, [userId]);
      return { data: this.formatResult(result), error: null };
    },

    getAllMasteries: async (userId) => {
      const sql = `
        SELECT vm.*, vn.word, vn.meaning, vn.level
        FROM vocabulary_mastery vm
        JOIN vocabulary_notes vn ON vm.vocabulary_id = vn.id
        WHERE vm.user_id = ?
        ORDER BY vm.mastery_level DESC
      `;
      const result = await this.query(sql, [userId]);
      return { data: this.formatResult(result), error: null };
    }
  };

  // 錯題本相關的資料庫操作
  wrongAnswersDB = {
    addWrongAnswer: async (userId, wrongAnswerData) => {
      const {
        vocabularyId,
        wrongAnswer,
        correctAnswer,
        questionType,
        questionContext = null
      } = wrongAnswerData;

      const checkSql = `
        SELECT * FROM wrong_answers_book
        WHERE user_id = ? AND vocabulary_id = ? AND mastered = FALSE
      `;
      const checkResult = await this.query(checkSql, [userId, vocabularyId]);
      const existing = this.formatResult(checkResult);

      if (existing && existing.length > 0) {
        const record = existing[0];
        const updateSql = `
          UPDATE wrong_answers_book
          SET times_wrong = times_wrong + 1,
              wrong_answer = ?,
              question_type = ?,
              question_context = ?,
              last_attempted_at = datetime('now')
          WHERE id = ?
          RETURNING *
        `;
        const result = await this.query(updateSql, [
          wrongAnswer,
          questionType,
          questionContext,
          record.id
        ]);
        return { data: { updated: true, id: record.id, ...this.formatResult(result)[0] }, error: null };
      } else {
        const insertSql = `
          INSERT INTO wrong_answers_book
          (user_id, vocabulary_id, wrong_answer, correct_answer, question_type, question_context, created_at, last_attempted_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          RETURNING *
        `;
        const result = await this.query(insertSql, [
          userId,
          vocabularyId,
          wrongAnswer,
          correctAnswer,
          questionType,
          questionContext
        ]);
        return { data: { created: true, ...this.formatResult(result)[0] }, error: null };
      }
    },

    getWrongAnswers: async (userId, options = {}) => {
      const { movieId = null, level = null, mastered = false, limit = 50 } = options;

      let sql = `
        SELECT wab.*, vn.word, vn.meaning, vn.level, vn.movie_id, vn.example_sentences
        FROM wrong_answers_book wab
        JOIN vocabulary_notes vn ON wab.vocabulary_id = vn.id
        WHERE wab.user_id = ? AND wab.mastered = ?
      `;
      const params = [userId, mastered ? 1 : 0];

      if (movieId) {
        sql += ' AND vn.movie_id = ?';
        params.push(movieId);
      }

      if (level) {
        sql += ' AND vn.level = ?';
        params.push(level);
      }

      sql += ' ORDER BY wab.times_wrong DESC, wab.created_at DESC LIMIT ?';
      params.push(limit);

      const result = await this.query(sql, params);
      return { data: this.formatResult(result), error: null };
    },

    markAsMastered: async (userId, wrongAnswerId) => {
      const sql = `
        UPDATE wrong_answers_book
        SET mastered = TRUE, last_attempted_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `;
      await this.query(sql, [wrongAnswerId, userId]);
      return { data: { marked: true }, error: null };
    },

    getWeaknessAnalysis: async (userId) => {
      const sql = `
        SELECT
          vn.id as vocabulary_id,
          vn.word,
          vn.meaning,
          vn.level,
          vn.movie_id,
          COUNT(wab.id) as total_wrong,
          MAX(wab.times_wrong) as max_times_wrong
        FROM wrong_answers_book wab
        JOIN vocabulary_notes vn ON wab.vocabulary_id = vn.id
        WHERE wab.user_id = ? AND wab.mastered = FALSE
        GROUP BY vn.id
        ORDER BY total_wrong DESC, max_times_wrong DESC
        LIMIT 20
      `;
      const result = await this.query(sql, [userId]);
      return { data: this.formatResult(result), error: null };
    }
  };

  // 學習統計分析相關操作
  analyticsDB = {
    getOverallStats: async (userId) => {
      const sql = `
        SELECT
          (SELECT COUNT(*) FROM vocabulary_notes) as total_vocabulary,
          (SELECT COUNT(DISTINCT vm.vocabulary_id)
           FROM vocabulary_mastery vm
           WHERE vm.user_id = ? AND vm.mastery_level >= 0.8) as mastered_count,
          (SELECT COUNT(*) FROM quiz_sessions WHERE user_id = ?) as total_quizzes,
          (SELECT AVG(CAST(correct_answers AS REAL) / CAST(total_questions AS REAL)) * 100
           FROM quiz_sessions
           WHERE user_id = ? AND completed_at IS NOT NULL) as avg_score,
          (SELECT current_streak FROM learning_streaks WHERE user_id = ?) as current_streak
      `;
      const result = await this.query(sql, [userId, userId, userId, userId]);
      const data = this.formatResult(result);
      if (data && data.length > 0) {
        return { data: data[0], error: null };
      }
      return { data: null, error: null };
    },

    getQuizHistory: async (userId, limit = 10) => {
      const sql = `
        SELECT
          id,
          quiz_type,
          total_questions,
          correct_answers,
          ROUND((CAST(correct_answers AS REAL) / total_questions) * 100, 1) as score_percentage,
          time_spent,
          completed_at,
          created_at
        FROM quiz_sessions
        WHERE user_id = ? AND completed_at IS NOT NULL
        ORDER BY created_at DESC
        LIMIT ?
      `;
      const result = await this.query(sql, [userId, limit]);
      return { data: this.formatResult(result), error: null };
    },

    getMasteryDistribution: async (userId) => {
      const sql = `
        SELECT
          CASE
            WHEN mastery_level = 0 THEN '尚未學習'
            WHEN mastery_level < 0.3 THEN '初級'
            WHEN mastery_level < 0.6 THEN '中級'
            WHEN mastery_level < 0.8 THEN '高級'
            ELSE '精通'
          END as mastery_label,
          COUNT(*) as count
        FROM vocabulary_mastery
        WHERE user_id = ?
        GROUP BY mastery_label
        ORDER BY
          CASE mastery_label
            WHEN '尚未學習' THEN 1
            WHEN '初級' THEN 2
            WHEN '中級' THEN 3
            WHEN '高級' THEN 4
            WHEN '精通' THEN 5
          END
      `;
      const result = await this.query(sql, [userId]);
      return { data: this.formatResult(result), error: null };
    },

    updateStreak: async (userId) => {
      const checkSql = 'SELECT * FROM learning_streaks WHERE user_id = ?';
      const checkResult = await this.query(checkSql, [userId]);
      const existing = this.formatResult(checkResult);
      const today = new Date().toISOString().split('T')[0];

      if (existing && existing.length > 0) {
        const record = existing[0];
        const lastStudyDate = record.last_study_date ? record.last_study_date.split('T')[0] : null;

        let newCurrentStreak = record.current_streak;
        let newTotalDays = record.total_study_days;

        if (lastStudyDate) {
          const lastDate = new Date(lastStudyDate);
          const todayDate = new Date(today);
          const diffTime = todayDate - lastDate;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            newCurrentStreak += 1;
            newTotalDays += 1;
          } else if (diffDays === 0) {
            return { data: record, error: null };
          } else {
            newCurrentStreak = 1;
            newTotalDays += 1;
          }
        } else {
          newCurrentStreak = 1;
          newTotalDays = 1;
        }

        const newLongestStreak = Math.max(record.longest_streak, newCurrentStreak);

        const updateSql = `
          UPDATE learning_streaks
          SET current_streak = ?,
              longest_streak = ?,
              last_study_date = ?,
              total_study_days = ?,
              updated_at = datetime('now')
          WHERE user_id = ?
          RETURNING *
        `;
        const result = await this.query(updateSql, [
          newCurrentStreak,
          newLongestStreak,
          today,
          newTotalDays,
          userId
        ]);

        return {
          data: {
            current_streak: newCurrentStreak,
            longest_streak: newLongestStreak,
            total_study_days: newTotalDays,
            last_study_date: today
          },
          error: null
        };
      } else {
        const insertSql = `
          INSERT INTO learning_streaks (user_id, current_streak, longest_streak, last_study_date, total_study_days, created_at, updated_at)
          VALUES (?, 1, 1, ?, 1, datetime('now'), datetime('now'))
          RETURNING *
        `;
        await this.query(insertSql, [userId, today]);

        return {
          data: {
            current_streak: 1,
            longest_streak: 1,
            total_study_days: 1,
            last_study_date: today
          },
          error: null
        };
      }
    }
  };
}

// 導出實例
export const db = new TursoAPI();
export const testConnection = db.testConnection;

// 向後兼容：導出所有 DB 對象
export const movieDB = db.movieDB;
export const subtitleDB = db.subtitleDB;
export const vocabularyDB = db.vocabularyDB;
export const importantDialoguesDB = db.importantDialoguesDB;
export const exerciseDB = db.exerciseDB;
export const learningDB = db.learningDB;
export const quizDB = db.quizDB;
export const masteryDB = db.masteryDB;
export const wrongAnswersDB = db.wrongAnswersDB;
export const analyticsDB = db.analyticsDB;
