import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'polkadot-vendor': [
            '@polkadot/api',
            '@polkadot/extension-dapp',
            '@polkadot/util',
            '@polkadot/util-crypto'
          ],
          'ipfs-vendor': ['helia', '@helia/unixfs'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
  }
})
