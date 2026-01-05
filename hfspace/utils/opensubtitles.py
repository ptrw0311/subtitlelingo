import requests
import time
import logging
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from config.settings import (
    OPENSUBTITLES_API_KEY,
    OPENSUBTITLES_USER_AGENT,
    OPENSUBTITLES_BASE_URL,
    OPENSUBTITLES_RATE_LIMIT
)

logger = logging.getLogger(__name__)

@dataclass
class SubtitleInfo:
    """字幕資訊類別"""
    file_id: str
    file_name: str
    language: str
    download_count: int
    rating: float
    fps: Optional[str] = None
    encoding: Optional[str] = None

@dataclass
class MovieInfo:
    """影片資訊類別"""
    imdb_id: str
    title: str
    year: Optional[int]
    poster_url: Optional[str]
    download_count: int

class OpenSubtitlesClient:
    """OpenSubtitles API 客戶端"""

    def __init__(self):
        self.api_key = OPENSUBTITLES_API_KEY
        self.base_url = OPENSUBTITLES_BASE_URL
        self.user_agent = OPENSUBTITLES_USER_AGENT
        self.rate_limit_delay = 1.0 / OPENSUBTITLES_RATE_LIMIT  # 計算請求間隔
        self.last_request_time = 0

        if not self.api_key:
            raise ValueError("OPENSUBTITLES_API_KEY 環境變數未設定")

    def _wait_for_rate_limit(self):
        """實作速率限制"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time

        if time_since_last_request < self.rate_limit_delay:
            sleep_time = self.rate_limit_delay - time_since_last_request
            logger.debug(f"Rate limit: 等待 {sleep_time:.2f} 秒")
            time.sleep(sleep_time)

        self.last_request_time = current_time

    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """發送 API 請求"""
        self._wait_for_rate_limit()

        url = f"{self.base_url}{endpoint}"
        headers = {
            "Api-Key": self.api_key,
            "User-Agent": self.user_agent
        }

        try:
            response = requests.get(url, params=params, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"OpenSubtitles API 請求失敗: {e}")
            raise Exception(f"API 請求失敗: {str(e)}")

    def search_movies(self, query: str, page: int = 1) -> List[MovieInfo]:
        """搜尋影片"""
        logger.info(f"搜尋影片: {query}, 頁面: {page}")

        params = {
            "query": query,
            "page": page
        }

        try:
            response = self._make_request("/search", params)

            if response.get("status") != "success":
                raise Exception(f"搜尋失敗: {response.get('message', '未知錯誤')}")

            movies = []
            for item in response.get("data", []):
                movie = MovieInfo(
                    imdb_id=item.get("imdb_id"),
                    title=item.get("title"),
                    year=item.get("year"),
                    poster_url=item.get("poster"),
                    download_count=item.get("download_count", 0)
                )
                movies.append(movie)

            logger.info(f"找到 {len(movies)} 部影片")
            return movies

        except Exception as e:
            logger.error(f"搜尋影片失敗: {e}")
            return []

    def get_popular_movies(self, page: int = 1) -> List[MovieInfo]:
        """取得熱門影片列表"""
        logger.info(f"取得熱門影片, 頁面: {page}")

        params = {"page": page}

        try:
            response = self._make_request("/popular", params)

            if response.get("status") != "success":
                raise Exception(f"取得熱門影片失敗: {response.get('message', '未知錯誤')}")

            movies = []
            for item in response.get("data", []):
                movie = MovieInfo(
                    imdb_id=item.get("imdb_id"),
                    title=item.get("title"),
                    year=item.get("year"),
                    poster_url=item.get("poster"),
                    download_count=item.get("download_count", 0)
                )
                movies.append(movie)

            logger.info(f"取得 {len(movies)} 部熱門影片")
            return movies

        except Exception as e:
            logger.error(f"取得熱門影片失敗: {e}")
            return []

    def get_movie_subtitles(self, imdb_id: str, language: str = "en") -> List[SubtitleInfo]:
        """取得影片字幕列表"""
        logger.info(f"取得影片字幕: {imdb_id}, 語言: {language}")

        params = {
            "imdb_id": imdb_id,
            "language": language
        }

        try:
            response = self._make_request("/subtitles", params)

            if response.get("status") != "success":
                raise Exception(f"取得字幕失敗: {response.get('message', '未知錯誤')}")

            subtitles = []
            for item in response.get("data", []):
                subtitle = SubtitleInfo(
                    file_id=item.get("file_id"),
                    file_name=item.get("file_name"),
                    language=item.get("language"),
                    download_count=item.get("download_count", 0),
                    rating=item.get("rating", 0),
                    fps=item.get("fps"),
                    encoding=item.get("encoding")
                )
                subtitles.append(subtitle)

            logger.info(f"找到 {len(subtitles)} 個字幕檔案")
            return subtitles

        except Exception as e:
            logger.error(f"取得影片字幕失敗: {e}")
            return []

    def download_subtitle(self, file_id: str) -> str:
        """下載字幕內容"""
        logger.info(f"下載字幕: {file_id}")

        params = {"file_id": file_id}

        try:
            response = self._make_request("/download", params)

            if response.get("status") != "success":
                raise Exception(f"下載字幕失敗: {response.get('message', '未知錯誤')}")

            content = response.get("data", {}).get("content", "")
            if not content:
                raise Exception("字幕內容為空")

            logger.info(f"字幕下載成功，大小: {len(content)} 字元")
            return content

        except Exception as e:
            logger.error(f"下載字幕失敗: {e}")
            raise

    def get_best_subtitle(self, imdb_id: str, language: str = "en") -> Optional[SubtitleInfo]:
        """取得最佳字幕（基於下載次數和評分）"""
        subtitles = self.get_movie_subtitles(imdb_id, language)

        if not subtitles:
            return None

        # 計算綜合評分：下載次數 * 0.7 + 評分 * 0.3
        def calculate_score(subtitle: SubtitleInfo) -> float:
            return (subtitle.download_count * 0.7) + (subtitle.rating * 100 * 0.3)

        best_subtitle = max(subtitles, key=calculate_score)
        logger.info(f"選擇最佳字幕: {best_subtitle.file_name} (下載次數: {best_subtitle.download_count}, 評分: {best_subtitle.rating})")

        return best_subtitle

    def download_best_subtitle(self, imdb_id: str, language: str = "en") -> Optional[str]:
        """下載最佳字幕"""
        best_subtitle = self.get_best_subtitle(imdb_id, language)

        if not best_subtitle:
            logger.warning(f"找不到影片 {imdb_id} 的字幕")
            return None

        try:
            return self.download_subtitle(best_subtitle.file_id)
        except Exception as e:
            logger.error(f"下載最佳字幕失敗: {e}")
            return None