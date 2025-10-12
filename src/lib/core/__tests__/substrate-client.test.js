import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubstrateClient } from '../substrate-client';

describe('SubstrateClient', () => {
  let client;
  const mockRpcUrl = 'https://test-rpc.example.com';

  beforeEach(() => {
    global.fetch = vi.fn();
    client = new SubstrateClient(mockRpcUrl);
  });

  describe('constructor', () => {
    it('should initialize with RPC URL', () => {
      expect(client.rpcUrl).toBe(mockRpcUrl);
      expect(client.currentBlock).toBe(0);
    });
  });

  describe('connect', () => {
    it('should fetch current block number', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            number: '0x64' // 100 in hex
          }
        })
      });

      await client.connect();

      expect(client.currentBlock).toBe(100);
      expect(client.isConnected).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        mockRpcUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      // Clean up polling
      client.stopPolling();
    });

    it('should handle connection errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await client.connect();
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      expect(client.isConnected).toBe(false);
    });
  });

  describe('queryStorage', () => {
    beforeEach(() => {
      // Mock connection
      client.isConnected = true;
    });

    it('should query storage with correct params', async () => {
      const storageKey = '0x1234';
      const mockResult = '0xabcd';

      global.fetch.mockResolvedValueOnce({
        json: async () => ({
          result: mockResult
        })
      });

      const result = await client.queryStorage(storageKey);

      expect(result).toBe(mockResult);
      expect(global.fetch).toHaveBeenCalledWith(
        mockRpcUrl,
        expect.objectContaining({
          body: expect.stringContaining(storageKey)
        })
      );
    });

    it('should throw when not connected', async () => {
      client.isConnected = false;

      await expect(client.queryStorage('0x1234')).rejects.toThrow('Not connected to Substrate');
    });
  });

  describe('getCurrentBlock', () => {
    it('should return current block number', () => {
      client.currentBlock = 150;
      
      expect(client.getCurrentBlock()).toBe(150);
    });
  });
});

