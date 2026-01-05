import re
import logging
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import chardet

logger = logging.getLogger(__name__)

@dataclass
class SubtitleEntry:
    """字幕條目類別"""
    index: int
    start_time: str
    end_time: str
    text: str
    start_ms: int
    end_ms: int

class SubtitleParser:
    """字幕解析器，支援 SRT 和 VTT 格式"""

    @staticmethod
    def parse_time(time_str: str) -> Tuple[str, int]:
        """解析時間字串，返回標準格式和毫秒數"""
        # 移除可能的 HTML 標籤
        clean_time = re.sub(r'<[^>]+>', '', time_str).strip()

        # 處理 SRT 格式 (HH:MM:SS,mmm)
        if ',' in clean_time:
            time_part, ms_part = clean_time.split(',')
            hours, minutes, seconds = time_part.split(':')
            total_ms = int(hours) * 3600000 + int(minutes) * 60000 + int(seconds) * 1000 + int(ms_part)
            return clean_time, total_ms

        # 處理 VTT 格式 (HH:MM:SS.mmm)
        elif '.' in clean_time:
            time_part, ms_part = clean_time.split('.')
            hours, minutes, seconds = time_part.split(':')
            # 補齊到 3 位數
            ms_part = ms_part.ljust(3, '0')
            total_ms = int(hours) * 3600000 + int(minutes) * 60000 + int(seconds) * 1000 + int(ms_part)
            return f"{time_part}.{ms_part}", total_ms

        # 處理純秒數格式
        elif ':' in clean_time:
            parts = clean_time.split(':')
            if len(parts) == 2:  # MM:SS
                minutes, seconds = parts
                total_ms = int(minutes) * 60000 + int(seconds) * 1000
            elif len(parts) == 3:  # HH:MM:SS
                hours, minutes, seconds = parts
                total_ms = int(hours) * 3600000 + int(minutes) * 60000 + int(seconds) * 1000
            else:
                raise ValueError(f"無效的時間格式: {clean_time}")
            return clean_time, total_ms

        else:
            raise ValueError(f"無效的時間格式: {clean_time}")

    @staticmethod
    def clean_subtitle_text(text: str) -> str:
        """清理字幕文字，移除 HTML 標籤和多餘空白"""
        # 移除 HTML 標籤
        clean_text = re.sub(r'<[^>]+>', '', text)
        # 移除字體設定
        clean_text = re.sub(r'<\/?font[^>]*>', '', clean_text)
        # 移除顏色設定
        clean_text = re.sub(r'<\/?color[^>]*>', '', clean_text)
        # 清理多餘空白和換行
        clean_text = re.sub(r'\s+', ' ', clean_text.strip())
        return clean_text

    def parse_srt(self, content: str) -> List[SubtitleEntry]:
        """解析 SRT 格式字幕"""
        logger.info("開始解析 SRT 格式字幕")

        # 檢測編碼
        if isinstance(content, bytes):
            try:
                detected = chardet.detect(content)
                encoding = detected['encoding']
                logger.info(f"檢測到編碼: {encoding} (信心度: {detected.get('confidence', 0):.2f})")
                content = content.decode(encoding)
            except:
                content = content.decode('utf-8', errors='ignore')
                logger.warning("無法檢測編碼，使用 UTF-8")

        # 分割字幕條目
        blocks = re.split(r'\n\s*\n', content.strip())
        entries = []

        for block in blocks:
            if not block.strip():
                continue

            lines = block.strip().split('\n')
            if len(lines) < 3:
                continue

            try:
                # 第一行：序號
                index = int(lines[0].strip())

                # 第二行：時間範圍
                time_line = lines[1].strip()
                if ' --> ' not in time_line:
                    continue

                start_time_str, end_time_str = time_line.split(' --> ')
                start_time_clean, start_ms = self.parse_time(start_time_str.strip())
                end_time_clean, end_ms = self.parse_time(end_time_str.strip())

                # 第三行及之後：字幕文字
                text = '\n'.join(lines[2:])
                clean_text = self.clean_subtitle_text(text)

                entry = SubtitleEntry(
                    index=index,
                    start_time=start_time_clean,
                    end_time=end_time_clean,
                    text=clean_text,
                    start_ms=start_ms,
                    end_ms=end_ms
                )
                entries.append(entry)

            except (ValueError, IndexError) as e:
                logger.warning(f"解析字幕條目失敗: {e}, 條目內容: {block[:50]}...")
                continue

        logger.info(f"成功解析 {len(entries)} 個字幕條目")
        return entries

    def parse_vtt(self, content: str) -> List[SubtitleEntry]:
        """解析 VTT 格式字幕"""
        logger.info("開始解析 VTT 格式字幕")

        # 檢測編碼
        if isinstance(content, bytes):
            try:
                detected = chardet.detect(content)
                encoding = detected['encoding']
                logger.info(f"檢測到編碼: {encoding} (信心度: {detected.get('confidence', 0):.2f})")
                content = content.decode(encoding)
            except:
                content = content.decode('utf-8', errors='ignore')
                logger.warning("無法檢測編碼，使用 UTF-8")

        lines = content.strip().split('\n')
        entries = []

        # 跳過 VTT 檔頭
        i = 0
        while i < len(lines) and not lines[i].startswith('NOTE'):
            if lines[i].strip().startswith('WEBVTT') or '-->' in lines[i]:
                i += 1
            else:
                break

        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue

            if ' --> ' in line:
                # 解析時間行
                time_line = line
                start_time_str, end_time_str = time_line.split(' --> ')

                try:
                    start_time_clean, start_ms = self.parse_time(start_time_str.strip())
                    end_time_clean, end_ms = self.parse_time(end_time_str.strip())
                except ValueError as e:
                    logger.warning(f"解析 VTT 時間失敗: {e}")
                    i += 1
                    continue

                # 收集字幕文字
                i += 1
                text_lines = []
                while i < len(lines) and lines[i].strip():
                    text_lines.append(lines[i])
                    i += 1

                if text_lines:
                    text = '\n'.join(text_lines)
                    clean_text = self.clean_subtitle_text(text)

                    # 生成序號（VTT 可能沒有序號）
                    index = len(entries) + 1

                    entry = SubtitleEntry(
                        index=index,
                        start_time=start_time_clean,
                        end_time=end_time_clean,
                        text=clean_text,
                        start_ms=start_ms,
                        end_ms=end_ms
                    )
                    entries.append(entry)

        logger.info(f"成功解析 {len(entries)} 個字幕條目")
        return entries

    def auto_detect_format(self, content: str) -> str:
        """自動檢測字幕格式"""
        if isinstance(content, bytes):
            content = content.decode('utf-8', errors='ignore')

        if 'WEBVTT' in content[:100]:
            return 'vtt'
        elif '-->' in content and re.search(r'\d+\n\d{2}:\d{2}:\d{2},\d{3}', content):
            return 'srt'
        else:
            logger.warning("無法自動檢測字幕格式，嘗試 SRT")
            return 'srt'

    def parse(self, content: str, format: Optional[str] = None) -> List[SubtitleEntry]:
        """解析字幕內容"""
        if not format:
            format = self.auto_detect_format(content)

        if format.lower() == 'vtt':
            return self.parse_vtt(content)
        elif format.lower() == 'srt':
            return self.parse_srt(content)
        else:
            raise ValueError(f"不支援的字幕格式: {format}")

    def extract_dialogues(self, entries: List[SubtitleEntry], min_duration: int = 2000) -> List[Dict]:
        """提取對話片段（基於時間間隔）"""
        logger.info("開始提取對話片段")

        if not entries:
            return []

        dialogues = []
        current_dialogue = []
        last_gap = 0

        for i, entry in enumerate(entries):
            # 計算與前一個字幕的間隔
            if i > 0:
                gap = entry.start_ms - entries[i-1].end_ms
                if gap > min_duration and current_dialogue:
                    # 如果間隔足夠大，結束當前對話
                    dialogue = {
                        'start_index': current_dialogue[0]['index'],
                        'end_index': current_dialogue[-1]['index'],
                        'start_time': current_dialogue[0]['start_time'],
                        'end_time': current_dialogue[-1]['end_time'],
                        'duration': current_dialogue[-1]['end_ms'] - current_dialogue[0]['start_ms'],
                        'entries': current_dialogue,
                        'text': ' '.join([e['text'] for e in current_dialogue])
                    }
                    dialogues.append(dialogue)
                    current_dialogue = []
                last_gap = gap

            # 添加當前字幕到對話中
            current_dialogue.append({
                'index': entry.index,
                'start_time': entry.start_time,
                'end_time': entry.end_time,
                'text': entry.text
            })

        # 添加最後一個對話
        if current_dialogue:
            dialogue = {
                'start_index': current_dialogue[0]['index'],
                'end_index': current_dialogue[-1]['index'],
                'start_time': current_dialogue[0]['start_time'],
                'end_time': current_dialogue[-1]['end_time'],
                'duration': current_dialogue[-1]['end_ms'] - current_dialogue[0]['start_ms'],
                'entries': current_dialogue,
                'text': ' '.join([e['text'] for e in current_dialogue])
            }
            dialogues.append(dialogue)

        logger.info(f"提取了 {len(dialogues)} 個對話片段")
        return dialogues

    def get_statistics(self, entries: List[SubtitleEntry]) -> Dict[str, Any]:
        """取得字幕統計資訊"""
        if not entries:
            return {}

        total_duration = entries[-1].end_ms - entries[0].start_ms if entries else 0
        avg_duration = sum(entry.end_ms - entry.start_ms for entry in entries) / len(entries)
        word_count = sum(len(entry.text.split()) for entry in entries)

        return {
            'total_entries': len(entries),
            'total_duration_ms': total_duration,
            'average_duration_ms': avg_duration,
            'total_words': word_count,
            'average_words_per_entry': word_count / len(entries) if entries else 0,
            'total_duration_formatted': self._format_duration(total_duration)
        }

    @staticmethod
    def _format_duration(ms: int) -> str:
        """格式化持續時間"""
        hours = ms // 3600000
        minutes = (ms % 3600000) // 60000
        seconds = (ms % 60000) // 1000

        if hours > 0:
            return f"{hours}小時{minutes}分{seconds}秒"
        elif minutes > 0:
            return f"{minutes}分{seconds}秒"
        else:
            return f"{seconds}秒"