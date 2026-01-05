import { createClient } from '@libsql/client';

// 從環境變數讀取 Turso 設定
const tursoUrl = import.meta.env.VITE_TURSO_URL || 'libsql://your-db.turso.io';
const tursoAuthToken = import.meta.env.VITE_TURSO_AUTH_TOKEN || 'your-auth-token';

// 建立 Turso 客戶端
export const db = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

// 匯出設定
export const tursoConfig = {
  url: tursoUrl,
  authToken: tursoAuthToken,
};

// 測試連線函數
export const testConnection = async () => {
  try {
    const result = await db.execute('SELECT COUNT(*) as count FROM movies');
    console.log('✅ Turso 連線成功，影片數量:', result.rows[0].count);
    return true;
  } catch (error) {
    console.error('❌ Turso 連線失敗:', error.message);
    return false;
  }
};

// 輔助函數：轉換查詢結果
export const formatQueryResult = (result) => {
  if (result.rows) {
    return result.rows;
  }
  return result;
};

// 通用查詢函數
export const query = async (sql, params = []) => {
  try {
    const result = await db.execute(sql, params);
    return { data: formatQueryResult(result), error: null };
  } catch (error) {
    console.error('Turso 查詢錯誤:', error);
    return { data: null, error };
  }
};

// 插入函數
export const insert = async (table, data) => {
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map(() => '?').join(', ');
  const values = Object.values(data);

  const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;

  try {
    const result = await db.execute(sql, values);
    return { data: formatQueryResult(result), error: null };
  } catch (error) {
    console.error('Turso 插入錯誤:', error);
    return { data: null, error };
  }
};

