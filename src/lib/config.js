// ============================================================================
// CONFIGURATION - Human Context Web
// ============================================================================

export const config = {
  // Substrate blockchain
  SUBSTRATE_WS_URL: 'wss://fraa-flashbox-4667-rpc.a.stagenet.tanssi.network',
  SUBSTRATE_RPC_URL: 'https://fraa-flashbox-4667-rpc.a.stagenet.tanssi.network',
  CHAIN_NAME: 'Ragchain',

  // IPFS/Helia
  IPFS_GATEWAY: 'https://ipfs.io',
  IPFS_UPLOAD_URL: 'http://127.0.0.1:5001/api/v0/add', // IPFS Kubo node upload endpoint
  IPFS_PUBLIC_GATEWAYS: [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
  ],

  // App
  APP_NAME: 'Carge',
  APP_VERSION: '1.0.0',

  // Crypto
  DEFAULT_KEY_INDEX: 0,

  // Storage
  STORAGE_PREFIX: 'carge',
};

