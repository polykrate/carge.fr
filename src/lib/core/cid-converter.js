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

  /**
   * Convert CID string to blockchain format (36 bytes)
   * @param {string} cidString - CID string (e.g., "bafybeigdyrzt5..." or "Qm...")
   * @returns {Uint8Array} - 36 bytes for blockchain storage
   */
  static toChainFormat(cidString) {
    try {
      let cid = CID.parse(cidString);
      
      // Auto-convert CIDv0 to CIDv1 (Kubo/IPFS often returns v0)
      if (cid.version === 0) {
        console.log('Converting CID v0 to v1 for blockchain compatibility');
        cid = cid.toV1();
      }
      
      // Verify it's CIDv1 with 36 bytes
      if (cid.version !== 1) {
        throw new Error(`Invalid CID version: expected v1, got v${cid.version}`);
      }
      
      if (cid.bytes.length !== 36) {
        throw new Error(`Invalid CID size: expected 36 bytes, got ${cid.bytes.length}`);
      }
      
      return cid.bytes;
    } catch (error) {
      throw new Error(`Failed to convert CID to chain format: ${error.message}`);
    }
  }

  /**
   * Reconstruct CID string from blockchain bytes
   * @param {Uint8Array} cidBytes - 36 bytes from blockchain
   * @returns {string} - CID string
   */
  static fromChainFormat(cidBytes) {
    try {
      if (cidBytes.length !== 36) {
        throw new Error(`Invalid CID bytes: expected 36 bytes, got ${cidBytes.length}`);
      }
      
      const cid = CID.decode(cidBytes);
      return cid.toString();
    } catch (error) {
      throw new Error(`Failed to convert CID from chain format: ${error.message}`);
    }
  }

  /**
   * Validate if CID can be converted to blockchain format
   * @param {string} cidString - CID to validate
   * @returns {boolean} - True if compatible with blockchain
   */
  static isValidForChain(cidString) {
    try {
      const cid = CID.parse(cidString);
      return cid.version === 1 && cid.bytes.length === 36;
    } catch {
      return false;
    }
  }
}

