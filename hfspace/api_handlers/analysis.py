import logging
from typing import Dict, Any, List
from utils.turso_client import TursoClient
from utils.subtitle_parser import SubtitleParser
import json

logger = logging.getLogger(__name__)

async def handle_movie_analysis(movie_id: str, turso_client: TursoClient, subtitle_parser: SubtitleParser) -> Dict[str, Any]:
    """處理影片分析請求"""
    try:
        if not movie_id:
            return {
                "success": False,
                "error": "影片 ID 不能為空",
                "message": "請提供有效的 IMDb ID"
            }

        logger.info(f"開始分析影片: {movie_id}")

        # 檢查是否已有分析結果
        if turso_client:
            existing_analysis = turso_client.get_analysis(movie_id, "comprehensive")
            if existing_analysis:
                logger.info("使用快取的分析結果")
                return {
                    "success": True,
                    "cached": True,
                    "data": {
                        "imdb_id": movie_id,
                        "analysis": json.loads(existing_analysis.get('data', '{}')),
                        "created_at": existing_analysis.get('created_at')
                    },
                    "message": "使用快取分析結果"
                }

        # 取得影片資訊
        movie_info = None
        if turso_client:
            movie_info = turso_client.get_movie_by_imdb_id(movie_id)

        if not movie_info:
            return {
                "success": False,
                "error": "找不到影片資訊",
                "message": f"找不到 IMDb ID 為 {movie_id} 的影片"
            }

        # 取得字幕資料
        subtitle_entries = []
        if turso_client:
            subtitle_entries = turso_client.get_subtitle_entries(movie_id)

        if not subtitle_entries:
            return {
                "success": False,
                "error": "找不到字幕資料",
                "message": f"影片 {movie_id} 沒有字幕資料，請先抓取字幕"
            }

        # 執行各種分析
        analysis_results = {
            "movie_info": {
                "title": movie_info.get('title'),
                "year": movie_info.get('year'),
                "imdb_id": movie_id
            },
            "subtitle_statistics": analyze_subtitle_statistics(subtitle_entries, subtitle_parser),
            "dialogue_analysis": analyze_dialogues(subtitle_entries, subtitle_parser),
            "vocabulary_analysis": analyze_vocabulary(subtitle_entries),
            "difficulty_assessment": assess_difficulty(subtitle_entries),
            "learning_recommendations": generate_learning_recommendations(subtitle_entries)
        }

        # 儲存分析結果
        if turso_client:
            turso_client.save_analysis({
                "movie_id": movie_id,
                "analysis_type": "comprehensive",
                "data": analysis_results
            })

        logger.info(f"影片分析完成: {movie_info.get('title')}")

        return {
            "success": True,
            "cached": False,
            "data": {
                "imdb_id": movie_id,
                "analysis": analysis_results,
                "summary": {
                    "total_subtitles": len(subtitle_entries),
                    "duration_minutes": analysis_results.get("subtitle_statistics", {}).get("total_duration_formatted", "未知"),
                    "difficulty_level": analysis_results.get("difficulty_assessment", {}).get("overall_level", "未知"),
                    "estimated_vocabulary_size": analysis_results.get("vocabulary_analysis", {}).get("unique_words_count", 0)
                }
            },
            "message": f"影片分析完成: {movie_info.get('title')}"
        }

    except Exception as e:
        logger.error(f"處理影片分析請求失敗: {e}")
        return {
            "success": False,
            "error": "影片分析失敗",
            "message": str(e)
        }

def analyze_subtitle_statistics(subtitle_entries: List[Dict], subtitle_parser: SubtitleParser) -> Dict[str, Any]:
    """分析字幕統計資訊"""
    try:
        if not subtitle_entries:
            return {}

        # 轉換為 SubtitleEntry 物件
        entries = []
        for entry in subtitle_entries:
            from utils.subtitle_parser import SubtitleEntry
            entries.append(SubtitleEntry(
                index=entry.get('sequence_number', entry.get('index', 0)),
                start_time=entry.get('start_time', ''),
                end_time=entry.get('end_time', ''),
                text=entry.get('text', ''),
                start_ms=0,  # 暫時設為 0
                end_ms=0     # 暫時設為 0
            ))

        # 使用解析器取得統計資訊
        stats = subtitle_parser.get_statistics(entries)

        # 額外的統計分析
        dialogues = subtitle_parser.extract_dialogues(entries)

        return {
            **stats,
            "dialogue_count": len(dialogues),
            "average_dialogue_duration": sum(d.get('duration', 0) for d in dialogues) / len(dialogues) if dialogues else 0,
            "longest_dialogue": max(dialogues, key=lambda d: len(d.get('text', '')), default=None),
            "subtitles_per_minute": len(entries) / (stats.get('total_duration_ms', 1) / 60000)
        }

    except Exception as e:
        logger.error(f"字幕統計分析失敗: {e}")
        return {}

