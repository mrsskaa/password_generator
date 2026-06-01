import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const t1LogoSource = resolve(__dirname, 'src/assets/images/T1_logo.svg')
const t1LogoPublic = resolve(__dirname, 'public/T1_logo.svg')
const faviconPath = resolve(__dirname, 'public/favicon.svg')

function syncT1LogoAndFavicon(): Plugin {
  const sync = () => {
    const logoSvg = readFileSync(t1LogoSource, 'utf8')
    copyFileSync(t1LogoSource, t1LogoPublic)

    const pngMatch = logoSvg.match(/xlink:href="(data:image\/png;base64,[^"]+)"/)
    const logoPngHref = pngMatch?.[1] ?? `data:image/svg+xml,${encodeURIComponent(logoSvg)}`
    const siteBackground = '#F5E1DD'
    const canvasSize = 32
    const cornerRadius = 12
    const logoAspect = 44 / 122
    const logoW = 28
    const logoH = Math.round(logoW * logoAspect)
    const logoX = (canvasSize - logoW) / 2
    const logoY = (canvasSize - logoH) / 2
    const favicon = [
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32">',
      '  <defs>',
      '    <clipPath id="favicon-clip">',
      `      <rect width="${canvasSize}" height="${canvasSize}" rx="${cornerRadius}" ry="${cornerRadius}"/>`,
      '    </clipPath>',
      '  </defs>',
      '  <g clip-path="url(#favicon-clip)">',
      `    <rect width="${canvasSize}" height="${canvasSize}" fill="${siteBackground}"/>`,
      `    <image href="${logoPngHref}" x="${logoX}" y="${logoY}" width="${logoW}" height="${logoH}" preserveAspectRatio="xMidYMid meet"/>`,
      '  </g>',
      '</svg>',
      '',
    ].join('\n')

    writeFileSync(faviconPath, favicon, 'utf8')
  }

  return {
    name: 'sync-t1-favicon',
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
  plugins: [syncT1LogoAndFavicon(), react()],
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
