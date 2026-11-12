import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GitHub Pages 는 https://아이디.github.io/music-diary/ 아래에서 열린다 — 배포 때만 BASE=/music-diary/ 를 준다
export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [react()],
})
