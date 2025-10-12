import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock crypto.subtle for Node environment
global.crypto = {
  subtle: {
    digest: async (algorithm, data) => {
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256');
      hash.update(Buffer.from(data));
      return hash.digest();
    }
  },
  getRandomValues: (arr) => {
    const crypto = require('crypto');
    return crypto.randomFillSync(arr);
  }
};

// Mock fetch
global.fetch = vi.fn();

