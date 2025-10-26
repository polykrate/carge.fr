import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProofVerifier } from '../proof-verifier';

describe('ProofVerifier', () => {
  let verifier;
  let mockSubstrateClient;

  beforeEach(() => {
    mockSubstrateClient = {
      rpcUrl: 'https://test-rpc.example.com',
      queryStorage: vi.fn()
    };
    verifier = new ProofVerifier(mockSubstrateClient);

    // Mock Polkadot.js utils
    global.window = {
      polkadotUtil: {
        hexToU8a: (hex) => new Uint8Array(Buffer.from(hex.slice(2), 'hex')),
        u8aToHex: (arr) => '0x' + Buffer.from(arr).toString('hex'),
        stringToU8a: (str) => new TextEncoder().encode(str)
      },
      polkadotUtilCrypto: {
        cryptoWaitReady: vi.fn().mockResolvedValue(true),
        xxhashAsHex: vi.fn((str, bits) => '0x' + '00'.repeat(bits / 8)),
        blake2AsHex: vi.fn((data, bits) => '0x' + '00'.repeat(bits / 8)),
        blake2AsU8a: vi.fn((data, bits) => new Uint8Array((bits || 256) / 8).fill(0)),
        encodeAddress: vi.fn((bytes, prefix) => '5GrwvaEF5zXb26Fz'),
        signatureVerify: vi.fn((message, signature, address) => ({
          isValid: true,
          crypto: 'sr25519'
        }))
      }
    };
  });

  describe('calculateRagDataHash', () => {
    it('should calculate SHA-256 hash of ragData', async () => {
      const proof = {
        ragData: {
          ragHash: '0x123',
          stepHash: '0x456'
        }
      };

      const hash = await verifier.calculateRagDataHash(proof);
      
      expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('should throw error if ragData is missing', async () => {
      const proof = {};
      
      await expect(verifier.calculateRagDataHash(proof)).rejects.toThrow('missing ragData');
    });
  });

  describe('buildStorageKey', () => {
    it('should build correct storage key', () => {
      const contentHash = '0x' + '12'.repeat(32);
      
      const storageKey = verifier.buildStorageKey(contentHash);
      
      expect(storageKey).toMatch(/^0x[0-9a-f]+$/);
      expect(storageKey.length).toBeGreaterThan(66);
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', async () => {
      const contentHash = '0x' + 'ab'.repeat(32);
      const signature = '0x' + 'cd'.repeat(64);
      const address = '5GrwvaEF5zXb26Fz';

      const isValid = await verifier.verifySignature(contentHash, signature, address);
      
      expect(isValid).toBe(true);
    });

    it('should return false on verification error', async () => {
      global.window.polkadotUtilCrypto.signatureVerify = vi.fn(() => {
        throw new Error('Verification failed');
      });

      const isValid = await verifier.verifySignature('0x123', '0x456', 'test');
      
      expect(isValid).toBe(false);
    });
  });

  describe('decodeCryptoTrail', () => {
    it('should decode crypto trail data', () => {
      // Create minimal valid trail data (32 + 52 + 32 + 12 + 12 + 32 + 64 + 4 + 4 = 244 bytes)
      const creator = '00'.repeat(32);
      const encryptedCid = '00'.repeat(52);
      const ephemeralPubkey = '00'.repeat(32);
      const cidNonce = '00'.repeat(12);
      const contentNonce = '00'.repeat(12);
      const contentHash = '00'.repeat(32);
      const signature = '00'.repeat(64);
      const createdAt = '64000000'; // 100 in little-endian
      const expiresAt = 'c8000000'; // 200 in little-endian

      const hexData = '0x' + creator + encryptedCid + ephemeralPubkey + 
                      cidNonce + contentNonce + contentHash + signature + 
                      createdAt + expiresAt;

      const decoded = verifier.decodeCryptoTrail(hexData);
      
      expect(decoded).toBeDefined();
      expect(decoded.createdAt).toBe(100);
      expect(decoded.expiresAt).toBe(200);
      expect(decoded.contentHash).toMatch(/^0x[0-9a-f]+$/);
    });
  });
});

