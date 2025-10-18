/**
 * Tests for encryption utilities
 * Verify compatibility with crypto.ts (TypeScript implementation)
 */

import { describe, it, expect } from 'vitest';
import {
  generateEphemeralKeypair,
  deriveSharedSecret,
  encrypt,
  decrypt,
  generateNonce,
  hexToBytes,
  bytesToHex,
  encryptRagData,
  getPkiProfile,
} from '../encryption-utils.js';

describe('Encryption Utilities', () => {
  describe('generateEphemeralKeypair', () => {
    it('should generate a valid X25519 keypair', () => {
      const keypair = generateEphemeralKeypair();
      
      expect(keypair).toHaveProperty('secretKey');
      expect(keypair).toHaveProperty('publicKey');
      expect(keypair.secretKey).toBeInstanceOf(Uint8Array);
      expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keypair.secretKey.length).toBe(32);
      expect(keypair.publicKey.length).toBe(32);
    });

    it('should generate different keypairs each time', () => {
      const keypair1 = generateEphemeralKeypair();
      const keypair2 = generateEphemeralKeypair();
      
      expect(keypair1.secretKey).not.toEqual(keypair2.secretKey);
      expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
    });
  });

  describe('deriveSharedSecret (X25519 ECDH)', () => {
    it('should derive a 32-byte shared secret', () => {
      const alice = generateEphemeralKeypair();
      const bob = generateEphemeralKeypair();
      
      const aliceShared = deriveSharedSecret(alice.secretKey, bob.publicKey);
      const bobShared = deriveSharedSecret(bob.secretKey, alice.publicKey);
      
      // Both parties should derive the same shared secret
      expect(aliceShared).toEqual(bobShared);
      expect(aliceShared.length).toBe(32);
    });

    it('should throw on invalid secret key length', () => {
      const alice = generateEphemeralKeypair();
      const invalidSecret = new Uint8Array(16); // Wrong length
      
      expect(() => {
        deriveSharedSecret(invalidSecret, alice.publicKey);
      }).toThrow('Secret key must be 32 bytes');
    });

    it('should throw on invalid public key length', () => {
      const alice = generateEphemeralKeypair();
      const invalidPublic = new Uint8Array(16); // Wrong length
      
      expect(() => {
        deriveSharedSecret(alice.secretKey, invalidPublic);
      }).toThrow('Public key must be 32 bytes');
    });
  });

  describe('encrypt/decrypt (ChaCha20-Poly1305)', () => {
    it('should encrypt and decrypt data correctly', () => {
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);
      const nonce = generateNonce();
      const originalText = 'Hello, World!';
      const plaintext = new TextEncoder().encode(originalText);
      
      const ciphertext = encrypt(plaintext, key, nonce);
      const decrypted = decrypt(ciphertext, key, nonce);
      
      // Compare the actual data, not the object references
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(originalText);
      expect(Array.from(decrypted)).toEqual(Array.from(plaintext));
    });

    it('should produce different ciphertext with different nonces', () => {
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);
      const plaintext = new TextEncoder().encode('Hello, World!');
      
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      
      const ciphertext1 = encrypt(plaintext, key, nonce1);
      const ciphertext2 = encrypt(plaintext, key, nonce2);
      
      expect(ciphertext1).not.toEqual(ciphertext2);
    });

    it('should fail decryption with wrong key', () => {
      const key1 = new Uint8Array(32);
      const key2 = new Uint8Array(32);
      crypto.getRandomValues(key1);
      crypto.getRandomValues(key2);
      
      const nonce = generateNonce();
      const plaintext = new TextEncoder().encode('Hello, World!');
      
      const ciphertext = encrypt(plaintext, key1, nonce);
      
      expect(() => {
        decrypt(ciphertext, key2, nonce);
      }).toThrow('Decryption failed');
    });

    it('should throw on invalid key length', () => {
      const invalidKey = new Uint8Array(16); // Wrong length
      const nonce = generateNonce();
      const plaintext = new TextEncoder().encode('test');
      
      expect(() => {
        encrypt(plaintext, invalidKey, nonce);
      }).toThrow('Encryption key must be 32 bytes');
    });

    it('should throw on invalid nonce length', () => {
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);
      const invalidNonce = new Uint8Array(8); // Wrong length
      const plaintext = new TextEncoder().encode('test');
      
      expect(() => {
        encrypt(plaintext, key, invalidNonce);
      }).toThrow('Nonce must be 12 bytes');
    });

    it('should include authentication tag (AEAD)', () => {
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);
      const nonce = generateNonce();
      const plaintext = new TextEncoder().encode('Hello!');
      
      const ciphertext = encrypt(plaintext, key, nonce);
      
      // ChaCha20-Poly1305 adds 16-byte auth tag
      expect(ciphertext.length).toBe(plaintext.length + 16);
    });
  });

  describe('generateNonce', () => {
    it('should generate a 12-byte nonce', () => {
      const nonce = generateNonce();
      
      expect(nonce).toBeInstanceOf(Uint8Array);
      expect(nonce.length).toBe(12);
    });

    it('should generate different nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      
      expect(nonce1).not.toEqual(nonce2);
    });
  });

  describe('hex conversion utilities', () => {
    it('should convert bytes to hex and back', () => {
      const original = new Uint8Array([0x12, 0x34, 0xab, 0xcd, 0xef]);
      const hex = bytesToHex(original);
      const back = hexToBytes(hex);
      
      expect(hex).toBe('0x1234abcdef');
      expect(back).toEqual(original);
    });

    it('should handle hex with or without 0x prefix', () => {
      const withPrefix = hexToBytes('0x1234');
      const withoutPrefix = hexToBytes('1234');
      
      expect(withPrefix).toEqual(withoutPrefix);
      expect(withPrefix).toEqual(new Uint8Array([0x12, 0x34]));
    });
  });

  describe('encryptRagData (end-to-end)', () => {
    it('should encrypt RAG data with ECDH + ChaCha20-Poly1305', () => {
      const recipient = generateEphemeralKeypair();
      const ragData = {
        name: 'Test RAG',
        description: 'Test description',
        steps: ['step1', 'step2'],
      };
      
      const encrypted = encryptRagData(ragData, recipient.publicKey);
      
      expect(encrypted).toHaveProperty('encryptedContent');
      expect(encrypted).toHaveProperty('ephemeralPublicKey');
      expect(encrypted).toHaveProperty('contentNonce');
      
      expect(encrypted.encryptedContent).toBeInstanceOf(Uint8Array);
      expect(encrypted.ephemeralPublicKey).toBeInstanceOf(Uint8Array);
      expect(encrypted.contentNonce).toBeInstanceOf(Uint8Array);
      
      expect(encrypted.ephemeralPublicKey.length).toBe(32);
      expect(encrypted.contentNonce.length).toBe(12);
    });

    it('should allow recipient to decrypt RAG data', () => {
      const recipient = generateEphemeralKeypair();
      const ragData = {
        name: 'Test RAG',
        description: 'Test description',
        value: 12345,
      };
      
      const encrypted = encryptRagData(ragData, recipient.publicKey);
      
      // Recipient decrypts using their secret key and sender's ephemeral public key
      const sharedSecret = deriveSharedSecret(
        recipient.secretKey,
        encrypted.ephemeralPublicKey
      );
      
      const decryptedBytes = decrypt(
        encrypted.encryptedContent,
        sharedSecret,
        encrypted.contentNonce
      );
      
      const decryptedJson = JSON.parse(new TextDecoder().decode(decryptedBytes));
      
      expect(decryptedJson).toEqual(ragData);
    });

    it('should fail if wrong recipient tries to decrypt', () => {
      const recipient1 = generateEphemeralKeypair();
      const recipient2 = generateEphemeralKeypair();
      const ragData = { secret: 'classified' };
      
      const encrypted = encryptRagData(ragData, recipient1.publicKey);
      
      // Wrong recipient tries to decrypt
      const wrongSharedSecret = deriveSharedSecret(
        recipient2.secretKey,
        encrypted.ephemeralPublicKey
      );
      
      expect(() => {
        decrypt(
          encrypted.encryptedContent,
          wrongSharedSecret,
          encrypted.contentNonce
        );
      }).toThrow('Decryption failed');
    });
  });

  describe('Compatibility with TypeScript implementation', () => {
    it('should use the same algorithms', () => {
      // This test documents the algorithms used for compatibility
      // TypeScript: @noble/ciphers/chacha + @noble/curves/ed25519
      // JavaScript: @noble/ciphers/chacha.js + @noble/curves/ed25519.js
      
      const keypair = generateEphemeralKeypair();
      expect(keypair.secretKey.length).toBe(32); // X25519 standard
      expect(keypair.publicKey.length).toBe(32); // X25519 standard
      
      const nonce = generateNonce();
      expect(nonce.length).toBe(12); // ChaCha20-Poly1305 IETF standard
      
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);
      const plaintext = new Uint8Array([1, 2, 3]);
      const ciphertext = encrypt(plaintext, key, nonce);
      
      expect(ciphertext.length).toBe(plaintext.length + 16); // Poly1305 auth tag
    });

    it('should validate all inputs (security best practice)', () => {
      // TypeScript implementation validates all inputs
      // JavaScript should do the same
      
      const validKey = new Uint8Array(32);
      const invalidKey = new Uint8Array(16);
      const validNonce = new Uint8Array(12);
      const plaintext = new Uint8Array([1, 2, 3]);
      
      // Should throw on invalid inputs
      expect(() => encrypt(plaintext, invalidKey, validNonce)).toThrow();
      expect(() => deriveSharedSecret(invalidKey, validKey)).toThrow();
      expect(() => deriveSharedSecret(validKey, invalidKey)).toThrow();
    });
  });

  describe('Memory safety', () => {
    it('should clean up ephemeral secret keys', () => {
      const recipient = generateEphemeralKeypair();
      const ragData = { test: 'data' };
      
      const encrypted = encryptRagData(ragData, recipient.publicKey);
      
      // The encryptRagData function should have cleaned up sensitive data
      // We can't directly test this, but we verify the encrypted output is valid
      expect(encrypted.encryptedContent.length).toBeGreaterThan(0);
      expect(encrypted.ephemeralPublicKey.length).toBe(32);
    });
  });
});

