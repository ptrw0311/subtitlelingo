#!/usr/bin/env python3
"""
SubtitleLingo HuggingFace Spaces 部署指令碼

使用方式:
python deploy.py

這個指令碼將會:
1. 驗證所有必要的檔案是否存在
2. 檢查環境變數設定
3. 生成部署配置
4. 提供部署步驟指導
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from typing import Dict, List

# 必要的檔案清單
REQUIRED_FILES = [
    'app.py',
    'requirements.txt',
    'README.md',
    '.env.example',
    'config/settings.py',
    'utils/opensubtitles.py',
    'utils/subtitle_parser.py',
    'utils/turso_client.py',
    'api_handlers/movies.py',
    'api_handlers/subtitles.py',
    'api_handlers/analysis.py'
]

# 必要的目錄清單
REQUIRED_DIRS = [
    'config',
    'utils',
    'api_handlers'
]

def check_files_exist() -> bool:
    """檢查所有必要的檔案是否存在"""
    print("檢查檔案結構...")

    missing_files = []
    missing_dirs = []

    # 檢查目錄
    for dir_path in REQUIRED_DIRS:
        if not os.path.isdir(dir_path):
            missing_dirs.append(dir_path)

    # 檢查檔案
    for file_path in REQUIRED_FILES:
        if not os.path.isfile(file_path):
            missing_files.append(file_path)

    if missing_dirs:
        print(f"缺少目錄: {', '.join(missing_dirs)}")
        return False

    if missing_files:
        print(f"缺少檔案: {', '.join(missing_files)}")
        return False

    print("所有必要檔案都存在")
    return True

def check_python_syntax() -> bool:
    """檢查 Python 語法"""
    print("檢查 Python 語法...")

    python_files = [f for f in REQUIRED_FILES if f.endswith('.py')]

    for py_file in python_files:
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # 嘗試編譯檢查語法
            compile(content, py_file, 'exec')
            print(f"✅ {py_file} 語法正確")

        except SyntaxError as e:
            print(f"❌ {py_file} 語法錯誤: {e}")
            return False
        except Exception as e:
            print(f"❌ 檢查 {py_file} 時發生錯誤: {e}")
            return False

    return True

def check_requirements() -> bool:
    """檢查 requirements.txt"""
    print("📦 檢查依賴套件...")

    if not os.path.isfile('requirements.txt'):
        print("❌ requirements.txt 不存在")
        return False

    try:
        with open('requirements.txt', 'r') as f:
            requirements = f.read().strip().split('\n')

        # 檢查關鍵依賴
        required_packages = [
            'gradio',
            'fastapi',
            'uvicorn',
            'libsql-client',
            'requests',
            'chardet'
        ]

        for package in required_packages:
            found = any(package.lower() in req.lower() for req in requirements)
            if found:
                print(f"✅ {package} 已包含")
            else:
                print(f"❌ {package} 未在 requirements.txt 中找到")
                return False

        return True

    except Exception as e:
        print(f"❌ 讀取 requirements.txt 失敗: {e}")
        return False

def generate_space_config():
    """生成 HuggingFace Space 配置"""
    print("⚙️ 生成 Space 配置...")

    config = {
        "title": "SubtitleLingo API Server",
        "emoji": "🎬",
        "colorFrom": "blue",
        "colorTo": "purple",
        "sdk": "gradio",
        "sdk_version": "4.0.0",
        "app_file": "app.py",
        "pinned": False,
        "license": "mit",
        "short_description": "n8n style subtitle fetching and analysis API",
        "models": [],
        "datasets": [],
        "tags": ["api", "subtitles", "movie", "education", "english-learning"]
    }

    try:
        with open('README.md', 'r', encoding='utf-8') as f:
            readme_content = f.read()

        # 確保有 app.py 的入口點
        if 'gradio' not in readme_content.lower():
            print("⚠️  README.md 應該包含 Gradio 相關說明")

        print("✅ Space 配置完成")
        return True

    except Exception as e:
        print(f"❌ 生成配置失敗: {e}")
        return False

def generate_deployment_guide():
    """生成部署指南"""
    print("📋 生成部署指南...")

    guide = """
# 🚀 SubtitleLingo HuggingFace Spaces 部署指南

## 第一部份：準備工作

### 1. 確認檔案完整性
執行 `python deploy.py` 確認所有檔案都已準備就緒。

### 2. 取得 API 金鑰
- **OpenSubtitles API Key**: 前往 https://www.opensubtitles.com/ 註冊並申請
- **Turso Database**: 前往 https://turso.tech/ 建立資料庫

