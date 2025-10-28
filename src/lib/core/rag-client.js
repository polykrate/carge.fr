/**
 * RAG Client - Query RAG metadata from the blockchain
 */

import { xxhashAsHex } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a } from '@polkadot/util';

export class RagClient {
  constructor(substrateClient) {
    this.substrateClient = substrateClient;
  }

  /**
   * Create a RAG metadata extrinsic without signing it (for batching)
   * @returns {Promise<Object>} Unsigned extrinsic
   */
  async prepareRagMetadataExtrinsic(
    name,
    description,
    instructionCid,
    resourceCid,
    schemaCid,
    stepHashes = [],
    tags = [],
    ttl = null
  ) {
    try {
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const { config } = await import('../config.js');
      
      // Use WebSocket URL from config (required by WsProvider)
      const provider = new WsProvider(config.SUBSTRATE_WS_URL);
      const api = await ApiPromise.create({ provider });
      
      // Clean hex strings (ensure 0x prefix)
      const cleanHex = (hex) => {
        if (typeof hex !== 'string') {
          throw new Error('CID must be a hex string');
        }
        return hex.startsWith('0x') ? hex : `0x${hex}`;
      };
      
      const instructionCidHex = cleanHex(instructionCid);
      const resourceCidHex = cleanHex(resourceCid);
      const schemaCidHex = cleanHex(schemaCid);
      
      // Create extrinsic WITHOUT signing
      const extrinsic = api.tx.rag.storeMetadata(
        instructionCidHex,
        resourceCidHex,
        schemaCidHex,
        stepHashes.map(h => cleanHex(h)),
        name,
        description,
        tags,
        ttl
      );
      
      return { extrinsic, api };
    } catch (error) {
      console.error('Error preparing RAG extrinsic:', error);
      throw error;
    }
  }

  /**
   * Get all RAGs from the blockchain
   * Uses state_getKeys RPC to query all entries in rag.ragStorage
   * @returns Promise<Array<{hash: string, metadata: Object}>>
   */
  async getAllRags() {
    try {
      if (!this.substrateClient || !this.substrateClient.rpcUrl) {
        throw new Error('Substrate client not initialized');
      }

      // Calculate the storage prefix for rag.ragStorage
      // Storage key format: xxhash128("Rag") + xxhash128("RagStorage")
      const modulePrefix = xxhashAsHex('Rag', 128);
      const storagePrefix = xxhashAsHex('RagStorage', 128);
      const fullPrefix = modulePrefix + storagePrefix.slice(2); // Remove 0x from second part

      console.log(`Querying RAG storage with prefix: ${fullPrefix}`);

      // Get all keys for this storage map
      const response = await fetch(this.substrateClient.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'state_getKeys',
          params: [fullPrefix],
          id: 1
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('RPC error:', data.error);
        return [];
      }

      const keys = data.result || [];
      console.log(`Found ${keys.length} RAG(s)`);

      // Fetch metadata for each RAG in parallel (optimized)
      const ragPromises = keys.map(async (key) => {
        try {
          const metadata = await this.getRagByStorageKey(key);
          if (metadata) {
            // Extract the hash from the storage key (last 32 bytes)
            const hash = '0x' + key.slice(-64);
            return {
              hash,
              metadata
            };
          }
          return null;
        } catch (error) {
          console.error(`Failed to fetch RAG metadata for key ${key}:`, error);
          return null;
        }
      });

      const results = await Promise.all(ragPromises);
      const rags = results.filter(rag => rag !== null);

      return rags;
    } catch (error) {
      console.error('Error fetching RAGs:', error);
      return [];
    }
  }

