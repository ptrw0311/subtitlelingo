import { defineConfig } from '@playwright/test';

// 畫面操作測試：在本機開發站執行，資料庫 API 一律以假資料模擬，不連線正式資料庫
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5199',
    launchOptions: {
      // 模擬麥克風，測試錄音對照
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
    },
    permissions: ['microphone'],
  },
  webServer: {
    command: 'npx vite --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: false,
  },
});
