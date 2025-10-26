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
}

