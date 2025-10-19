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
    this.reconnectInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // 5 seconds
    this.connectionListeners = new Set();
  }

  /**
   * Add a connection status listener
   */
  onConnectionChange(listener) {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  /**
   * Notify all listeners of connection status change
   */
  notifyConnectionChange(isConnected) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(isConnected);
      } catch (err) {
        console.error('Error in connection listener:', err);
      }
    });
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
        const wasDisconnected = !this.isConnected;
        this.isConnected = true;
        this.currentBlock = parseInt(data.result.number, 16);
        this.reconnectAttempts = 0; // Reset reconnect counter on successful connection
        
        if (wasDisconnected) {
          console.log(`✅ ${this.reconnectAttempts > 0 ? 'Reconnected' : 'Connected'} to Substrate. Current block: ${this.currentBlock}`);
          this.notifyConnectionChange(true);
        }
        
        // Stop any reconnect attempts
        this.stopReconnecting();
        
        // Start polling for new blocks
        this.startPolling();
        
        return true;
      } else {
        throw new Error('Invalid response from RPC');
      }
      
    } catch (error) {
      console.error('Failed to connect to Substrate:', error);
      const wasConnected = this.isConnected;
      this.isConnected = false;
      
      if (wasConnected) {
        this.notifyConnectionChange(false);
      }
      
      throw error;
    }
  }

  /**
   * Start automatic reconnection attempts
   */
  startReconnecting() {
    if (this.reconnectInterval) {
      return; // Already reconnecting
    }

    console.log(`🔄 Starting reconnection attempts (max: ${this.maxReconnectAttempts})...`);
    
    this.reconnectInterval = setInterval(async () => {
      if (this.isConnected) {
        this.stopReconnecting();
        return;
      }

      this.reconnectAttempts++;
      
      if (this.reconnectAttempts > this.maxReconnectAttempts) {
        console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
        this.stopReconnecting();
        return;
      }

      console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      
      try {
        await this.connect();
      } catch (err) {
        // connect() already logs the error
      }
    }, this.reconnectDelay);
  }

  /**
   * Stop reconnection attempts
   */
  stopReconnecting() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  /**
   * Disconnect from the Substrate node
   */
  async disconnect() {
    this.stopPolling();
    this.stopReconnecting();
    const wasConnected = this.isConnected;
    this.isConnected = false;
    
    if (wasConnected) {
      this.notifyConnectionChange(false);
    }
    
    console.log('Disconnected from Substrate');
  }

  /**
   * Start polling for new blocks
   */
  startPolling() {
    // Stop any existing polling
    this.stopPolling();
    
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
        console.error('⚠️ Error polling block, connection lost:', err.message);
        const wasConnected = this.isConnected;
        this.isConnected = false;
        this.stopPolling();
        
        if (wasConnected) {
          this.notifyConnectionChange(false);
          // Start automatic reconnection
          this.startReconnecting();
        }
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
   * Ensure connection is established (auto-reconnect if needed)
   */
  async ensureConnected() {
    if (this.isConnected) {
      return true;
    }

    console.log('⚠️ Not connected, attempting to reconnect...');
    try {
      await this.connect();
      return true;
    } catch (err) {
      console.error('❌ Failed to establish connection:', err.message);
      throw new Error('Not connected to Substrate blockchain');
    }
  }

  /**
   * Get current block number
   */
  async getCurrentBlock() {
    await this.ensureConnected();
    return this.currentBlock;
  }

  /**
   * Query blockchain storage with raw RPC
   */
  async queryStorage(storageKey) {
    await this.ensureConnected();
    
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
