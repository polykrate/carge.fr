/**
 * Multi-Wallet Connector for Substrate
 * Supports: Polkadot.js, Talisman, SubWallet, Enkrypt
 */

export class MultiWalletConnector {
  constructor() {
    this.selectedWallet = null;
    this.selectedAccount = null;
    
    // Supported wallets with their extension keys
    this.supportedWallets = {
      'polkadot-js': {
        name: 'Polkadot.js Extension',
        logo: '🟠',
        extensionKey: 'polkadot-js',
        downloadUrl: 'https://polkadot.js.org/extension/'
      },
      'talisman': {
        name: 'Talisman',
        logo: '🔮',
        extensionKey: 'talisman',
        downloadUrl: 'https://talisman.xyz/'
      },
      'subwallet-js': {
        name: 'SubWallet',
        logo: '🌊',
        extensionKey: 'subwallet-js',
        downloadUrl: 'https://subwallet.app/'
      },
      'enkrypt': {
        name: 'Enkrypt',
        logo: '🦊',
        extensionKey: 'enkrypt',
        downloadUrl: 'https://www.enkrypt.com/'
      }
    };
  }

  /**
   * Detect if we're on mobile
   * @returns {boolean}
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Detect installed wallets (desktop and mobile)
   * @returns {Promise<Array>} List of installed wallets
   */
  async detectInstalledWallets() {
    // On mobile, wallets take longer to inject
    const waitTime = this.isMobile() ? 1500 : 300;
    console.log(`⏳ Waiting ${waitTime}ms for wallet injection (${this.isMobile() ? 'mobile' : 'desktop'})...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    const installed = [];

    // Try using @polkadot/extension-dapp first (works better on mobile)
    try {
      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
      
      // Silent enable to detect wallets
      const extensions = await web3Enable('Carge');
      
      if (extensions.length > 0) {
        console.log(`✅ Found ${extensions.length} wallet(s) via extension-dapp`);
        
        // Map detected extensions to our wallet list
        for (const ext of extensions) {
          const walletConfig = this.supportedWallets[ext.name] || {
            name: ext.name,
            logo: '💼',
            extensionKey: ext.name,
            downloadUrl: null
          };
          
          installed.push({
            id: ext.name,
            ...walletConfig,
            extension: ext,
            version: ext.version
          });
        }
        
        return installed;
      }
    } catch (error) {
      console.warn('Extension-dapp detection failed:', error.message);
    }

    // Fallback to window.injectedWeb3 (desktop)
    if (window.injectedWeb3) {
      console.log('📦 Checking window.injectedWeb3...');
      
      for (const [key, wallet] of Object.entries(this.supportedWallets)) {
        if (window.injectedWeb3[key]) {
          console.log(`✅ Found wallet via injectedWeb3: ${wallet.name}`);
          installed.push({
            id: key,
            ...wallet,
            extension: window.injectedWeb3[key]
          });
        }
      }
    } else {
      console.warn('❌ No window.injectedWeb3 found');
    }

    if (installed.length === 0) {
      console.warn('⚠️ No Substrate wallets detected. Please ensure you have:');
      if (this.isMobile()) {
        console.warn('  - Opened this site from your wallet\'s in-app browser (Nova, SubWallet, etc.)');
        console.warn('  - Or installed a mobile wallet app');
      } else {
        console.warn('  - Installed a wallet extension (Polkadot.js, Talisman, SubWallet)');
        console.warn('  - Refreshed the page after installation');
      }
    }

    return installed;
  }

  /**
   * Connect to a specific wallet
   * @param {string} walletId - Wallet identifier (e.g., 'polkadot-js', 'talisman')
   * @returns {Promise<void>}
   */
  async connect(walletId = 'polkadot-js') {
    try {
      console.log(`🔌 Connecting to ${walletId}...`);

      // Import extension-dapp
      const { web3Enable } = await import('@polkadot/extension-dapp');

      // Enable the extension
      const extensions = await web3Enable('Carge');

      if (extensions.length === 0) {
        throw new Error('No wallet extension found. Please install a Substrate wallet.');
      }

      // Find the specific wallet
      const wallet = extensions.find(ext => {
        // Polkadot.js uses 'polkadot-js' name
        // Talisman uses 'talisman' name
        // SubWallet uses 'subwallet-js' name
        return ext.name === walletId;
      });

      if (!wallet) {
        // If specific wallet not found, use first available
        this.selectedWallet = extensions[0];
        console.warn(`Wallet ${walletId} not found, using ${extensions[0].name}`);
      } else {
        this.selectedWallet = wallet;
      }

      console.log(`✅ Connected to ${this.selectedWallet.name}`);
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }

  /**
   * Get accounts from the connected wallet
   * @returns {Promise<Array>}
   */
  async getAccounts() {
    if (!this.selectedWallet) {
      throw new Error('No wallet connected. Call connect() first.');
    }

    try {
      const { web3Accounts } = await import('@polkadot/extension-dapp');
      
      // Get all accounts
      const allAccounts = await web3Accounts();

      // Filter accounts from the selected wallet
      const walletAccounts = allAccounts.filter(
        account => account.meta.source === this.selectedWallet.name
      );

      console.log(`Found ${walletAccounts.length} accounts in ${this.selectedWallet.name}`);
      return walletAccounts;
    } catch (error) {
      console.error('Failed to get accounts:', error);
      throw error;
    }
  }

  /**
   * Select an account for signing
   * @param {string} address - Account address
   */
  async selectAccount(address) {
    this.selectedAccount = address;
    console.log('✅ Account selected:', address);
  }

  /**
   * Sign raw data
   * @param {string} message - Hex-encoded message
   * @returns {Promise<{signature: string}>}
   */
  async signRaw(message) {
    if (!this.selectedAccount) {
      throw new Error('No account selected');
    }

    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      
      const injector = await web3FromAddress(this.selectedAccount);
      
      if (!injector.signer || !injector.signer.signRaw) {
        throw new Error('Selected wallet does not support signing');
      }

      const result = await injector.signer.signRaw({
        address: this.selectedAccount,
        data: message,
        type: 'bytes'
      });

      return { signature: result.signature };
    } catch (error) {
      console.error('Signing failed:', error);
      throw error;
    }
  }

  /**
   * Get X25519 public key (for encryption)
   * @param {string} address - Account address
   * @param {string} password - Password (may be ignored by extension)
   * @param {number} keyIndex - Key derivation index
   * @returns {Promise<{publicKey: string}>}
   */
  async getX25519PublicKey(address, password, keyIndex = 0) {
    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      
      const injector = await web3FromAddress(address);
      
      // Not all wallets support this
      if (!injector.signer || !injector.signer.signRaw) {
        throw new Error('Wallet does not support key derivation');
      }

      // For now, we'll use the account's public key
      // In production, you'd need proper X25519 key derivation
      const { decodeAddress } = await import('@polkadot/util-crypto');
      const publicKey = Buffer.from(decodeAddress(address)).toString('hex');
      
      return { publicKey: '0x' + publicKey };
    } catch (error) {
      console.error('Failed to get X25519 key:', error);
      throw error;
    }
  }

  /**
   * Encrypt data (placeholder - needs proper implementation)
   */
  async encrypt(address, password, recipientPubKey, message) {
    throw new Error('Encryption not yet implemented for multi-wallet');
  }

  /**
   * Decrypt data (placeholder - needs proper implementation)
   */
  async decrypt(address, password, ciphertext, nonce, senderPublicKey, keyIndex) {
    throw new Error('Decryption not yet implemented for multi-wallet');
  }
}

