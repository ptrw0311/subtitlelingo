#!/usr/bin/env python3
import os
import requests
import json
from datetime import datetime

# 配置
TURSO_HTTP_URL = os.getenv("VITE_TURSO_HTTP_URL", "https://subtitlelingo-peterwang.aws-ap-northeast-1.turso.io")
TURSO_AUTH_TOKEN = os.getenv("VITE_TURSO_AUTH_TOKEN", "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjU1MjcyNTQsImlkIjoiOTY0ZjBjMjMtMTEzYi00YjEwLTg3N2UtM2I2NjVhNmYyYjg3IiwicmlkIjoiNzEyZmJhNmQtODY4YS00ZGU2LTg5NTEtNDNlOWExY2UyNzA3In0.w228JKt8eUFbWMoeKKQOwWsZGL1lkvOJ5Ho9_mbf2n34_IZrpakq69VoB4jtPN1I9-ZEbOMio3Xyb2A-pJ--CA")
OPENSUBTITLES_API_KEY = "vSuOAURoDGadtGk6End40nf6Eah0bVOF"

def execute_turso_sql(sql, params=None):
    """執行 Turso SQL 查詢"""
    headers = {
        "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    # 如果沒有參數，使用簡化格式
    if not params:
        data = {
            "statements": [
                {"q": sql}
            ]
        }
    else:
        data = {
            "statements": [
                {
                    "q": sql,
                    "params": params
                }
            ]
        }

    response = requests.post(TURSO_HTTP_URL, headers=headers, json=data)

    # 輸出錯誤詳情
    if not response.ok:
        print(f"API Error: {response.status_code}")
        print(f"Response: {response.text}")

    response.raise_for_status()
    return response.json()

def create_turso_tables():
    """創建 Turso 資料庫表格"""
    # 創建 movies 表
    sql_movies = """
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            imdb_id TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            year INTEGER,
            subtitle_languages TEXT,
            last_subtitle_fetch TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """

    # 創建 subtitles 表
    sql_subtitles = """
        CREATE TABLE IF NOT EXISTS subtitles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            imdb_id TEXT NOT NULL,
            language TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            text TEXT NOT NULL,
            sequence_number INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (imdb_id) REFERENCES movies(imdb_id),
            UNIQUE(imdb_id, language, sequence_number)
        )
    """

    execute_turso_sql(sql_movies)
    execute_turso_sql(sql_subtitles)
    print("[OK] Database tables created")

def download_subtitle(file_id):
    """下載字幕檔案"""
    url = f"https://api.opensubtitles.com/api/v1/download"
    headers = {
        "Api-Key": OPENSUBTITLES_API_KEY,
        "Content-Type": "application/json",
        "User-Agent": "SubtitleLingo v1.0"
    }

    response = requests.post(url, json={"file_id": file_id}, headers=headers)
    data = response.json()

    if "link" not in data:
        return None

    srt_response = requests.get(data["link"])
    return {
        "download_info": data,
        "srt_content": srt_response.text,
        "file_name": data.get("file_name", "subtitle.srt")
    }

def parse_srt(content):
    """解析 SRT 格式"""
    lines = content.split('\n')
    subtitles = []
    current = None

    for line in lines:
        line = line.strip()
        if not line:
            if current and current.get('text'):
                subtitles.append(current)
                current = None
        elif line.isdigit():
            current = {'sequence_number': int(line)}
        elif '-->' in line:
            parts = line.split('-->')
            current['start_time'] = parts[0].strip()
            current['end_time'] = parts[1].strip()
        elif current:
            if current.get('text'):
                current['text'] += ' ' + line
            else:
                current['text'] = line

    return subtitles

def save_to_turso(imdb_id, movie_title, movie_year, language, subtitles):
    """儲存字幕到 Turso 資料庫 (使用現有表格結構)"""
    try:
        now = datetime.now().isoformat()

        # 檢查影片是否已存在
        check_sql = "SELECT id FROM movies WHERE imdb_id = ?"
        result = execute_turso_sql(check_sql, [imdb_id])

        movie_id = None
        if result and len(result) > 0 and 'results' in result[0]:
            rows = result[0]['results'].get('rows', [])
            if len(rows) > 0:
                movie_id = rows[0][0]
                print(f"[INFO] Movie exists with ID: {movie_id}")

        # 如果影片不存在，插入新影片
        if not movie_id:
            # 使用隨機 UUID 作為 movie_id
            import uuid
            movie_id = str(uuid.uuid4())

            sql_movie = """
                INSERT INTO movies (id, imdb_id, title, year, type, download_count, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'movie', 1, ?, ?)
            """

            execute_turso_sql(sql_movie, [movie_id, imdb_id, movie_title, movie_year, now, now])
            print(f"[OK] Created new movie with ID: {movie_id}")
        else:
            # 更新影片的下載次數
            update_sql = """
                UPDATE movies SET download_count = download_count + 1, updated_at = ?
                WHERE imdb_id = ?
            """
            execute_turso_sql(update_sql, [now, imdb_id])
            print(f"[OK] Updated movie download count")

        # 重新構建 SRT 內容
        srt_lines = []
        for sub in subtitles:
            srt_lines.append(str(sub['sequence_number']))
            srt_lines.append(f"{sub['start_time']} --> {sub['end_time']}")
            srt_lines.append(sub['text'])
            srt_lines.append('')  # 空行分隔

        srt_content = '\n'.join(srt_lines)

        # 插入或更新字幕 (整個 SRT 內容存儲在一筆記錄)
        sql_check_subtitle = "SELECT id FROM subtitles WHERE movie_id = ? AND language = ?"
        result = execute_turso_sql(sql_check_subtitle, [movie_id, language])

        if result and len(result) > 0 and 'results' in result[0]:
            rows = result[0]['results'].get('rows', [])
            if len(rows) > 0:
                # 字幕已存在，更新
                subtitle_id = rows[0][0]
                sql_update = "UPDATE subtitles SET srt_content = ?, created_at = ? WHERE id = ?"
                execute_turso_sql(sql_update, [srt_content, now, subtitle_id])
                print(f"[OK] Updated existing subtitle (ID: {subtitle_id})")
            else:
                # 插入新字幕
                import uuid
                subtitle_id = str(uuid.uuid4())
                sql_insert = "INSERT INTO subtitles (id, movie_id, srt_content, language, created_at) VALUES (?, ?, ?, ?, ?)"
                execute_turso_sql(sql_insert, [subtitle_id, movie_id, srt_content, language, now])
                print(f"[OK] Created new subtitle (ID: {subtitle_id})")
        else:
            # 插入新字幕
            import uuid
            subtitle_id = str(uuid.uuid4())
            sql_insert = "INSERT INTO subtitles (id, movie_id, srt_content, language, created_at) VALUES (?, ?, ?, ?, ?)"
            execute_turso_sql(sql_insert, [subtitle_id, movie_id, srt_content, language, now])
            print(f"[OK] Created new subtitle (ID: {subtitle_id})")

        print(f"[OK] Total saved {len(subtitles)} subtitle entries to Turso database")
        print(f"[INFO] Stored as single SRT content blob ({len(srt_content)} bytes)")
        return True

    except Exception as e:
        print(f"[ERROR] Failed to save to Turso: {e}")
        import traceback
        traceback.print_exc()
        return False

# 主程式
if __name__ == "__main__":
    print("Testing Turso database integration...")
    print("Using existing database schema\n")

    print("\nDownloading Inception subtitles (file_id: 76256)...")
    result = download_subtitle(76256)

    if result:
        print(f"[OK] Downloaded: {result['file_name']}")
        print(f"[OK] SRT size: {len(result['srt_content'])} bytes")

        print("\nParsing subtitles...")
        subtitles = parse_srt(result['srt_content'])
        print(f"[OK] Parsed {len(subtitles)} subtitle entries")

        print("\nSaving to Turso database...")
        success = save_to_turso(
            imdb_id="tt1375666",
            movie_title="Inception",
            movie_year=2010,
            language="en",
            subtitles=subtitles
        )

        if success:
            print("\n[SUCCESS] Subtitles successfully saved to Turso database!")
            print(f"Total entries: {len(subtitles)}")
            print(f"IMDb ID: tt1375666")
            print(f"Language: en")

            # 驗證資料
            print("\n--- Verifying data in Turso database ---")

            # 查詢影片資訊
            print("\nQuerying movie info...")
            result = execute_turso_sql("SELECT * FROM movies WHERE imdb_id = 'tt1375666'")

            if result and len(result) > 0 and 'results' in result[0]:
                query_result = result[0]['results']
                rows = query_result.get('rows', [])

                if len(rows) > 0:
                    columns = query_result.get('columns', [])
                    row_dict = dict(zip(columns, rows[0]))
                    print(f"[OK] Movie found:")
                    print(f"  ID: {row_dict.get('id')}")
                    print(f"  Title: {row_dict.get('title')}")
                    print(f"  Year: {row_dict.get('year')}")
                    print(f"  IMDb ID: {row_dict.get('imdb_id')}")
                    print(f"  Type: {row_dict.get('type')}")
                    print(f"  Download Count: {row_dict.get('download_count')}")
                else:
                    print("[ERROR] Movie not found")
            else:
                print("[ERROR] Unexpected result format")

            # 查詢字幕
            print("\nQuerying subtitles...")
            result = execute_turso_sql("""
                SELECT s.id, s.movie_id, s.language,
                       LENGTH(s.srt_content) as content_size,
                       s.created_at
                FROM subtitles s
                JOIN movies m ON s.movie_id = m.id
                WHERE m.imdb_id = 'tt1375666'
            """)

            if result and len(result) > 0 and 'results' in result[0]:
                query_result = result[0]['results']
                rows = query_result.get('rows', [])

                if len(rows) > 0:
                    columns = query_result.get('columns', [])
                    print(f"[OK] Found {len(rows)} subtitle(s):")
                    for row in rows:
                        row_dict = dict(zip(columns, row))
                        print(f"  ID: {row_dict.get('id')}")
                        print(f"  Language: {row_dict.get('language')}")
                        print(f"  Content Size: {row_dict.get('content_size')} bytes")
                        print(f"  Created: {row_dict.get('created_at')}")
                else:
                    print("[ERROR] No subtitles found")
            else:
                print("[ERROR] Unexpected result format")
