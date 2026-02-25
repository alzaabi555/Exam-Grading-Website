import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // ربط الرمز @ بمجلد src لتسهيل استدعاء الملفات
      '@': path.resolve(__dirname, './src'),
    },
  },

  // إعداد القاعدة (base) مهم جداً عند الرفع على GitHub Pages
  // إذا كان اسم مستودعك "fast-grader"، فاجعلها '/fast-grader/'
  base: process.env.NODE_ENV === 'production' ? './' : '/',

  build: {
    // التأكد من أن المخرجات تذهب لمجلد dist الذي يحتاجه Electron و GitHub
    outDir: 'dist',
    assetsDir: 'assets',
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
})