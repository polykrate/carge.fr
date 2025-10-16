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

