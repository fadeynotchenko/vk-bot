// max-web/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // dev (на будущее, чтобы тоже слушал снаружи)
  server: {
    host: true,           // = 0.0.0.0
    port: 4173,
  },

  // <<< ЭТО ВАЖНО ДЛЯ ТВОЕГО СЛУЧАЯ >>>
  preview: {
    host: true,           // = 0.0.0.0 (принимаем внешние коннекты)
    port: 4173,
    allowedHosts: [
      'dobrayadysha.ru',
      'www.dobrayadysha.ru',
      // при необходимости добавь свой внешний IP:
      // '51.250.2.8'
    ],
  },
})
