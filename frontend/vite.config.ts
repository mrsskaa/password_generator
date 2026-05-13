import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Прокси /api → бэкенд в dev (npm run dev).
 * В Docker Compose задайте API_PROXY_TARGET=http://backend:8000 (см. compose).
 * Если переменная не подхватилась, DOCKER=1 даёт запасной target.
 */
const devApiProxyTarget =
  process.env.API_PROXY_TARGET ??
  (process.env.DOCKER === '1' ? 'http://backend:8000' : 'http://127.0.0.1:8000')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
