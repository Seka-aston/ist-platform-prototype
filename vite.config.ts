import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    dedupe: ['vue', 'chart.js'],
  },
  optimizeDeps: {
    include: ['chart.js', 'vue-chartjs > chart.js'],
  },
})
