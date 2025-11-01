// ============================================================================
// CONFIGURATION - Human Context Web
// ============================================================================

export const config = {
  // Substrate blockchain
  SUBSTRATE_WS_URL: 'wss://services.tanssi-testnet.network/dancelight-2016',
  SUBSTRATE_RPC_URL: 'https://services.tanssi-testnet.network/dancelight-2016',
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

  // Examples - Macallan 25 Years Workflow
  EXAMPLES: {
    // QR Code hash - Step 1 only (Production)
    QR_CODE_HASH: '0xe0c96f06853d17030fe9b01c48a4b389a2a3e64c0d90237dd12a3d76905df974',
    
    // Complete workflow hash - Steps 1-6 (Production → Retail)
    COMPLETE_WORKFLOW_HASH: '0x7519e725790fbdec11a7d82a963197e8a4208d22e87d7faa357769502b730459',
    
    // Workflow details
    WORKFLOW: {
      ragHash: '0x51bd4b7e9b2669fe16c73c369c3b100d2ac6c826dee3e4f20aa1d532d992c39f',
      retailStepHash: '0xfe5b62ffda7a56d94311e1b00845e1c331578f4f8bbb333328c53333ac7041ad', // Step 6 (Retail) - used to detect example and pre-fill consumer form
      batchNumber: 'B47-2023',
      totalBottles: 2500,
      bottleNumber: 347,
      distillationYear: 1998,
      productionYear: 2023,
      targetAddress: '5CLqgPWHnzKw7eF7pL8bV7kuV6FyJ3fFtJyGA7592jrrF1oM', // Mr. Wei Chen
    },
    
    // Pre-filled data for Wei Chen (Step 7 - Consumer)
    CONSUMER_DATA: {
      responsibleIdentity: 'Wei Chen (陈伟) - Shanghai Premium Spirits Collector',
      purchaseDate: '2024-10-15',
      fromEntity: 'Emperor\'s Cellar - Shanghai Whisky Palace, Nanjing Road West, Jing\'an District',
      retailerName: 'Emperor\'s Cellar - Shanghai Whisky Palace',
      consumerType: 'Premium collector',
      purchaseLocation: 'Shanghai, People\'s Republic of China',
      finalDestination: 'Private collection, Lujiazui penthouse, Pudong, Shanghai',
      batchNumber: 'B47-2023',
      unitIdentifier: 'Bottle #347/2500 from Batch B47-2023',
      purchasePrice: '28800',
      purchaseCurrency: 'CNY',
      usage: 'Private whisky collection in Shanghai penthouse. Will be displayed in climate-controlled display case.',
      tastingNotes: '深郁红棕色，极致雪莉橡木桌香。口感：丰富的干果（葡萄干、无花果）、黑巧克力、肉桂。余韵漫长，温暖而优雅。| Deep mahogany color, sublime sherry oak influence. Palate: Rich dried fruits (raisins, figs), dark chocolate, cinnamon. Long, warm, elegant finish.',
      feedback: '令人惊叹！扫描QR码，我可以看到这瓶威士忌从1998年苏格兰蒸馆到上海的完整历程：苏格兰 → 英国 → 法国 → 香港 → 上海。每一步都在区块链上被加密验证。这就是真正的透明度，这就是为什么值每一分钱。 | Simply extraordinary! Scanning the QR code, I can see this whisky\'s complete journey from 1998 Scotland distillation to Shanghai: Scotland → UK → France → Hong Kong → Shanghai. Every step cryptographically verified on blockchain. This is true transparency, this is why it\'s worth every yuan. 25 years of Scottish craftsmanship, impossible to counterfeit.',
      consumerRating: '5',
      _targetAddress: '5CLqgPWHnzKw7eF7pL8bV7kuV6FyJ3fFtJyGA7592jrrF1oM',
    },
  },
};

