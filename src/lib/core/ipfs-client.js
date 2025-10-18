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
      
      // Timeout de 30 secondes pour l'initialisation (active dial + WebRTC NAT traversal prend du temps)
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Helia init timeout')), 30000)
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
              webRTC({
                // Configuration STUN/TURN pour NAT traversal
                rtcConfiguration: {
                  iceServers: [
                    // Serveurs STUN publics pour découvrir son adresse publique
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                  ]
                }
              }),               // WebRTC pour connexions P2P directes entre navigateurs
              webSockets(),     // WebSockets pour bootstrap nodes
              circuitRelayTransport({ // Circuit Relay pour se connecter via des relais
                discoverRelays: 3, // Découvrir encore plus de relais
              })
            ],
            // Chiffrement et multiplexage
            connectionEncryption: [noise()],
            streamMuxers: [yamux()],
            // Peer discovery avec bootstrap étendu + mDNS local
            peerDiscovery: [
              bootstrap({
                list: [
                  // Bootstrap nodes officiels IPFS (WSS)
                  '/dns4/node0.preload.ipfs.io/tcp/443/wss/p2p/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic',
                  '/dns4/node1.preload.ipfs.io/tcp/443/wss/p2p/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6',
                  '/dns4/node2.preload.ipfs.io/tcp/443/wss/p2p/QmV7gnbW5VTcJ3oyM2Xk1rdFBJ3kTkvxc87UFGsun29STS',
                  '/dns4/node3.preload.ipfs.io/tcp/443/wss/p2p/QmY7JB6MQXhxHvq7dBDh4HpbH29v4yE9JRadAVpndvzySN',
                  // Bootstrap nodes libp2p (WebSocket Secure + WebRTC support)
                  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                  '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
                  '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
                  '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
                  // Circuit Relay nodes publics
                  '/dns4/relay.libp2p.io/tcp/443/wss/p2p/QmWDn2LY8nannvSWJzruUYoLZ4vV83vfCBwd8DipvdbbN1',
                  '/dns4/relay.libp2p.io/tcp/443/wss/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
                  // Additional WebRTC-compatible bootstrap nodes
                  '/dns4/sjc-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                  '/dns4/ams-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
                ]
              })
            ],
            // Connection Manager optimisé pour meilleure connectivité
            connectionManager: {
              maxConnections: 150,       // Beaucoup plus de connexions possibles
              minConnections: 15,        // Minimum plus élevé pour garantir connectivité
              pollInterval: 3000,        // Vérifier les connexions toutes les 3s (plus fréquent)
              autoDialInterval: 5000,    // Auto-dial vers des peers toutes les 5s (plus agressif)
              dialTimeout: 30000,        // Timeout plus long pour dial (30s)
            }
          },
          start: true,
        };

        console.log('🔧 Creating Helia with WebRTC (STUN) + WebSockets + Circuit Relay...');
        this.helia = await createHelia(heliaConfig);
        this.fs = unixfs(this.helia);
        
        // CONNECTER ACTIVEMENT aux bootstrap nodes dès le départ
        console.log('🚀 Actively dialing bootstrap nodes...');
        const bootstrapAddrs = [
          '/dns4/node0.preload.ipfs.io/tcp/443/wss/p2p/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic',
          '/dns4/node1.preload.ipfs.io/tcp/443/wss/p2p/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6',
          '/dns4/node2.preload.ipfs.io/tcp/443/wss/p2p/QmV7gnbW5VTcJ3oyM2Xk1rdFBJ3kTkvxc87UFGsun29STS',
          '/dns4/node3.preload.ipfs.io/tcp/443/wss/p2p/QmY7JB6MQXhxHvq7dBDh4HpbH29v4yE9JRadAVpndvzySN',
          '/dns4/relay.libp2p.io/tcp/443/wss/p2p/QmWDn2LY8nannvSWJzruUYoLZ4vV83vfCBwd8DipvdbbN1',
          '/dns4/relay.libp2p.io/tcp/443/wss/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
          '/dns4/sjc-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
          '/dns4/ams-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
        ];
        
        // Importer multiaddr pour parser les adresses
        const { multiaddr } = await import('@multiformats/multiaddr');
        
        // Dial tous les bootstrap nodes en parallèle (ne pas attendre qu'ils réussissent tous)
        const dialPromises = bootstrapAddrs.map(async (addr) => {
          try {
            const ma = multiaddr(addr);
            console.log(`📞 Dialing ${addr.split('/')[2]}...`);
            await this.helia.libp2p.dial(ma);
            console.log(`✅ Connected to ${addr.split('/')[2]}`);
          } catch (error) {
            console.log(`⚠️ Failed to dial ${addr.split('/')[2]}: ${error.message}`);
          }
        });
        
        // Attendre que certaines connexions s'établissent (mais pas toutes, timeout après 10s)
        const waitForDials = Promise.allSettled(dialPromises);
        const timeout = new Promise(resolve => setTimeout(resolve, 10000));
        await Promise.race([waitForDials, timeout]);
        
        console.log('⏳ Waiting for additional peer discovery...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 secondes de plus pour la découverte
        
        // Log des peers connectés
        const peers = this.helia.libp2p.getPeers();
        console.log(`✅ Helia ready with ${peers.length} peer(s) connected`);
        
        // Log détaillé des connexions
        if (peers.length > 0) {
          console.log('📊 Connected peers:', peers.map(p => p.toString()));
          const connections = this.helia.libp2p.getConnections();
          console.log(`📡 Total connections: ${connections.length}`);
        } else {
          console.warn('⚠️ No peers connected yet. This is normal in browser without Kubo.');
          console.warn('💡 Helia will connect to peers when downloading CIDs from the network.');
          console.warn('💡 Bootstrap nodes will be contacted on-demand during content retrieval.');
        }
        
        // Maintenir activement les connexions - re-dial périodiquement si trop peu de peers
        this._startPeerMaintenance();
        
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
   * Maintenir activement un nombre minimum de connexions peers
   * Re-dial les bootstrap nodes si trop peu de peers connectés
   */
  _startPeerMaintenance() {
    if (!this.helia?.libp2p) return;
    
    console.log('🔄 Starting peer maintenance (will check every 15 seconds)');
    
    const maintenanceInterval = setInterval(async () => {
      try {
        if (!this.helia?.libp2p) {
          clearInterval(maintenanceInterval);
          return;
        }
        
        const peers = this.helia.libp2p.getPeers();
        const minPeers = 8; // Minimum souhaité (augmenté pour meilleure connectivité)
        
        if (peers.length < minPeers) {
          console.log(`🔄 Only ${peers.length} peer(s) connected (min: ${minPeers}), re-dialing bootstrap nodes...`);
          
          const bootstrapAddrs = [
            '/dns4/node0.preload.ipfs.io/tcp/443/wss/p2p/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic',
            '/dns4/node1.preload.ipfs.io/tcp/443/wss/p2p/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6',
            '/dns4/node2.preload.ipfs.io/tcp/443/wss/p2p/QmV7gnbW5VTcJ3oyM2Xk1rdFBJ3kTkvxc87UFGsun29STS',
            '/dns4/relay.libp2p.io/tcp/443/wss/p2p/QmWDn2LY8nannvSWJzruUYoLZ4vV83vfCBwd8DipvdbbN1',
            '/dns4/sjc-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
          ];
          
          const { multiaddr } = await import('@multiformats/multiaddr');
          
          // Essayer de se connecter à plusieurs bootstrap nodes (plus agressif)
          let connected = 0;
          const targetConnections = 3; // Essayer de faire 3 connexions
          
          for (const addr of bootstrapAddrs) {
            if (connected >= targetConnections) break;
            
            try {
              const ma = multiaddr(addr);
              await this.helia.libp2p.dial(ma);
              console.log(`✅ Re-connected to ${addr.split('/')[2]}`);
              connected++;
            } catch (error) {
              // Ignore les erreurs, essayer le suivant
            }
          }
          
          if (connected > 0) {
            console.log(`🔗 Re-established ${connected} connection(s) to bootstrap nodes`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Peer maintenance error:', error.message);
      }
    }, 15000); // Check toutes les 15 secondes (plus agressif)
    
    // Stocker l'interval pour cleanup
    this._maintenanceInterval = maintenanceInterval;
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
    if (this._maintenanceInterval) {
      clearInterval(this._maintenanceInterval);
      this._maintenanceInterval = null;
    }
    
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
