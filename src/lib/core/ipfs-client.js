// ============================================================================
// IPFS CLIENT - Helia (Read-Only)
// Simple client pour télécharger des CIDs depuis IPFS
// ============================================================================

export class IpfsClient {
  constructor() {
    this.helia = null;
    this.fs = null;
    this.isReady = false;
  }

  /**
   * Initialise Helia
   * @returns {Promise<boolean>}
   */
  async init() {
    try {
      // Import dynamique de Helia (ESM)
      const { createHelia } = await import('https://esm.sh/helia@4');
      const { unixfs } = await import('https://esm.sh/@helia/unixfs@3');

      console.log('🚀 Initializing Helia...');
      
      // Créer instance Helia
      this.helia = await createHelia();
      this.fs = unixfs(this.helia);
      
      this.isReady = true;
      console.log('✅ Helia ready');
      
      return true;
    } catch (error) {
      console.error('❌ Helia initialization failed:', error);
      this.isReady = false;
      return false;
    }
  }

  /**
   * Télécharge du texte depuis un CID
   * @param {string} cid - CID IPFS
   * @returns {Promise<string>}
   */
  async downloadText(cid) {
    if (!this.isReady) {
      await this.init();
    }

    try {
      console.log(`📥 Downloading CID: ${cid}`);
      
      const decoder = new TextDecoder();
      let content = '';

      // Télécharger par chunks
      for await (const chunk of this.fs.cat(cid)) {
        content += decoder.decode(chunk, { stream: true });
      }

      console.log(`✅ Downloaded ${content.length} bytes from ${cid}`);
      return content;
    } catch (error) {
      console.error(`❌ Failed to download ${cid}:`, error);
      throw error;
    }
  }

  /**
   * Télécharge un fichier binaire
   * @param {string} cid - CID IPFS
   * @returns {Promise<Uint8Array>}
   */
  async downloadFile(cid) {
    if (!this.isReady) {
      await this.init();
    }

    try {
      console.log(`📥 Downloading file CID: ${cid}`);
      
      const chunks = [];
      
      for await (const chunk of this.fs.cat(cid)) {
        chunks.push(chunk);
      }

      // Concat tous les chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      console.log(`✅ Downloaded ${result.length} bytes from ${cid}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to download file ${cid}:`, error);
      throw error;
    }
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
   * Vérifie si le client est prêt
   * @returns {boolean}
   */
  get ready() {
    return this.isReady;
  }
}

