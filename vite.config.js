import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vercel 和本地開發都使用根路徑
  return {
    plugins: [react()],
    base: '/',
  }
})
