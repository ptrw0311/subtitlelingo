# -*- coding: utf-8 -*-
from playwright.sync_api import sync_playwright
import time
import sys

def check_stats_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # 導航到統計頁面
        print("Navigating to stats page...")
        page.goto('http://localhost:5173/stats')

        # 等待頁面載入
        print("Waiting for page load...")
        try:
            page.wait_for_load_state('networkidle', timeout=10000)
            print("Page loaded successfully")
        except Exception as e:
            print(f"Load timeout: {e}")

        # 等待一下確保渲染完成
        time.sleep(2)

        # 截圖
        screenshot_path = 'D:\\vscode\\SubtitleLingo\\stats_page_screenshot.png'
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved: {screenshot_path}")

        # 檢查頁面標題
        print("\n" + "="*60)
        print("Page Title:")
        print("="*60)
        title = page.title()
        print(f"Title: {title}")

        # 檢查控制台訊息（需要在導航前設置監聽器）
        print("\n" + "="*60)
        print("Console Messages:")
        print("="*60)
        console_logs = []

        def handle_console(msg):
            log_entry = f"{msg.type}: {msg.text}"
            console_logs.append(log_entry)
            print(log_entry)

        page.on('console', handle_console)

        # 檢查網路請求
        network_logs = []
        def handle_request(request):
            network_logs.append(f"Request: {request.method} {request.url}")

        def handle_response(response):
            if response.status >= 400:
                network_logs.append(f"Response Error: {response.status} {response.url}")

        page.on('request', handle_request)
        page.on('response', handle_response)

        # 重新載入頁面以捕獲所有訊息
        page.reload()
        try:
            page.wait_for_load_state('networkidle', timeout=10000)
        except:
            pass

        time.sleep(3)  # 等待更多訊息

        print(f"Total console messages: {len(console_logs)}")
        print(f"Total network requests: {len(network_logs)}")

        # 檢查頁面 HTML
        print("\n" + "="*60)
        print("Page HTML Structure:")
        print("="*60)
        body_html = page.locator('body').inner_html()
        print(f"Body HTML length: {len(body_html)}")

        # 檢查是否有錯誤元素
        error_elements = page.locator('[class*="error"], [class*="Error"], text=/error/i')
        error_count = error_elements.count()
        print(f"Error elements found: {error_count}")

        # 檢查是否有錯誤
        print("\n" + "="*60)
        print("Page Errors:")
        print("="*60)
        errors = page.locator("text=載入失敗").count()
        if errors > 0:
            print(f"Found {errors} error messages")
        else:
            print("No obvious error messages")

        # 檢查統計卡片是否存在
        print("\n" + "="*60)
        print("Statistics Elements Check:")
        print("="*60)

        selectors = {
            "Back to Home Button": 'text=回到首頁',
            "Page Title": 'text=學習統計',
            "Time Selector": 'text=最近 7 天',
            "Stat Cards": '.card',
        }

        for name, selector in selectors.items():
            try:
                count = page.locator(selector).count()
                print(f"[OK] {name}: {count} found")
            except Exception as e:
                print(f"[FAIL] {name}: Not found ({e})")

        # 檢查 loading 狀態
        loading = page.locator("text=載入中").count()
        loading2 = page.locator("text=正在載入").count()
        print(f"\nLoading elements: {loading + loading2}")

        # 檢查內容區域
        content_area = page.locator('.content-area')
        if content_area.count() > 0:
            is_visible = content_area.is_visible()
            print(f"Content area visible: {is_visible}")

            if is_visible:
                # 獲取內容區域的尺寸
                box = content_area.bounding_box()
                print(f"   Dimensions: {box}")
        else:
            print("[FAIL] Content area not found")

        # 檢查 .app-container 的寬度
        print("\n" + "="*60)
        print("Layout Dimensions:")
        print("="*60)
        app_container = page.locator('.app-container')
        if app_container.count() > 0:
            box = app_container.bounding_box()
            print(f"App Container: {box}")

        main_content = page.locator('.main-content')
        if main_content.count() > 0:
            box = main_content.bounding_box()
            print(f"Main Content: {box}")

        sidebar = page.locator('.sidebar')
        if sidebar.count() > 0:
            box = sidebar.bounding_box()
            print(f"Sidebar: {box}")

        browser.close()
        print("\nCheck completed!")

if __name__ == "__main__":
    check_stats_page()
