import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: './', // ⭐ 设置为相对路径，避免绝对路径 /xxx 加载失败
  plugins: [vue()],
  build: {
    outDir: '../web',  // 直接指定输出目录
    rollupOptions: {
      output: {
        dir: '../web'  // 双重保障（兼容 Rollup 配置）
      }
    }
  }
})
