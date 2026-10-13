// Turso API 客戶端 - 使用 Vercel Serverless Functions
// 解決瀏覽器 CORS 問題並保護資料庫憑證

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 顯示當前使用的 API URL
console.log('🔗 Turso API URL:', API_BASE_URL || '(relative path - same domain)');

class TursoAPI {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // 送出具名查詢；SQL 只存在伺服器端白名單（api/_queries.js）
  async query(name, params = []) {
    try {
      console.log('📤 Sending query:', name);

      // 如果 baseURL 為空，使用相對路徑（同域名下的 /api/query）
      // 否則使用完整 URL
      const apiUrl = this.baseURL ? `${this.baseURL}/api/query` : '/api/query';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, params }),
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
      const result = await this.query('movies.count');
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
      const result = await this.query('movies.getAll', [limit]);
      return { data: this.formatResult(result), error: null };
    },

    getByImdbId: async (imdbId) => {
      const result = await this.query('movies.getByImdbId', [imdbId]);
      return { data: this.formatResult(result), error: null };
    },

    search: async (query, limit = 20) => {
      const result = await this.query('movies.search', [`%${query}%`, limit]);
      return { data: this.formatResult(result), error: null };
    },
  };

  // 字幕相關操作
  subtitleDB = {
    getByMovieId: async (movieId) => {
      const result = await this.query('subtitles.getByMovieId', [movieId]);
      return { data: this.formatResult(result), error: null };
    },
  };

  // 生字筆記相關操作
  vocabularyDB = {
    getAll: async (level = null) => {
      const result = level
        ? await this.query('vocabulary.getByLevel', [level])
        : await this.query('vocabulary.getAll');
      return { data: this.formatResult(result), error: null };
    },

    getByMovieId: async (movieId) => {
      const result = await this.query('vocabulary.getByMovieId', [movieId]);
      return { data: this.formatResult(result), error: null };
    },
  };

  // 重要對話相關操作
  importantDialoguesDB = {
    getByMovieId: async (movieId) => {
      const result = await this.query('importantDialogues.getByMovieId', [movieId]);
      return { data: this.formatResult(result), error: null };
    },
  };

  // 練習題相關操作
  exerciseDB = {
    getByMovieId: async (movieId) => {
      const result = await this.query('exercises.getByMovieId', [movieId]);
      return { data: this.formatResult(result), error: null };
    },
  };

  // 用戶學習記錄相關操作
  learningDB = {
    getStats: async (userId, days = 7) => {
      const result = await this.query('learning.getStats', [userId, days]);
      return { data: this.formatResult(result), error: null };
    }
  };

  // 測驗系統相關操作
  quizDB = {
    createSession: async (userId, quizConfig) => {
      const result = await this.query('quiz.createSession', [
        userId,
        quizConfig.quizType || 'multiple_choice',
        quizConfig.totalQuestions || 10,
        quizConfig.movieId || null,
        quizConfig.timeLimit || null,
      ]);
      return { data: this.formatResult(result), error: null };
    },

    recordAnswer: async (sessionId, answerData) => {
      const result = await this.query('quiz.recordAnswer', [
        sessionId,
        answerData.vocabularyId,
        answerData.questionType,
        answerData.questionText,
        answerData.userAnswer,
        answerData.correctAnswer,
        answerData.isCorrect ? 1 : 0,
        answerData.timeSpent || null,
      ]);
      return { data: this.formatResult(result), error: null };
    },

    completeSession: async (sessionId, results) => {
      const result = await this.query('quiz.completeSession', [results.correctAnswers, results.timeSpent, sessionId]);
      return { data: this.formatResult(result), error: null };
    },
  };

  // 掌握度相關的資料庫操作
  masteryDB = {
    updateMastery: async (userId, vocabularyId, isCorrect) => {
      const checkResult = await this.query('mastery.find', [userId, vocabularyId]);
      const existing = this.formatResult(checkResult);

      if (existing && existing.length > 0) {
        const record = existing[0];
        const correctCount = isCorrect ? record.correct_count + 1 : record.correct_count;
        const incorrectCount = isCorrect ? record.incorrect_count : record.incorrect_count + 1;
        const total = correctCount + incorrectCount;
        const masteryLevel = total === 0 ? 0 : (correctCount * 1.5) / (correctCount * 1.5 + incorrectCount * 0.5);

        await this.query('mastery.update', [correctCount, incorrectCount, masteryLevel, userId, vocabularyId]);
        return { data: { updated: true }, error: null };
      } else {
        const correctCount = isCorrect ? 1 : 0;
        const incorrectCount = isCorrect ? 0 : 1;
        const masteryLevel = isCorrect ? (1 * 1.5) / (1 * 1.5 + 0 * 0.5) : 0;

        const result = await this.query('mastery.insert', [userId, vocabularyId, masteryLevel, correctCount, incorrectCount]);
        return { data: { created: true, ...this.formatResult(result)[0] }, error: null };
      }
    },

    updateLeitnerBox: async (userId, vocabularyId, isCorrect) => {
      const checkResult = await this.query('mastery.getSrsBox', [userId, vocabularyId]);
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

      await this.query('mastery.upsertLeitner', [userId, vocabularyId, newBox, intervalDays, nextReviewDate.toISOString()]);

      return {
        data: {
          box: newBox,
          next_review_date: nextReviewDate.toISOString(),
          interval_days: intervalDays
        },
        error: null
      };
    },
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

      const checkResult = await this.query('wrongAnswers.findOpen', [userId, vocabularyId]);
      const existing = this.formatResult(checkResult);

      if (existing && existing.length > 0) {
        const record = existing[0];
        const result = await this.query('wrongAnswers.update', [
          wrongAnswer,
          questionType,
          questionContext,
          record.id
        ]);
        return { data: { updated: true, id: record.id, ...this.formatResult(result)[0] }, error: null };
      } else {
        const result = await this.query('wrongAnswers.insert', [
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
  };

  // 學習統計分析相關操作
  analyticsDB = {
    updateStreak: async (userId) => {
      const checkResult = await this.query('streaks.find', [userId]);
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

        await this.query('streaks.update', [
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
        await this.query('streaks.insert', [userId, today]);

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
