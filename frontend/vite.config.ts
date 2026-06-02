import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const t1LogoSource = resolve(__dirname, 'src/assets/images/T1_logo.svg')
const t1LogoPublic = resolve(__dirname, 'public/T1_logo.svg')

function syncT1Logo(): Plugin {
  const sync = () => {
    copyFileSync(t1LogoSource, t1LogoPublic)
  }

  return {
    name: 'sync-t1-logo',
    buildStart: sync,
    configureServer: sync,
  }
}

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
  plugins: [syncT1Logo(), react()],
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
