/**
 * Multi-Wallet Connector for Substrate
 * Supports: Polkadot.js, Talisman, SubWallet, Enkrypt
 */

export class MultiWalletConnector {
  constructor() {
    this.selectedWallet = null;
    this.selectedAccount = null;
    this._web3Enabled = false; // Track if web3Enable has been called
    
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
    const waitTime = this.isMobile() ? 2000 : 500;
    console.log(`⏳ Waiting ${waitTime}ms for wallet injection (${this.isMobile() ? 'mobile' : 'desktop'})...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    const installed = [];

    // Use CDN-loaded extension-dapp (works on both desktop and mobile)
    if (window.polkadotExtensionDapp) {
      try {
        console.log('✅ Using CDN-loaded extension-dapp');
        const { web3Enable } = window.polkadotExtensionDapp;
        
        // CRITICAL: web3Enable MUST be called before ANY other extension-dapp functions
        // This enables the dApp and authorizes it to interact with wallets
        const extensions = await web3Enable('Carge');
        
        // Store that we've enabled (so we don't need to call it again)
        this._web3Enabled = true;
        
        if (extensions && extensions.length > 0) {
          console.log(`✅ Found ${extensions.length} wallet(s) via CDN extension-dapp`);
          
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
        console.warn('CDN extension-dapp detection failed:', error.message);
      }
    } else {
      console.warn('⚠️ window.polkadotExtensionDapp not found (CDN scripts not loaded)');
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

      // Use CDN-loaded extension-dapp
      if (!window.polkadotExtensionDapp) {
        throw new Error('Polkadot extension API not found. Please ensure wallet is installed.');
      }

      const { web3Enable } = window.polkadotExtensionDapp;

      // Enable the extension if not already done
      // web3Enable MUST be called at least once before using web3FromAddress
      if (!this._web3Enabled) {
        console.log('🔐 Enabling web3 for the first time...');
        const extensions = await web3Enable('Carge');
        this._web3Enabled = true;

        if (extensions.length === 0) {
          throw new Error('No wallet extension found. Please install a Substrate wallet.');
        }
      } else {
        console.log('✅ web3 already enabled');
      }

      // Get extensions (they're cached after first enable)
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
      if (!window.polkadotExtensionDapp) {
        throw new Error('Polkadot extension API not found');
      }

      const { web3Accounts } = window.polkadotExtensionDapp;
      
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
      if (!window.polkadotExtensionDapp) {
        throw new Error('Polkadot extension API not found');
      }

      // CRITICAL: Ensure web3Enable has been called before web3FromAddress
      if (!this._web3Enabled) {
        console.log('⚠️ web3Enable not called yet, enabling now...');
        const { web3Enable } = window.polkadotExtensionDapp;
        await web3Enable('Carge');
        this._web3Enabled = true;
      }

      const { web3FromAddress } = window.polkadotExtensionDapp;
      
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

}