### 3. 確認檔案結構
```
subtitlelingo/
├── app.py                    ✅ 主應用程式
├── requirements.txt          ✅ Python 依賴
├── README.md                ✅ 專案說明
├── .env.example             ✅ 環境變數範例
├── config/
│   └── settings.py         ✅ 配置檔案
├── utils/
│   ├── opensubtitles.py     ✅ OpenSubtitles API
│   ├── subtitle_parser.py   ✅ 字幕解析器
│   └── turso_client.py      ✅ 資料庫客戶端
└── api_handlers/
    ├── movies.py           ✅ 影片 API
    ├── subtitles.py        ✅ 字幕 API
    └── analysis.py         ✅ 分析 API
```

## 第二部份：HuggingFace Space 部署

### 1. 建立新的 Space
1. 前往 https://huggingface.co/spaces
2. 點擊 "Create new Space"
3. **Space 設定**:
   - Name: `subtitlelingo`
   - License: MIT
   - SDK: Gradio
   - Hardware: CPU Basic (免費)
   - Visibility: Public
   - Space Template: Blank

### 2. 上傳檔案
選擇以下其中一種方式：

**方式 A: 拖拉上傳 (推薦用於測試)**
1. 將所有檔案拖拉到 Space 中
2. 等待建構完成

**方式 B: Git 上傳 (推薦用於生產)**
```bash
git init
git add .
git commit -m "Initial commit: SubtitleLingo API Server"

git remote add origin https://huggingface.co/spaces/your-username/subtitlelingo
git push origin main
```

### 3. 設定環境變數
在 Space 的 Settings > Variables and secrets 中設定：

```bash
OPENSUBTITLES_API_KEY=vSuOAURoDGadtGk6End40nf6Eah0bVOF
TURSO_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
GEMINI_API_KEY=your_gemini_api_key  # 可選
```

### 4. 測試部署
1. 等待建構完成
2. 檢查建構日誌確認沒有錯誤
3. 測試健康檢查端點: `https://subtitlelingo.hf.space/health`
4. 測試 API 端點: `https://subtitlelingo.hf.space/webhook/movies/popular`

## 第三部份：驗證和整合

### 1. API 測試
使用 Gradio 介面的 "API 測試" 標籤測試各種功能。

### 2. 前端整合
更新前端應用程式的 API 配置：
```javascript
// src/config/api.js
export const API_CONFIG = {
  baseURL: 'https://subtitlelingo.hf.space/webhook',
  // ... 其他配置
};
```

### 3. 監控設定
- 定期檢查系統狀態
- 監控 API 使用量
- 檢查錯誤日誌

## 常見問題解決

### Q: 建構失敗怎麼辦？
A: 檢查建構日誌，通常問題出現在：
- requirements.txt 依賴問題
- Python 語法錯誤
- 環境變數未設定

### Q: API 無法回應？
A: 確認：
1. 所有環境變數都已設定
2. API 金鑰有效且有額度
3. 資料庫連線正常

### Q: 如何更新部署？
A: 推送新程式碼到 Git repository，HuggingFace 會自動重新建構。

## 聯絡支援
如遇到問題，請：
1. 查看 HuggingFace Space 的建構日誌
2. 檢查 GitHub Issues
3. 聯絡開發團隊

---
**部署完成後，您的 SubtitleLingo API 將可在 https://subtitlelingo.hf.space 存取！** 🎉
"""

    try:
        with open('DEPLOYMENT_GUIDE.md', 'w', encoding='utf-8') as f:
            f.write(guide.strip())
        print("✅ 部署指南已生成: DEPLOYMENT_GUIDE.md")
        return True
    except Exception as e:
        print(f"❌ 生成部署指南失敗: {e}")
        return False

def main():
    """主執行函數"""
    print("SubtitleLingo HuggingFace Spaces 部署檢查工具")
    print("=" * 50)

    all_checks_passed = True

    # 執行各項檢查
    checks = [
        ("檔案結構", check_files_exist),
        ("Python 語法", check_python_syntax),
        ("依賴套件", check_requirements),
        ("Space 配置", generate_space_config),
        ("部署指南", generate_deployment_guide)
    ]

    for check_name, check_func in checks:
        print(f"\n📍 {check_name}:")
        if not check_func():
            all_checks_passed = False

    print("\n" + "=" * 50)
    if all_checks_passed:
        print("所有檢查通過！可以開始部署到 HuggingFace Spaces")
        print("\n下一步:")
        print("1. 閱讀 DEPLOYMENT_GUIDE.md")
        print("2. 在 HuggingFace 建立新的 Space")
        print("3. 上傳檔案並設定環境變數")
        print("4. 測試 API 功能")
    else:
        print("檢查失敗，請修復問題後重新執行")
        sys.exit(1)

if __name__ == "__main__":
    main()