/**
 * Logger for dApp (client-side only)
 * 
 * Simplified logger for decentralized applications:
 * - Disabled in production (performance)
 * - Categorized logs for better debugging (blockchain, IPFS, crypto)
 * - Manual enable with localStorage for production debugging
 * 
 * For error monitoring in production, use Sentry (see AUDIT_BONNES_PRATIQUES.md)
 */

const isDev = import.meta.env.DEV;

/**
 * Check if debug mode is manually enabled (for production debugging)
 * Enable with: localStorage.setItem('carge:debug', 'true')
 */
const isDebugEnabled = () => {
  try {
    return localStorage.getItem('carge:debug') === 'true';
  } catch {
    return false;
  }
};

/**
 * Format log with emoji prefix for better visibility
 */
const formatLog = (emoji, category, ...args) => {
  const timestamp = new Date().toISOString().substr(11, 12); // HH:MM:SS.mmm
  return [`${emoji} [${timestamp}] [${category}]`, ...args];
};

export const logger = {
  /**
   * Debug logs - development only
   * Use for detailed debugging information
   */
  debug: (...args) => {
    if (isDev || isDebugEnabled()) {
      console.log(...formatLog('🔍', 'DEBUG', ...args));
    }
  },

  /**
   * Info logs - development only
   * Use for general information
   */
  info: (...args) => {
    if (isDev || isDebugEnabled()) {
      console.info(...formatLog('ℹ️', 'INFO', ...args));
    }
  },

  /**
   * Warning logs - always shown
   * Use for recoverable errors or important warnings
   */
  warn: (...args) => {
    console.warn(...formatLog('⚠️', 'WARN', ...args));
  },

  /**
   * Error logs - always shown
   * Use for errors that should be investigated
   * In production, these should be sent to Sentry
   */
  error: (...args) => {
    console.error(...formatLog('❌', 'ERROR', ...args));
    
    // TODO: Send to Sentry in production
    // if (import.meta.env.PROD && window.Sentry) {
    //   window.Sentry.captureException(args[0]);
    // }
  },

  /**
   * Blockchain-specific logs - development only
   * Use for transaction submissions, block updates, queries
   */
  blockchain: (...args) => {
    if (isDev || isDebugEnabled()) {
      console.log(...formatLog('⛓️', 'CHAIN', ...args));
    }
  },

  /**
   * IPFS-specific logs - development only
   * Use for uploads, downloads, peer connections
   */
  ipfs: (...args) => {
    if (isDev || isDebugEnabled()) {
      console.log(...formatLog('📦', 'IPFS', ...args));
    }
  },

  /**
   * Cryptography-specific logs - development only
   * Use for encryption, signing, key generation
   */
  crypto: (...args) => {
    if (isDev || isDebugEnabled()) {
      console.log(...formatLog('🔐', 'CRYPTO', ...args));
    }
  },

  /**
   * Wallet-specific logs - development only
   * Use for wallet connections, account changes
   */
  wallet: (...args) => {
    if (isDev || isDebugEnabled()) {
      console.log(...formatLog('👛', 'WALLET', ...args));
    }
  },

  /**
   * Success logs - always shown for user feedback
   * Use for successful operations
   */
  success: (...args) => {
    console.log(...formatLog('✅', 'SUCCESS', ...args));
  },
};

/**
 * Helper to enable debug mode in production console
 * Usage in browser console: enableDebug()
 */
if (typeof window !== 'undefined') {
  window.enableCargeDebug = () => {
    localStorage.setItem('carge:debug', 'true');
    console.log('✅ Carge debug mode enabled. Reload page to see logs.');
  };
  
  window.disableCargeDebug = () => {
    localStorage.removeItem('carge:debug');
    console.log('✅ Carge debug mode disabled.');
  };
}

export default logger;