// 更新函數
export const update = async (table, id, data) => {
  const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(data), id];

  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ? RETURNING *`;

  try {
    const result = await db.execute(sql, values);
    return { data: formatQueryResult(result), error: null };
  } catch (error) {
    console.error('Turso 更新錯誤:', error);
    return { data: null, error };
  }
};

// 選擇函數
export const select = async (table, where = {}, columns = '*', limit = null) => {
  let sql = `SELECT ${columns} FROM ${table}`;
  const values = [];

  if (Object.keys(where).length > 0) {
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    sql += ` WHERE ${whereClause}`;
    values.push(...Object.values(where));
  }

  if (limit) {
    sql += ` LIMIT ${limit}`;
  }

  try {
    const result = await db.execute(sql, values);
    return { data: formatQueryResult(result), error: null };
  } catch (error) {
    console.error('Turso 選擇錯誤:', error);
    return { data: null, error };
  }
};

// 刪除函數
export const remove = async (table, id) => {
  const sql = `DELETE FROM ${table} WHERE id = ?`;

  try {
    await db.execute(sql, [id]);
    return { data: { deleted: true }, error: null };
  } catch (error) {
    console.error('Turso 刪除錯誤:', error);
    return { data: null, error };
  }
};

// 影片相關的資料庫操作
export const movieDB = {
  // 取得所有影片（依下載次數排序）
  getAll: async (limit = 50) => {
    const sql = `SELECT * FROM movies ORDER BY download_count DESC LIMIT ${limit}`;
    try {
      const result = await db.execute(sql);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('Turso 查詢錯誤:', error);
      return { data: null, error };
    }
  },

  // 根據 IMDb ID 取得影片
  getByImdbId: async (imdbId) => {
    return await select('movies', { imdb_id: imdbId });
  },

  // 搜尋影片
  search: async (query, limit = 20) => {
    const sql = `SELECT * FROM movies WHERE title LIKE ? ORDER BY download_count DESC LIMIT ?`;
    try {
      const result = await db.execute(sql, [`%${query}%`, limit]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('搜尋影片錯誤:', error);
      return { data: null, error };
    }
  },

  // 新增影片
  create: async (movieData) => {
    return await insert('movies', movieData);
  },

  // 更新影片
  update: async (id, movieData) => {
    return await update('movies', id, movieData);
  }
};

// 字幕相關的資料庫操作
export const subtitleDB = {
  // 取得影片的字幕
  getByMovieId: async (movieId) => {
    return await select('subtitles', { movie_id: movieId });
  },

  // 新增字幕
  create: async (subtitleData) => {
    return await insert('subtitles', subtitleData);
  }
};

// 生字筆記相關的資料庫操作
export const vocabularyDB = {
  // 取得所有生字
  getAll: async (level = null) => {
    if (level) {
      return await select('vocabulary_notes', { level });
    }
    return await select('vocabulary_notes');
  },

  // 根據影片取得生字
  getByMovieId: async (movieId) => {
    return await select('vocabulary_notes', { movie_id: movieId });
  },

  // 新增生字筆記
  create: async (vocabData) => {
    // 處理 JSON 欄位
    const dataToInsert = { ...vocabData };
    if (dataToInsert.example_sentences && Array.isArray(dataToInsert.example_sentences)) {
      dataToInsert.example_sentences = JSON.stringify(dataToInsert.example_sentences);
    }
    return await insert('vocabulary_notes', dataToInsert);
  },

  // 根據等級取得生字統計
  getStatsByLevel: async () => {
    const sql = `
      SELECT
        level,
        COUNT(*) as count,
        AVG(CASE WHEN id IN (
          SELECT vocabulary_id FROM user_exercise_attempts uea
          JOIN practice_exercises pe ON uea.exercise_id = pe.id
          WHERE uea.is_correct = 1
        ) THEN 1 ELSE 0 END) * 100 as correct_rate
      FROM vocabulary_notes
      GROUP BY level
    `;

    try {
      const result = await db.execute(sql);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('生字統計錯誤:', error);
      return { data: null, error };
    }
  }
};

// 重要對話相關的資料庫操作
export const importantDialoguesDB = {
  // 根據字幕 ID 取得重要對話
  getBySubtitleId: async (subtitleId) => {
    return await select('important_dialogues', { subtitle_id: subtitleId });
  },

  // 根據影片 ID 取得重要對話（透過字幕）
  getByMovieId: async (movieId) => {
    const sql = `
      SELECT id.*
      FROM important_dialogues id
      JOIN subtitles s ON id.subtitle_id = s.id
      WHERE s.movie_id = ?
      ORDER BY id.time_start ASC
    `;
    try {
      const result = await db.execute(sql, [movieId]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('取得重要對話錯誤:', error);
      return { data: null, error };
    }
  },

  // 新增重要對話
  create: async (dialogueData) => {
    return await insert('important_dialogues', dialogueData);
  },

  // 根據難度等級取得對話
  getByDifficulty: async (movieId, difficultyLevel) => {
    const sql = `
      SELECT id.*
      FROM important_dialogues id
      JOIN subtitles s ON id.subtitle_id = s.id
      WHERE s.movie_id = ? AND id.difficulty_level = ?
      ORDER BY id.time_start ASC
    `;
    try {
      const result = await db.execute(sql, [movieId, difficultyLevel]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('取得難度對話錯誤:', error);
      return { data: null, error };
    }
  }
};

// 練習題相關的資料庫操作
export const exerciseDB = {
  // 取得影片的練習題
  getByMovieId: async (movieId) => {
    return await select('practice_exercises', { movie_id: movieId });
  },

  // 新增練習題
  create: async (exerciseData) => {
    // 處理 JSON 欄位
    if (exerciseData.options) {
      exerciseData.options = JSON.stringify(exerciseData.options);
    }
    return await insert('practice_exercises', exerciseData);
  },

  // 隨機取得練習題
  getRandom: async (movieId, count = 5) => {
    const sql = `SELECT * FROM practice_exercises WHERE movie_id = ? ORDER BY RANDOM() LIMIT ?`;
    try {
      const result = await db.execute(sql, [movieId, count]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('隨機練習題錯誤:', error);
      return { data: null, error };
    }
  }
};

// 用戶學習記錄相關操作
export const learningDB = {
  // 記錄學習資料
  recordSession: async (userId, movieId, sessionData) => {
    return await insert('user_learning_records', {
      user_id: userId,
      movie_id: movieId,
      ...sessionData
    });
  },

  // 取得學習統計
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

    try {
      const result = await db.execute(sql, [userId]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('學習統計錯誤:', error);
      return { data: null, error };
    }
  }
};
// ========================================
// 測驗系統相關操作
// ========================================

export const quizDB = {
  // 建立測驗會話
  createSession: async (userId, quizConfig) => {
    const data = {
      user_id: userId,
      quiz_type: quizConfig.quizType || 'multiple_choice',
      total_questions: quizConfig.totalQuestions || 10,
      movie_id: quizConfig.movieId || null,
      time_limit: quizConfig.timeLimit || null,
    };
    return await insert('quiz_sessions', data);
  },

  // 記錄單題答案
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
    return await insert('quiz_answers', data);
  },

  // 完成測驗會話
  completeSession: async (sessionId, results) => {
    const sql = `
      UPDATE quiz_sessions
      SET correct_answers = ?, time_spent = ?, completed_at = datetime('now')
      WHERE id = ?
      RETURNING *
    `;
    try {
      const result = await db.execute(sql, [results.correctAnswers, results.timeSpent, sessionId]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('完成測驗錯誤:', error);
      return { data: null, error };
    }
  },

  // 取得測驗歷史記錄
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
    try {
      const result = await db.execute(sql, [userId, limit]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('取得測驗歷史錯誤:', error);
      return { data: null, error };
    }
  },

  // 取得測驗詳細資料
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
    try {
      const result = await db.execute(sql, [sessionId]);
      const data = formatQueryResult(result);
      if (data && data.length > 0) {
        data[0].answers = JSON.parse(data[0].answers || '[]');
      }
      return { data, error: null };
    } catch (error) {
      console.error('取得測驗詳細錯誤:', error);
      return { data: null, error };
    }
  }
};

// 掌握度相關的資料庫操作
export const masteryDB = {
  // 更新單字掌握度
  updateMastery: async (userId, vocabularyId, isCorrect) => {
    // 先檢查是否已有記錄
    const checkSql = 'SELECT * FROM vocabulary_mastery WHERE user_id = ? AND vocabulary_id = ?';
    try {
      const checkResult = await db.execute(checkSql, [userId, vocabularyId]);
      
      if (checkResult.rows && checkResult.rows.length > 0) {
        // 更新現有記錄
        const existing = checkResult.rows[0];
        const correctCount = isCorrect ? existing.correct_count + 1 : existing.correct_count;
        const incorrectCount = isCorrect ? existing.incorrect_count : existing.incorrect_count + 1;
        
        // 計算新的掌握度
        const total = correctCount + incorrectCount;
        const masteryLevel = total === 0 ? 0 : (correctCount * 1.5) / (correctCount * 1.5 + incorrectCount * 0.5);
        
        const updateSql = `
          UPDATE vocabulary_mastery
          SET correct_count = ?, incorrect_count = ?, mastery_level = ?,
              last_reviewed_at = datetime('now'), updated_at = datetime('now')
          WHERE user_id = ? AND vocabulary_id = ?
        `;
        await db.execute(updateSql, [correctCount, incorrectCount, masteryLevel, userId, vocabularyId]);
        return { data: { updated: true }, error: null };
      } else {
        // 新增記錄
        const correctCount = isCorrect ? 1 : 0;
        const incorrectCount = isCorrect ? 0 : 1;
        const masteryLevel = isCorrect ? (1 * 1.5) / (1 * 1.5 + 0 * 0.5) : 0;
        
        const insertSql = `
          INSERT INTO vocabulary_mastery 
          (user_id, vocabulary_id, mastery_level, correct_count, incorrect_count, last_reviewed_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
        `;
        await db.execute(insertSql, [userId, vocabularyId, masteryLevel, correctCount, incorrectCount]);
        return { data: { created: true }, error: null };
      }
    } catch (error) {
      console.error('更新掌握度錯誤:', error);
      return { data: null, error };
    }
  },

  // 更新 Leitner Box 等級
  updateLeitnerBox: async (userId, vocabularyId, isCorrect) => {
    // 先取得當前 Box 等級
    const checkSql = 'SELECT srs_box FROM vocabulary_mastery WHERE user_id = ? AND vocabulary_id = ?';
    try {
      const checkResult = await db.execute(checkSql, [userId, vocabularyId]);
      
      let currentBox = 0;
      if (checkResult.rows && checkResult.rows.length > 0) {
        currentBox = checkResult.rows[0].srs_box || 0;
      }
      
      // 計算新 Box
      const newBox = isCorrect ? Math.min(5, currentBox + 1) : 0;
      
      // Box 間隔設定
      const intervals = { 0: 1, 1: 2, 2: 4, 3: 7, 4: 14, 5: 30 };
      const intervalDays = intervals[newBox];
      
      // 計算下次複習日期
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
      
      // 更新資料庫
      const upsertSql = `
        INSERT INTO vocabulary_mastery (user_id, vocabulary_id, srs_box, srs_interval, next_review_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(user_id, vocabulary_id) DO UPDATE SET
          srs_box = excluded.srs_box,
          srs_interval = excluded.srs_interval,
          next_review_date = excluded.next_review_date,
          updated_at = datetime('now')
      `;
      await db.execute(upsertSql, [userId, vocabularyId, newBox, intervalDays, nextReviewDate.toISOString()]);
      
      return { 
        data: { 
          box: newBox, 
          next_review_date: nextReviewDate.toISOString(),
          interval_days: intervalDays 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('更新 Leitner Box 錯誤:', error);
      return { data: null, error };
    }
  },

  // 取得單字掌握度
  getMasteryLevel: async (userId, vocabularyId) => {
    const sql = 'SELECT * FROM vocabulary_mastery WHERE user_id = ? AND vocabulary_id = ?';
    try {
      const result = await db.execute(sql, [userId, vocabularyId]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('取得掌握度錯誤:', error);
      return { data: null, error };
    }
  },

  // 取得今日待複習單字
  getDueReviews: async (userId) => {
    const sql = `
      SELECT vm.*, vn.word, vn.meaning, vn.level, vn.movie_id
      FROM vocabulary_mastery vm
      JOIN vocabulary_notes vn ON vm.vocabulary_id = vn.id
      WHERE vm.user_id = ? AND date(vm.next_review_date) <= date('now')
      ORDER BY vm.next_review_date ASC
    `;
    try {
      const result = await db.execute(sql, [userId]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('取得待複習單字錯誤:', error);
      return { data: null, error };
    }
  },

  // 取得所有掌握度記錄
  getAllMasteries: async (userId) => {
    const sql = `
      SELECT vm.*, vn.word, vn.meaning, vn.level
      FROM vocabulary_mastery vm
      JOIN vocabulary_notes vn ON vm.vocabulary_id = vn.id
      WHERE vm.user_id = ?
      ORDER BY vm.mastery_level DESC
    `;
    try {
      const result = await db.execute(sql, [userId]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('取得所有掌握度錯誤:', error);
      return { data: null, error };
    }
  }
};

// 錯題本相關的資料庫操作
export const wrongAnswersDB = {
  // 新增錯題記錄
  addWrongAnswer: async (userId, wrongAnswerData) => {
    const {
      vocabularyId,
      wrongAnswer,
      correctAnswer,
      questionType,
      questionContext = null
    } = wrongAnswerData;
    
    // 檢查是否已存在該單字的錯題記錄
    const checkSql = `
      SELECT * FROM wrong_answers_book 
      WHERE user_id = ? AND vocabulary_id = ? AND mastered = FALSE
    `;
    try {
      const checkResult = await db.execute(checkSql, [userId, vocabularyId]);
      
      if (checkResult.rows && checkResult.rows.length > 0) {
        // 更新現有記錄
        const existing = checkResult.rows[0];
        const updateSql = `
          UPDATE wrong_answers_book
          SET times_wrong = times_wrong + 1,
              wrong_answer = ?,
              question_type = ?,
              question_context = ?,
              last_attempted_at = datetime('now')
          WHERE id = ?
        `;
        await db.execute(updateSql, [
          wrongAnswer,
          questionType,
          questionContext,
          existing.id
        ]);
        return { data: { updated: true, id: existing.id }, error: null };
      } else {
        // 新增記錄
        const insertSql = `
          INSERT INTO wrong_answers_book 
          (user_id, vocabulary_id, wrong_answer, correct_answer, question_type, question_context, created_at, last_attempted_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;
        const result = await db.execute(insertSql, [
          userId,
          vocabularyId,
          wrongAnswer,
          correctAnswer,
          questionType,
          questionContext
        ]);
        return { data: { created: true, id: result.lastInsertRowid }, error: null };
      }
    } catch (error) {
      console.error('新增錯題錯誤:', error);
      return { data: null, error };
    }
  },

  // 取得錯題列表
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
    
    try {
      const result = await db.execute(sql, params);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('取得錯題列表錯誤:', error);
      return { data: null, error };
    }
  },

  // 標記為已掌握
  markAsMastered: async (userId, wrongAnswerId) => {
    const sql = `
      UPDATE wrong_answers_book
      SET mastered = TRUE, last_attempted_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `;
    try {
      await db.execute(sql, [wrongAnswerId, userId]);
      return { data: { marked: true }, error: null };
    } catch (error) {
      console.error('標記已掌握錯誤:', error);
      return { data: null, error };
    }
  },

  // 取得弱點分析
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
    try {
      const result = await db.execute(sql, [userId]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('取得弱點分析錯誤:', error);
      return { data: null, error };
    }
  }
};

