import { createContext, useContext, useState, useEffect } from 'react';
import { MultiWalletConnector } from '../lib/core/multi-wallet-connector.js';
import { SubstrateClient } from '../lib/core/substrate-client.js';
import { IpfsClient } from '../lib/core/ipfs-client.js';
import { config } from '../lib/config.js';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Services
  const [walletConnector] = useState(() => new MultiWalletConnector());
  const [substrateClient] = useState(() => new SubstrateClient(config.SUBSTRATE_RPC_URL));
  const [ipfsClient] = useState(() => new IpfsClient());

  // State
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [installedWallets, setInstalledWallets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [isWalletSelectOpen, setIsWalletSelectOpen] = useState(false);
  
  // Connection status
  const [substrateConnected, setSubstrateConnected] = useState(false);
  const [ipfsReady, setIpfsReady] = useState(false);
  const [currentBlock, setCurrentBlock] = useState(null);

  // Initialize services on mount
  useEffect(() => {
    initializeApp();
    detectWallets();
    setupAccountChangeListener();
    
    // Cleanup on unmount
    return () => {
      // Unsubscribe from account changes if needed
    };
  }, []);

  const detectWallets = async () => {
    const wallets = await walletConnector.detectInstalledWallets();
    setInstalledWallets(wallets);
    console.log('📱 Detected wallets:', wallets.map(w => w.name).join(', '));
  };

  const setupAccountChangeListener = async () => {
    // Wait for extension to be ready
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (!window.polkadotExtensionDapp) {
      console.log('⚠️ Cannot setup account listener: extension not loaded');
      return;
    }

    try {
      const { web3Enable, web3AccountsSubscribe } = window.polkadotExtensionDapp;
      
      // Enable first (required before subscribing)
      await web3Enable('Carge');
      
      // Subscribe to account changes
      const unsubscribe = await web3AccountsSubscribe((injectedAccounts) => {
        console.log('🔄 Accounts changed in wallet:', injectedAccounts.length, 'accounts');
        
        // If we have a connected wallet, update the accounts list
        if (selectedWallet) {
          const walletAccounts = injectedAccounts.filter(
            acc => acc.meta.source === selectedWallet
          );
          
          console.log('📋 Updated accounts for', selectedWallet, ':', walletAccounts.length);
          setAccounts(walletAccounts);
          
          // If current selected account is no longer available, clear it
          if (selectedAccount && !walletAccounts.some(acc => acc.address === selectedAccount)) {
            console.log('⚠️ Previously selected account no longer available');
            setSelectedAccount(null);
            localStorage.removeItem('carge_selected_account');
          }
        }
      });
      
      console.log('✅ Account change listener setup complete');
      
      // Store unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('❌ Failed to setup account change listener:', error);
    }
  };

  const initializeApp = async () => {
    // Connect to Substrate
    try {
      const connected = await substrateClient.connect();
      setSubstrateConnected(connected);
      
      if (connected) {
        const block = await substrateClient.getCurrentBlock();
        setCurrentBlock(block);
        
        // Update block periodically
        const interval = setInterval(async () => {
          try {
            const newBlock = await substrateClient.getCurrentBlock();
            setCurrentBlock(newBlock);
          } catch (error) {
            console.error('Error updating block:', error);
          }
        }, 6000);
        
        // Clean up interval on unmount (sera géré par useEffect return)
      }
    } catch (error) {
      console.error('Substrate connection failed:', error);
    }

    // Initialize IPFS (non-bloquant) - on démarre tôt pour avoir le temps de se connecter
    console.log('🌐 Starting IPFS client initialization...');
    ipfsClient.init().then(ready => {
      setIpfsReady(ready);
      if (ready) {
        console.log('✅ IPFS P2P ready');
      } else {
        console.log('💡 IPFS will use HTTP gateway fallback');
      }
    }).catch(error => {
      console.error('IPFS initialization failed:', error);
      console.log('💡 IPFS will use HTTP gateway fallback');
      setIpfsReady(false);
    });

    // Auto-connect wallet on mobile or restore saved state on desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const savedAccount = localStorage.getItem('carge_selected_account');
    const savedWallet = localStorage.getItem('carge_selected_wallet');
    
    try {
      // On mobile: always try to auto-connect after a short delay (let wallet inject APIs)
      if (isMobile) {
        console.log('📱 Mobile detected, waiting for wallet injection...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for injection
        
        // Detect wallets again after delay
        const wallets = await walletConnector.detectInstalledWallets();
        setInstalledWallets(wallets);
        
        if (wallets.length > 0) {
          console.log('📱 Mobile wallet detected, auto-connecting...');
          const walletToConnect = savedWallet || wallets[0].id;
          await walletConnector.connect(walletToConnect);
          const allAccounts = await walletConnector.getAccounts();
          setAccounts(allAccounts);
          setSelectedWallet(walletToConnect);
          
          // Log account details to check for "active" indicators
          console.log('📋 All accounts metadata:');
          allAccounts.forEach((acc, idx) => {
            console.log(`  [${idx}] ${acc.meta.name || 'Unnamed'}`);
            console.log(`      Address: ${acc.address}`);
            console.log(`      Source: ${acc.meta.source}`);
            console.log(`      Meta:`, acc.meta);
          });
          
          // Try to restore previously selected account
          if (savedAccount && allAccounts.some(acc => acc.address === savedAccount)) {
            await selectAccount(savedAccount);
            console.log('✅ Mobile: Restored saved account:', savedAccount);
          } else if (allAccounts.length === 1) {
            // If only one account, auto-select it
            await selectAccount(allAccounts[0].address);
            console.log('✅ Mobile: Auto-selected single account');
          } else if (allAccounts.length > 0) {
            // Multiple accounts: auto-select first one (usually the active account in mobile wallets)
            // Most mobile wallets (SubWallet, Nova) put the currently active account first
            await selectAccount(allAccounts[0].address);
            console.log('✅ Mobile: Auto-selected first account (likely active in wallet)');
            console.log('💡 Note: SubWallet usually puts your active account first in the list');
            console.log('💡 Tip: Click the wallet button (top-right) to change accounts if needed');
          }
        }
      } else if (savedAccount) {
        // Desktop: only restore if previously saved
        console.log('💻 Desktop: Restoring saved account...');
        await walletConnector.connect();
        const allAccounts = await walletConnector.getAccounts();
        setAccounts(allAccounts);
        
        const accountExists = allAccounts.some(acc => acc.address === savedAccount);
        if (accountExists) {
          await selectAccount(savedAccount);
          console.log('✅ Desktop account restored:', savedAccount);
        } else {
          localStorage.removeItem('carge_selected_account');
        }
      }
    } catch (error) {
      console.error('❌ Failed to auto-connect wallet:', error);
    }
  };

  const connectWallet = async (walletId = 'polkadot-js') => {
    try {
      console.log('🔌 Connecting wallet:', walletId);
      await walletConnector.connect(walletId);
      const allAccounts = await walletConnector.getAccounts();
      console.log('✅ Wallet connected:', allAccounts.length, 'accounts');
      setAccounts(allAccounts);
      setSelectedWallet(walletId);
      setIsWalletSelectOpen(false);
      setIsWalletMenuOpen(true);
      localStorage.setItem('carge_selected_wallet', walletId);
      return allAccounts;
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      alert(`Wallet connection failed: ${error.message}\n\nPlease install a Substrate wallet.`);
      throw error;
    }
  };

  const selectAccount = async (address) => {
    try {
      await walletConnector.selectAccount(address);
      setSelectedAccount(address);
      localStorage.setItem('carge_selected_account', address);
      setIsWalletMenuOpen(false);
    } catch (error) {
      console.error('Account selection failed:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setSelectedAccount(null);
    setAccounts([]);
    localStorage.removeItem('carge_selected_account');
    setIsWalletMenuOpen(false);
  };

  const toggleWalletMenu = async () => {
    console.log('🔄 Toggle wallet menu, current state:', { isWalletMenuOpen, accountsLength: accounts.length });
    if (!isWalletMenuOpen && accounts.length === 0) {
      // Show wallet selection first
      setIsWalletSelectOpen(true);
    } else {
      setIsWalletMenuOpen(!isWalletMenuOpen);
    }
  };

  const value = {
    // Services
    walletConnector,
    substrateClient,
    ipfsClient,
    config,
    
    // State
    selectedAccount,
    selectedWallet,
    installedWallets,
    accounts,
    isWalletMenuOpen,
    isWalletSelectOpen,
    substrateConnected,
    ipfsReady,
    currentBlock,
    
    // Actions
    connectWallet,
    selectAccount,
    disconnectWallet,
    toggleWalletMenu,
    setIsWalletMenuOpen,
    setIsWalletSelectOpen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

