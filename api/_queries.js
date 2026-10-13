// 具名查詢白名單：瀏覽器只能送查詢名稱和參數，不能送 SQL
// 檔名以底線開頭，Vercel 不會把它當成獨立的 API 端點
// 只收錄前端實際使用的查詢；新增功能需要新查詢時，在這裡加一筆

export const QUERIES = {
  // 影片
  'movies.count': 'SELECT COUNT(*) as count FROM movies',
  'movies.getAll': 'SELECT * FROM movies ORDER BY download_count DESC LIMIT ?',
  'movies.getByImdbId': 'SELECT * FROM movies WHERE imdb_id = ?',
  'movies.search': 'SELECT * FROM movies WHERE title LIKE ? ORDER BY download_count DESC LIMIT ?',

  // 字幕
  'subtitles.getByMovieId': 'SELECT * FROM subtitles WHERE movie_id = ?',

  // 生字筆記
  'vocabulary.getAll': 'SELECT * FROM vocabulary_notes',
  'vocabulary.getByLevel': 'SELECT * FROM vocabulary_notes WHERE level = ?',
  'vocabulary.getByMovieId': 'SELECT * FROM vocabulary_notes WHERE movie_id = ?',

  // 重要對話
  'importantDialogues.getByMovieId': `
    SELECT id.*
    FROM important_dialogues id
    JOIN subtitles s ON id.subtitle_id = s.id
    WHERE s.movie_id = ?
    ORDER BY id.time_start ASC`,

  // 練習題
  'exercises.getByMovieId': 'SELECT * FROM practice_exercises WHERE movie_id = ?',

  // 學習紀錄
  'learning.getStats': `
    SELECT
      study_date,
      SUM(study_minutes) as total_minutes,
      SUM(words_learned) as total_words,
      SUM(exercises_completed) as total_exercises,
      SUM(exercises_correct) as correct_exercises
    FROM user_learning_records
    WHERE user_id = ? AND study_date >= date('now', '-' || ? || ' days')
    GROUP BY study_date
    ORDER BY study_date DESC`,

  // 測驗（測驗頁既有的寫入）
  'quiz.createSession': `
    INSERT INTO quiz_sessions (user_id, quiz_type, total_questions, movie_id, time_limit)
    VALUES (?, ?, ?, ?, ?) RETURNING *`,
  'quiz.recordAnswer': `
    INSERT INTO quiz_answers
    (session_id, vocabulary_id, question_type, question_text, user_answer, correct_answer, is_correct, time_spent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
  'quiz.completeSession': `
    UPDATE quiz_sessions
    SET correct_answers = ?, time_spent = ?, completed_at = datetime('now')
    WHERE id = ?
    RETURNING *`,

  // 掌握度
  'mastery.find': 'SELECT * FROM vocabulary_mastery WHERE user_id = ? AND vocabulary_id = ?',
  'mastery.update': `
    UPDATE vocabulary_mastery
    SET correct_count = ?, incorrect_count = ?, mastery_level = ?,
        last_reviewed_at = datetime('now'), updated_at = datetime('now')
    WHERE user_id = ? AND vocabulary_id = ?`,
  'mastery.insert': `
    INSERT INTO vocabulary_mastery
    (user_id, vocabulary_id, mastery_level, correct_count, incorrect_count, last_reviewed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    RETURNING *`,
  'mastery.getSrsBox': 'SELECT srs_box FROM vocabulary_mastery WHERE user_id = ? AND vocabulary_id = ?',
  'mastery.upsertLeitner': `
    INSERT INTO vocabulary_mastery (user_id, vocabulary_id, srs_box, srs_interval, next_review_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(user_id, vocabulary_id) DO UPDATE SET
      srs_box = excluded.srs_box,
      srs_interval = excluded.srs_interval,
      next_review_date = excluded.next_review_date,
      updated_at = datetime('now')
    RETURNING *`,

  // 錯題本
  'wrongAnswers.findOpen': `
    SELECT * FROM wrong_answers_book
    WHERE user_id = ? AND vocabulary_id = ? AND mastered = FALSE`,
  'wrongAnswers.update': `
    UPDATE wrong_answers_book
    SET times_wrong = times_wrong + 1,
        wrong_answer = ?,
        question_type = ?,
        question_context = ?,
        last_attempted_at = datetime('now')
    WHERE id = ?
    RETURNING *`,
  'wrongAnswers.insert': `
    INSERT INTO wrong_answers_book
    (user_id, vocabulary_id, wrong_answer, correct_answer, question_type, question_context, created_at, last_attempted_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    RETURNING *`,

  // 連續學習天數
  'streaks.find': 'SELECT * FROM learning_streaks WHERE user_id = ?',
  'streaks.update': `
    UPDATE learning_streaks
    SET current_streak = ?,
        longest_streak = ?,
        last_study_date = ?,
        total_study_days = ?,
        updated_at = datetime('now')
    WHERE user_id = ?
    RETURNING *`,
  'streaks.insert': `
    INSERT INTO learning_streaks (user_id, current_streak, longest_streak, last_study_date, total_study_days, created_at, updated_at)
    VALUES (?, 1, 1, ?, 1, datetime('now'), datetime('now'))
    RETURNING *`,
};

const isAllowedParam = (v) =>
  v === null || ['string', 'number', 'boolean'].includes(typeof v);

// 依名稱取出 SQL 並檢查參數；不合法時回傳 { error }
export function resolveQuery(name, params = []) {
  if (typeof name !== 'string' || !Object.hasOwn(QUERIES, name)) {
    return { error: 'Unknown query name' };
  }
  const sql = QUERIES[name];
  const expected = (sql.match(/\?/g) || []).length;
  if (!Array.isArray(params) || params.length !== expected) {
    return { error: `Query "${name}" expects ${expected} parameter(s)` };
  }
  if (!params.every(isAllowedParam)) {
    return { error: 'Parameters must be strings, numbers, booleans or null' };
  }
  return { sql, params };
}