  /**
   * Get RAG metadata by storage key
   */
  async getRagByStorageKey(storageKey) {
    try {
      const response = await fetch(this.substrateClient.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'state_getStorage',
          params: [storageKey],
          id: 1
        })
      });

      const data = await response.json();
      
      if (data.error || !data.result) {
        return null;
      }

      // Decode the SCALE-encoded metadata
      return this.decodeRagMetadata(data.result);
    } catch (error) {
      console.error('Error fetching RAG by storage key:', error);
      return null;
    }
  }

  /**
   * Decode RAG metadata from SCALE-encoded hex string
   * Structure: PalletRagRagMetadata {
   *   instructionCid: [u8; 36],
   *   resourceCid: [u8; 36],
   *   schemaCid: [u8; 36],
   *   steps: Vec<[u8; 32]>,
   *   createdAt: u32,
   *   expiresAt: u32,
   *   stakedAmount: u128,
   *   publisher: AccountId32,
   *   name: Vec<u8>,
   *   description: Vec<u8>
   * }
   */
  decodeRagMetadata(hexData) {
    try {
      const bytes = hexToU8a(hexData);
      let offset = 0;

      // Read fixed-size CIDs (36 bytes each)
      const instructionCid = u8aToHex(bytes.slice(offset, offset + 36));
      offset += 36;

      const resourceCid = u8aToHex(bytes.slice(offset, offset + 36));
      offset += 36;

      const schemaCid = u8aToHex(bytes.slice(offset, offset + 36));
      offset += 36;

      // Read Vec<[u8; 32]> steps
      // First, read the compact length
      const stepsLength = this.readCompactLength(bytes, offset);
      offset += this.compactLengthSize(bytes, offset);
      
      const steps = [];
      for (let i = 0; i < stepsLength; i++) {
        steps.push(u8aToHex(bytes.slice(offset, offset + 32)));
        offset += 32;
      }

      // Read u32 timestamps
      const createdAt = this.readU32(bytes, offset);
      offset += 4;

      const expiresAt = this.readU32(bytes, offset);
      offset += 4;

      // Read u128 stakedAmount (16 bytes, little-endian)
      const stakedAmount = this.readU128(bytes, offset);
      offset += 16;

      // Read AccountId32 (32 bytes)
      const publisher = u8aToHex(bytes.slice(offset, offset + 32));
      offset += 32;

      // Read Vec<u8> name
      const nameLength = this.readCompactLength(bytes, offset);
      offset += this.compactLengthSize(bytes, offset);
      const nameBytes = bytes.slice(offset, offset + nameLength);
      const name = new TextDecoder().decode(nameBytes);
      offset += nameLength;

      // Read Vec<u8> description
      const descLength = this.readCompactLength(bytes, offset);
      offset += this.compactLengthSize(bytes, offset);
      const descBytes = bytes.slice(offset, offset + descLength);
      const description = new TextDecoder().decode(descBytes);

      return {
        instructionCid,
        resourceCid,
        schemaCid,
        steps,
        createdAt,
        expiresAt,
        stakedAmount: stakedAmount.toString(),
        publisher,
        name,
        description
      };
    } catch (error) {
      console.error('Error decoding RAG metadata:', error);
      return null;
    }
  }

  /**
   * Read compact-encoded length (SCALE codec)
   */
  readCompactLength(bytes, offset) {
    const first = bytes[offset];
    const mode = first & 0b11;

    if (mode === 0b00) {
      return first >> 2;
    } else if (mode === 0b01) {
      return ((first >> 2) | (bytes[offset + 1] << 6));
    } else if (mode === 0b10) {
      return ((first >> 2) | (bytes[offset + 1] << 6) | (bytes[offset + 2] << 14) | (bytes[offset + 3] << 22));
    } else {
      // Mode 0b11 - big integer, not commonly used for lengths
      throw new Error('Compact length mode 0b11 not supported');
    }
  }

  /**
   * Get the size of a compact-encoded length
   */
  compactLengthSize(bytes, offset) {
    const mode = bytes[offset] & 0b11;
    if (mode === 0b00) return 1;
    if (mode === 0b01) return 2;
    if (mode === 0b10) return 4;
    throw new Error('Compact length mode 0b11 not supported');
  }

  /**
   * Read u32 (4 bytes, little-endian)
   */
  readU32(bytes, offset) {
    return bytes[offset] |
           (bytes[offset + 1] << 8) |
           (bytes[offset + 2] << 16) |
           (bytes[offset + 3] << 24);
  }

  /**
   * Read u128 (16 bytes, little-endian) as BigInt
   */
  readU128(bytes, offset) {
    let result = 0n;
    for (let i = 0; i < 16; i++) {
      result |= BigInt(bytes[offset + i]) << BigInt(i * 8);
    }
    return result;
  }

  /**
   * Get a specific RAG by its hash
   * @param {string} ragHash - RAG hash (0x-prefixed hex string)
   * @returns Promise<{hash: string, metadata: Object}|null>
   */
  async getRagByHash(ragHash) {
    try {
      // Build storage key for this specific RAG
      // Storage key format: xxhash128("Rag") + xxhash128("RagStorage") + blake2_128concat(ragHash)
      const { blake2AsHex } = await import('@polkadot/util-crypto');
      
      const modulePrefix = xxhashAsHex('Rag', 128);
      const storagePrefix = xxhashAsHex('RagStorage', 128);
      
      // Remove 0x prefix from hash
      const hash = ragHash.startsWith('0x') ? ragHash.slice(2) : ragHash;
      const hashBytes = hexToU8a('0x' + hash);
      
      // blake2_128concat = blake2_128(key) + key
      const keyHashPrefix = blake2AsHex(hashBytes, 128);
      const storageKey = modulePrefix + storagePrefix.slice(2) + keyHashPrefix.slice(2) + hash;
      
      // Fetch metadata
      const metadata = await this.getRagByStorageKey(storageKey);
      
      if (!metadata) {
        return null;
      }
      
      return {
        hash: ragHash,
        metadata
      };
    } catch (error) {
      console.error(`Error fetching RAG by hash ${ragHash}:`, error);
      return null;
    }
  }

  /**
   * Get multiple RAGs by their hashes (parallelized)
   * @param {string[]} ragHashes - Array of RAG hashes
   * @returns Promise<Array<{hash: string, metadata: Object}>>
   */
  async getRagsByHashes(ragHashes) {
    try {
      console.log(`Fetching ${ragHashes.length} specific RAG(s) in parallel...`);
      
      // Parallelize all RAG fetches
      const ragPromises = ragHashes.map(hash => this.getRagByHash(hash));
      const results = await Promise.all(ragPromises);
      
      // Filter out nulls (RAGs not found)
      const rags = results.filter(rag => rag !== null);
      
      console.log(`Successfully fetched ${rags.length}/${ragHashes.length} RAG(s)`);
      return rags;
    } catch (error) {
      console.error('Error fetching RAGs by hashes:', error);
      return [];
    }
  }

  /**
   * Search RAG metadata by tags using runtime API (AND logic)
   * @param {string[]} tags - Array of tags to search for (all must match)
   * @returns Promise<Array<{hash: string, metadata: Object}>>
   */
  async searchRagsByTags(tags) {
    let api = null;
    
    try {
      if (!this.substrateClient || !this.substrateClient.rpcUrl) {
        throw new Error('Substrate client not initialized');
      }

      // Validate tags
      if (!tags || tags.length === 0) {
        console.log('No tags provided for search');
        return [];
      }

      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed for search');
      }

      for (const tag of tags) {
        if (tag.length === 0 || tag.length > 15) {
          throw new Error(`Invalid tag "${tag}": must be between 1 and 15 characters`);
        }
      }

      console.log(`🔍 Searching RAGs with tags (AND logic): [${tags.join(', ')}]`);

      // Create a temporary API connection for runtime call
      console.log('Creating temporary API connection for runtime call...');
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const wsUrl = this.substrateClient.rpcUrl
        .replace('https://', 'wss://')
        .replace('http://', 'ws://');
      
      const wsProvider = new WsProvider(wsUrl);
      api = await ApiPromise.create({ provider: wsProvider });
      console.log('✅ API connected for runtime call');
      
      // Prepare tags for runtime API call
      // The runtime expects Vec<Bytes>, so we need to pass strings and let Polkadot.js encode them
      console.log('Calling ragApi.findByTags with tags:', tags);
      const searchResults = await api.call.ragApi.findByTags(tags);
      
      console.log('Raw search results:', searchResults);
      
      // Import utilities for hash conversion
      const { u8aToHex } = await import('@polkadot/util');
      
      // Convert BTreeMap to entries array
      let resultsEntries = [];
      
      if (searchResults && typeof searchResults === 'object') {
        if (searchResults instanceof Map) {
          resultsEntries = Array.from(searchResults.entries());
        } else if (Array.isArray(searchResults)) {
          resultsEntries = searchResults;
        } else if (typeof searchResults.entries === 'function') {
          resultsEntries = Array.from(searchResults.entries());
        } else if (searchResults.constructor === Object) {
          resultsEntries = Object.entries(searchResults);
        }
      }

      if (resultsEntries.length === 0) {
        console.log(`No RAGs found matching all tags: [${tags.join(', ')}]`);
        return [];
      }

      console.log(`Found ${resultsEntries.length} RAG(s) matching all tags`);

      // Process results - fetch full metadata for each hash
      const ragPromises = resultsEntries.map(async ([metadataHashRaw]) => {
        try {
          // Convert hash to hex string format
          let metadataHash;
          if (typeof metadataHashRaw === 'string') {
            metadataHash = metadataHashRaw.startsWith('0x') ? metadataHashRaw : `0x${metadataHashRaw}`;
          } else if (metadataHashRaw instanceof Uint8Array) {
            metadataHash = u8aToHex(metadataHashRaw);
          } else if (Array.isArray(metadataHashRaw)) {
            metadataHash = u8aToHex(new Uint8Array(metadataHashRaw));
          } else {
            metadataHash = u8aToHex(new Uint8Array(Object.values(metadataHashRaw)));
          }

          // Fetch the RAG by its hash
          const rag = await this.getRagByHash(metadataHash);
          return rag;
        } catch (error) {
          console.error(`Error processing search result:`, error);
          return null;
        }
      });

      const results = await Promise.all(ragPromises);
      const rags = results.filter(rag => rag !== null);

      console.log(`✅ Successfully retrieved ${rags.length} RAG(s) from search results`);
      
      // Disconnect the temporary API
      if (api) {
        await api.disconnect();
        console.log('API disconnected');
      }
      
      return rags;
    } catch (error) {
      console.error('Error searching RAGs by tags:', error);
      
      // Clean up API connection on error
      if (api) {
        try {
          await api.disconnect();
        } catch (disconnectError) {
          console.error('Error disconnecting API:', disconnectError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Calculate metadata hash (same as blockchain logic)
   * Hash = blake2_256(instruction_cid + resource_cid + schema_cid + blake2_256(steps.encode()))
   * @param {string} instructionCid - 36 bytes hex
   * @param {string} resourceCid - 36 bytes hex
   * @param {string} schemaCid - 36 bytes hex
   * @param {Array<string>} stepHashes - Array of 32 bytes hex
   * @returns {Promise<string>} Metadata hash (0x-prefixed)
   */
  async calculateMetadataHash(instructionCid, resourceCid, schemaCid, stepHashes = []) {
    const { blake2AsU8a, blake2AsHex } = await import('@polkadot/util-crypto');
    const { hexToU8a, compactToU8a, u8aConcat } = await import('@polkadot/util');
    
    // Remove 0x prefix if present
    const cleanHex = (hex) => hex.startsWith('0x') ? hex.slice(2) : hex;
    
    // Convert CIDs to bytes (36 bytes each)
    const instructionBytes = hexToU8a('0x' + cleanHex(instructionCid));
    const resourceBytes = hexToU8a('0x' + cleanHex(resourceCid));
    const schemaBytes = hexToU8a('0x' + cleanHex(schemaCid));
    
    // Encode steps as SCALE Vec<[u8; 32]>
    // SCALE encoding: compact length + items
    const stepsCount = stepHashes.length;
    const compactLength = compactToU8a(stepsCount);
    
    // Concatenate compact length + all step hashes
    const stepByteArrays = [compactLength];
    for (const stepHash of stepHashes) {
      const stepBytes = hexToU8a('0x' + cleanHex(stepHash));
      stepByteArrays.push(stepBytes);
    }
    const stepsBytes = u8aConcat(...stepByteArrays);
    
    // Hash the steps
    const stepsHash = blake2AsU8a(stepsBytes, 256);
    
    // Concatenate: instruction (36) + resource (36) + schema (36) + steps_hash (32) = 140 bytes
    const input = new Uint8Array(140);
    input.set(instructionBytes, 0);
    input.set(resourceBytes, 36);
    input.set(schemaBytes, 72);
    input.set(stepsHash, 108);
    
    // Final hash
    return blake2AsHex(input, 256);
  }

  /**
   * Store RAG metadata on the blockchain
   * @param {string} senderAddress - Account address creating the RAG
   * @param {string} name - Name of the RAG (max 50 chars)
   * @param {string} description - Description (max 300 chars)
   * @param {string} instructionCid - CID for instruction (36 bytes hex)
   * @param {string} resourceCid - CID for resource (36 bytes hex)
   * @param {string} schemaCid - CID for schema (36 bytes hex)
   * @param {Array<string>} stepHashes - Array of step hashes (32 bytes hex each, max 64)
   * @param {Array<string>} tags - Array of tags (max 10 tags, each max 15 chars)
   * @param {number} ttl - Optional time-to-live in blocks
   * @returns {Promise<string>} Metadata hash
   */
  async storeRagMetadata(
    senderAddress,
    name,
    description,
    instructionCid,
    resourceCid,
    schemaCid,
    stepHashes = [],
    tags = [],
    ttl = null
  ) {
    try {
      console.log('🔧 Creating RAG metadata on blockchain...');
      
      // Calculate metadata hash
      const expectedHash = await this.calculateMetadataHash(
        instructionCid,
        resourceCid,
        schemaCid,
        stepHashes
      );
      console.log(`📊 Expected metadata hash: ${expectedHash}`);
      
      // Check if RAG already exists
      const existingRag = await this.getRagByHash(expectedHash);
      if (existingRag) {
        console.log(`✅ RAG already exists with hash: ${expectedHash}`);
        console.log(`   Name: ${existingRag.metadata.name}`);
        console.log(`   Skipping creation, returning existing hash`);
        return expectedHash;
      }
      
      console.log('✨ RAG does not exist yet, creating...');
      
      // Import required utilities
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const { waitForPolkadot, getWalletSigner } = await import('./blockchain-utils.js');
      
      // Wait for Polkadot extension
      await waitForPolkadot();
      
      // Convert HTTP(S) RPC URL to WebSocket
      const wsUrl = this.substrateClient.rpcUrl
        .replace('https://', 'wss://')
        .replace('http://', 'ws://');
      
      // Create API connection
      console.log('Connecting to API:', wsUrl);
      const wsProvider = new WsProvider(wsUrl);
      const api = await ApiPromise.create({ provider: wsProvider });
      console.log('✅ API connected');
      
      // Get wallet signer
      const injector = await getWalletSigner(senderAddress);
      
      // Prepare parameters
      // CIDs should be 36-byte hex strings (with or without 0x prefix)
      const cleanHex = (hex) => hex.startsWith('0x') ? hex : `0x${hex}`;
      
      const instructionCidHex = cleanHex(instructionCid);
      const resourceCidHex = cleanHex(resourceCid);
      const schemaCidHex = cleanHex(schemaCid);
      
      console.log('Parameters:', {
        name,
        description,
        instructionCid: instructionCidHex.slice(0, 20) + '...',
        resourceCid: resourceCidHex.slice(0, 20) + '...',
        schemaCid: schemaCidHex.slice(0, 20) + '...',
        stepHashesCount: stepHashes.length,
        tagsCount: tags.length
      });
      
      // Create extrinsic
      const extrinsic = api.tx.rag.storeMetadata(
        instructionCidHex,
        resourceCidHex,
        schemaCidHex,
        stepHashes.map(h => cleanHex(h)),
        name,
        description,
        tags,
        ttl
      );
      
      // Sign and send
      console.log('📝 Signing and sending transaction...');
      
      return new Promise((resolve, reject) => {
        extrinsic
          .signAndSend(senderAddress, { signer: injector.signer }, ({ status, events, dispatchError }) => {
            console.log(`Transaction status: ${status.type}`);
            
            if (status.isInBlock) {
              console.log(`✅ Transaction included in block: ${status.asInBlock.toHex()}`);
              
              // Check for errors
              if (dispatchError) {
                let errorMessage = 'Transaction failed';
                
                if (dispatchError.isModule) {
                  const decoded = api.registry.findMetaError(dispatchError.asModule);
                  errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                } else {
                  errorMessage = dispatchError.toString();
                }
                
                console.error('❌ Dispatch error:', errorMessage);
                api.disconnect();
                reject(new Error(errorMessage));
                return;
              }
              
              // Extract metadata hash from events
              let metadataHash = null;
              events.forEach(({ event }) => {
                console.log(`Event: ${event.section}.${event.method}`);
                
                if (event.section === 'rag' && event.method === 'MetadataStored') {
                  // MetadataStored event: { metadata_hash, instruction_cid, resource_cid, schema_cid, publisher, staked_amount, expires_at }
                  // metadata_hash is at index 0 (32 bytes)
                  metadataHash = event.data[0].toHex();
                  console.log(`✅ Metadata hash: ${metadataHash}`);
                }
              });
              
              api.disconnect();
              
              if (metadataHash) {
                resolve(metadataHash);
              } else {
                reject(new Error('Metadata hash not found in events'));
              }
            }
            
            if (status.isFinalized) {
              console.log(`✅ Transaction finalized in block: ${status.asFinalized.toHex()}`);
            }
          })
          .catch(error => {
            console.error('❌ Transaction error:', error);
            api.disconnect();
            reject(error);
          });
      });
    } catch (error) {
      console.error('❌ Failed to store RAG metadata:', error);
      throw error;
    }
  }
}

