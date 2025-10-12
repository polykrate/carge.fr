import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock crypto.subtle for Node environment if needed
if (!global.crypto || !global.crypto.subtle) {
  const nodeCrypto = await import('crypto');
  
  Object.defineProperty(global, 'crypto', {
    value: {
      subtle: {
        digest: async (algorithm, data) => {
          const hash = nodeCrypto.createHash('sha256');
          hash.update(Buffer.from(data));
          return hash.digest();
        }
      },
      getRandomValues: (arr) => {
        return nodeCrypto.randomFillSync(arr);
      }
    },
    writable: true,
    configurable: true
  });
}

// Mock fetch
global.fetch = vi.fn();

