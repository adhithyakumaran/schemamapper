import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { schemaApiPlugin } from './vite-plugin-schema-api.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), schemaApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 43123,
  },
})
