import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from '../AppContext';

// Test component that uses the context
function TestComponent() {
  const { substrateClient, ipfsClient, selectedAccount } = useApp();
  
  return (
    <div>
      <div data-testid="substrate">{substrateClient ? 'connected' : 'disconnected'}</div>
      <div data-testid="ipfs">{ipfsClient ? 'ready' : 'not-ready'}</div>
      <div data-testid="account">{selectedAccount || 'no-account'}</div>
    </div>
  );
}

describe('AppContext', () => {
  it('should provide initial context values', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('substrate')).toHaveTextContent('connected');
    expect(screen.getByTestId('account')).toHaveTextContent('no-account');
  });

  it('should initialize SubstrateClient', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    const substrateStatus = screen.getByTestId('substrate');
    expect(substrateStatus).toHaveTextContent('connected');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useApp must be used within AppProvider');

    consoleSpy.mockRestore();
  });
});

