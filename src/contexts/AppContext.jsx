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
  }, []);

  const detectWallets = async () => {
    const wallets = await walletConnector.detectInstalledWallets();
    setInstalledWallets(wallets);
    console.log('📱 Detected wallets:', wallets.map(w => w.name).join(', '));
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

    // Restore wallet state
    const savedAccount = localStorage.getItem('carge_selected_account');
    if (savedAccount) {
      try {
        await walletConnector.connect();
        const allAccounts = await walletConnector.getAccounts();
        setAccounts(allAccounts);
        
        const accountExists = allAccounts.some(acc => acc.address === savedAccount);
        if (accountExists) {
          await selectAccount(savedAccount);
        } else {
          localStorage.removeItem('carge_selected_account');
        }
      } catch (error) {
        console.error('Failed to restore wallet state:', error);
      }
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

