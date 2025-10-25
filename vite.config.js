import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 🚀 Simplified chunking strategy - group only heavy vendors separately
        manualChunks: {
          // Core dependencies loaded upfront
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-hot-toast'],
          
          // Heavy vendors loaded on demand
          'polkadot-vendor': [
            '@polkadot/api',
            '@polkadot/extension-dapp',
            '@polkadot/util',
            '@polkadot/util-crypto'
          ],
          
          // Note: IPFS is too complex to chunk manually, let Vite handle it
        }
      }
    },
    // Reduce chunk size warning limit (we're optimizing!)
    chunkSizeWarningLimit: 400,
    
    // Improve build performance
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.error for debugging issues in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove only verbose console methods
      },
    },
    
    // Better source maps for debugging (without bloating bundle)
    sourcemap: true, // Enable temporarily for debugging Netlify deployment
  },
  
  // Optimize dev server
  server: {
    host: true,
  },
})
