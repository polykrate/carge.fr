import { createContext, useContext, useState, useEffect } from 'react';
import { WalletConnector } from '../lib/core/wallet-connector.js';
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
  const [walletConnector] = useState(() => new WalletConnector());
  const [substrateClient] = useState(() => new SubstrateClient(config.SUBSTRATE_RPC_URL));
  const [ipfsClient] = useState(() => new IpfsClient());

  // State
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  
  // Connection status
  const [substrateConnected, setSubstrateConnected] = useState(false);
  const [ipfsReady, setIpfsReady] = useState(false);
  const [currentBlock, setCurrentBlock] = useState(null);

  // Initialize services on mount
  useEffect(() => {
    initializeApp();
  }, []);

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
        
        return () => clearInterval(interval);
      }
    } catch (error) {
      console.error('Substrate connection failed:', error);
    }

    // Initialize IPFS
    try {
      const ready = await ipfsClient.init();
      setIpfsReady(ready);
    } catch (error) {
      console.error('IPFS initialization failed:', error);
    }

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

  const connectWallet = async () => {
    try {
      await walletConnector.connect();
      const allAccounts = await walletConnector.getAccounts();
      setAccounts(allAccounts);
      setIsWalletMenuOpen(true);
      return allAccounts;
    } catch (error) {
      console.error('Wallet connection failed:', error);
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
    if (!isWalletMenuOpen && accounts.length === 0) {
      await connectWallet();
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
    accounts,
    isWalletMenuOpen,
    substrateConnected,
    ipfsReady,
    currentBlock,
    
    // Actions
    connectWallet,
    selectAccount,
    disconnectWallet,
    toggleWalletMenu,
    setIsWalletMenuOpen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

