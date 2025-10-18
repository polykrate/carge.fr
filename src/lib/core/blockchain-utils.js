/**
 * Blockchain Utilities
 * Common functions for blockchain operations (signing, submitting transactions)
 */

/**
 * Wait for Polkadot.js libraries to be loaded
 */
export async function waitForPolkadot() {
  while (!window.polkadotUtil || !window.polkadotUtilCrypto) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await window.polkadotUtilCrypto.cryptoWaitReady();
}

/**
 * Create and connect to Substrate API
 * @param {string} rpcUrl - RPC URL (http/https)
 * @returns {Promise<ApiPromise>} Connected API instance
 */
export async function connectToApi(rpcUrl) {
  console.log('Connecting to Substrate API...');
  const { ApiPromise, WsProvider } = await import('@polkadot/api');
  const wsUrl = rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
  const wsProvider = new WsProvider(wsUrl);
  const api = await ApiPromise.create({ provider: wsProvider });
  console.log('API connected');
  return api;
}

/**
 * Get wallet signer for a given account address
 * @param {string} accountAddress - SS58 account address
 * @returns {Promise<Object>} Injector with signer
 */
export async function getWalletSigner(accountAddress) {
  if (!window.polkadotExtensionDapp) {
    throw new Error('Polkadot extension API not found');
  }
  
  const { web3Enable, web3FromAddress } = window.polkadotExtensionDapp;
  await web3Enable('Carge'); // Safe to call multiple times
  
  const injector = await web3FromAddress(accountAddress);
  
  if (!injector || !injector.signer) {
    throw new Error('Failed to get wallet signer');
  }

  return injector;
}

/**
 * Sign content hash with wallet
 * @param {Object} signer - Wallet signer
 * @param {string} accountAddress - SS58 account address
 * @param {string} contentHash - Content hash to sign (0x prefixed)
 * @returns {Promise<string>} Signature (0x prefixed)
 */
export async function signContentHash(signer, accountAddress, contentHash) {
  console.log('Signing content hash:', contentHash);
  
  const signResult = await signer.signRaw({
    address: accountAddress,
    data: contentHash,
    type: 'bytes'
  });

  console.log('Signature obtained:', signResult.signature);
  return signResult.signature;
}

/**
 * Calculate SHA-256 hash of content
 * @param {string} content - Content to hash
 * @returns {Promise<string>} Hash (0x prefixed)
 */
