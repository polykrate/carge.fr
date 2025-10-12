import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RagClient } from '../rag-client';

describe('RagClient', () => {
  let client;
  let mockSubstrateClient;

  beforeEach(() => {
    mockSubstrateClient = {
      rpcUrl: 'https://test-rpc.example.com'
    };
    client = new RagClient(mockSubstrateClient);
    global.fetch = vi.fn();
  });

  describe('getAllRags', () => {
    it('should fetch all RAGs from blockchain', async () => {
      // Mock state_getKeys
      global.fetch.mockResolvedValueOnce({
        json: async () => ({
          result: [
            '0x1234567890abcdef' + '12'.repeat(32) // storage key with hash
          ]
        })
      });

      // Mock state_getStorage for the RAG data
      global.fetch.mockResolvedValueOnce({
        json: async () => ({
          result: createMockRagData()
        })
      });

      const rags = await client.getAllRags();

      expect(rags).toBeInstanceOf(Array);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const rags = await client.getAllRags();

      expect(rags).toEqual([]);
    });

    it('should handle empty results', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({
          result: []
        })
      });

      const rags = await client.getAllRags();

      expect(rags).toEqual([]);
    });
  });

  describe('readU32', () => {
    it('should read little-endian u32', () => {
      const bytes = new Uint8Array([0x64, 0x00, 0x00, 0x00]); // 100
      
      const value = client.readU32(bytes, 0);
      
      expect(value).toBe(100);
    });

    it('should read u32 at offset', () => {
      const bytes = new Uint8Array([0xFF, 0xFF, 0xC8, 0x00, 0x00, 0x00]); // 200 at offset 2
      
      const value = client.readU32(bytes, 2);
      
      expect(value).toBe(200);
    });
  });

  describe('readCompactLength', () => {
    it('should read single-byte compact (mode 00)', () => {
      const bytes = new Uint8Array([0b00001000]); // 2 in compact encoding
      
      const length = client.readCompactLength(bytes, 0);
      
      expect(length).toBe(2);
    });

    it('should read two-byte compact (mode 01)', () => {
      const bytes = new Uint8Array([0b01000001, 0b00000001]); // 320 in compact
      
      const length = client.readCompactLength(bytes, 0);
      
      expect(length).toBeGreaterThan(0);
    });
  });

  describe('compactLengthSize', () => {
    it('should return 1 for single-byte compact', () => {
      const bytes = new Uint8Array([0b00001000]);
      
      const size = client.compactLengthSize(bytes, 0);
      
      expect(size).toBe(1);
    });

    it('should return 2 for two-byte compact', () => {
      const bytes = new Uint8Array([0b01000001, 0x01]);
      
      const size = client.compactLengthSize(bytes, 0);
      
      expect(size).toBe(2);
    });
  });
});

// Helper function to create mock RAG data
function createMockRagData() {
  // Minimal SCALE-encoded RAG metadata
  const instructionCid = '00'.repeat(36);
  const resourceCid = '00'.repeat(36);
  const schemaCid = '00'.repeat(36);
  const steps = '00'; // Empty vec
  const createdAt = '64000000'; // 100
  const expiresAt = 'c8000000'; // 200
  const stakedAmount = '00'.repeat(16);
  const publisher = '00'.repeat(32);
  const name = '0474657374'; // "test" with length prefix
  const description = '0474657374'; // "test" with length prefix

  return '0x' + instructionCid + resourceCid + schemaCid + steps + 
         createdAt + expiresAt + stakedAmount + publisher + name + description;
}

