import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'PluginApp.tsx',
      output: {
        entryFileNames: 'plugin-ui.js',
        assetFileNames: 'plugin-ui.[ext]'
      }
    },
    // Ensure CSS is included in the JS bundle for simpler deployment
    cssCodeSplit: false,
    // Inline all assets for a single-file deployment
    assetsInlineLimit: 100000
  },
  // Resolve path aliases if needed
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})