// 學習統計分析相關操作
export const analyticsDB = {
  // 取得綜合統計
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
    try {
      const result = await db.execute(sql, [userId, userId, userId, userId]);
      const data = formatQueryResult(result);
      if (data && data.length > 0) {
        return { data: data[0], error: null };
      }
      return { data: null, error: null };
    } catch (error) {
      console.error('取得綜合統計錯誤:', error);
      return { data: null, error };
    }
  },

  // 取得測驗成績趨勢
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
    try {
      const result = await db.execute(sql, [userId, limit]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('取得測驗歷史錯誤:', error);
      return { data: null, error };
    }
  },

  // 取得掌握度分佈
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
    try {
      const result = await db.execute(sql, [userId]);
      return { data: formatQueryResult(result), error: null };
    } catch (error) {
      console.error('取得掌握度分佈錯誤:', error);
      return { data: null, error };
    }
  },

  // 更新連續學習天數
  updateStreak: async (userId) => {
    // 檢查是否已有記錄
    const checkSql = 'SELECT * FROM learning_streaks WHERE user_id = ?';
    try {
      const checkResult = await db.execute(checkSql, [userId]);
      const today = new Date().toISOString().split('T')[0];
      
      if (checkResult.rows && checkResult.rows.length > 0) {
        const existing = checkResult.rows[0];
        const lastStudyDate = existing.last_study_date ? existing.last_study_date.split('T')[0] : null;
        
        let newCurrentStreak = existing.current_streak;
        let newTotalDays = existing.total_study_days;
        
        // 計算上次學習日期與今天的天數差
        if (lastStudyDate) {
          const lastDate = new Date(lastStudyDate);
          const todayDate = new Date(today);
          const diffTime = todayDate - lastDate;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // 連續學習，增加連續天數
            newCurrentStreak += 1;
            newTotalDays += 1;
          } else if (diffDays === 0) {
            // 同一天，不更新
            return { data: existing, error: null };
          } else {
            // 中斷了，重置連續天數
            newCurrentStreak = 1;
            newTotalDays += 1;
          }
        } else {
          // 首次學習
          newCurrentStreak = 1;
          newTotalDays = 1;
        }
        
        // 更新最長連續天數
        const newLongestStreak = Math.max(existing.longest_streak, newCurrentStreak);
        
        const updateSql = `
          UPDATE learning_streaks
          SET current_streak = ?,
              longest_streak = ?,
              last_study_date = ?,
              total_study_days = ?,
              updated_at = datetime('now')
          WHERE user_id = ?
        `;
        await db.execute(updateSql, [
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
        // 新增記錄
        const insertSql = `
          INSERT INTO learning_streaks (user_id, current_streak, longest_streak, last_study_date, total_study_days, created_at, updated_at)
          VALUES (?, 1, 1, ?, 1, datetime('now'), datetime('now'))
        `;
        await db.execute(insertSql, [userId, today]);
        
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
    } catch (error) {
      console.error('更新連續學習錯誤:', error);
      return { data: null, error };
    }
  }
};
