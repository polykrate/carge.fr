import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size limit to avoid warnings on vendors
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Let Vite handle chunking automatically with default strategy
        // This avoids circular dependency issues from manual chunking
      }
    },
    
    // Use ES2020 to support BigInt (required by IPFS/Helia)
    target: 'es2020',
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
