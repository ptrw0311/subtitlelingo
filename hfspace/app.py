import gradio as gr
import json
import os
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 匯入工具模組
from utils.opensubtitles import OpenSubtitlesClient
from utils.subtitle_parser import SubtitleParser
from utils.turso_client import TursoClient
from api_handlers.movies import handle_popular_movies, handle_search_movies, handle_movie_details
from api_handlers.subtitles import handle_subtitle_fetch
from api_handlers.analysis import handle_movie_analysis

# 設定 FastAPI 應用
app = FastAPI(title="SubtitleLingo API Server")

# 初始化客戶端
try:
    os_client = OpenSubtitlesClient()
    turso_client = TursoClient()
    subtitle_parser = SubtitleParser()
    logger.info("所有客戶端初始化成功")
except Exception as e:
    logger.error(f"客戶端初始化失敗: {e}")
    os_client = None
    turso_client = None
    subtitle_parser = None

class SubtitleLingoAPI:
    """SubtitleLingo API 伺服器"""

    def __init__(self):
        self.setup_health_check()

    def setup_health_check(self):
        """設定健康檢查"""
        @app.get("/health")
        async def health_check():
            try:
                # 檢查所有客戶端狀態
                status = {
                    "status": "healthy",
                    "timestamp": datetime.now().isoformat(),
                    "clients": {}
                }

                if os_client:
                    status["clients"]["opensubtitles"] = "connected"
                if turso_client:
                    status["clients"]["turso"] = "connected"
                if subtitle_parser:
                    status["clients"]["subtitle_parser"] = "ready"

                return JSONResponse(status)
            except Exception as e:
                logger.error(f"健康檢查失敗: {e}")
                return JSONResponse({"status": "unhealthy", "error": str(e)}, status_code=500)

    def log_api_request(self, endpoint: str, params: Dict, response_time: float, status: str):
        """記錄 API 請求日誌"""
        logger.info(f"API: {endpoint} | 參數: {params} | 時間: {response_time:.2f}s | 狀態: {status}")

    async def process_request(self, endpoint: str, data: Dict[str, Any], method: str = "GET") -> Dict[str, Any]:
        """統一處理 API 請求"""
        start_time = datetime.now()

        try:
            logger.info(f"處理 {method} 請求: {endpoint}")

            # 路由到對應的處理器
            if endpoint == "/movies/popular":
                result = await handle_popular_movies(data, os_client, turso_client)
            elif endpoint == "/movies/search":
                result = await handle_search_movies(data, os_client, turso_client)
            elif endpoint.startswith("/movies/") and endpoint.endswith("/details"):
                movie_id = endpoint.split("/")[-2]
                result = await handle_movie_details(movie_id, turso_client)
            elif endpoint == "/subtitles/fetch":
                result = await handle_subtitle_fetch(data, os_client, subtitle_parser, turso_client)
            elif endpoint.startswith("/movies/") and endpoint.endswith("/analyze"):
                movie_id = endpoint.split("/")[-2]
                result = await handle_movie_analysis(movie_id, turso_client, subtitle_parser)
            else:
                result = {
                    "success": False,
                    "error": "不支援的端點",
                    "message": f"端點 {endpoint} 不存在",
                    "available_endpoints": [
                        "/movies/popular",
                        "/movies/search",
                        "/movies/{id}/details",
                        "/movies/{id}/analyze",
                        "/subtitles/fetch"
                    ]
                }

            # 計定回應時間
            response_time = (datetime.now() - start_time).total_seconds()
            status = "success" if result.get("success", False) else "failed"
            self.log_api_request(endpoint, data, response_time, status)

            return result

        except Exception as e:
            response_time = (datetime.now() - start_time).total_seconds()
            self.log_api_request(endpoint, data, response_time, "error")
            logger.error(f"處理請求失敗 {endpoint}: {e}")

            return {
                "success": False,
                "error": "伺服器內部錯誤",
                "message": str(e),
                "response_time": response_time
            }

# 設定 FastAPI webhook 路由
@app.post("/webhook/{path:path}")
async def webhook_handler(path: str, request: Dict[str, Any]):
    """處理所有 webhook 請求"""
    api = SubtitleLingoAPI()

    # 移除路徑中的開頭斜線
    clean_path = path.lstrip('/')

    return await api.process_request(f"/{clean_path}", request, "POST")

# 設置 CORS 支援
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

