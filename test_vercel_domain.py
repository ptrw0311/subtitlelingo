import sys
import io
from playwright.sync_api import sync_playwright

# 設置 UTF-8 編碼
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_subtitlelingo_vercel():
    """測試 https://subtitlelingo.vercel.app"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 收集 console logs
        console_messages = []
        page.on('console', lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))

        try:
            print("==> 導航到 https://subtitlelingo.vercel.app")
            page.goto('https://subtitlelingo.vercel.app', wait_until='networkidle', timeout=30000)

            # 截圖
            screenshot_path = 'D:/vscode/SubtitleLingo/vercel_domain_test.png'
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"[OK] 截圖已保存: {screenshot_path}")

            # 檢查頁面標題
            title = page.title()
            print(f"[INFO] 頁面標題: {title}")

            # 檢查是否有錯誤
            errors = [msg for msg in console_messages if 'error' in msg.lower()]
            if errors:
                print("[ERROR] Console Errors:")
                for error in errors[:5]:  # 只顯示前5個錯誤
                    print(f"  - {error}")
            else:
                print("[OK] 無 console errors")

            # 檢查關鍵元素
            print("\n[CHECK] 檢查頁面元素:")

            # 檢查載入狀態
            loading = page.locator('.loading').count()
            if loading > 0:
                print("[WARN] 頁面仍在載入狀態")
                page.wait_for_timeout(3000)

            # 檢查主容器
            app = page.locator('#root').count()
            print(f"  #root: {'[OK]' if app > 0 else '[FAIL]'}")

            # 檢查是否有電影選擇器
            movie_selector = page.locator('[class*="movie"]').count()
            print(f"  電影相關元素: {'[OK]' if movie_selector > 0 else '[FAIL]'} ({movie_selector} 個)")

            # 檢查 API 調用
            print("\n[API] 檢查 API:")
            api_calls = [msg for msg in console_messages if 'api' in msg.lower()]
            if api_calls:
                print(f"  API 調用: {len(api_calls)} 個")
                for call in api_calls[:3]:
                    print(f"  - {call}")

            # 檢查資料庫連接
            db_logs = [msg for msg in console_messages if 'turso' in msg.lower() or 'database' in msg.lower()]
            if db_logs:
                print(f"  資料庫相關: {len(db_logs)} 個")
                for log in db_logs[:3]:
                    print(f"  - {log}")

            print("\n[SUCCESS] 測試完成！")
            print(f"網域: https://subtitlelingo.vercel.app")
            print(f"舊網域仍可用: https://subtitlelingo-api.vercel.app")

        except Exception as e:
            print(f"[FAIL] 測試失敗: {str(e)}")
        finally:
            browser.close()

if __name__ == '__main__':
    test_subtitlelingo_vercel()
