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
  // 取得所有影片
  getAll: async (limit = 50) => {
    return await select('movies', {}, '*', limit);
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
    return await insert('vocabulary_notes', vocabData);
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