import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueLegalDocsImport',
      fileName: (format: string) => `vue-legal-docs-import.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
        // Without this the UMD build hides the plugin behind `.default`,
        // which no consumer expects when the package also has named exports.
        exports: 'named'
      }
    }
  }
})
