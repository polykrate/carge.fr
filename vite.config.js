import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 🚀 Optimized chunking strategy for better caching and load performance
        manualChunks: (id) => {
          // Core React dependencies (needed everywhere, cache well)
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          
          // Polkadot dependencies (only loaded when wallet features are used)
          if (id.includes('@polkadot/')) {
            return 'polkadot-vendor';
          }
          
          // IPFS/Helia dependencies (only loaded on Verify/Workflows/QuickSign pages)
          if (id.includes('helia') || 
              id.includes('@helia/') ||
              id.includes('multiformats') ||
              id.includes('ipfs') ||
              id.includes('libp2p')) {
            return 'ipfs-vendor';
          }
          
          // QR code library (only used in Verify page)
          if (id.includes('jsqr') || id.includes('jsQR')) {
            return 'jsQR';
          }
          
          // i18n dependencies (lightweight, loaded early)
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n';
          }
          
          // UI libraries (toast, etc.)
          if (id.includes('react-hot-toast')) {
            return 'ui-vendor';
          }
          
          // Crypto utilities (used across many features)
          if (id.includes('node_modules') && 
              (id.includes('crypto') || id.includes('hash') || id.includes('buffer'))) {
            return 'crypto-vendor';
          }
          
          // All other node_modules go into a common vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
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
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
      },
    },
    
    // Better source maps for debugging (without bloating bundle)
    sourcemap: false, // Disable source maps in production for smaller size
  },
  
  // Optimize dev server
  server: {
    host: true,
  },
})
