// ============================================================================
// IPFS CLIENT - Hybrid (Helia P2P + HTTP Gateway Fallback)
// ============================================================================

export class IpfsClient {
  constructor() {
    this.helia = null;
    this.fs = null;
    this.isReady = false;
    this.initPromise = null;
    
    // Public IPFS gateways (fallback)
    this.gateways = [
      'https://dweb.link/ipfs',
      'https://ipfs.io/ipfs',
      'https://cloudflare-ipfs.com/ipfs',
    ];
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
        const { createHelia } = await import('https://esm.sh/helia@4');
        const { unixfs } = await import('https://esm.sh/@helia/unixfs@3');

        // Configuration optimisée pour connexion rapide
        const heliaConfig = {
          libp2p: {
            // Peers bootstrap rapides et fiables
            peerDiscovery: {
              bootstrap: {
                enabled: true,
                list: [
                  // Bootstrap nodes IPFS officiels (rapides)
                  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                  '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
                  '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
                  '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
                ]
              }
            },
            // Services minimaux pour connexion rapide
            services: {
              identify: {},
              ping: {
                protocolPrefix: 'ipfs',
                maxInboundStreams: 1,
                maxOutboundStreams: 1,
              }
            },
            // Limiter les connexions pour performance browser
            connectionManager: {
              maxConnections: 10,
              minConnections: 2,
              dialTimeout: 5000,
            },
          },
          // Datastore en mémoire (plus rapide)
          start: true,
        };

        this.helia = await createHelia(heliaConfig);
        this.fs = unixfs(this.helia);
        
        // Log des peers connectés
        const peers = this.helia.libp2p.getPeers();
        console.log(`✅ Helia ready with ${peers.length} peer(s) connected`);
        
        this.isReady = true;
        return true;
      })();

      return await Promise.race([initHelia, timeout]);
    } catch (error) {
      console.warn('⚠️ Helia initialization failed or timed out:', error.message);
      console.log('📡 Will use HTTP gateway fallback');
      this.isReady = false;
      return false;
    }
  }

  /**
   * Télécharge depuis HTTP gateway (fallback)
   */
  async downloadViaGateway(cid, timeout = 10000) {
    const errors = [];

    for (const gateway of this.gateways) {
      try {
        console.log(`📡 Trying gateway: ${gateway}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${gateway}/${cid}`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        console.log(`✅ Downloaded ${text.length} bytes via gateway`);
        return text;
      } catch (error) {
        console.warn(`❌ Gateway ${gateway} failed:`, error.message);
        errors.push({ gateway, error: error.message });
        continue;
      }
    }

    throw new Error(`All gateways failed: ${JSON.stringify(errors)}`);
  }

  /**
   * Télécharge du texte depuis un CID (avec fallback automatique)
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

        // Timeout de 12 secondes pour Helia (plus de temps pour trouver les peers)
        const downloadPromise = (async () => {
          for await (const chunk of this.fs.cat(cid)) {
            content += decoder.decode(chunk, { stream: true });
          }
          return content;
        })();

        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Helia download timeout')), 12000)
        );

        content = await Promise.race([downloadPromise, timeout]);
        
        console.log(`✅ Downloaded ${content.length} bytes via Helia (P2P)`);
        return content;
      } catch (error) {
        console.warn('⚠️ Helia download failed:', error.message);
        console.log('📡 Falling back to HTTP gateway...');
      }
    } else {
      console.log('⚠️ Helia not ready, using HTTP gateway directly');
    }

    // Fallback sur gateway HTTP
    return await this.downloadViaGateway(cid);
  }

  /**
   * Télécharge un fichier binaire
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
          setTimeout(() => reject(new Error('Timeout')), 8000)
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
        console.warn('⚠️ Helia download failed, using gateway');
      }
    }

    // Fallback gateway
    const text = await this.downloadViaGateway(cid);
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
