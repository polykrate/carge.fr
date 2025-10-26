// ============================================================================
// PROOF VERIFIER - Carge
// Module de vérification cryptographique de preuves sur la blockchain
// ============================================================================

export class ProofVerifier {
  constructor(substrateClient) {
    this.substrate = substrateClient;
  }


  /**
   * Calcule le hash blake2-256 du champ ragData d'une preuve (Substrate-compatible)
   */
  async calculateRagDataHash(proof) {
    if (!proof.ragData) {
      throw new Error('Invalid proof format: missing ragData field');
    }

    await this.waitForPolkadot();
    const { blake2AsU8a } = window.polkadotUtilCrypto;
    
    const ragDataString = JSON.stringify(proof.ragData);
    const encoder = new TextEncoder();
    const data = encoder.encode(ragDataString);
    const hashArray = blake2AsU8a(data, 256);
    const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return '0x' + hashHex;
  }

  /**
   * Attend que Polkadot.js soit chargé
   */
  async waitForPolkadot() {
    while (!window.polkadotUtil || !window.polkadotUtilCrypto) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await window.polkadotUtilCrypto.cryptoWaitReady();
  }

  /**
   * Construit la clé de stockage pour cryptoTrail.cryptoTrails(hash)
   */
  buildStorageKey(contentHashHex) {
    const { xxhashAsHex, blake2AsHex } = window.polkadotUtilCrypto;
    const { hexToU8a } = window.polkadotUtil;
    
    // Remove 0x prefix from content hash
    const hash = contentHashHex.startsWith('0x') ? contentHashHex.slice(2) : contentHashHex;
    const hashBytes = hexToU8a('0x' + hash);
    
    // Storage key structure in Substrate:
    // xxHash128("CryptoTrail") + xxHash128("CryptoTrails") + blake2_128concat(contentHash)
    
    // 1. Module hash: xxHash128("CryptoTrail")
    const moduleHash = xxhashAsHex('CryptoTrail', 128);
    
    // 2. Storage item hash: xxHash128("CryptoTrails") 
    const storageHash = xxhashAsHex('CryptoTrails', 128);
    
    // 3. Key hash: blake2_128concat(contentHash)
    // blake2_128concat = blake2_128(key) + key
    const keyHashPrefix = blake2AsHex(hashBytes, 128);
    
    // Combine all parts
    const storageKey = moduleHash + storageHash.slice(2) + keyHashPrefix.slice(2) + hash;
    
    console.log('Storage key components:', {
      module: moduleHash,
      storage: storageHash,
      keyPrefix: keyHashPrefix,
      contentHash: '0x' + hash,
      fullKey: storageKey
    });
    
    return storageKey;
  }

  /**
   * Décode un CryptoTrail depuis les données brutes de la blockchain
   */
  decodeCryptoTrail(hexData) {
    try {
      const { hexToU8a, u8aToHex } = window.polkadotUtil;
      
      // Remove 0x prefix and convert to bytes
      const hex = hexData.startsWith('0x') ? hexData.slice(2) : hexData;
      const bytes = hexToU8a('0x' + hex);
      
      let offset = 0;
      
      // Structure: PalletCryptoTrailCryptoTrail
      // 1. creator: AccountId32 (32 bytes)
      const creator = u8aToHex(bytes.slice(offset, offset + 32));
      offset += 32;
      
      // 2. encryptedCid: FixedBytes<52> (52 bytes)
      const encryptedCid = u8aToHex(bytes.slice(offset, offset + 52));
      offset += 52;
      
      // 3. ephemeralPubkey: FixedBytes<32> (32 bytes)
      const ephemeralPubkey = u8aToHex(bytes.slice(offset, offset + 32));
      offset += 32;
      
      // 4. cidNonce: FixedBytes<12> (12 bytes)
      const cidNonce = u8aToHex(bytes.slice(offset, offset + 12));
      offset += 12;
      
      // 5. contentNonce: FixedBytes<12> (12 bytes)
      const contentNonce = u8aToHex(bytes.slice(offset, offset + 12));
      offset += 12;
      
      // 6. contentHash: FixedBytes<32> (32 bytes)
      const contentHash = u8aToHex(bytes.slice(offset, offset + 32));
      offset += 32;
      
      // 7. substrateSignature: FixedBytes<64> (64 bytes)
      const substrateSignature = u8aToHex(bytes.slice(offset, offset + 64));
      offset += 64;
      
      // 8. createdAt: BlockNumberFor<T> = u32 (4 bytes, little-endian)
      const createdAtBytes = bytes.slice(offset, offset + 4);
      const createdAt = new DataView(createdAtBytes.buffer, createdAtBytes.byteOffset, 4).getUint32(0, true);
      offset += 4;
      
      // 9. expiresAt: BlockNumberFor<T> = u32 (4 bytes, little-endian)
      const expiresAtBytes = bytes.slice(offset, offset + 4);
      const expiresAt = new DataView(expiresAtBytes.buffer, expiresAtBytes.byteOffset, 4).getUint32(0, true);
      offset += 4;
      
      console.log('✓ Decoded CryptoTrail:', {
        creator,
        encryptedCid,
        ephemeralPubkey,
        cidNonce,
        contentNonce,
        contentHash,
        substrateSignature,
        createdAt,
        expiresAt
      });
      
      return {
        creator,
        encryptedCid,
        ephemeralPubkey,
        cidNonce,
        contentNonce,
        contentHash,
        substrateSignature,
        createdAt,
        expiresAt
      };
      
    } catch (error) {
      console.error('Failed to decode CryptoTrail:', error);
      return null;
    }
  }

