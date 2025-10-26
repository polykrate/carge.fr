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
   * Get block timestamp from block number
   * Extracts timestamp from the timestamp.set extrinsic in the block
   */
  async getBlockTimestamp(blockNumber) {
    await this.ensureConnected();
    
    try {
      // First, get the block hash for this block number
      const hashResponse = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'chain_getBlockHash',
          params: [blockNumber],
          id: Date.now()
        })
      });
      
      if (!hashResponse.ok) {
        throw new Error(`HTTP error! status: ${hashResponse.status}`);
      }
      
      const hashData = await hashResponse.json();
      
      if (hashData.error || !hashData.result) {
        console.error('Failed to get block hash:', hashData.error);
        return null;
      }
      
      const blockHash = hashData.result;
      
      // Now get the block with this hash
      const blockResponse = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'chain_getBlock',
          params: [blockHash],
          id: Date.now()
        })
      });
      
      if (!blockResponse.ok) {
        throw new Error(`HTTP error! status: ${blockResponse.status}`);
      }
      
      const blockData = await blockResponse.json();
      
      if (blockData.error || !blockData.result) {
        console.error('Failed to get block:', blockData.error);
        return null;
      }
      
      // Look for timestamp.set extrinsic (usually the first inherent extrinsic)
      const extrinsics = blockData.result.block.extrinsics;
      
      console.log(`🔍 Searching timestamp in block ${blockNumber} (${extrinsics.length} extrinsics)`);
      
      for (let i = 0; i < extrinsics.length; i++) {
        const extrinsic = extrinsics[i];
        
        // Decode the extrinsic to find timestamp.set
        // The timestamp.set extrinsic starts with specific bytes
        if (extrinsic.startsWith('0x28')) {
          try {
            // Remove 0x prefix
            const hex = extrinsic.slice(2);
            console.log(`  Extrinsic ${i}: ${hex.slice(0, 20)}...`);
            
            // Look for the pattern: timestamp pallet + set call (usually 0200 or 0300)
            // On this chain, timestamp pallet has index 2
            let pattern = '0200';
            let patternIndex = hex.toLowerCase().indexOf(pattern);
            
            // Fallback to pallet index 3 if not found
            if (patternIndex === -1) {
              pattern = '0300';
              patternIndex = hex.toLowerCase().indexOf(pattern);
            }
            
            if (patternIndex !== -1) {
              console.log(`  ✓ Found timestamp.set pattern at position ${patternIndex}`);
              
              // After '0300', we have the compact-encoded timestamp
              const afterPattern = hex.slice(patternIndex + 4);
              console.log(`  Timestamp data: ${afterPattern.slice(0, 40)}`);
              
              // Check the first byte for compact encoding format
              const firstByte = parseInt(afterPattern.slice(0, 2), 16);
              const mode = firstByte & 0x03;
              let timestamp = 0;
              
              console.log(`  First byte: 0x${afterPattern.slice(0, 2)}, mode: ${mode}`);
              
              if (mode === 0x03) {
                // BigInt mode (0x03): The first byte encodes the length
                // Format: bottom 2 bits = mode (11), top 6 bits = (length - 4)
                // So if byte = 0x0b = 0000 1011, length = (0b >> 2) + 4 = 2 + 4 = 6 bytes
                const lengthMinusFour = firstByte >> 2;
                const byteLength = lengthMinusFour + 4;
                
                console.log(`  BigInt mode - Length: ${byteLength} bytes`);
                
                // Extract the timestamp bytes (skip the first byte which was the length indicator)
                const timestampHex = afterPattern.slice(2, 2 + byteLength * 2); // Each byte = 2 hex chars
                
                console.log(`  BigInt mode - Timestamp hex: ${timestampHex}`);
                
                // Convert little-endian hex to number
                for (let j = 0; j < timestampHex.length; j += 2) {
                  const byte = parseInt(timestampHex.substr(j, 2), 16);
                  timestamp += byte * Math.pow(256, j / 2);
                }
              } else if (mode === 0x02) {
                // Four-byte mode
                const bytes = afterPattern.slice(0, 8); // 4 bytes = 8 hex chars
                // Convert little-endian hex to number
                let val = 0;
                for (let j = 0; j < 8; j += 2) {
                  const byte = parseInt(bytes.substr(j, 2), 16);
                  val += byte * Math.pow(256, j / 2);
                }
                timestamp = val >> 2;
                console.log(`  Four-byte mode - Raw value: ${val}, timestamp: ${timestamp}`);
              } else if (mode === 0x01) {
                // Two-byte mode
                const bytes = afterPattern.slice(0, 4); // 2 bytes = 4 hex chars
                // Convert little-endian
                const byte1 = parseInt(bytes.substr(0, 2), 16);
                const byte2 = parseInt(bytes.substr(2, 2), 16);
                const val = byte1 + (byte2 * 256);
                timestamp = val >> 2;
                console.log(`  Two-byte mode - Raw value: ${val}, timestamp: ${timestamp}`);
              } else {
                // Single-byte mode: value = byte >> 2
                timestamp = firstByte >> 2;
                console.log(`  Single-byte mode - timestamp: ${timestamp}`);
              }
              
              console.log(`  📅 Decoded timestamp: ${timestamp}`);
              
              // Validate timestamp (should be in milliseconds and reasonable)
              // Valid range: year 2000 to year 2100 in milliseconds
              if (timestamp > 946684800000 && timestamp < 4102444800000) {
                const date = new Date(timestamp);
                console.log(`  ✅ Valid timestamp for block ${blockNumber}: ${date.toISOString()}`);
                return timestamp;
              } else {
                console.warn(`  ⚠️ Invalid timestamp value: ${timestamp} (not in valid range)`);
              }
            }
          } catch (err) {
            console.error(`  ❌ Failed to parse extrinsic ${i}:`, err);
          }
        }
      }
      
      console.warn(`❌ No timestamp.set extrinsic found in block ${blockNumber}`);
      return null;
    } catch (error) {
      console.error('Failed to get block timestamp:', error);
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