def analyze_dialogues(subtitle_entries: List[Dict], subtitle_parser: SubtitleParser) -> Dict[str, Any]:
    """分析對話內容"""
    try:
        if not subtitle_entries:
            return {}

        # 轉換為 SubtitleEntry 物件
        entries = []
        for entry in subtitle_entries:
            from utils.subtitle_parser import SubtitleEntry
            entries.append(SubtitleEntry(
                index=entry.get('sequence_number', entry.get('index', 0)),
                start_time=entry.get('start_time', ''),
                end_time=entry.get('end_time', ''),
                text=entry.get('text', ''),
                start_ms=0,
                end_ms=0
            ))

        # 提取對話片段
        dialogues = subtitle_parser.extract_dialogues(entries)

        # 分析對話特徵
        dialogue_lengths = [len(d.get('text', '').split()) for d in dialogues]
        dialogue_durations = [d.get('duration', 0) for d in dialogues]

        return {
            "total_dialogues": len(dialogues),
            "average_dialogue_length": sum(dialogue_lengths) / len(dialogue_lengths) if dialogue_lengths else 0,
            "average_dialogue_duration": sum(dialogue_durations) / len(dialogue_durations) if dialogue_durations else 0,
            "shortest_dialogue": min(dialogue_lengths) if dialogue_lengths else 0,
            "longest_dialogue": max(dialogue_lengths) if dialogue_lengths else 0,
            "dialogues_per_minute": len(dialogues) / (sum(dialogue_durations) / 60000) if dialogue_durations else 0
        }

    except Exception as e:
        logger.error(f"對話分析失敗: {e}")
        return {}

def analyze_vocabulary(subtitle_entries: List[Dict]) -> Dict[str, Any]:
    """分析詞彙使用"""
    try:
        if not subtitle_entries:
            return {}

        # 收集所有文字
        all_text = " ".join(entry.get('text', '') for entry in subtitle_entries)

        # 簡單的詞彙分析
        import re
        words = re.findall(r'\b[a-zA-Z]+\b', all_text.lower())

        # 詞頻統計
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1

        # 排序並取得常用詞
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)

        # 識別可能的生字 (出現次數少的詞)
        rare_words = [word for word, freq in sorted_words if freq <= 2]

        # 常用詞彙
        common_words = sorted_words[:20] if len(sorted_words) >= 20 else sorted_words

        return {
            "total_words": len(words),
            "unique_words_count": len(word_freq),
            "word_frequency": dict(sorted_words[:50]),  # 前 50 個常用詞
            "common_words": common_words,
            "rare_words": rare_words[:20],  # 前 20 個可能生字
            "vocabulary_diversity": len(word_freq) / len(words) if words else 0,  # 詞彙多樣性
            "average_word_length": sum(len(word) for word in words) / len(words) if words else 0
        }

    except Exception as e:
        logger.error(f"詞彙分析失敗: {e}")
        return {}