export async function calculateHash(content) {
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', contentBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate wrapped message hash (what the extension actually signs)
 * @param {string} contentHash - Content hash (0x prefixed)
 * @returns {Promise<string>} Wrapped message hash (0x prefixed)
 */
export async function calculateWrappedHash(contentHash) {
  await waitForPolkadot();
  
  const { stringToU8a, hexToU8a } = window.polkadotUtil;
  const contentHashBytes = hexToU8a(contentHash);
  const wrappedMessage = new Uint8Array([
    ...stringToU8a('<Bytes>'),
    ...contentHashBytes,
    ...stringToU8a('</Bytes>')
  ]);
  const wrappedHashBuffer = await crypto.subtle.digest('SHA-256', wrappedMessage);
  const wrappedHashArray = Array.from(new Uint8Array(wrappedHashBuffer));
  return '0x' + wrappedHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create empty parameters for crypto trail (when not using IPFS/encryption)
 * @returns {Object} Empty crypto trail parameters
 */
export function createEmptyTrailParams() {
  return {
    encryptedCid: '0x' + '00'.repeat(52),    // 52 bytes
    ephemeralPubkey: '0x' + '00'.repeat(32), // 32 bytes
    cidNonce: '0x' + '00'.repeat(12),        // 12 bytes
    contentNonce: '0x' + '00'.repeat(12),    // 12 bytes
  };
}

/**
 * Submit a crypto trail transaction to the blockchain
 * @param {Object} params - Transaction parameters
 * @param {ApiPromise} params.api - Connected API instance
 * @param {string} params.accountAddress - SS58 account address
 * @param {Object} params.signer - Wallet signer
 * @param {string} params.contentHash - Content hash (0x prefixed)
 * @param {string} params.signature - Signature (0x prefixed)
 * @param {Function} params.onStatusChange - Callback for transaction status updates
 * @returns {Promise<Function>} Unsubscribe function
 */
export async function submitCryptoTrail({
  api,
  accountAddress,
  signer,
  contentHash,
  signature,
  onStatusChange
}) {
  const emptyParams = createEmptyTrailParams();
  
  console.log('Submitting crypto trail to blockchain...');
  console.log('  - contentHash:', contentHash);
  console.log('  - signature:', signature);
  console.log('  - account:', accountAddress);
  
  // Create transaction
  const tx = api.tx.cryptoTrail.storeTrail(
    emptyParams.encryptedCid,
    emptyParams.ephemeralPubkey,
    emptyParams.cidNonce,
    emptyParams.contentNonce,
    contentHash,
    signature
  );

  console.log('Transaction created, awaiting signature...');
  
  // Submit transaction with callback
  const unsub = await tx.signAndSend(accountAddress, { signer }, (result) => {
    if (onStatusChange) {
      onStatusChange(result);
    }
  });

  return unsub;
}

/**
 * Handle transaction result and check for errors
 * @param {Object} result - Transaction result from signAndSend callback
 * @param {ApiPromise} api - API instance for decoding errors
 * @returns {Object|null} Error object if error occurred, null otherwise
 */
export function handleTransactionResult(result, api) {
  console.log('Transaction status:', result.status.type);
  
  if (result.dispatchError) {
    let errorMessage = 'Transaction failed';
    
    if (result.dispatchError.isModule) {
      const decoded = api.registry.findMetaError(result.dispatchError.asModule);
      errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
      console.error('Module error:', errorMessage);
    } else {
      errorMessage = result.dispatchError.toString();
      console.error('Dispatch error:', errorMessage);
    }
    
    return { error: true, message: errorMessage };
  }
  
  return null;
}

/**
 * Submit an encrypted crypto trail transaction to the blockchain
 * @param {Object} params - Transaction parameters
 * @param {ApiPromise} params.api - Connected API instance
 * @param {string} params.accountAddress - SS58 account address
 * @param {Object} params.signer - Wallet signer
 * @param {string} params.encryptedCid - Encrypted CID (0x prefixed hex)
 * @param {string} params.ephemeralPubkey - Ephemeral public key (0x prefixed hex)
 * @param {string} params.cidNonce - CID nonce (0x prefixed hex)
 * @param {string} params.contentNonce - Content nonce (0x prefixed hex)
 * @param {string} params.contentHash - Content hash (0x prefixed)
 * @param {string} params.signature - Signature (0x prefixed)
 * @param {Function} params.onStatusChange - Callback for transaction status updates
 * @returns {Promise<Function>} Unsubscribe function
 */
export async function submitEncryptedCryptoTrail({
  api,
  accountAddress,
  signer,
  encryptedCid,
  ephemeralPubkey,
  cidNonce,
  contentNonce,
  contentHash,
  signature,
  onStatusChange
}) {
  console.log('Submitting encrypted crypto trail to blockchain...');
  console.log('  - contentHash:', contentHash);
  console.log('  - signature:', signature);
  console.log('  - encryptedCid:', encryptedCid.slice(0, 20) + '...');
  console.log('  - ephemeralPubkey:', ephemeralPubkey);
  console.log('  - account:', accountAddress);
  
  // Create transaction with encryption parameters
  const tx = api.tx.cryptoTrail.storeTrail(
    encryptedCid,
    ephemeralPubkey,
    cidNonce,
    contentNonce,
    contentHash,
    signature
  );

  console.log('Transaction created, awaiting signature...');
  
  // Submit transaction with callback
  const unsub = await tx.signAndSend(accountAddress, { signer }, (result) => {
    if (onStatusChange) {
      onStatusChange(result);
    }
  });

  return unsub;
}

/**
 * Generate random bytes as hex string
 * @param {number} length - Number of bytes
 * @returns {string} Hex string with 0x prefix
 */
function generateRandomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random CID v1 raw (36 bytes before encryption, 52 after)
 * CID v1 format: version (1) + codec (1) + multihash (34)
 * Multihash: hash_type (1) + hash_length (1) + hash (32)
 * @returns {Uint8Array} 36-byte CID v1 raw
 */
function generateRandomCidV1() {
  const cid = new Uint8Array(36);
  cid[0] = 0x01; // CID version 1
  cid[1] = 0x55; // Codec: raw (0x55)
  cid[2] = 0x12; // Multihash type: sha2-256 (0x12)
  cid[3] = 0x20; // Multihash length: 32 bytes (0x20)
  
  // Random 32-byte hash
  const randomHash = new Uint8Array(32);
  crypto.getRandomValues(randomHash);
  cid.set(randomHash, 4);
  
  return cid;
}

/**
 * Submit a RAG workflow step to the blockchain
 * Automatically handles encryption if recipient is different, or uses simple mode if same/empty
 * @param {Object} params - Workflow submission parameters
 * @param {Object} params.ragData - RAG data object (ragHash, stepHash, livrable)
 * @param {string} params.recipientAddress - Recipient address (or empty/same as sender for simple mode)
 * @param {string} params.selectedAccount - Sender account address
 * @param {Object} params.api - Connected API instance
 * @param {Object} params.ipfsClient - IPFS client instance
 * @param {Function} params.onStatusChange - Callback for transaction status updates
 * @returns {Promise<Object>} Result object with transaction details
 */
export async function submitRagWorkflowStep({
  ragData,
  recipientAddress,
  selectedAccount,
  api,
  ipfsClient,
  onStatusChange
}) {
  const { 
    getPkiProfile, 
    encryptRagData, 
    generateEphemeralKeypair, 
    deriveSharedSecret, 
    hexToBytes, 
    bytesToHex, 
    generateNonce, 
    encrypt 
  } = await import('./encryption-utils.js');
  
  const { CidConverter } = await import('./cid-converter.js');
  
  // Calculate content hash
  const ragDataJson = JSON.stringify(ragData);
  const contentHash = await calculateHash(ragDataJson);
  
  // Get wallet signer
  const injector = await getWalletSigner(selectedAccount);
  
  // Sign the content hash
  const signature = await signContentHash(injector.signer, selectedAccount, contentHash);
  
  // Decide mode: encryption or simple
  const useEncryption = recipientAddress && 
                        recipientAddress.trim() !== '' && 
                        recipientAddress !== selectedAccount;
  
  let encryptedCid, ephemeralPubkey, cidNonce, contentNonce, ipfsCid;
  
  if (useEncryption) {
    console.log('Using ENCRYPTED mode (different recipient)');
    
    // Get recipient's PKI profile
    console.log('Fetching PKI profile for recipient...');
    const pkiProfile = await getPkiProfile(api, recipientAddress);
    
    if (!pkiProfile) {
      throw new Error('Recipient does not have a PKI profile on-chain. They must register first.');
    }
    
    console.log('PKI profile found:', pkiProfile);
    
    // Convert exchange key from hex to bytes
    const recipientExchangeKey = hexToBytes(pkiProfile.exchangeKey);
    console.log('Recipient exchange key length:', recipientExchangeKey.length, 'bytes (expected: 32)');
    
    // Generate ONE ephemeral keypair for BOTH content AND CID (like TypeScript implementation)
    const ephemeralKeypair = generateEphemeralKeypair();
    console.log('Generated ephemeral keypair for encryption');
    
    // Derive shared secret using ECDH
    const sharedSecret = deriveSharedSecret(
      ephemeralKeypair.secretKey,
      recipientExchangeKey
    );
    
    // Encrypt RAG data with the shared secret
    const contentNonceBytes = generateNonce();
    const ragJson = JSON.stringify(ragData);
    const encoder = new TextEncoder();
    const ragBytes = encoder.encode(ragJson);
    const encryptedContent = encrypt(ragBytes, sharedSecret, contentNonceBytes);
    
    console.log('RAG data encrypted');
    
    // Upload encrypted content to IPFS
    console.log('Uploading encrypted content to IPFS...');
    ipfsCid = await ipfsClient.uploadFile(encryptedContent);
    
    if (!ipfsCid || typeof ipfsCid !== 'string') {
      console.error('Invalid CID returned:', ipfsCid);
      throw new Error('Failed to get valid CID from IPFS upload');
    }
    
    console.log('Uploaded to IPFS:', ipfsCid);
    
    // Convert CID to chain format (36 bytes)
    console.log('Converting CID to chain format:', ipfsCid);
    const cidBytes = CidConverter.toChainFormat(ipfsCid);
    console.log('CID converted to', cidBytes.length, 'bytes');
    
    // Encrypt the CID with the SAME shared secret (critical!)
    const cidNonceBytes = generateNonce();
    const encryptedCidBytes = encrypt(cidBytes, sharedSecret, cidNonceBytes);
    
    // Convert to hex for blockchain
    encryptedCid = bytesToHex(encryptedCidBytes);
    ephemeralPubkey = bytesToHex(ephemeralKeypair.publicKey);
    cidNonce = bytesToHex(cidNonceBytes);
    contentNonce = bytesToHex(contentNonceBytes);
    
    // Clean up sensitive data from memory
    ephemeralKeypair.secretKey.fill(0);
    sharedSecret.fill(0);
    
    console.log('Encryption parameters prepared');
    
  } else {
    console.log('Using SIMPLE mode (same recipient or empty)');
    
    // Generate random parameters (only hash and signature matter)
    const randomCidBytes = generateRandomCidV1(); // 36 bytes
    
    // Generate random nonces and keys
    const randomContentNonceBytes = new Uint8Array(12);
    crypto.getRandomValues(randomContentNonceBytes);
    
    const randomCidNonceBytes = new Uint8Array(12);
    crypto.getRandomValues(randomCidNonceBytes);
    
    const randomEphemeralKey = new Uint8Array(32);
    crypto.getRandomValues(randomEphemeralKey);
    
    // "Encrypt" CID with random key (just to get 52 bytes)
    const randomSharedSecret = new Uint8Array(32);
    crypto.getRandomValues(randomSharedSecret);
    const encryptedCidBytes = encrypt(randomCidBytes, randomSharedSecret, randomCidNonceBytes);
    
    // Convert to hex
    encryptedCid = bytesToHex(encryptedCidBytes);
    ephemeralPubkey = bytesToHex(randomEphemeralKey);
    cidNonce = bytesToHex(randomCidNonceBytes);
    contentNonce = bytesToHex(randomContentNonceBytes);
    
    ipfsCid = null; // No real IPFS upload in simple mode
    
    console.log('Random parameters generated (simple mode)');
  }
  
  // Submit transaction
  console.log('Submitting to blockchain...');
  const unsub = await submitEncryptedCryptoTrail({
    api,
    accountAddress: selectedAccount,
    signer: injector.signer,
    encryptedCid,
    ephemeralPubkey,
    cidNonce,
    contentNonce,
    contentHash,
    signature,
    onStatusChange
  });
  
  return {
    unsub,
    contentHash,
    ipfsCid,
    useEncryption
  };
}

/**
 * Create and download a proof file
 * @param {Object} ragData - RAG data object
 * @param {string} contentHash - Content hash for filename
 */
export function downloadProofFile(ragData, contentHash) {
  const proof = { ragData };
  const proofJson = JSON.stringify(proof, null, 2);
  
  const blob = new Blob([proofJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `proof_${contentHash}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('Proof file downloaded:', `proof_${contentHash}.json`);
}