  /**
   * Verify signature off-chain
   * @param {string} contentHash - Content hash hex
   * @param {string} signature - Signature hex
   * @param {string} creatorAddress - SS58 address of creator
   * @returns {Promise<boolean>} True if signature is valid
   */
  async verifySignature(contentHash, signature, creatorAddress) {
    try {
      await this.waitForPolkadot();
      
      const { signatureVerify, cryptoWaitReady } = window.polkadotUtilCrypto;
      const { hexToU8a, u8aToHex, stringToU8a } = window.polkadotUtil;
      
      await cryptoWaitReady();
      
      // Reconstruct the wrapped message that was signed
      // The extension/MCP signs: b"<Bytes>" + contentHash + b"</Bytes>"
      const contentHashBytes = hexToU8a(contentHash);
      const wrappedMessage = new Uint8Array([
        ...stringToU8a('<Bytes>'),
        ...contentHashBytes,
        ...stringToU8a('</Bytes>')
      ]);
      
      console.log('Verifying signature off-chain...');
      console.log('  - Content hash:', contentHash);
      console.log('  - Wrapped message:', u8aToHex(wrappedMessage));
      console.log('  - Signature:', signature);
      console.log('  - Creator:', creatorAddress);
      
      // Verify using the wrapped message (not the hash)
      const result = signatureVerify(wrappedMessage, signature, creatorAddress);
      
      console.log('Signature verification:', result.isValid ? 'VALID' : 'INVALID');
      console.log('  - Crypto type:', result.crypto);
      
      return result.isValid;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Query blockchain directly for a content hash
   * @param {string} contentHash - Content hash (with or without 0x prefix)
   * @returns {Promise<Object|null>} Trail data if found, null otherwise
   */
  async queryBlockchain(contentHash) {
    try {
      console.log('Querying blockchain for hash:', contentHash);
      
      // Wait for Polkadot.js to be ready
      await this.waitForPolkadot();

      // Build storage key
      const storageKey = this.buildStorageKey(contentHash);
      console.log('Storage key:', storageKey);

      // Query blockchain
      const result = await this.substrate.queryStorage(storageKey);

      if (!result || result === '0x' || result === null) {
        console.log('Hash not found on blockchain');
        return null;
      }

      // Decode trail
      const trailData = this.decodeCryptoTrail(result);
      
      if (!trailData) {
        throw new Error('Trail found but failed to decode');
      }

      // Format creator address to SS58 first
      let creatorAddress = trailData.creator;
      try {
        const { encodeAddress } = window.polkadotUtilCrypto;
        const { hexToU8a } = window.polkadotUtil;
        
        const creatorBytes = hexToU8a(trailData.creator);
        creatorAddress = encodeAddress(creatorBytes, 42); // 42 = generic Substrate prefix
      } catch (e) {
        console.warn('Failed to encode creator address:', e);
      }
      
      // Verify signature off-chain using the SS58 address
      const signatureValid = await this.verifySignature(
        contentHash,
        trailData.substrateSignature,
        creatorAddress
      );
      
      console.log('Trail found and decoded. Signature valid:', signatureValid);

      return {
        ...trailData,
        creatorAddress,
        signatureValid
      };
    } catch (error) {
      console.error('Blockchain query error:', error);
      throw error;
    }
  }

  /**
   * Vérifie une preuve sur la blockchain
   */
  async verifyProof(proofJson) {
    // Parse proof
    let proof;
    try {
      proof = typeof proofJson === 'string' ? JSON.parse(proofJson) : proofJson;
    } catch {
      throw new Error('Invalid JSON format');
    }

    // Calculate hash
    const contentHash = await this.calculateRagDataHash(proof);
    console.log('Content hash:', contentHash);

    // Query blockchain
    const trail = await this.queryBlockchain(contentHash);

    if (!trail) {
      return {
        found: false,
        contentHash
      };
    }

    return {
      found: true,
      contentHash,
      trail
    };
  }

  /**
   * Reconstruit l'historique du workflow à partir d'une preuve finale
   * Retourne les étapes intermédiaires avec leurs hash et livrables reconstitués
   * @param {Object} proof - Proof object with ragData
   * @param {Object} ragClient - RagClient instance
   * @param {Object} ipfsClient - IpfsClient instance
   * @returns {Promise<Object>} Workflow history with verification status for each step
   */
  async reconstructWorkflowHistory(proof, ragClient, ipfsClient) {
    try {
      console.log('🔄 Reconstructing workflow history...');
      
      if (!proof.ragData) {
        throw new Error('Invalid proof format: missing ragData');
      }

      const { ragHash, stepHash, livrable } = proof.ragData;
      
      console.log(`RAG: ${ragHash}, Current step: ${stepHash}`);

      // 🚀 OPTIMIZATION 0: Fetch only the master RAG first to get the steps list
      console.log('📥 Fetching master workflow RAG...');
      const masterRag = await ragClient.getRagByHash(ragHash);
      
      if (!masterRag) {
        throw new Error(`Master workflow not found: ${ragHash}`);
      }

      const steps = masterRag.metadata.steps;
      const currentStepIndex = steps.findIndex(step => step === stepHash);
      
      if (currentStepIndex === -1) {
        throw new Error(`Current step hash not found in workflow: ${stepHash}`);
      }

      console.log(`Current step is ${currentStepIndex + 1}/${steps.length}`);

      // 🚀 OPTIMIZATION 0.5: Fetch only the necessary step RAGs (not all RAGs from blockchain)
      const neededStepHashes = steps.slice(0, currentStepIndex + 1);
      console.log(`📥 Fetching only ${neededStepHashes.length} necessary step RAG(s) in parallel...`);
      const stepRags = await ragClient.getRagsByHashes(neededStepHashes);
      
      // Create a map for quick lookup
      const stepRagMap = new Map(stepRags.map(rag => [rag.hash, rag]));
      console.log(`✅ Fetched ${stepRags.length}/${neededStepHashes.length} step RAG(s)`);

      // Reconstruct history by going through steps
      const history = [];
      
      // 🚀 OPTIMIZATION 1: Parallelize IPFS schema downloads
      console.log('📥 Downloading all step schemas in parallel...');
      const schemaPromises = neededStepHashes.map(async (stepHashValue, i) => {
        const stepRag = stepRagMap.get(stepHashValue);
        
        if (!stepRag) {
          console.warn(`Step ${i + 1} metadata not found: ${stepHashValue}`);
          return { hash: stepHashValue, metadata: null, keys: [] };
        }
        
        // Try to get schema keys
        let keys = [];
        try {
          const schemaCid = stepRag.metadata.schemaCid;
          const schemaObj = await ipfsClient.downloadJsonFromHex(schemaCid);
          keys = Object.keys(schemaObj.properties || {});
          console.log(`Step ${i + 1} keys from schema:`, keys);
        } catch (error) {
          console.warn(`Could not retrieve schema for step ${i + 1}:`, error.message);
        }
        
        return {
          hash: stepHashValue,
          metadata: stepRag.metadata,
          keys
        };
      });
      
      const stepMetadataList = await Promise.all(schemaPromises);
      console.log('✅ All schemas downloaded');

      // Reconstruct each step with partial delivrable data
      console.log('🔨 Building step hashes...');
      let accumulatedDelivrable = {};
      const stepsToVerify = [];
      
      for (let i = 0; i < neededStepHashes.length; i++) {
        const stepHashValue = neededStepHashes[i];
        const { keys, metadata } = stepMetadataList[i];
        
        // Extract only this step's data
        const stepOnlyData = {};
        for (const key of keys) {
          if (livrable[key] !== undefined) {
            stepOnlyData[key] = livrable[key];
          }
        }
        
        // Add keys from this step to accumulated delivrable
        for (const key of keys) {
          if (livrable[key] !== undefined) {
            accumulatedDelivrable[key] = livrable[key];
          }
        }

        // Calculate hash for this step using blake2 (Substrate-compatible)
        const stepRagData = {
          ragHash,
          stepHash: stepHashValue,
          livrable: { ...accumulatedDelivrable }
        };
        
        await this.waitForPolkadot();
        const { blake2AsU8a } = window.polkadotUtilCrypto;
        
        const ragDataString = JSON.stringify(stepRagData);
        const encoder = new TextEncoder();
        const data = encoder.encode(ragDataString);
        const hashArray = blake2AsU8a(data, 256);
        const contentHash = '0x' + Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');

        stepsToVerify.push({
          stepIndex: i,
          stepHash: stepHashValue,
          stepName: metadata?.name || `Step ${i + 1}`,
          delivrable: { ...accumulatedDelivrable },
          stepOnlyData: { ...stepOnlyData },
          contentHash
        });
      }

      // 🚀 OPTIMIZATION 2: Parallelize blockchain verifications
      console.log('⛓️  Verifying all steps on blockchain in parallel...');
      const verificationPromises = stepsToVerify.map(async (step) => {
        try {
          const trail = await this.queryBlockchain(step.contentHash);
          if (trail) {
            console.log(`✅ Step ${step.stepIndex + 1}: Verified on blockchain at block ${trail.createdAt}`);
            return {
              ...step,
              blockchainVerified: true,
              blockchainData: {
                creator: trail.creatorAddress,
                createdAt: trail.createdAt,
                expiresAt: trail.expiresAt,
                signatureValid: trail.signatureValid
              }
            };
          } else {
            console.log(`❌ Step ${step.stepIndex + 1}: Hash not found on blockchain: ${step.contentHash}`);
            return {
              ...step,
              blockchainVerified: false,
              blockchainData: null
            };
          }
        } catch (error) {
          console.warn(`⚠️ Step ${step.stepIndex + 1}: Blockchain verification error:`, error.message);
          return {
            ...step,
            blockchainVerified: false,
            blockchainData: null
          };
        }
      });

      const verifiedSteps = await Promise.all(verificationPromises);
      console.log('✅ All blockchain verifications complete');

      // Validate chain of trust (must be sequential as each step depends on previous)
      console.log('🔐 Validating chain of trust...');
      for (let i = 0; i < verifiedSteps.length; i++) {
        const step = verifiedSteps[i];
        let chainOfTrustValid = null; // null = not verifiable, true = valid, false = broken

        if (i > 0 && step.blockchainData) {
          const previousStep = verifiedSteps[i - 1];
          
          // Extract _targetAddress from any section of the delivrable
          let expectedCreator = null;
          if (previousStep && previousStep.delivrable) {
            // Look for _targetAddress in any section of the delivrable
            for (const key of Object.keys(previousStep.delivrable)) {
              if (previousStep.delivrable[key] && typeof previousStep.delivrable[key] === 'object' && previousStep.delivrable[key]._targetAddress) {
                expectedCreator = previousStep.delivrable[key]._targetAddress;
                // Keep the last one found (most recent section)
              }
            }
          }
          
          if (expectedCreator) {
            const actualCreator = step.blockchainData.creator;
            
            if (expectedCreator !== actualCreator) {
              chainOfTrustValid = false;
              console.warn(`⚠️ Chain of trust broken at step ${i + 1}: Expected creator ${expectedCreator} but got ${actualCreator}`);
            } else {
              chainOfTrustValid = true;
              console.log(`✅ Step ${i + 1}: Chain of trust validated (${actualCreator})`);
            }
          } else {
            console.log(`ℹ️ Step ${i + 1}: Chain of trust not verifiable (no _targetAddress in previous step)`);
          }
        } else if (i === 0) {
          // First step - chain of trust is valid by definition
          chainOfTrustValid = true;
        }

        history.push({
          ...step,
          chainOfTrustValid
        });

        console.log(`Step ${i + 1}: hash=${step.contentHash}, keys=[${Object.keys(step.delivrable).join(', ')}], verified=${step.blockchainVerified}`);
      }

      // Calculate chain of trust status
      const chainOfTrustStatuses = history.map(h => h.chainOfTrustValid);
      const hasAnyBroken = chainOfTrustStatuses.includes(false);
      const hasAnyNonVerifiable = chainOfTrustStatuses.includes(null);
      const allValid = chainOfTrustStatuses.every(status => status === true);
      
      return {
        masterWorkflowHash: ragHash,
        masterWorkflowName: masterRag.metadata?.name || 'Unknown Workflow',
        currentStepIndex,
        totalSteps: steps.length,
        history,
        allStepsVerified: history.every(h => h.blockchainVerified),
        chainOfTrustValid: hasAnyBroken ? false : (hasAnyNonVerifiable ? null : true),
        chainOfTrustVerifiable: !hasAnyNonVerifiable
      };
    } catch (error) {
      console.error('Failed to reconstruct workflow history:', error);
      throw error;
    }
  }
}

