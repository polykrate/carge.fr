// ============================================================================
// CRYPTO MODULE - Human Context Web
// Basé sur les bonnes pratiques du wallet avec HKDF (RFC 5869)
// ============================================================================

import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { x25519 } from '@noble/curves/ed25519';
import { ed25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from '@noble/hashes/utils';
import { CID } from 'multiformats/cid';

// ============================================================================
// DÉRIVATION DE CLÉS (HKDF - Standard RFC 5869)
// ============================================================================

/**
 * Dérive une paire de clés X25519 depuis une seed Substrate (DÉTERMINISTE)
 * Utilise HKDF pour une sécurité cryptographique maximale
 * 
 * @param {Uint8Array} substrateSeed - Seed de 32 bytes (depuis mnémonique)
 * @param {number} keyIndex - Index pour rotation de clés (0 = clé principale)
 * @param {string} info - Contexte de dérivation
 * @returns {{ publicKey: Uint8Array, secretKey: Uint8Array }}
 */
export function deriveX25519KeyPair(substrateSeed, keyIndex = 0, info = 'X25519-encryption') {
  // Validation stricte
  if (substrateSeed.length !== 32) {
    throw new Error('Substrate seed must be 32 bytes');
  }
  if (keyIndex < 0 || !Number.isInteger(keyIndex)) {
    throw new Error('Key index must be a non-negative integer');
  }

  // Utiliser l'index comme sel (4 bytes en big-endian)
  const indexBuffer = new Uint8Array(4);
  new DataView(indexBuffer.buffer).setUint32(0, keyIndex, false);
  
  // Contexte unique avec index
  const context = `${info}:${keyIndex}`;

  // Dérivation HKDF (standard cryptographique)
  const secretKey = hkdf(sha256, substrateSeed, indexBuffer, context, 32);
  const publicKey = x25519.getPublicKey(secretKey);

  return {
    publicKey: new Uint8Array(publicKey),
    secretKey: new Uint8Array(secretKey)
  };
}

/**
 * Dérive une paire de clés Ed25519 pour Helia (DÉTERMINISTE)
 * 
 * @param {Uint8Array} substrateSeed - Seed de 32 bytes
 * @param {number} keyIndex - Index pour rotation (0 = clé principale)
 * @param {string} info - Contexte
 * @returns {{ publicKey: Uint8Array, secretKey: Uint8Array }}
 */
export function deriveEd25519KeyPair(substrateSeed, keyIndex = 0, info = 'Ed25519-Helia') {
  if (substrateSeed.length !== 32) {
    throw new Error('Substrate seed must be 32 bytes');
  }
  if (keyIndex < 0 || !Number.isInteger(keyIndex)) {
    throw new Error('Key index must be a non-negative integer');
  }

  const indexBuffer = new Uint8Array(4);
  new DataView(indexBuffer.buffer).setUint32(0, keyIndex, false);
  
  const context = `${info}:${keyIndex}`;
  const secretKey = hkdf(sha256, substrateSeed, indexBuffer, context, 32);
  const publicKey = ed25519.getPublicKey(secretKey);

  return {
    publicKey: new Uint8Array(publicKey),
    secretKey: new Uint8Array(secretKey)
  };
}

/**
 * Génère une clé éphémère X25519 (NON-DÉTERMINISTE)
 * Pour Perfect Forward Secrecy
 * 
 * @param {Uint8Array} substrateSeed - Seed de 32 bytes
 * @returns {{ publicKey: Uint8Array, secretKey: Uint8Array, salt: Uint8Array }}
 */
export function deriveEphemeralX25519KeyPair(substrateSeed) {
  if (substrateSeed.length !== 32) {
    throw new Error('Substrate seed must be 32 bytes');
  }

  const salt = randomBytes(32);
  const secretKey = hkdf(sha256, substrateSeed, salt, 'X25519-ephemeral', 32);
  const publicKey = x25519.getPublicKey(secretKey);

  return {
    publicKey: new Uint8Array(publicKey),
    secretKey: new Uint8Array(secretKey),
    salt // Retourner le sel pour pouvoir re-dériver si nécessaire
  };
}

// ============================================================================
// CHIFFREMENT / DÉCHIFFREMENT (avec nettoyage mémoire)
// ============================================================================

/**
 * Génère un nonce aléatoire de 12 bytes pour ChaCha20-Poly1305
 * @returns {Uint8Array}
 */
export function generateNonce() {
  return randomBytes(12);
}

/**
 * ECDH key agreement avec validation
 * 
 * @param {Uint8Array} secretKey - Notre clé privée X25519 (32 bytes)
 * @param {Uint8Array} publicKey - Leur clé publique X25519 (32 bytes)
 * @returns {Uint8Array} Shared secret (32 bytes)
 */
export function agreement(secretKey, publicKey) {
  // Validation stricte
  if (secretKey.length !== 32) {
    throw new Error('Secret key must be 32 bytes');
  }
  if (publicKey.length !== 32) {
    throw new Error('Public key must be 32 bytes');
  }
  
  return x25519.getSharedSecret(secretKey, publicKey);
}

/**
 * Chiffre des données avec ChaCha20-Poly1305
 * 
 * @param {Uint8Array|string} data - Données à chiffrer
 * @param {Uint8Array} key - Clé de chiffrement (32 bytes)
 * @param {Uint8Array} nonce - Nonce (12 bytes)
 * @returns {Uint8Array} Données chiffrées
 */
export function encrypt(data, key, nonce) {
  // Validation stricte
  if (key.length !== 32) {
    throw new Error('Key must be 32 bytes');
  }
  if (nonce.length !== 12) {
    throw new Error('Nonce must be 12 bytes for ChaCha20-Poly1305');
  }

  const dataBytes = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;

  const cipher = chacha20poly1305(key, nonce);
  return cipher.encrypt(dataBytes);
}

/**
 * Déchiffre des données avec ChaCha20-Poly1305
 * 
 * @param {Uint8Array} encryptedData - Données chiffrées
 * @param {Uint8Array} key - Clé de déchiffrement (32 bytes)
 * @param {Uint8Array} nonce - Nonce (12 bytes)
 * @returns {Uint8Array} Données déchiffrées
 */
export function decrypt(encryptedData, key, nonce) {
  // Validation stricte
  if (key.length !== 32) {
    throw new Error('Key must be 32 bytes');
  }
  if (nonce.length !== 12) {
    throw new Error('Nonce must be 12 bytes');
  }

  const cipher = chacha20poly1305(key, nonce);
  return cipher.decrypt(encryptedData);
}

/**
 * Chiffre pour un destinataire (ECDH + encryption)
 * AVEC nettoyage automatique du shared secret
 * 
 * @param {string|Uint8Array} plaintext - Message à chiffrer
 * @param {Uint8Array} recipientPublicKey - Clé publique X25519 du destinataire (32 bytes)
 * @param {{ publicKey: Uint8Array, secretKey: Uint8Array }} senderKeyPair - Notre paire de clés
 * @param {Uint8Array|null} nonce - Nonce (optionnel, généré si non fourni)
 * @returns {{ ciphertext: Uint8Array, nonce: Uint8Array, senderPublicKey: Uint8Array }}
 */
export function encryptForRecipient(plaintext, recipientPublicKey, senderKeyPair, nonce = null) {
  // Validation
  if (recipientPublicKey.length !== 32) {
    throw new Error('Recipient public key must be 32 bytes');
  }
  if (senderKeyPair.secretKey.length !== 32) {
    throw new Error('Sender secret key must be 32 bytes');
  }

  const plaintextBytes = typeof plaintext === 'string'
    ? new TextEncoder().encode(plaintext)
    : plaintext;

  const actualNonce = nonce || generateNonce();
  if (actualNonce.length !== 12) {
    throw new Error('Nonce must be 12 bytes');
  }

  // ECDH pour calculer le shared secret
  const sharedSecret = x25519.getSharedSecret(senderKeyPair.secretKey, recipientPublicKey);

  try {
    // Chiffrer avec ChaCha20-Poly1305
    const cipher = chacha20poly1305(sharedSecret, actualNonce);
    const ciphertext = cipher.encrypt(plaintextBytes);

    return {
      ciphertext: new Uint8Array(ciphertext),
      nonce: actualNonce,
      senderPublicKey: senderKeyPair.publicKey
    };
  } finally {
    // ⭐ NETTOYAGE MÉMOIRE - Bonnes pratiques sécurité
    sharedSecret.fill(0);
  }
}

/**
 * Déchiffre depuis un expéditeur (ECDH + decryption)
 * AVEC nettoyage automatique du shared secret
 * 
 * @param {{ ciphertext: Uint8Array, nonce: Uint8Array, senderPublicKey: Uint8Array }} encrypted
 * @param {{ publicKey: Uint8Array, secretKey: Uint8Array }} recipientKeyPair
 * @param {boolean} asString - Si true, retourne un string, sinon Uint8Array
 * @returns {string|Uint8Array|null} Message déchiffré ou null si échec
 */
export function decryptFromSender(encrypted, recipientKeyPair, asString = true) {
  let sharedSecret = null;

  try {
    // Validation
    if (encrypted.nonce.length !== 12) {
      throw new Error('Nonce must be 12 bytes');
    }
    if (encrypted.senderPublicKey.length !== 32) {
      throw new Error('Sender public key must be 32 bytes');
    }
    if (recipientKeyPair.secretKey.length !== 32) {
      throw new Error('Recipient secret key must be 32 bytes');
    }

    // ECDH pour calculer le shared secret
    sharedSecret = x25519.getSharedSecret(recipientKeyPair.secretKey, encrypted.senderPublicKey);

    // Déchiffrer
    const cipher = chacha20poly1305(sharedSecret, encrypted.nonce);
    const plaintext = cipher.decrypt(encrypted.ciphertext);

    return asString ? new TextDecoder().decode(plaintext) : plaintext;
  } catch (error) {
    // Retourner null pour erreurs d'authentification
    if (error.message && (error.message.includes('bytes') || error.message.includes('key'))) {
      throw error;
    }
    return null;
  } finally {
    // ⭐ NETTOYAGE MÉMOIRE
    if (sharedSecret) {
      sharedSecret.fill(0);
    }
  }
}

/**
 * Nettoie une paire de clés de la mémoire (sécurité)
 * @param {{ publicKey: Uint8Array, secretKey: Uint8Array }} keyPair
 */
export function clearKeyPair(keyPair) {
  if (keyPair.secretKey) keyPair.secretKey.fill(0);
  if (keyPair.publicKey) keyPair.publicKey.fill(0);
}

// ============================================================================
// UTILITAIRES CID (pour IPFS/Blockchain)
// ============================================================================

export class CidConverter {
  /**
   * Convertit un CID string en bytes pour la blockchain (36 bytes)
   * @param {string} cidString
   * @returns {Uint8Array}
   */
  static toChainFormat(cidString) {
    const cid = CID.parse(cidString);
    
    if (cid.version !== 1) {
      throw new Error(`Invalid CID version: expected v1, got v${cid.version}`);
    }
    
    if (cid.bytes.length !== 36) {
      throw new Error(`Invalid CID size: expected 36 bytes, got ${cid.bytes.length}`);
    }
    
    return cid.bytes;
  }
  
  /**
   * Reconstruit un CID string depuis les bytes de la blockchain
   * @param {Uint8Array} cidBytes
   * @returns {string}
   */
  static fromChainFormat(cidBytes) {
    if (cidBytes.length !== 36) {
      throw new Error(`Invalid CID bytes: expected 36 bytes, got ${cidBytes.length}`);
    }
    
    const cid = CID.decode(cidBytes);
    return cid.toString();
  }
  
  /**
   * Valide qu'un CID peut être converti au format blockchain
   * @param {string} cidString
   * @returns {boolean}
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

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Convertit hex en bytes
 * @param {string} hex
 * @returns {Uint8Array}
 */
export function hexToBytes(hex) {
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  return new Uint8Array(cleaned.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

/**
 * Convertit bytes en hex
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function bytesToHex(bytes) {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

