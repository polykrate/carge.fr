import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 🚀 Simplified chunking strategy - keep critical vendors together
        manualChunks: (id) => {
          // Core React dependencies
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          
          // Polkadot vendor
          if (id.includes('@polkadot/')) {
            return 'polkadot-vendor';
          }
          
          // IPFS/Helia - MUST stay together for dynamic imports to work
          if (id.includes('helia') || 
              id.includes('@helia/') ||
              id.includes('multiformats') ||
              id.includes('libp2p') ||
              id.includes('@libp2p/') ||
              id.includes('blockstore') ||
              id.includes('datastore') ||
              id.includes('ipfs') ||
              id.includes('@chainsafe/libp2p')) {
            return 'ipfs-vendor';
          }
          
          // All other node_modules
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
