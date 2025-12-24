#!/usr/bin/env python3
import requests
import json

# OpenSubtitles API 配置
API_KEY = "vSuOAURoDGadtGk6End40nf6Eah0bVOF"
API_URL = "https://api.opensubtitles.com/api/v1"

def download_subtitle(file_id):
    """下載字幕檔案"""
    url = f"{API_URL}/download"
    headers = {
        "Api-Key": API_KEY,
        "Content-Type": "application/json",
        "User-Agent": "SubtitleLingo v1.0"
    }

    response = requests.post(url, json={"file_id": file_id}, headers=headers)
    data = response.json()

    if "link" not in data:
        print(f"Error: {data}")
        return None

    # 下載 SRT 檔案
    srt_response = requests.get(data["link"])
    srt_content = srt_response.text

    return {
        "download_info": data,
        "srt_content": srt_content,
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

# 測試下載 Inception 字幕
print("正在下載 Inception 字幕...")
result = download_subtitle(76256)

if result:
    print(f"[OK] Downloaded: {result['file_name']}")
    print(f"[OK] SRT size: {len(result['srt_content'])} bytes")
    print(f"[OK] Remaining quota: {result['download_info']['remaining']}")

    # Parse subtitles
    print("\nParsing SRT...")
    subtitles = parse_srt(result['srt_content'])
    print(f"[OK] Parsed {len(subtitles)} subtitle entries")

    # Show first 3 entries
    print("\nFirst 3 entries:")
    for i, sub in enumerate(subtitles[:3], 1):
        print(f"\n{i}. [{sub['start_time']} --> {sub['end_time']}]")
        print(f"   {sub['text']}")

    # TODO: Save to Turso database
    print("\nNext: Integrate Turso database...")
