// ============================================================================
// IPFS CLIENT - Dual Mode (Helia P2P Client + Local Kubo Node)
// ============================================================================
// 
// ⚠️ IMPORTANT: IPFS is DECENTRALIZED but NOT PERMANENT by default
// - Data persists only while at least one node hosts (pins) it
// - Use pinning services (Pinata, Web3.Storage, Infura) for production
// - The blockchain stores CIDs - actual data needs separate pinning
//
// Two modes available:
// 1. Helia P2P - Lightweight browser IPFS client (P2P connections)
// 2. Kubo Node - Full IPFS node on localhost:5001 (public gateway)
//
// NO external HTTP gateways - fully decentralized approach
// ============================================================================

import { config } from '../config.js';

export class IpfsClient {
  constructor() {
    this.helia = null;
    this.fs = null;
    this.isReady = false;
    this.initPromise = null;
  }

  /**
   * Initialise Helia (en arrière-plan, non-bloquant)
   * @returns {Promise<boolean>}
   */
  async init() {
    // Si déjà en cours d'initialisation, retourner la promesse existante
    if (this.initPromise) {
      return this.initPromise;
    }

    // Si déjà initialisé
    if (this.isReady) {
      return true;
    }

    this.initPromise = this._initHelia();
    return this.initPromise;
  }