def create_gradio_interface():
    """建立 Gradio 介面"""

    # API 測試區塊
    with gr.Blocks(theme=gr.themes.Soft()) as demo:
        gr.Markdown("# 🎬 SubtitleLingo API Server")
        gr.Markdown("在 HuggingFace Spaces 上部署的 n8n 風格字幕抓取和分析服務")

        with gr.Tab("API 測試"):
            gr.Markdown("### 測試 API 端點")

            with gr.Row():
                with gr.Column():
                    # 端點選擇
                    endpoint = gr.Dropdown(
                        choices=[
                            "/movies/popular",
                            "/movies/search",
                            "/movies/{id}/details",
                            "/movies/{id}/analyze",
                            "/subtitles/fetch"
                        ],
                        label="選擇 API 端點",
                        value="/movies/popular"
                    )

                    # 請求參數
                    with gr.Row():
                        page = gr.Number(value=1, label="頁數", minimum=1, maximum=10)
                        search_query = gr.Textbox(label="搜尋關鍵字", placeholder="輸入影片名稱...")
                        imdb_id = gr.Textbox(label="IMDb ID", placeholder="例如: tt0111161")

                    # 發送按鈕
                    submit_btn = gr.Button("🚀 發送請求", variant="primary")

                    # 回應顯示
                    response_output = gr.JSON(label="API 回應")

            # 測試邏輯
            def test_api(endpoint, page, search_query, imdb_id):
                """測試 API 端點"""
                data = {}

                if page:
                    data["page"] = int(page)
                if search_query:
                    data["query"] = search_query
                if imdb_id:
                    data["imdb_id"] = imdb_id

                # 處理端點
                if endpoint == "/movies/{id}/details" or endpoint == "/movies/{id}/analyze":
                    if imdb_id:
                        endpoint = endpoint.replace("{id}", imdb_id)
                        if not data.get("imdb_id"):
                            data["imdb_id"] = imdb_id

                # 模擬處理（實際應該通過 webhook）
                return {
                    "endpoint": endpoint,
                    "request_data": data,
                    "message": "這是測試回應，實際應用請使用 webhook 呼叫",
                    "status": "test"
                }

            submit_btn.click(
                fn=test_api,
                inputs=[endpoint, page, search_query, imdb_id],
                outputs=[response_output]
            )

        with gr.Tab("系統狀態"):
            gr.Markdown("### 系統狀態監控")

            # 狀態刷新按鈕
            refresh_btn = gr.Button("🔄 刷新狀態", variant="secondary")

            # 狀態顯示
            status_output = gr.JSON(label="系統狀態")

            def get_system_status():
                """取得系統狀態"""
                try:
                    if turso_client:
                        stats = turso_client.get_statistics()
                    else:
                        stats = {"error": "Turso 客戶端未連線"}

                    return {
                        "timestamp": datetime.now().isoformat(),
                        "clients": {
                            "opensubtitles": os_client is not None,
                            "turso": turso_client is not None,
                            "subtitle_parser": subtitle_parser is not None
                        },
                        "database_stats": stats
                    }
                except Exception as e:
                    return {
                        "error": str(e),
                        "timestamp": datetime.now().isoformat()
                    }

            refresh_btn.click(
                fn=get_system_status,
                outputs=[status_output]
            )

        with gr.Tab("資料庫管理"):
            gr.Markdown("### 資料庫操作")

            with gr.Row():
                with gr.Column():
                    # 操作選擇
                    db_operation = gr.Radio(
                        choices=[
                            ("statistics", "📊 統計資訊"),
                            ("test_connection", "🔗 測試連線")
                        ],
                        label="選擇操作",
                        value="statistics"
                    )

                    # 執行按鈕
                    execute_btn = gr.Button("⚡ 執行操作", variant="primary")

                    # 結果顯示
                    db_output = gr.JSON(label="操作結果")

            def execute_database_operation(operation):
                """執行資料庫操作"""
                try:
                    if not turso_client:
                        return {"error": "Turso 客戶端未初始化"}

                    if operation == "statistics":
                        return turso_client.get_statistics()
                    elif operation == "test_connection":
                        # 測試基本連線
                        test_query = "SELECT 1 as test"
                        result = turso_client._execute_query(test_query)
                        return {"connection": "success", "test_result": result}
                    else:
                        return {"error": "不支援的操作"}

                except Exception as e:
                    return {"error": str(e)}

            execute_btn.click(
                fn=execute_database_operation,
                inputs=[db_operation],
                outputs=[db_output]
            )

        # 日誌輸出
        with gr.Accordion("📋 系統日誌", open=False):
            gr.Markdown("### 即時日誌輸出")
            log_output = gr.TextArea(
                label="系統日誌",
                lines=20,
                max_lines=50,
                placeholder="日誌輸出將顯示在這裡..."
            )

            def update_logs():
                """更新日誌顯示"""
                # 這裡可以實作日誌讀取功能
                # 目前顯示最近的日誌訊息
                import sys
                import io
                from contextlib import redirect

                # 創獲日誌緩衝區
                log_capture = io.StringIO()

                with redirect(log_capture, sys.stderr):
                    # 模擬一些日誌輸出
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] 系統狀態正常")

                return log_capture.getvalue()

            # 定期更新日誌（每5秒）
            demo.load(lambda: update_logs(), every=5)

    return demo

def main():
    """主函數"""
    interface = create_gradio_interface()

    # 啟動 Gradio 介面
    interface.launch(
        server_name="subtitlelingo",
        server_port=7860,
        share=False,
        show_error=True,
        favicon_path=None,
        ssl_verify=False
    )

if __name__ == "__main__":
    main()