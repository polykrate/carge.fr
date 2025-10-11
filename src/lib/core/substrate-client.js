// ============================================================================
// SUBSTRATE CLIENT - Carge
// Connexion HTTP RPC à la blockchain Substrate (compatible avec le site carge.fr)
// ============================================================================

import { config } from '../config.js';

export class SubstrateClient {
  constructor(rpcUrl) {
    this.rpcUrl = rpcUrl || config.SUBSTRATE_RPC_URL;
    this.isConnected = false;
    this.currentBlock = 0;
    this.pollInterval = null;
  }

  /**
   * Connect to the Substrate node via HTTP RPC
   */
  async connect() {
    try {
      console.log(`Connecting to Substrate at ${this.rpcUrl}...`);
      
      // Test connection with a simple RPC call
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'chain_getHeader',
          params: [],
          id: 1
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.result && data.result.number) {
        this.isConnected = true;
        this.currentBlock = parseInt(data.result.number, 16);
        console.log(`✅ Connected to Substrate. Current block: ${this.currentBlock}`);
        
        // Start polling for new blocks
        this.startPolling();
        
        return true;
      } else {
        throw new Error('Invalid response from RPC');
      }
      
    } catch (error) {
      console.error('Failed to connect to Substrate:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect from the Substrate node
   */
  async disconnect() {
    this.stopPolling();
    this.isConnected = false;
    console.log('Disconnected from Substrate');
  }

  /**
   * Start polling for new blocks
   */
  startPolling() {
    // Poll every 6 seconds (typical Substrate block time)
    this.pollInterval = setInterval(async () => {
      if (!this.isConnected) return;
      
      try {
        const response = await fetch(this.rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'chain_getHeader',
            params: [],
            id: Date.now()
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.result && data.result.number) {
          this.currentBlock = parseInt(data.result.number, 16);
        }
      } catch (err) {
        console.error('Error polling block:', err);
        this.isConnected = false;
        this.stopPolling();
      }
    }, 6000);
  }

  /**
   * Stop polling for new blocks
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Get current block number
   */
  async getCurrentBlock() {
    if (!this.isConnected) {
      throw new Error('Not connected to Substrate');
    }
    
    return this.currentBlock;
  }

  /**
   * Query blockchain storage with raw RPC
   */
  async queryStorage(storageKey) {
    if (!this.isConnected) {
      throw new Error('Not connected to Substrate');
    }
    
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'state_getStorage',
          params: [storageKey, null], // null = at latest block
          id: Date.now()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('RPC Error:', data.error);
        return null;
      }
      
      return data.result;
    } catch (error) {
      console.error('Failed to query storage:', error);
      return null;
    }
  }

  /**
   * Vérifie si connecté
   */
  getIsConnected() {
    return this.isConnected;
  }
}
