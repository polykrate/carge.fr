/**
 * Encryption Utilities
 * Functions for encrypting/decrypting RAG data for secure delivery
 */

import { sharedKey, scalarMultBase } from '@stablelib/x25519';
import { ChaCha20Poly1305 } from '@stablelib/chacha20poly1305';
import { randomBytes } from '@stablelib/random';

/**
 * Generate ephemeral keypair for ECDH
 * @returns {Object} { secretKey: Uint8Array, publicKey: Uint8Array }
 */
export function generateEphemeralKeypair() {
  const secretKey = randomBytes(32);
  const publicKey = scalarMultBase(secretKey);
  return { secretKey, publicKey };
}

/**
 * Perform ECDH key agreement to derive shared secret
 * @param {Uint8Array} secretKey - Our secret key
 * @param {Uint8Array} publicKey - Their public key
 * @returns {Uint8Array} Shared secret (32 bytes)
 */
export function deriveSharedSecret(secretKey, publicKey) {
  return sharedKey(secretKey, publicKey);
}

/**
 * Encrypt data using ChaCha20-Poly1305
 * @param {Uint8Array} data - Data to encrypt
 * @param {Uint8Array} key - 32-byte encryption key
 * @param {Uint8Array} nonce - 12-byte nonce
 * @returns {Uint8Array} Encrypted data with auth tag
 */
export function encrypt(data, key, nonce) {
  const cipher = new ChaCha20Poly1305(key);
  return cipher.seal(nonce, data);
}

/**
 * Decrypt data using ChaCha20-Poly1305
 * @param {Uint8Array} encryptedData - Data to decrypt (includes auth tag)
 * @param {Uint8Array} key - 32-byte encryption key
 * @param {Uint8Array} nonce - 12-byte nonce
 * @returns {Uint8Array} Decrypted data
 */
export function decrypt(encryptedData, key, nonce) {
  const cipher = new ChaCha20Poly1305(key);
  const decrypted = cipher.open(nonce, encryptedData);
  if (!decrypted) {
    throw new Error('Decryption failed - invalid key or corrupted data');
  }
  return decrypted;
}

/**
 * Generate random nonce (12 bytes for ChaCha20-Poly1305)
 * @returns {Uint8Array} Random nonce
 */
export function generateNonce() {
  return randomBytes(12);
}

/**
 * Convert hex string to Uint8Array
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {Uint8Array}
 */
export function hexToBytes(hex) {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 * @param {Uint8Array} bytes
 * @returns {string} Hex string with 0x prefix
 */
export function bytesToHex(bytes) {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get PKI profile from blockchain
 * @param {Object} api - Polkadot API instance
 * @param {string} targetAddress - SS58 address
 * @returns {Promise<Object>} PKI profile { exchangeKey, peerId, ... }
 */
export async function getPkiProfile(api, targetAddress) {
  try {
    console.log('Fetching PKI profile for:', targetAddress);
    
    // Convert SS58 address to AccountId32 (hex)
    const { decodeAddress } = await import('@polkadot/util-crypto');
    const publicKey = decodeAddress(targetAddress);
    const accountId = '0x' + Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('AccountId:', accountId);
    
    // Query PKI profile from blockchain
    const profile = await api.query.pki.pkiProfiles(accountId);
    
    if (!profile || profile.isNone) {
      return null;
    }
    
    const profileData = profile.unwrap();
    
    // Extract and format data
    const exchangeKey = bytesToHex(profileData.exchangeKey);
    const peerId = bytesToHex(profileData.peerId);
    
    console.log('PKI profile found:', { exchangeKey, peerId });
    
    return {
      exchangeKey,
      peerId,
      stakedAmount: profileData.stakedAmount.toString(),
      createdAt: profileData.createdAt.toNumber(),
      expiresAt: profileData.expiresAt.toNumber(),
    };
  } catch (error) {
    console.error('Failed to fetch PKI profile:', error);
    throw new Error(`Failed to fetch PKI profile: ${error.message}`);
  }
}

/**
 * Encrypt RAG data for secure delivery
 * @param {Object} ragData - RAG data object
 * @param {Uint8Array} targetExchangeKey - Recipient's public exchange key
 * @returns {Object} { encryptedContent, ephemeralPublicKey, contentNonce }
 */
export function encryptRagData(ragData, targetExchangeKey) {
  console.log('Encrypting RAG data...');
  
  // Generate ephemeral keypair
  const { secretKey: ephemeralSecretKey, publicKey: ephemeralPublicKey } = generateEphemeralKeypair();
  
  // Derive shared secret using ECDH
  const sharedSecret = deriveSharedSecret(ephemeralSecretKey, targetExchangeKey);
  
  // Generate nonce
  const contentNonce = generateNonce();
  
  // Convert RAG data to bytes
  const ragJson = JSON.stringify(ragData);
  const encoder = new TextEncoder();
  const ragBytes = encoder.encode(ragJson);
  
  // Encrypt
  const encryptedContent = encrypt(ragBytes, sharedSecret, contentNonce);
  
  // Clean up secret key from memory
  ephemeralSecretKey.fill(0);
  sharedSecret.fill(0);
  
  console.log('RAG data encrypted successfully');
  console.log('Encrypted content size:', encryptedContent.length, 'bytes');
  
  return {
    encryptedContent,
    ephemeralPublicKey,
    contentNonce
  };
}

/**
 * Encrypt CID for storage on blockchain
 * @param {string} cid - IPFS CID string
 * @param {Uint8Array} sharedSecret - Shared secret from ECDH
 * @returns {Object} { encryptedCid, cidNonce }
 */
export function encryptCid(cid, sharedSecret) {
  // Convert CID to bytes (we need the CID in a specific format)
  // For now, just use the CID string as bytes
  const encoder = new TextEncoder();
  const cidBytes = encoder.encode(cid);
  
  // Pad to 36 bytes if needed (CID v1 format)
  const paddedCidBytes = new Uint8Array(36);
  paddedCidBytes.set(cidBytes.slice(0, 36));
  
  const cidNonce = generateNonce();
  const encryptedCid = encrypt(paddedCidBytes, sharedSecret, cidNonce);
  
  return { encryptedCid, cidNonce };
}