  async _initHelia() {
    try {
      console.log('🚀 Initializing Helia (P2P IPFS) with optimized config...');
      
      // Timeout de 10 secondes pour l'initialisation
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Helia init timeout')), 10000)
      );

      const initHelia = (async () => {
        // Import depuis les packages installés
        const { createHelia } = await import('helia');
        const { unixfs } = await import('@helia/unixfs');
        const { webSockets } = await import('@libp2p/websockets');
        const { bootstrap } = await import('@libp2p/bootstrap');

        // Configuration simplifiée pour navigateur
        const heliaConfig = {
          libp2p: {
            // Adresses d'écoute vides pour navigateur (pas de listen, juste dial out)
            addresses: {
              listen: []
            },
            // Transports compatibles navigateur
            transports: [
              webSockets()
            ],
            // Peer discovery avec bootstrap
            peerDiscovery: [
              bootstrap({
                list: [
                  // Bootstrap nodes WebSocket Secure (compatible navigateur)
                  '/dns4/node0.preload.ipfs.io/tcp/443/wss/p2p/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic',
                  '/dns4/node1.preload.ipfs.io/tcp/443/wss/p2p/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6',
                  '/dns4/node2.preload.ipfs.io/tcp/443/wss/p2p/QmV7gnbW5VTcJ3oyM2Xk1rdFBJ3kTkvxc87UFGsun29STS',
                  '/dns4/node3.preload.ipfs.io/tcp/443/wss/p2p/QmY7JB6MQXhxHvq7dBDh4HpbH29v4yE9JRadAVpndvzySN',
                ]
              })
            ],
            // Connection Manager
            connectionManager: {
              maxConnections: 20,
              minConnections: 2,
            },
          },
          start: true,
        };

        console.log('🔧 Creating Helia with WebSocket transport...');
        this.helia = await createHelia(heliaConfig);
        this.fs = unixfs(this.helia);
        
        // Attendre un peu pour que les connexions se fassent
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Log des peers connectés
        const peers = this.helia.libp2p.getPeers();
        console.log(`✅ Helia ready with ${peers.length} peer(s) connected`);
        
        if (peers.length === 0) {
          console.warn('⚠️ No peers connected yet, but Helia is initialized');
        }
        
        this.isReady = true;
        return true;
      })();

      return await Promise.race([initHelia, timeout]);
    } catch (error) {
      console.warn('⚠️ Helia initialization failed or timed out:', error.message);
      console.log('📡 Will use local Kubo node as fallback');
      this.isReady = false;
      return false;
    }
  }

  /**
   * Télécharge depuis le noeud Kubo local (fallback si Helia échoue)
   * @param {string} cid - CID IPFS
   * @returns {Promise<string>} - Contenu du fichier
   */
  async downloadViaKubo(cid) {
    try {
      console.log(`📡 Attempting download via local Kubo node...`);
      
      // Utiliser l'API Kubo pour cat (lecture)
      const kuboGatewayUrl = config.IPFS_UPLOAD_URL.replace('/api/v0/add', '');
      const response = await fetch(`${kuboGatewayUrl}/api/v0/cat?arg=${cid}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Kubo cat failed: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`✅ Downloaded ${text.length} bytes via Kubo node`);
      return text;
    } catch (error) {
      console.error('❌ Kubo download failed:', error.message);
      throw new Error(`Local Kubo node unavailable: ${error.message}`);
    }
  }

  /**
   * Télécharge du texte depuis un CID
   * Essaie d'abord Helia P2P, puis le noeud Kubo local
   * @param {string} cid - CID IPFS
   * @returns {Promise<string>}
   */
  async downloadText(cid) {
    console.log(`📥 Downloading CID: ${cid}`);

    // Essayer Helia en premier (si disponible)
    if (this.isReady && this.fs) {
      try {
        // Log du nombre de peers
        const peers = this.helia?.libp2p?.getPeers() || [];
        console.log(`🔄 Attempting P2P download via Helia (${peers.length} peers)...`);
        
        const decoder = new TextDecoder();
        let content = '';

        // Timeout de 15 secondes pour Helia (plus de temps pour trouver les peers)
        const downloadPromise = (async () => {
          for await (const chunk of this.fs.cat(cid)) {
            content += decoder.decode(chunk, { stream: true });
          }
          return content;
        })();

        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Helia download timeout')), 15000)
        );

        content = await Promise.race([downloadPromise, timeout]);
        
        console.log(`✅ Downloaded ${content.length} bytes via Helia (P2P)`);
        return content;
      } catch (error) {
        console.warn('⚠️ Helia download failed:', error.message);
        console.log('📡 Falling back to local Kubo node...');
      }
    } else {
      console.log('⚠️ Helia not ready, trying local Kubo node directly');
    }

    // Fallback sur le noeud Kubo local
    return await this.downloadViaKubo(cid);
  }

  /**
   * Télécharge un fichier binaire
   * Essaie d'abord Helia P2P, puis le noeud Kubo local
   * @param {string} cid - CID IPFS
   * @returns {Promise<Uint8Array>}
   */
  async downloadFile(cid) {
    console.log(`📥 Downloading file CID: ${cid}`);

    // Essayer Helia
    if (this.isReady && this.fs) {
      try {
        const chunks = [];
        
        const downloadPromise = (async () => {
          for await (const chunk of this.fs.cat(cid)) {
            chunks.push(chunk);
          }
        })();

        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 15000)
        );

        await Promise.race([downloadPromise, timeout]);

        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }

        console.log(`✅ Downloaded ${result.length} bytes via Helia`);
        return result;
      } catch (error) {
        console.warn('⚠️ Helia download failed, trying Kubo:', error.message);
      }
    }

    // Fallback sur le noeud Kubo local
    const text = await this.downloadViaKubo(cid);
    return new TextEncoder().encode(text);
  }

  /**
   * Télécharge et parse un JSON
   * @param {string} cid - CID IPFS
   * @returns {Promise<Object>}
   */
  async downloadJson(cid) {
    const text = await this.downloadText(cid);
    return JSON.parse(text);
  }

  /**
   * Upload file to IPFS via Kubo node
   * ⚠️ WARNING: This only uploads to local node. For data persistence:
   * - Pin the returned CID on your Kubo node
   * - Use a pinning service for production (Pinata, Web3.Storage, etc.)
   * - The blockchain stores only the CID, not the data itself
   * 
   * @param {Uint8Array} data - File data to upload
   * @returns {Promise<string>} CID of uploaded file (must be pinned for persistence!)
   */
  async uploadFile(data) {
    console.log(`Uploading file to IPFS (${data.length} bytes)...`);
    
    try {
      const formData = new FormData();
      const blob = new Blob([data], { type: 'application/octet-stream' });
      formData.append('file', blob, 'encrypted-rag-data');
      
      const response = await fetch(config.IPFS_UPLOAD_URL, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const cid = result.Hash || result.cid || result.CID;
      
      if (!cid) {
        throw new Error('No CID returned from upload');
      }
      
      console.log(`File uploaded to IPFS: ${cid}`);
      return cid;
    } catch (error) {
      console.error('Failed to upload to IPFS:', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Arrête Helia proprement
   */
  async stop() {
    if (this.helia) {
      console.log('🛑 Stopping Helia...');
      await this.helia.stop();
      this.isReady = false;
      console.log('✅ Helia stopped');
    }
  }

  /**
   * Vérifie si Helia P2P est prêt
   * @returns {boolean}
   */
  get ready() {
    return this.isReady;
  }
}
