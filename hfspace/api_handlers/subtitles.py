import logging
from typing import Dict, Any
from utils.opensubtitles import OpenSubtitlesClient
from utils.subtitle_parser import SubtitleParser
from utils.turso_client import TursoClient

logger = logging.getLogger(__name__)

async def handle_subtitle_fetch(data: Dict[str, Any], os_client: OpenSubtitlesClient,
                              subtitle_parser: SubtitleParser, turso_client: TursoClient) -> Dict[str, Any]:
    """處理字幕抓取請求"""
    try:
        imdb_id = data.get('imdb_id')
        language = data.get('language', 'en')
        force_refresh = data.get('force_refresh', False)

        if not imdb_id:
            return {
                "success": False,
                "error": "IMDb ID 不能為空",
                "message": "請提供有效的 IMDb ID"
            }

        logger.info(f"開始抓取字幕: {imdb_id}, 語言: {language}")

        # 檢查是否已存在字幕
        existing_subtitle = None
        if not force_refresh and turso_client:
            existing_subtitle = turso_client.get_subtitle_by_imdb_id(imdb_id)

        if existing_subtitle and not force_refresh:
            # 取得字幕條目
            entries = turso_client.get_subtitle_entries(imdb_id)
            return {
                "success": True,
                "cached": True,
                "data": {
                    "imdb_id": imdb_id,
                    "language": language,
                    "file_name": existing_subtitle.get('file_name'),
                    "download_count": existing_subtitle.get('download_count', 0),
                    "rating": existing_subtitle.get('rating', 0),
                    "entries_count": len(entries),
                    "entries": entries
                },
                "message": "使用快取字幕"
            }

        # 抓取字幕
        if os_client:
            logger.info(f"從 OpenSubtitles 下載字幕...")
            subtitle_content = os_client.download_best_subtitle(imdb_id, language)

            if subtitle_content:
                logger.info(f"字幕下載成功，開始解析...")
                # 解析字幕
                parsed_entries = subtitle_parser.parse(subtitle_content)

                # 儲存字幕資料
                subtitle_data = {
                    'imdb_id': imdb_id,
                    'language': language,
                    'file_id': f"auto_{imdb_id}_{language}",
                    'file_name': f"{imdb_id}_{language}.srt",
                    'download_count': 0,  # 無法取得
                    'rating': 0,
                    'content': subtitle_content,
                    'parsed_entries': [entry.__dict__ for entry in parsed_entries]
                }

                if turso_client:
                    turso_client.save_subtitle(subtitle_data)

                # 計算統計資訊
                stats = subtitle_parser.get_statistics(parsed_entries)

                logger.info(f"字幕解析完成: {stats.get('total_entries', 0)} 個條目")

                return {
                    "success": True,
                    "cached": False,
                    "data": {
                        "imdb_id": imdb_id,
                        "language": language,
                        "file_name": subtitle_data['file_name'],
                        "entries_count": len(parsed_entries),
                        "entries": subtitle_data['parsed_entries'],
                        "statistics": stats
                    },
                    "message": f"字幕抓取和解析成功，共 {len(parsed_entries)} 個條目"
                }
            else:
                return {
                    "success": False,
                    "error": "字幕下載失敗",
                    "message": "無法下載字幕內容"
                }
        else:
            return {
                "success": False,
                "error": "OpenSubtitles 客戶端未連線",
                "message": "無法連接到 OpenSubtitles API"
            }

    except Exception as e:
        logger.error(f"處理字幕抓取請求失敗: {e}")
        return {
            "success": False,
            "error": "字幕抓取失敗",
            "message": str(e)
        }

async def get_subtitle_statistics(imdb_id: str, turso_client: TursoClient) -> Dict[str, Any]:
    """取得字幕統計資訊"""
    try:
        if not turso_client:
            return {
                "success": False,
                "error": "資料庫客戶端未連線",
                "message": "無法取得字幕統計"
            }

        # 取得字幕元資料
        metadata = turso_client.get_subtitle_by_imdb_id(imdb_id)
        if not metadata:
            return {
                "success": False,
                "error": "找不到字幕資料",
                "message": f"影片 {imdb_id} 沒有字幕資料"
            }

        # 取得字幕條目
        entries = turso_client.get_subtitle_entries(imdb_id)

        if not entries:
            return {
                "success": True,
                "data": {
                    "imdb_id": imdb_id,
                    "metadata": metadata,
                    "entries_count": 0,
                    "entries": []
                },
                "message": "影片沒有字幕條目"
            }

        # 計算統計資訊
        parser = SubtitleParser()
        stats = parser.get_statistics(entries)

        return {
            "success": True,
            "data": {
                "imdb_id": imdb_id,
                "metadata": metadata,
                "entries_count": len(entries),
                "entries": entries,
                "statistics": stats
            },
            "message": f"取得字幕統計成功，共 {len(entries)} 個條目"
        }

    except Exception as e:
        logger.error(f"取得字幕統計失敗: {e}")
        return {
            "success": False,
            "error": "取得統計失敗",
            "message": str(e)
        }