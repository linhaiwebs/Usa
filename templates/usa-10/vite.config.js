import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { renameSync, existsSync, unlinkSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), {
    name: 'copy-to-root',
    closeBundle() {
      const distIdx = resolve(__dirname, 'dist', 'index.html')
      const rootTpl = resolve(__dirname, 'template.html')
      const distAssets = resolve(__dirname, 'dist', 'assets')
      const rootAssets = resolve(__dirname, 'assets')
      if (existsSync(distIdx)) {
        // Copy index.html to root as template.html
        const { copyFileSync, rmSync, cpSync } = require('fs')
        copyFileSync(distIdx, rootTpl)
        // Copy assets to root
        if (existsSync(rootAssets)) rmSync(rootAssets, { recursive: true })
        if (existsSync(distAssets)) cpSync(distAssets, rootAssets, { recursive: true })
      }
    },
  }],
  base: '/_tmpl/usa-10/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
