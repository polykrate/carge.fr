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
        const { webRTC } = await import('@libp2p/webrtc');
        const { bootstrap } = await import('@libp2p/bootstrap');
        const { circuitRelayTransport } = await import('@libp2p/circuit-relay-v2');
        const { noise } = await import('@chainsafe/libp2p-noise');
        const { yamux } = await import('@chainsafe/libp2p-yamux');
        
        // Blockstore persistant (IndexedDB pour le navigateur)
        const { IDBBlockstore } = await import('blockstore-idb');
        const { IDBDatastore } = await import('datastore-idb');
        
        // Initialiser et ouvrir le blockstore et datastore
        const blockstore = new IDBBlockstore('helia-carge-blockstore');
        const datastore = new IDBDatastore('helia-carge-datastore');
        await blockstore.open();
        await datastore.open();
        
        console.log('✅ IndexedDB blockstore and datastore opened');
        
        // Configuration optimisée pour navigateur avec WebRTC et Circuit Relay
        const heliaConfig = {
          blockstore,
          datastore,
          libp2p: {
            // Adresses d'écoute vides pour navigateur (pas de listen, juste dial out)
            addresses: {
              listen: []
            },
            // Transports compatibles navigateur (ordre important: WebRTC > WebSockets)
            transports: [
              webRTC(),               // WebRTC pour connexions P2P directes entre navigateurs
              webSockets(),           // WebSockets pour bootstrap nodes
              circuitRelayTransport({ // Circuit Relay pour se connecter via des relais
                discoverRelays: 1,
              })
            ],
            // Chiffrement et multiplexage
            connectionEncryption: [noise()],
            streamMuxers: [yamux()],
            // Peer discovery avec bootstrap étendu
            peerDiscovery: [
              bootstrap({
                list: [
                  // Bootstrap nodes officiels IPFS (WSS)
                  '/dns4/node0.preload.ipfs.io/tcp/443/wss/p2p/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic',
                  '/dns4/node1.preload.ipfs.io/tcp/443/wss/p2p/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6',
                  '/dns4/node2.preload.ipfs.io/tcp/443/wss/p2p/QmV7gnbW5VTcJ3oyM2Xk1rdFBJ3kTkvxc87UFGsun29STS',
                  '/dns4/node3.preload.ipfs.io/tcp/443/wss/p2p/QmY7JB6MQXhxHvq7dBDh4HpbH29v4yE9JRadAVpndvzySN',
                  // Ajout de bootstrap nodes supplémentaires
                  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                  '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
                  '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
                  '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
                ]
              })
            ],
            // Connection Manager optimisé
            connectionManager: {
              maxConnections: 50,        // Plus de connexions
              minConnections: 5,         // Minimum plus élevé pour meilleure redondance
              pollInterval: 5000,        // Vérifier les connexions toutes les 5s
              autoDialInterval: 10000,   // Auto-dial vers des peers toutes les 10s
            }
          },
          start: true,
        };

        console.log('🔧 Creating Helia with WebRTC + WebSockets + Circuit Relay...');
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
   * Télécharge depuis le noeud Kubo local
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
   * Télécharge depuis un gateway IPFS public
   * @param {string} cid - CID IPFS
   * @param {string} gateway - Gateway URL (défaut: ipfs.io)
   * @returns {Promise<string>} - Contenu du fichier
   */
  async downloadViaGateway(cid, gateway = 'https://ipfs.io/ipfs/') {
    try {
      console.log(`🌐 Attempting download via public gateway: ${gateway}`);
      
      const url = `${gateway}${cid}`;
      const response = await fetch(url, {
        method: 'GET',
        // Timeout de 10 secondes pour les gateways publics
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Gateway failed: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`✅ Downloaded ${text.length} bytes via public gateway`);
      return text;
    } catch (error) {
      console.error('❌ Gateway download failed:', error.message);
      throw new Error(`Public gateway unavailable: ${error.message}`);
    }
  }

  /**
   * Télécharge du texte depuis un CID
   * Stratégie parallèle: Helia (cache + P2P) || Kubo local || Gateway public
   * Le plus rapide gagne
   * @param {string} cid - CID IPFS
   * @param {Array<string>} gateways - Liste de gateways publics à essayer
   * @returns {Promise<string>}
   */
  async downloadText(cid, gateways = config.IPFS_PUBLIC_GATEWAYS) {
    console.log(`📥 Downloading CID: ${cid}`);

    // Stratégie : lancer TOUTES les sources en parallèle, le premier qui répond gagne
    const promises = [];
    
    // 1. Helia (vérifie cache IndexedDB automatiquement, puis réseau P2P si besoin)
    if (this.isReady && this.fs) {
      const heliaPromise = (async () => {
        try {
          const peers = this.helia?.libp2p?.getPeers() || [];
          console.log(`🔄 Trying Helia (${peers.length} peers, checks cache first)...`);
          
          const decoder = new TextDecoder();
          let content = '';

          // Timeout de 15 secondes pour Helia
          const downloadPromise = (async () => {
            for await (const chunk of this.fs.cat(cid)) {
              content += decoder.decode(chunk, { stream: true });
            }
            return content;
          })();

          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Helia timeout')), 15000)
          );

          content = await Promise.race([downloadPromise, timeout]);
          console.log(`✅ Downloaded ${content.length} bytes via Helia`);
          return content;
        } catch (error) {
          console.warn('⚠️ Helia download failed:', error.message);
          throw error;
        }
      })();
      
      promises.push(heliaPromise);
    }

    // 2. Kubo local en parallèle (rapide si le CID y est)
    const kuboPromise = (async () => {
      try {
        console.log('🚀 Trying local Kubo node in parallel...');
        const result = await this.downloadViaKubo(cid);
        console.log(`✅ Downloaded via Kubo`);
        return result;
      } catch (error) {
        console.warn('⚠️ Kubo download failed:', error.message);
        throw error;
      }
    })();
    
    promises.push(kuboPromise);

    // 3. Gateways publics en parallèle (pour CIDs publics ou si local échoue)
    for (const gateway of gateways) {
      const gatewayPromise = (async () => {
        try {
          console.log(`🌐 Trying public gateway ${gateway} in parallel...`);
          const result = await this.downloadViaGateway(cid, gateway);
          console.log(`✅ Downloaded via gateway ${gateway}`);
          return result;
        } catch (error) {
          console.warn(`⚠️ Gateway ${gateway} failed:`, error.message);
          throw error;
        }
      })();
      
      promises.push(gatewayPromise);
    }

    // Prendre le premier qui réussit
    if (promises.length === 0) {
      throw new Error('No download methods available');
    }

    try {
      // Promise.any retourne dès que la première promise réussit
      const result = await Promise.any(promises);
      return result;
    } catch (error) {
      // Toutes les promesses ont échoué
      console.error('❌ All download methods failed');
      throw new Error(`Failed to download CID ${cid}: all methods failed (Helia, Kubo, and ${gateways.length} gateway(s))`);
    }
  }

  /**
   * Télécharge un fichier binaire
   * Stratégie parallèle: Helia (cache + P2P) || Kubo local || Gateway public
   * @param {string} cid - CID IPFS
   * @param {Array<string>} gateways - Liste de gateways publics
   * @returns {Promise<Uint8Array>}
   */
  async downloadFile(cid, gateways = config.IPFS_PUBLIC_GATEWAYS) {
    console.log(`📥 Downloading file CID: ${cid}`);

    const promises = [];
    
    // 1. Helia (vérifie cache automatiquement, puis réseau)
    if (this.isReady && this.fs) {
      const heliaPromise = (async () => {
        try {
          console.log('🔄 Trying Helia (checks cache first)...');
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
          console.warn('⚠️ Helia download failed:', error.message);
          throw error;
        }
      })();
      
      promises.push(heliaPromise);
    }

    // 2. Kubo local en parallèle
    const kuboPromise = (async () => {
      try {
        console.log('🚀 Trying local Kubo node in parallel...');
        const text = await this.downloadViaKubo(cid);
        console.log(`✅ Downloaded via Kubo`);
        return new TextEncoder().encode(text);
      } catch (error) {
        console.warn('⚠️ Kubo download failed:', error.message);
        throw error;
      }
    })();
    
    promises.push(kuboPromise);

    // 3. Gateways publics en parallèle
    for (const gateway of gateways) {
      const gatewayPromise = (async () => {
        try {
          console.log(`🌐 Trying public gateway ${gateway} in parallel...`);
          const text = await this.downloadViaGateway(cid, gateway);
          console.log(`✅ Downloaded via gateway ${gateway}`);
          return new TextEncoder().encode(text);
        } catch (error) {
          console.warn(`⚠️ Gateway ${gateway} failed:`, error.message);
          throw error;
        }
      })();
      
      promises.push(gatewayPromise);
    }

    // Prendre le premier qui réussit
    if (promises.length === 0) {
      throw new Error('No download methods available');
    }

    try {
      const result = await Promise.any(promises);
      return result;
    } catch (error) {
      console.error('❌ All download methods failed');
      throw new Error(`Failed to download CID ${cid}: all methods failed`);
    }
  }

  /**
   * Télécharge et parse un JSON depuis un CID string
   * @param {string} cid - CID IPFS (string format: bafyxxx...)
   * @returns {Promise<Object>}
   */
  async downloadJson(cid) {
    const text = await this.downloadText(cid);
    return JSON.parse(text);
  }

  /**
   * Télécharge et parse un JSON depuis un CID hex (format blockchain)
   * Combine la conversion hex->string et le téléchargement+parsing
   * @param {string} hexCid - CID en format hex (0x01551220...)
   * @returns {Promise<Object>}
   */
  async downloadJsonFromHex(hexCid) {
    const { CidConverter } = await import('./cid-converter.js');
    const cidString = CidConverter.hexToString(hexCid);
    return this.downloadJson(cidString);
  }

  /**
   * Télécharge du texte depuis un CID hex (format blockchain)
   * @param {string} hexCid - CID en format hex (0x01551220...)
   * @returns {Promise<string>}
   */
  async downloadTextFromHex(hexCid) {
    const { CidConverter } = await import('./cid-converter.js');
    const cidString = CidConverter.hexToString(hexCid);
    return this.downloadText(cidString);
  }

  /**
   * Crée une URL de gateway IPFS depuis un CID hex
   * @param {string} hexCid - CID en format hex (0x01551220...)
   * @param {string} gateway - Gateway URL (défaut: https://ipfs.io/ipfs/)
   * @returns {string} URL complète vers le gateway
   */
  static async getGatewayUrl(hexCid, gateway = 'https://ipfs.io/ipfs/') {
    const { CidConverter } = await import('./cid-converter.js');
    const cidString = CidConverter.hexToString(hexCid);
    return `${gateway}${cidString}`;
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
