import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'
import apiDevPlugin from './dev/api-dev-plugin.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vercel 和本地開發都使用根路徑
  return {
    // apiDevPlugin 只在 npm run dev 時啟用，讓本機預覽也有 /api/query
    plugins: [react(), tailwindcss(), apiDevPlugin(loadEnv(mode, process.cwd(), ''))],
    base: '/',
  }
})
