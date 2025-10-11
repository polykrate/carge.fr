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

      // Fetch metadata for each RAG
      const rags = [];
      for (const key of keys) {
        try {
          const metadata = await this.getRagByStorageKey(key);
          if (metadata) {
            // Extract the hash from the storage key (last 32 bytes)
            const hash = '0x' + key.slice(-64);
            rags.push({
              hash,
              metadata
            });
          }
        } catch (error) {
          console.error(`Failed to fetch RAG metadata for key ${key}:`, error);
        }
      }

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
}

