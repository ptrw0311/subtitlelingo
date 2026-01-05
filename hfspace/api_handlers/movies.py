import logging
from typing import Dict, Any, Optional
from utils.opensubtitles import OpenSubtitlesClient
from utils.turso_client import TursoClient

logger = logging.getLogger(__name__)

async def handle_popular_movies(data: Dict[str, Any], os_client: OpenSubtitlesClient, turso_client: TursoClient) -> Dict[str, Any]:
    """處理熱門影片請求"""
    try:
        page = int(data.get('page', 1))
        logger.info(f"取得熱門影片，頁面: {page}")

        # 從 OpenSubtitles API 取得熱門影片
        if os_client:
            movies = os_client.get_popular_movies(page)
        else:
            # 如果 OpenSubtitles 不可用，從資料庫取得
            movies = []
            if turso_client:
                db_movies = turso_client.get_popular_movies(20)
                for movie in db_movies:
                    movies.append({
                        'imdb_id': movie['imdb_id'],
                        'title': movie['title'],
                        'year': movie['year'],
                        'poster_url': movie['poster_url'],
                        'download_count': movie['download_count']
                    })

        # 儲存到資料庫
        if movies and turso_client:
            for movie in movies:
                turso_client.save_movie(movie)

        return {
            "success": True,
            "data": movies,
            "page": page,
            "total_count": len(movies),
            "message": f"取得第 {page} 頁熱門影片成功"
        }

    except Exception as e:
        logger.error(f"處理熱門影片請求失敗: {e}")
        return {
            "success": False,
            "error": "取得熱門影片失敗",
            "message": str(e)
        }

async def handle_search_movies(data: Dict[str, Any], os_client: OpenSubtitlesClient, turso_client: TursoClient) -> Dict[str, Any]:
    """處理影片搜尋請求"""
    try:
        query = data.get('query', '').strip()
        page = int(data.get('page', 1))

        if not query:
            return {
                "success": False,
                "error": "搜尋關鍵字不能為空",
                "message": "請提供搜尋關鍵字"
            }

        logger.info(f"搜尋影片: {query}, 頁面: {page}")

        # 優先從資料庫搜尋
        db_movies = []
        if turso_client:
            db_movies = turso_client.search_movies(query, 20)

        # 從 OpenSubtitles API 搜尋
        if os_client:
            api_movies = os_client.search_movies(query, page)

            # 合併結果（去重）
            seen_ids = set(movie.get('imdb_id') for movie in db_movies)
            for api_movie in api_movies:
                if api_movie.get('imdb_id') not in seen_ids:
                    db_movies.append(api_movie)
                    seen_ids.add(api_movie.get('imdb_id'))

            # 儲存新找到的影片
            if api_movies and turso_client:
                for movie in api_movies:
                    if movie.get('imdb_id') not in seen_ids:
                        turso_client.save_movie(movie)

        return {
            "success": True,
            "data": db_movies,
            "query": query,
            "page": page,
            "total_count": len(db_movies),
            "message": f"搜尋 '{query}' 找到 {len(db_movies)} 部影片"
        }

    except Exception as e:
        logger.error(f"處理影片搜尋請求失敗: {e}")
        return {
            "success": False,
            "error": "搜尋影片失敗",
            "message": str(e)
        }

async def handle_movie_details(movie_id: str, turso_client: TursoClient) -> Dict[str, Any]:
    """處理影片詳情請求"""
    try:
        if not movie_id:
            return {
                "success": False,
                "error": "影片 ID 不能為空",
                "message": "請提供有效的 IMDb ID"
            }

        logger.info(f"取得影片詳情: {movie_id}")

        # 從資料庫取得影片詳情
        movie = turso_client.get_movie_by_imdb_id(movie_id) if turso_client else None

        if movie:
            return {
                "success": True,
                "data": movie,
                "imdb_id": movie_id,
                "message": "取得影片詳情成功"
            }
        else:
            return {
                "success": False,
                "error": "找不到影片",
                "message": f"找不到 IMDb ID 為 {movie_id} 的影片資訊"
            }

    except Exception as e:
        logger.error(f"處理影片詳情請求失敗: {e}")
        return {
            "success": False,
            "error": "取得影片詳情失敗",
            "message": str(e)
        }