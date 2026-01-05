import libsql_experimental as libsql
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from config.settings import TURSO_URL, TURSO_AUTH_TOKEN

logger = logging.getLogger(__name__)

class TursoClient:
    """Turso 資料庫客戶端"""

    def __init__(self):
        if not TURSO_URL or not TURSO_AUTH_TOKEN:
            raise ValueError("Turso 連線資訊未設定")

        self.conn = libsql.connect(TURSO_URL, auth_token=TURSO_AUTH_TOKEN)
        logger.info("Turso 資料庫連線成功")

    def _execute_query(self, query: str, params: Optional[List] = None) -> List[Dict]:
        """執行查詢"""
        try:
            result = self.conn.execute(query, params or [])
            if hasattr(result, 'rows'):
                return [dict(row) for row in result.rows]
            return []
        except Exception as e:
            logger.error(f"執行查詢失敗: {e}")
            logger.error(f"查詢: {query}")
            logger.error(f"參數: {params}")
            raise

    def _execute_update(self, query: str, params: Optional[List] = None) -> bool:
        """執行更新/插入操作"""
        try:
            self.conn.execute(query, params or [])
            return True
        except Exception as e:
            logger.error(f"執行更新失敗: {e}")
            logger.error(f"查詢: {query}")
            logger.error(f"參數: {params}")
            return False

    # === 影片相關操作 ===
    def save_movie(self, movie_data: Dict[str, Any]) -> str:
        """儲存影片資訊"""
        try:
            query = """
                INSERT OR REPLACE INTO movies (
                    imdb_id, title, year, type, poster_url,
                    download_count, overview, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """

            params = [
                movie_data.get('imdb_id'),
                movie_data.get('title'),
                movie_data.get('year'),
                movie_data.get('type'),
                movie_data.get('poster_url'),
                movie_data.get('download_count', 0),
                movie_data.get('overview', ''),
                movie_data.get('created_at', datetime.now().isoformat()),
                movie_data.get('updated_at', datetime.now().isoformat())
            ]

            if self._execute_update(query, params):
                logger.info(f"影片儲存成功: {movie_data.get('title')}")
                return movie_data.get('imdb_id')
            return None

        except Exception as e:
            logger.error(f"儲存影片失敗: {e}")
            return None

    def get_movie_by_imdb_id(self, imdb_id: str) -> Optional[Dict]:
        """根據 IMDb ID 取得影片"""
        try:
            query = "SELECT * FROM movies WHERE imdb_id = ?"
            result = self._execute_query(query, [imdb_id])
            return result[0] if result else None
        except Exception as e:
            logger.error(f"取得影片失敗 {imdb_id}: {e}")
            return None

    def search_movies(self, query: str, limit: int = 20) -> List[Dict]:
        """搜尋影片"""
        try:
            sql = """
                SELECT * FROM movies
                WHERE title LIKE ? OR overview LIKE ?
                ORDER BY download_count DESC
                LIMIT ?
            """
            search_term = f"%{query}%"
            result = self._execute_query(sql, [search_term, search_term, limit])
            return result
        except Exception as e:
            logger.error(f"搜尋影片失敗: {e}")
            return []

    def get_popular_movies(self, limit: int = 20) -> List[Dict]:
        """取得熱門影片"""
        try:
            sql = "SELECT * FROM movies ORDER BY download_count DESC LIMIT ?"
            result = self._execute_query(sql, [limit])
            return result
        except Exception as e:
            logger.error(f"取得熱門影片失敗: {e}")
            return []

    # === 字幕相關操作 ===
    def save_subtitle(self, subtitle_data: Dict[str, Any]) -> str:
        """儲存字幕內容"""
        try:
            # 先刪除現有字幕
            self._execute_update(
                "DELETE FROM subtitles WHERE movie_id = ?",
                [subtitle_data.get('movie_id')]
            )

            # 儲存字幕條目
            if 'parsed_entries' in subtitle_data:
                entries = subtitle_data['parsed_entries']
                for entry in entries:
                    query = """
                        INSERT INTO subtitles (
                            movie_id, sequence_number, start_time, end_time,
                            text, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    """
                    params = [
                        subtitle_data.get('movie_id'),
                        entry.get('index', 0),
                        entry.get('start_time'),
                        entry.get('end_time'),
                        entry.get('text'),
                        datetime.now().isoformat()
                    ]
                    self._execute_update(query, params)

            # 儲存字幕元資料
            metadata_query = """
                INSERT OR REPLACE INTO subtitle_metadata (
                    movie_id, file_id, file_name, language, download_count,
                    rating, content, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """
            metadata_params = [
                subtitle_data.get('movie_id'),
                subtitle_data.get('file_id'),
                subtitle_data.get('file_name'),
                subtitle_data.get('language', 'en'),
                subtitle_data.get('download_count', 0),
                subtitle_data.get('rating', 0),
                subtitle_data.get('content', ''),
                datetime.now().isoformat()
            ]
            self._execute_update(metadata_query, metadata_params)

            logger.info(f"字幕儲存成功: {subtitle_data.get('movie_id')}")
            return subtitle_data.get('movie_id')

        except Exception as e:
            logger.error(f"儲存字幕失敗: {e}")
            return None

    def get_subtitle_by_imdb_id(self, imdb_id: str) -> Optional[Dict]:
        """取得影片字幕元資料"""
        try:
            query = "SELECT * FROM subtitle_metadata WHERE movie_id = ?"
            result = self._execute_query(query, [imdb_id])
            return result[0] if result else None
        except Exception as e:
            logger.error(f"取得字幕元資料失敗 {imdb_id}: {e}")
            return None

    def get_subtitle_entries(self, imdb_id: str) -> List[Dict]:
        """取得影片字幕條目"""
        try:
            query = """
                SELECT * FROM subtitles
                WHERE movie_id = ?
                ORDER BY sequence_number
            """
            result = self._execute_query(query, [imdb_id])
            return result
        except Exception as e:
            logger.error(f"取得字幕條目失敗 {imdb_id}: {e}")
            return []

    # === 生字筆記相關操作 ===
    def save_vocabulary(self, vocab_data: Dict[str, Any]) -> str:
        """儲存生字筆記"""
        try:
            # 檢查是否已存在
            existing = self.get_vocabulary(vocab_data.get('word'), vocab_data.get('movie_id'))

            if existing:
                # 更新現有記錄
                query = """
                    UPDATE vocabulary_notes
                    SET definition_zh = ?, level = ?, example_sentences = ?, updated_at = ?
                    WHERE word = ? AND movie_id = ?
                """
                params = [
                    vocab_data.get('definition_zh'),
                    vocab_data.get('level'),
                    json.dumps(vocab_data.get('example_sentences', [])),
                    datetime.now().isoformat(),
                    vocab_data.get('word'),
                    vocab_data.get('movie_id')
                ]
            else:
                # 插入新記錄
                query = """
                    INSERT INTO vocabulary_notes (
                        word, part_of_speech, definition_zh, level,
                        original_sentence, example_sentences, movie_id,
                        dialogue_id, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                params = [
                    vocab_data.get('word'),
                    vocab_data.get('part_of_speech'),
                    vocab_data.get('definition_zh'),
                    vocab_data.get('level'),
                    vocab_data.get('original_sentence'),
                    json.dumps(vocab_data.get('example_sentences', [])),
                    vocab_data.get('movie_id'),
                    vocab_data.get('dialogue_id'),
                    datetime.now().isoformat(),
                    datetime.now().isoformat()
                ]

            self._execute_update(query, params)
            logger.info(f"生字筆記儲存成功: {vocab_data.get('word')}")
            return vocab_data.get('word')

        except Exception as e:
            logger.error(f"儲存生字筆記失敗: {e}")
            return None

    def get_vocabulary(self, word: str, movie_id: Optional[str] = None) -> Optional[Dict]:
        """取得生字筆記"""
        try:
            if movie_id:
                query = "SELECT * FROM vocabulary_notes WHERE word = ? AND movie_id = ?"
                params = [word, movie_id]
            else:
                query = "SELECT * FROM vocabulary_notes WHERE word = ?"
                params = [word]

            result = self._execute_query(query, params)
            return result[0] if result else None
        except Exception as e:
            logger.error(f"取得生字筆記失敗 {word}: {e}")
            return None

    def get_vocabulary_by_level(self, level: Optional[str] = None) -> List[Dict]:
        """根據等級取得生字筆記統計"""
        try:
            if level:
                query = "SELECT level, COUNT(*) as count FROM vocabulary_notes WHERE level = ? GROUP BY level"
                params = [level]
            else:
                query = "SELECT level, COUNT(*) as count FROM vocabulary_notes GROUP BY level"
                params = []

            result = self._execute_query(query, params)
            return result
        except Exception as e:
            logger.error(f"取得生字統計失敗: {e}")
            return []

    # === 練習題相關操作 ===
    def save_exercise(self, exercise_data: Dict[str, Any]) -> str:
        """儲存練習題"""
        try:
            query = """
                INSERT OR REPLACE INTO practice_exercises (
                    id, movie_id, dialogue_id, question_type, question,
                    correct_answer, options, explanation, difficulty_level, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """

            params = [
                exercise_data.get('id'),
                exercise_data.get('movie_id'),
                exercise_data.get('dialogue_id'),
                exercise_data.get('question_type'),
                exercise_data.get('question'),
                exercise_data.get('correct_answer'),
                json.dumps(exercise_data.get('options', [])),
                exercise_data.get('explanation'),
                exercise_data.get('difficulty_level', 'intermediate'),
                datetime.now().isoformat()
            ]

            if self._execute_update(query, params):
                logger.info(f"練習題儲存成功: {exercise_data.get('id')}")
                return exercise_data.get('id')
            return None

        except Exception as e:
            logger.error(f"儲存練習題失敗: {e}")
            return None

    def get_exercises_by_movie_id(self, movie_id: str) -> List[Dict]:
        """取得影片練習題"""
        try:
            query = "SELECT * FROM practice_exercises WHERE movie_id = ? ORDER BY created_at"
            result = self._execute_query(query, [movie_id])
            return result
        except Exception as e:
            logger.error(f"取得練習題失敗 {movie_id}: {e}")
            return []

    # === 分析結果相關操作 ===
    def save_analysis(self, analysis_data: Dict[str, Any]) -> bool:
        """儲存分析結果"""
        try:
            query = """
                INSERT OR REPLACE INTO analysis_results (
                    movie_id, analysis_type, data, created_at
                ) VALUES (?, ?, ?, ?)
            """

            params = [
                analysis_data.get('movie_id'),
                analysis_data.get('analysis_type'),
                json.dumps(analysis_data.get('data', {})),
                datetime.now().isoformat()
            ]

            return self._execute_update(query, params)
        except Exception as e:
            logger.error(f"儲存分析結果失敗: {e}")
            return False

    def get_analysis(self, movie_id: str, analysis_type: str) -> Optional[Dict]:
        """取得分析結果"""
        try:
            query = "SELECT * FROM analysis_results WHERE movie_id = ? AND analysis_type = ?"
            result = self._execute_query(query, [movie_id, analysis_type])
            return result[0] if result else None
        except Exception as e:
            logger.error(f"取得分析結果失敗 {movie_id}: {e}")
            return None

    def get_statistics(self) -> Dict[str, Any]:
        """取得資料庫統計資訊"""
        try:
            stats = {}

            # 影片統計
            movie_count = self._execute_query("SELECT COUNT(*) as count FROM movies")
            stats['movies'] = movie_count[0]['count'] if movie_count else 0

            # 字幕統計
            subtitle_count = self._execute_query("SELECT COUNT(DISTINCT movie_id) as count FROM subtitles")
            stats['movies_with_subtitles'] = subtitle_count[0]['count'] if subtitle_count else 0

            # 生字筆記統計
            vocab_count = self._execute_query("SELECT COUNT(*) as count FROM vocabulary_notes")
            stats['vocabulary_notes'] = vocab_count[0]['count'] if vocab_count else 0

            # 練習題統計
            exercise_count = self._execute_query("SELECT COUNT(*) as count FROM practice_exercises")
            stats['exercises'] = exercise_count[0]['count'] if exercise_count else 0

            return stats

        except Exception as e:
            logger.error(f"取得統計資訊失敗: {e}")
            return {}

    def close(self):
        """關閉資料庫連線"""
        try:
            if hasattr(self, 'conn'):
                self.conn.close()
                logger.info("Turso 資料庫連線已關閉")
        except Exception as e:
            logger.error(f"關閉資料庫連線失敗: {e}")