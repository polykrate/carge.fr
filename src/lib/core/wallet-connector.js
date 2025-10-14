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
