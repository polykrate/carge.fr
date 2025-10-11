/**
 * CID Converter - Convert between hex (blockchain) and string (IPFS) formats
 */

import { CID } from 'multiformats/cid';
import * as raw from 'multiformats/codecs/raw';
import { sha256 } from 'multiformats/hashes/sha2';

export class CidConverter {
  /**
   * Convert hex CID from blockchain to IPFS string format
   * @param {string} hexCid - Hex string (with or without 0x prefix)
   * @returns {string} - CID string (e.g., bafkreixxx...)
   */
  static hexToString(hexCid) {
    try {
      // Remove 0x prefix if present
      const hex = hexCid.startsWith('0x') ? hexCid.slice(2) : hexCid;
      
      // Convert hex to bytes (36 bytes for CIDv1)
      const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      // Decode CID from bytes
      const cid = CID.decode(bytes);
      
      // Return as string (base32 encoded)
      return cid.toString();
    } catch (error) {
      console.error('Error converting hex CID to string:', error);
      throw new Error(`Invalid CID hex format: ${hexCid}`);
    }
  }

  /**
   * Convert IPFS string CID to hex format for blockchain
   * @param {string} cidString - CID string (e.g., bafkreixxx...)
   * @returns {string} - Hex string with 0x prefix
   */
  static stringToHex(cidString) {
    try {
      // Parse CID string
      const cid = CID.parse(cidString);
      
      // Encode to bytes
      const bytes = cid.bytes;
      
      // Convert to hex
      const hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      return '0x' + hex;
    } catch (error) {
      console.error('Error converting CID string to hex:', error);
      throw new Error(`Invalid CID string format: ${cidString}`);
    }
  }

  /**
   * Create a CID from content hash
   * @param {Uint8Array} content - Content to hash
   * @returns {Promise<string>} - CID string
   */
  static async fromContent(content) {
    const hash = await sha256.digest(content);
    const cid = CID.create(1, raw.code, hash);
    return cid.toString();
  }

  /**
   * Validate CID format
   * @param {string} cidString - CID to validate
   * @returns {boolean} - True if valid
   */
  static isValid(cidString) {
    try {
      CID.parse(cidString);
      return true;
    } catch {
      return false;
    }
  }
}

