import os
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

# OpenSubtitles API 配置
OPENSUBTITLES_API_KEY = os.getenv("OPENSUBTITLES_API_KEY")
OPENSUBTITLES_USER_AGENT = "SubtitleLingo v1.0"
OPENSUBTITLES_BASE_URL = "https://api.opensubtitles.org/api/v1"
OPENSUBTITLES_RATE_LIMIT = 4  # 每秒最多 4 個請求

# Turso 資料庫配置
TURSO_URL = os.getenv("TURSO_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

# Gemini AI 配置
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-pro"
GEMINI_RATE_LIMIT = 15  # 每分鐘最多 15 個請求

# 應用程式配置
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "7860"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# 快取設定
CACHE_TTL = 3600  # 1 小時
REQUEST_TIMEOUT = 30  # 30 秒

# 安全設定
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "subtitlelingo-secret")

# 日誌設定
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# API 回應格式
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100