def assess_difficulty(subtitle_entries: List[Dict]) -> Dict[str, Any]:
    """評估影片難度"""
    try:
        if not subtitle_entries:
            return {}

        # 詞彙分析
        vocab_analysis = analyze_vocabulary(subtitle_entries)

        # 字幕統計
        total_words = vocab_analysis.get('total_words', 0)
        unique_words = vocab_analysis.get('unique_words_count', 0)
        avg_word_length = vocab_analysis.get('average_word_length', 0)
        vocab_diversity = vocab_analysis.get('vocabulary_diversity', 0)

        # 對話速度分析
        all_text = " ".join(entry.get('text', '') for entry in subtitle_entries)
        dialogue_speed = total_words / 10  # 假設 10 分鐘的影片內容

        # 難度評分邏輯
        difficulty_score = 0

        # 詞彙複雜度 (30%)
        if avg_word_length > 5:
            difficulty_score += 30
        elif avg_word_length > 4:
            difficulty_score += 20
        else:
            difficulty_score += 10

        # 詞彙多樣性 (25%)
        if vocab_diversity > 0.7:
            difficulty_score += 25
        elif vocab_diversity > 0.5:
            difficulty_score += 15
        else:
            difficulty_score += 5

        # 對話速度 (25%)
        if dialogue_speed > 15:
            difficulty_score += 25
        elif dialogue_speed > 10:
            difficulty_score += 15
        else:
            difficulty_score += 5

        # 內容複雜度 (20%)
        rare_words_ratio = len(vocab_analysis.get('rare_words', [])) / unique_words if unique_words > 0 else 0
        if rare_words_ratio > 0.3:
            difficulty_score += 20
        elif rare_words_ratio > 0.2:
            difficulty_score += 15
        else:
            difficulty_score += 10

        # 決定難度等級
        if difficulty_score >= 80:
            level = "Advanced"
            level_zh = "高級"
        elif difficulty_score >= 60:
            level = "Intermediate-High"
            level_zh = "中高級"
        elif difficulty_score >= 40:
            level = "Intermediate"
            level_zh = "中級"
        elif difficulty_score >= 20:
            level = "Beginner-High"
            level_zh = "初高級"
        else:
            level = "Beginner"
            level_zh = "初級"

        return {
            "overall_score": difficulty_score,
            "overall_level": level,
            "overall_level_zh": level_zh,
            "vocabulary_complexity": "high" if avg_word_length > 5 else "medium" if avg_word_length > 4 else "low",
            "speaking_speed": "fast" if dialogue_speed > 15 else "medium" if dialogue_speed > 10 else "slow",
            "content_complexity": "complex" if rare_words_ratio > 0.3 else "moderate" if rare_words_ratio > 0.2 else "simple"
        }

    except Exception as e:
        logger.error(f"難度評估失敗: {e}")
        return {}

def generate_learning_recommendations(subtitle_entries: List[Dict]) -> Dict[str, Any]:
    """生成學習建議"""
    try:
        if not subtitle_entries:
            return {}

        # 取得分析結果
        vocab_analysis = analyze_vocabulary(subtitle_entries)
        difficulty_assessment = assess_difficulty(subtitle_entries)

        level = difficulty_assessment.get('overall_level', 'Unknown')
        rare_words = vocab_analysis.get('rare_words', [])

        # 根據難度等級生成建議
        recommendations = {
            "suitable_for": [],
            "learning_focus": [],
            "study_tips": [],
            "estimated_study_time": "",
            "prerequisite_level": ""
        }

        if level in ['Beginner', 'Beginner-High']:
            recommendations.update({
                "suitable_for": ["初學者", "基礎英文学習者"],
                "learning_focus": ["基本詞彙", "簡單句型", "日常對話"],
                "study_tips": [
                    "先看中文字幕理解故事",
                    "重複觀看並注意常用詞彙",
                    "練習跟讀簡單對話"
                ],
                "estimated_study_time": "2-3 週",
                "prerequisite_level": "A1-A2"
            })
        elif level in ['Intermediate', 'Intermediate-High']:
            recommendations.update({
                "suitable_for": ["中級學習者", "進階英文学習者"],
                "learning_focus": ["口語表達", "俚語和慣用語", "連讀技巧"],
                "study_tips": [
                    "關注語氣和情感表達",
                    "學習自然對話節奏",
                    "練習聽懂不同口音"
                ],
                "estimated_study_time": "3-4 週",
                "prerequisite_level": "B1-B2"
            })
        else:  # Advanced
            recommendations.update({
                "suitable_for": ["高級學習者", "母語程度學習者"],
                "learning_focus": ["文化背景", "專業詞彙", "細微語義差異"],
                "study_tips": [
                    "深入了解文化背景",
                    "分析語言的微妙之處",
                    "練習即時翻譯技巧"
                ],
                "estimated_study_time": "4-6 週",
                "prerequisite_level": "C1-C2"
            })

        # 特別建議
        if len(rare_words) > 50:
            recommendations["learning_focus"].append("大量生字學習")
            recommendations["study_tips"].append("建議使用生字卡記憶")

        if vocab_analysis.get('vocabulary_diversity', 0) > 0.8:
            recommendations["learning_focus"].append("詞彙變化學習")

        return recommendations

    except Exception as e:
        logger.error(f"生成學習建議失敗: {e}")
        return {}