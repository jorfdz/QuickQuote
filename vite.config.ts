import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { versionPlugin } from './vite-plugin-version'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionPlugin()],
})
