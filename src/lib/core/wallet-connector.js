// ============================================================================
// WALLET CONNECTOR - Human Context Web
// Interface avec l'extension wallet modifiée (Human Context Protocol)
// 
// SÉCURITÉ: Les clés privées RESTENT dans l'extension
// Toutes les opérations crypto se font côté extension
// ============================================================================

export class WalletConnector {
  constructor() {
    this.extensions = [];
    this.injector = null;
    this.selectedAccount = null;
  }

  /**
   * Connecte à l'extension wallet
   * @param {string} dappName - Nom de la dapp
   * @returns {Promise<Array>} Liste des extensions trouvées
   */
  async connect(dappName = 'Human Context Web') {
    if (typeof window.polkadotExtensionDapp === 'undefined') {
      throw new Error('@polkadot/extension-dapp not loaded');
    }

    this.extensions = await window.polkadotExtensionDapp.web3Enable(dappName);

    if (this.extensions.length === 0) {
      throw new Error('No wallet extension found. Please install the Human Context Wallet.');
    }

    console.log(`✅ ${this.extensions.length} extension(s) found:`, this.extensions.map(e => e.name));
    return this.extensions;
  }

  /**
   * Récupère tous les comptes disponibles
   * @returns {Promise<Array>} Liste des comptes
   */
  async getAccounts() {
    if (typeof window.polkadotExtensionDapp === 'undefined') {
      throw new Error('Extension not connected');
    }

    const accounts = await window.polkadotExtensionDapp.web3Accounts();
    return accounts;
  }

  /**
   * Sélectionne un compte et récupère son injector
   * @param {string} address - Adresse du compte
   * @returns {Promise<Object>} Injector du compte
   */
  async selectAccount(address) {
    if (typeof window.polkadotExtensionDapp === 'undefined') {
      throw new Error('Extension not connected');
    }

    this.selectedAccount = address;
    this.injector = await window.polkadotExtensionDapp.web3FromAddress(address);
    
    console.log(`✅ Account selected: ${address}`);
    return this.injector;
  }

  // ============================================================================
  // FONCTIONS CRYPTO - Délégation à l'extension
  // ============================================================================

  /**
   * Récupère la clé publique X25519 d'un compte
   * @param {string} address - Adresse du compte
   * @param {string} password - Mot de passe du compte
   * @param {number} keyIndex - Index de dérivation (0 par défaut)
   * @returns {Promise<{publicKey: string, publicKeyBytes: Uint8Array}>}
   */
  async getX25519PublicKey(address, password, keyIndex = 0) {
    if (!this.injector?.crypto) {
      throw new Error('No crypto API available. Make sure you are using the Human Context Wallet extension.');
    }

    try {
      return await this.injector.crypto.getPublicKey(address, password, keyIndex);
    } catch (error) {
      throw new Error(`Failed to get X25519 public key: ${error.message}`);
    }
  }

  /**
   * Dérive un PeerID libp2p depuis le compte
   * Note: Cette fonctionnalité pourrait être ajoutée à l'API crypto de l'extension
   * @param {string} address - Adresse du compte
   * @param {string} password - Mot de passe du compte
   * @param {number} keyIndex - Index de dérivation (0 par défaut)
   * @returns {Promise<{publicKey: string, publicKeyBytes: Uint8Array}>}
   */
  async deriveLibp2pPeerId(address, password, keyIndex = 0) {
    // TODO: Add this to the crypto API in the extension
    throw new Error('libp2p PeerID derivation not yet implemented in crypto API');
  }

  /**
   * Chiffre un message pour un destinataire (délégué à l'extension)
   * Utilise Perfect Forward Secrecy (clés éphémères)
   * 
   * @param {string} address - Adresse du compte émetteur
   * @param {string} password - Mot de passe du compte
   * @param {string} recipientPublicKey - Clé publique X25519 du destinataire (hex)
   * @param {string} message - Message à chiffrer
   * @returns {Promise<{ciphertext: string, nonce: string, senderPublicKey: string}>}
   */
  async encrypt(address, password, recipientPublicKey, message) {
    if (!this.injector?.crypto) {
      throw new Error('No crypto API available. Make sure you are using the Human Context Wallet extension.');
    }

    try {
      return await this.injector.crypto.encrypt(address, password, recipientPublicKey, message);
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Déchiffre un message (délégué à l'extension)
   * 
   * @param {string} address - Adresse du compte destinataire
   * @param {string} password - Mot de passe du compte
   * @param {string} ciphertext - Message chiffré (hex)
   * @param {string} nonce - Nonce (hex)
   * @param {string} senderPublicKey - Clé publique éphémère de l'émetteur (hex)
   * @param {number} keyIndex - Index de dérivation utilisé pour le chiffrement
   * @returns {Promise<{message: string, success: boolean}>}
   */
  async decrypt(address, password, ciphertext, nonce, senderPublicKey, keyIndex = 0) {
    if (!this.injector?.crypto) {
      throw new Error('No crypto API available. Make sure you are using the Human Context Wallet extension.');
    }

    try {
      return await this.injector.crypto.decrypt(address, password, senderPublicKey, nonce, ciphertext, keyIndex);
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // ============================================================================
  // FONCTIONS STANDARD (Signature)
  // ============================================================================

  /**
   * Signe une transaction
   * @param {Object} tx - Transaction à signer
   * @returns {Promise}
   */
  async signTransaction(tx) {
    if (!this.injector?.signer) {
      throw new Error('No signer available');
    }

    return await tx.signAndSend(this.selectedAccount, { signer: this.injector.signer });
  }

  /**
   * Signe un message brut
   * @param {string} message - Message à signer (hex)
   * @returns {Promise<{signature: string}>}
   */
  async signRaw(message) {
    if (!this.injector?.signer?.signRaw) {
      throw new Error('No signRaw available');
    }

    return await this.injector.signer.signRaw({
      address: this.selectedAccount,
      data: message,
      type: 'bytes'
    });
  }

  // ============================================================================
  // UTILITAIRES
  // ============================================================================

  /**
   * Vérifie si le wallet est connecté
   * @returns {boolean}
   */
  isConnected() {
    return this.extensions.length > 0;
  }

  /**
   * Vérifie si un compte est sélectionné
   * @returns {boolean}
   */
  hasSelectedAccount() {
    return this.selectedAccount !== null;
  }

  /**
   * Récupère le compte sélectionné
   * @returns {string|null}
   */
  getSelectedAccount() {
    return this.selectedAccount;
  }
}
