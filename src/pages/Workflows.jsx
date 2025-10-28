import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { RagClient } from '../lib/core/rag-client.js';
import { CidConverter } from '../lib/core/cid-converter.js';
import { FormGenerator } from '../lib/core/form-generator.js';
import { showError, showSuccess, toastTx } from '../lib/toast';
import { getFavorites, toggleFavorite, isFavorite } from '../lib/favorites';
import {
  waitForPolkadot,
  connectToApi,
  submitRagWorkflowStep,
  handleTransactionResult,
  downloadProofFile
} from '../lib/core/blockchain-utils.js';

export const Workflows = () => {
  const { t } = useTranslation();
  const { substrateClient, ipfsClient, selectedAccount } = useApp();
  const location = useLocation();
  
  // Generate Polkadot.js Apps explorer link for a block number
  const getBlockExplorerLink = (blockNumber) => {
    if (!substrateClient?.rpcUrl) return null;
    
    // Convert HTTP(S) RPC URL to WebSocket
    const wsUrl = substrateClient.rpcUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    
    return `https://polkadot.js.org/apps/?rpc=${encodeURIComponent(wsUrl)}#/explorer/query/${blockNumber}`;
  };
  
  // Pinned workflows (always displayed)
  const PINNED_WORKFLOWS = [
    'spirits-premium-7steps-fixed-v1',
    'copyright-v3'
  ];
  
  // State
  const [allRags, setAllRags] = useState([]); // All RAGs from blockchain (for step resolution)
  const [displayRags, setDisplayRags] = useState([]); // Only RAG masters (for display)
  const [loading, setLoading] = useState(true);
  const [selectedRag, setSelectedRag] = useState(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [schema, setSchema] = useState(null);
  const [error, setError] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false); // Accordion state for workflow details
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [searchTags, setSearchTags] = useState(''); // Tags search input
  const [searching, setSearching] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false); // Show/hide explanations
  const [favorites, setFavorites] = useState([]); // User's favorite workflow hashes
  const [currentPage, setCurrentPage] = useState(1); // Pagination
  const WORKFLOWS_PER_PAGE = 9; // 3x3 grid
  
  // Refs
  const formContainerRef = useRef(null);
  const workflowDetailsRef = useRef(null);
  
  // Auto-fill recipient address with connected wallet address
  useEffect(() => {
    if (selectedAccount) {
      setRecipientAddress(selectedAccount);
    }
  }, [selectedAccount]);

  // Load favorites when wallet connects and reload display
  useEffect(() => {
    if (selectedAccount) {
      const userFavorites = getFavorites(selectedAccount);
      setFavorites(userFavorites);
      console.log(`⭐ Loaded ${userFavorites.length} favorites for ${selectedAccount}`);
      
      // Reload display to show user favorites
      if (allRags.length > 0) {
        const ragMasters = allRags.filter(rag => 
          rag.metadata?.steps && Array.isArray(rag.metadata.steps) && rag.metadata.steps.length > 0
        );
        const pinnedRags = ragMasters.filter(rag => {
          return PINNED_WORKFLOWS.includes(rag.metadata?.name) || userFavorites.includes(rag.hash);
        });
        setDisplayRags(pinnedRags);
        console.log(`Updated display with ${pinnedRags.length} workflows (${PINNED_WORKFLOWS.length} hardcoded + ${userFavorites.length} favorites)`);
      }
    } else {
      setFavorites([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);
  
  // Convert hex address to SS58
  const hexToSS58 = async (hexAddress) => {
    try {
      const { encodeAddress } = await import('@polkadot/util-crypto');
      const { hexToU8a } = await import('@polkadot/util');
      
      // Remove 0x prefix if present
      const cleanHex = hexAddress.startsWith('0x') ? hexAddress.slice(2) : hexAddress;
      const addressBytes = hexToU8a('0x' + cleanHex);
      return encodeAddress(addressBytes, 42); // 42 = generic Substrate prefix
    } catch (err) {
      console.error('Failed to convert address:', err);
      return hexAddress; // Return original if conversion fails
    }
  };

  // Format token amount with 12 decimals (RAG tokens)
  /**
   * Toggle favorite status for a workflow
   */
  const handleToggleFavorite = (workflowHash) => {
    if (!selectedAccount) {
      showError('Please connect your wallet to save favorites');
      return;
    }
    
    const newStatus = toggleFavorite(selectedAccount, workflowHash);
    
    // Update local state
    if (newStatus) {
      // Added to favorites
      setFavorites([...favorites, workflowHash]);
      showSuccess('Added to favorites');
      
      // Add to displayRags if not already there
      const workflowToAdd = allRags.find(rag => rag.hash === workflowHash);
      if (workflowToAdd && !displayRags.some(rag => rag.hash === workflowHash)) {
        setDisplayRags([...displayRags, workflowToAdd]);
      }
    } else {
      // Removed from favorites
      setFavorites(favorites.filter(h => h !== workflowHash));
      showSuccess('Removed from favorites');
      
      // Remove from displayRags only if not a hardcoded pinned workflow
      const workflow = allRags.find(rag => rag.hash === workflowHash);
      const isHardcodedPinned = workflow && PINNED_WORKFLOWS.includes(workflow.metadata?.name);
      
      if (!isHardcodedPinned) {
        setDisplayRags(displayRags.filter(rag => rag.hash !== workflowHash));
      }
    }
  };

  const formatTokenAmount = (amount) => {
    if (!amount || amount === '0') return '0';
    
    try {
      // Convert string to BigInt, divide by 10^12
      const value = BigInt(amount);
      const decimals = BigInt(10 ** 12);
      const integerPart = value / decimals;
      const fractionalPart = value % decimals;
      
      // Format with up to 4 decimal places, remove trailing zeros
      const fractionalStr = fractionalPart.toString().padStart(12, '0').slice(0, 4);
      const trimmed = fractionalStr.replace(/0+$/, '');
      
      if (trimmed) {
        return `${integerPart}.${trimmed}`;
      }
      return integerPart.toString();
    } catch (err) {
      console.error('Failed to format token amount:', err);
      return amount;
    }
  };

  // Load RAGs on mount
  useEffect(() => {
    loadRags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select workflow if prefilledHash is provided from AI deployment
  useEffect(() => {
    const prefilledHash = location.state?.prefilledHash;
    if (prefilledHash && allRags.length > 0 && !selectedRag) {
      console.log('Prefilled hash detected:', prefilledHash);
      const matchingRag = allRags.find(rag => rag.hash === prefilledHash);
      if (matchingRag) {
        console.log('Auto-selecting workflow:', matchingRag.metadata.name);
        selectRag(matchingRag);
        // Scroll to form section
        setTimeout(() => {
          const formSection = document.getElementById('workflow-form-section');
          if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, allRags, selectedRag]);

  // Generate form when schema is loaded
  useEffect(() => {
    if (schema && formContainerRef.current) {
      FormGenerator.generateForm(schema, 'dynamic-form-fields');
    }
  }, [schema]);

  const loadRags = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading pinned & favorite RAGs from blockchain...');
      const ragClient = new RagClient(substrateClient);
      
      // Get user favorites (hashes)
      const userFavorites = selectedAccount ? getFavorites(selectedAccount) : [];
      
      const loadedRags = [];
      const stepHashes = new Set();
      
      // 1. Load hardcoded pinned workflows by tags
      for (const workflowName of PINNED_WORKFLOWS) {
        try {
          console.log(`🔍 Searching for pinned workflow: ${workflowName}`);
          const results = await ragClient.searchRagsByTags([workflowName]);
          if (results.length > 0) {
            const rag = results[0];
            loadedRags.push(rag);
            
            // Collect step hashes
            if (rag.metadata?.steps && Array.isArray(rag.metadata.steps)) {
              rag.metadata.steps.forEach(hash => stepHashes.add(hash));
            }
            console.log(`✅ Found pinned workflow: ${workflowName} (${rag.metadata.steps?.length || 0} steps)`);
          }
        } catch (err) {
          console.warn(`⚠️ Failed to load pinned workflow ${workflowName}:`, err);
        }
      }
      
      // 2. Load user favorite workflows by hashes
      if (userFavorites.length > 0) {
        console.log(`🔍 Loading ${userFavorites.length} favorite workflows...`);
        try {
          const favoriteRags = await ragClient.getRagsByHashes(userFavorites);
          
          for (const rag of favoriteRags) {
            // Avoid duplicates
            if (!loadedRags.some(r => r.hash === rag.hash)) {
              loadedRags.push(rag);
              
              // Collect step hashes
              if (rag.metadata?.steps && Array.isArray(rag.metadata.steps)) {
                rag.metadata.steps.forEach(hash => stepHashes.add(hash));
              }
            }
          }
          console.log(`✅ Loaded ${favoriteRags.length} favorite workflows`);
        } catch (err) {
          console.warn('⚠️ Failed to load favorite workflows:', err);
        }
      }
      
      // 3. Load all step RAGs
      if (stepHashes.size > 0) {
        console.log(`🔍 Loading ${stepHashes.size} step RAGs...`);
        try {
          const stepRags = await ragClient.getRagsByHashes(Array.from(stepHashes));
          loadedRags.push(...stepRags);
          console.log(`✅ Loaded ${stepRags.length} step RAGs`);
        } catch (err) {
          console.warn('⚠️ Failed to load step RAGs:', err);
        }
      }
      
      // Store all loaded RAGs (masters + steps)
      setAllRags(loadedRags);
      
      // Filter only RAG masters for display (workflows with steps)
      const ragMasters = loadedRags.filter(rag => {
        return rag.metadata?.steps && Array.isArray(rag.metadata.steps) && rag.metadata.steps.length > 0;
      });
      
      setDisplayRags(ragMasters);
      setCurrentPage(1); // Reset to first page on load
      
      console.log(`✅ Loaded ${ragMasters.length} workflows (${PINNED_WORKFLOWS.length} pinned + ${userFavorites.length} favorites) with ${stepHashes.size} step RAGs (${loadedRags.length} total RAGs)`);
    } catch (err) {
      console.error('Failed to load RAGs:', err);
      setError('Failed to load workflows from blockchain');
    } finally {
      setLoading(false);
    }
  };

  const searchByTags = async () => {
    try {
      setSearching(true);
      setError(null);
      
      // Parse tags from input (split by space, trim, filter empty)
      const tags = searchTags
        .split(' ')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      if (tags.length === 0) {
        // If no tags, show pinned workflows
        console.log('No tags provided, showing pinned workflows');
        await loadRags();
        return;
      }
      
      console.log(`Searching RAGs with tags (AND logic): ${tags.join(', ')}`);
      const ragClient = new RagClient(substrateClient);
      
      // Use the searchRagsByTags method from RagClient
      const foundRags = await ragClient.searchRagsByTags(tags);
      
      console.log(`Found ${foundRags.length} RAG(s) matching all tags`);
      
      // Filter only RAG masters (workflows with steps)
      const ragMasters = foundRags.filter(rag => {
        return rag.metadata?.steps && rag.metadata.steps.length > 0;
      });
      
      console.log(`Filtered to ${ragMasters.length} RAG master(s) with steps`);
      setDisplayRags(ragMasters);
      setCurrentPage(1); // Reset to first page on search
      
      // Update allRags if we found new ones
      if (foundRags.length > 0) {
        // Merge with existing allRags (avoid duplicates)
        const existingHashes = new Set(allRags.map(r => r.hash));
        const newRags = foundRags.filter(r => !existingHashes.has(r.hash));
        if (newRags.length > 0) {
          console.log(`Adding ${newRags.length} new RAG(s) to allRags`);
          setAllRags([...allRags, ...newRags]);
        }
      }
    } catch (err) {
      console.error('Failed to search RAGs:', err);
      setError(`Failed to search workflows: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  const selectRag = async (rag) => {
    try {
      setLoadingSchema(true);
      setError(null);
      setSchema(null);
      
      // Convert publisher to SS58 before setting selectedRag
      const ss58Publisher = await hexToSS58(rag.metadata.publisher);
      const ragWithSS58 = {
        ...rag,
        metadata: {
          ...rag.metadata,
          publisherSS58: ss58Publisher
        }
      };
      
      setSelectedRag(ragWithSS58);
      setIsDetailsExpanded(false); // Reset details accordion when selecting new workflow
      console.log('Selected RAG:', rag.metadata.name);
      
      // Scroll to workflow details section
      setTimeout(() => {
        if (workflowDetailsRef.current) {
          workflowDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      // Pre-load master workflow CIDs in background (non-blocking)
      preloadWorkflowCids(rag);
      
      // Determine which schema to load
      let schemaCidHex;
      if (rag.metadata.steps && rag.metadata.steps.length > 0) {
        // Master RAG - load first step's schema
        console.log('Master RAG detected, loading first step schema');
        const firstStepHash = rag.metadata.steps[0];
        
        // Find the step RAG in ALL RAGs (not just displayed masters)
        const stepRag = allRags.find(r => r.hash === firstStepHash);
        if (!stepRag) {
          throw new Error(`First step RAG not found. Looking for hash: ${firstStepHash}`);
        }
        
        console.log(`Found step RAG: ${stepRag.metadata?.name || 'Unnamed'}`);
        schemaCidHex = stepRag.metadata.schemaCid;
      } else {
        // Simple RAG - load its own schema
        schemaCidHex = rag.metadata.schemaCid;
      }
      
      // Download and parse schema from IPFS (hex CID)
      console.log('Loading schema from IPFS (hex CID):', schemaCidHex);
      const schemaObj = await ipfsClient.downloadJsonFromHex(schemaCidHex);
      
      console.log('Schema loaded:', schemaObj);
      setSchema(schemaObj);
    } catch (err) {
      console.error('Failed to load schema:', err);
      setError(`Failed to load workflow schema: ${err.message}`);
    } finally {
      setLoadingSchema(false);
    }
  };

  /**
   * Pre-load workflow CIDs in background (non-blocking)
   * Loads master workflow CIDs + all step CIDs into IPFS/Helia cache
   */
  const preloadWorkflowCids = async (rag) => {
    try {
      console.log('🔄 Pre-loading workflow CIDs in background...');
      
      const cidsToLoad = [];
      
      // Add master workflow CIDs
      if (rag.metadata.instructionCid) cidsToLoad.push(rag.metadata.instructionCid);
      if (rag.metadata.resourceCid) cidsToLoad.push(rag.metadata.resourceCid);
      if (rag.metadata.schemaCid) cidsToLoad.push(rag.metadata.schemaCid);
      
      // Add all step CIDs if this is a master workflow
      if (rag.metadata.steps && Array.isArray(rag.metadata.steps)) {
        for (const stepHash of rag.metadata.steps) {
          const stepRag = allRags.find(r => r.hash === stepHash);
          if (stepRag) {
            if (stepRag.metadata.instructionCid) cidsToLoad.push(stepRag.metadata.instructionCid);
            if (stepRag.metadata.resourceCid) cidsToLoad.push(stepRag.metadata.resourceCid);
            if (stepRag.metadata.schemaCid) cidsToLoad.push(stepRag.metadata.schemaCid);
          }
        }
      }
      
      console.log(`📦 Pre-loading ${cidsToLoad.length} CIDs...`);
      
      // Pre-load all CIDs in parallel (non-blocking)
      const loadPromises = cidsToLoad.map(async (hexCid) => {
        try {
          const cidString = CidConverter.hexToString(hexCid);
          // Just trigger the download, we don't need the result
          await ipfsClient.downloadJson(cidString);
          console.log(`✅ Pre-loaded: ${cidString.substring(0, 20)}...`);
        } catch (err) {
          console.warn(`⚠️ Failed to pre-load CID:`, err.message);
        }
      });
      
      // Wait for all in background (don't block UI)
      await Promise.allSettled(loadPromises);
      console.log(`✅ Finished pre-loading ${cidsToLoad.length} CIDs`);
    } catch (err) {
      // Non-critical, just log
      console.warn('⚠️ CID pre-loading failed (non-critical):', err);
    }
  };

  const submitWorkflow = async (e) => {
    e.preventDefault();
    
    // Validate form data against schema using Zod
    const formData = FormGenerator.getFormData('dynamic-form-fields');
    const validation = FormGenerator.validateForm(formData, schema);
    
    if (!validation.valid) {
      showError('Please fill all required fields:\n' + validation.errors.join('\n'));
      return;
    }

    // Check wallet connection
    if (!selectedAccount) {
      showError('Please connect your wallet to start the workflow');
      return;
    }

    const toastId = toastTx.signing();
    let api = null;

    try {
      setSubmitting(true);
      setError(null);
      setResult(null);

      console.log('Starting workflow...');
      console.log('Form data:', formData);
      console.log('Selected RAG:', selectedRag);
      console.log('Recipient:', recipientAddress);

      // Determine the step hash (first step)
      let stepHash;
      if (selectedRag.metadata.steps && selectedRag.metadata.steps.length > 0) {
        // Master RAG - use first step hash
        stepHash = selectedRag.metadata.steps[0];
        console.log('Master RAG - using first step hash:', stepHash);
      } else {
        // Simple RAG - use its own hash
        stepHash = selectedRag.hash;
        console.log('Simple RAG - using own hash:', stepHash);
      }

      // Create RAG object with workflow hash, first step hash, and form data as livrable
      const ragData = {
        ragHash: selectedRag.hash,
        stepHash: stepHash,
        livrable: formData
      };

      console.log('RAG data:', ragData);

      // Wait for Polkadot.js to be ready
      await waitForPolkadot();

      // Create API connection
      api = await connectToApi(substrateClient.rpcUrl);

      // Update toast to broadcasting
      toastTx.broadcasting(toastId);
      
      // Submit RAG workflow step (automatically handles encryption if needed)
      const { unsub, contentHash, ipfsCid, useEncryption } = await submitRagWorkflowStep({
        ragData,
        recipientAddress,
        selectedAccount,
        api,
        ipfsClient,
        onStatusChange: (txResult) => {
          // Handle transaction errors
          const error = handleTransactionResult(txResult, api);
          if (error) {
            toastTx.error(error.message, toastId);
            setError(error.message);
            setSubmitting(false);
            unsub();
            api.disconnect();
            return;
          }
          
          // Handle success (transaction in block)
          if (txResult.status.isInBlock) {
            console.log('Transaction included in block:', txResult.status.asInBlock.toHex());
            
            // Download proof file
            downloadProofFile(ragData, contentHash);
            
            const successMsg = useEncryption 
              ? 'Workflow started successfully! Encrypted proof sent to recipient.'
              : 'Workflow started successfully!';
            toastTx.success(successMsg, toastId);
            
            setResult({
              success: true,
              message: useEncryption 
                ? 'Workflow step 1 completed and encrypted proof sent!'
                : 'Workflow step 1 completed!',
              details: {
                contentHash,
                ipfsCid: ipfsCid || 'N/A (simple mode)',
                recipient: recipientAddress || 'Self',
                workflowName: selectedRag.metadata.name,
                stepName: allRags.find(r => r.hash === stepHash)?.metadata?.name || 'Step 1',
                blockHash: txResult.status.asInBlock.toHex(),
                proofDownloaded: true,
                encrypted: useEncryption
              }
            });
            
            setSubmitting(false);
            unsub();
            api.disconnect();
          }
        }
      });

    } catch (err) {
      console.error('Workflow submission error:', err);
      const errorMsg = err.message || 'Failed to submit workflow';
      toastTx.error(errorMsg, toastId);
      setError(errorMsg);
      setSubmitting(false);
      
      // Cleanup API connection on error
      if (api) {
        api.disconnect();
      }
    }
  };

  // Helper to create clickable CID link
  const CidLink = ({ hexCid, label }) => {
    try {
      const cidString = CidConverter.hexToString(hexCid);
      const url = `https://ipfs.io/ipfs/${cidString}`;
      
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline break-all inline-flex items-center gap-1"
          title="Open in IPFS gateway"
        >
          {cidString}
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      );
    } catch {
      return (
        <span className="font-mono text-xs text-red-500">Invalid CID</span>
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl font-light mb-4">{t('workflows.title')}</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin text-4xl">...</div>
          <span className="ml-4 text-gray-600">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Compact Page Header */}
      <div className="bg-white">
        <div className="container mx-auto px-6 py-6 max-w-6xl">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Title and Description */}
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-[#003399] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {t('workflows.title')}
                </h1>
                {!loading && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-700">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    {displayRags.length}
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                {t('workflows.description')}
              </p>
            </div>

            {/* How it works button */}
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[#003399] hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-[#003399]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showHowItWorks ? 'Hide details' : 'How it works?'}
            </button>
          </div>

          {/* Expandable How it works section */}
          {showHowItWorks && (
            <div className="mt-6 animate-fadeIn">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('workflows.step1Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('workflows.step1Desc')}</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('workflows.step2Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('workflows.step2Desc')}</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('workflows.step3Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('workflows.step3Desc')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Available Workflows Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('workflows.available')}</h2>
              <p className="text-gray-600">Select a workflow to get started</p>
            </div>
            <button
              onClick={loadRags}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white border-2 border-[#003399] text-[#003399] rounded-lg hover:bg-[#003399] hover:text-white transition-all shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('workflows.refresh')}
            </button>
          </div>

          {/* Tags Search */}
          <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="font-bold text-gray-900">Search by Tags</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Enter tags separated by spaces (AND logic - all tags must match)
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchTags}
                onChange={(e) => setSearchTags(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchByTags();
                  }
                }}
                placeholder="e.g., whisky scotland premium"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003399] focus:border-[#003399] transition-all"
              />
              <button
                onClick={searchByTags}
                disabled={searching}
                className="px-6 py-3 bg-[#003399] text-white rounded-lg hover:bg-[#002266] transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
              >
                {searching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Pinned workflows:</strong> {PINNED_WORKFLOWS.join(', ')} are always available. Clear search to return to pinned workflows.
              </span>
            </div>
          </div>

          {displayRags.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('workflows.noWorkflows')}</h3>
              <p className="text-gray-600 mb-4">{t('workflows.tryRefresh')}</p>
              <button
                onClick={loadRags}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#003399] text-white rounded-lg hover:bg-[#002266] transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Now
              </button>
            </div>
          ) : (
            <>
              {/* Pagination Info */}
              {displayRags.length > WORKFLOWS_PER_PAGE && (
                <div className="mb-4 text-sm text-gray-600">
                  Showing {((currentPage - 1) * WORKFLOWS_PER_PAGE) + 1} - {Math.min(currentPage * WORKFLOWS_PER_PAGE, displayRags.length)} of {displayRags.length} workflows
                </div>
              )}
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayRags
                  .slice((currentPage - 1) * WORKFLOWS_PER_PAGE, currentPage * WORKFLOWS_PER_PAGE)
                  .map((rag) => {
                const isFav = isFavorite(selectedAccount, rag.hash);
                
                return (
                <div key={rag.hash} className="relative">
                  {/* Favorite Star Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(rag.hash);
                    }}
                    className="absolute top-3 right-3 z-10 p-2 rounded-lg hover:bg-white/80 transition-all group/star"
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFav ? (
                      <svg className="w-6 h-6 text-yellow-500 drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-gray-400 group-hover/star:text-yellow-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    )}
                  </button>

                  {/* Workflow Card */}
                  <button
                    onClick={() => selectRag(rag)}
                    className={`w-full group text-left p-6 rounded-xl border-2 transition-all hover:shadow-xl ${
                      selectedRag?.hash === rag.hash
                        ? 'border-[#003399] bg-gradient-to-br from-blue-50 to-white shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-[#003399] hover:scale-105'
                    }`}
                  >
                    {/* Icon & Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                        selectedRag?.hash === rag.hash 
                          ? 'bg-[#003399] shadow-lg' 
                          : 'bg-gray-100 group-hover:bg-[#003399]'
                      }`}>
                        <svg className={`w-8 h-8 transition-colors ${
                          selectedRag?.hash === rag.hash 
                            ? 'text-white' 
                            : 'text-gray-600 group-hover:text-white'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      {rag.metadata.steps && rag.metadata.steps.length > 0 && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold transition-colors mr-10 ${
                          selectedRag?.hash === rag.hash
                            ? 'bg-[#003399] text-white'
                            : 'bg-blue-100 text-blue-800 group-hover:bg-blue-200'
                        }`}>
                          {rag.metadata.steps.length} Steps
                        </span>
                      )}
                    </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-[#003399] transition-colors">
                    {rag.metadata.name || t('workflows.unnamed')}
                  </h3>
                  {rag.metadata.description && (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                      {rag.metadata.description}
                    </p>
                  )}

                    {/* Selection Indicator */}
                    {selectedRag?.hash === rag.hash && (
                      <div className="mt-4 flex items-center gap-2 text-[#003399] font-semibold text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Selected
                      </div>
                    )}
                  </button>
                </div>
              );
                  })}
              </div>

              {/* Pagination Controls */}
              {displayRags.length > WORKFLOWS_PER_PAGE && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-[#003399] hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: Math.ceil(displayRags.length / WORKFLOWS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-[#003399] text-white shadow-lg'
                          : 'border-2 border-gray-300 hover:border-[#003399] hover:bg-blue-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(Math.ceil(displayRags.length / WORKFLOWS_PER_PAGE), currentPage + 1))}
                    disabled={currentPage === Math.ceil(displayRags.length / WORKFLOWS_PER_PAGE)}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-[#003399] hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      {/* RAG Details */}
      {selectedRag && (
        <div ref={workflowDetailsRef}>
        <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-[#003399] rounded-xl shadow-lg p-6 mb-6 animate-fadeIn">
          <div className="space-y-4">
            {/* Name & Description with Visual Enhancement */}
            <div className="pb-4 border-b-2 border-gray-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-[#003399] rounded-lg flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#003399] mb-2">{selectedRag.metadata.name || t('workflows.unnamed')}</h3>
                  {selectedRag.metadata.description && (
                    <p className="text-gray-700 text-sm leading-relaxed">{selectedRag.metadata.description}</p>
                  )}
                  {selectedRag.metadata.steps && selectedRag.metadata.steps.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {selectedRag.metadata.steps.length} Steps
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Active
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Workflow Details Toggle with Better Design */}
            <button
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-[#003399] rounded-xl transition-all text-left shadow-sm"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-gray-900">{t('workflows.detailsToggle')}</span>
              </div>
              <svg 
                className={`w-6 h-6 text-[#003399] transition-transform duration-300 ${isDetailsExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Collapsible Details Section with Enhanced Design */}
            {isDetailsExpanded && (
              <div className="space-y-6 animate-slideDown">
                {/* Metadata Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Publisher Card */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-500 uppercase">{t('workflows.publisher')}</span>
                    </div>
                    <p className="font-mono text-xs break-all text-gray-700">{selectedRag.metadata.publisherSS58 || selectedRag.metadata.publisher}</p>
                  </div>
                  
                  {/* Created At Card */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-500 uppercase">{t('workflows.createdAt')}</span>
                    </div>
                    <a
                      href={getBlockExplorerLink(selectedRag.metadata.createdAt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium inline-flex items-center gap-1"
                      title="View block in explorer"
                    >
                      Block #{selectedRag.metadata.createdAt.toLocaleString()}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  
                  {/* Expires At Card */}
                  {selectedRag.metadata.expiresAt && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-semibold text-gray-500 uppercase">{t('workflows.expiresAt')}</span>
                      </div>
                      <a
                        href={getBlockExplorerLink(selectedRag.metadata.expiresAt)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium inline-flex items-center gap-1"
                        title="View block in explorer"
                      >
                        Block #{selectedRag.metadata.expiresAt.toLocaleString()}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                  
                  {/* Staked Amount Card */}
                  {selectedRag.metadata.stakedAmount && selectedRag.metadata.stakedAmount !== '0' && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-semibold text-gray-500 uppercase">{t('workflows.staked')}</span>
                      </div>
                      <p className="font-bold text-lg text-[#003399]">{formatTokenAmount(selectedRag.metadata.stakedAmount)} RAG</p>
                    </div>
                  )}
                </div>

                {/* IPFS Resources Section with Icons */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    <h4 className="font-semibold text-gray-900">{t('workflows.ipfsResources')}</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 mb-1">{t('workflows.instructions')}</p>
                        <CidLink hexCid={selectedRag.metadata.instructionCid} label="" />
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 mb-1">{t('workflows.resources')}</p>
                        <CidLink hexCid={selectedRag.metadata.resourceCid} label="" />
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 mb-1">{t('workflows.schema')}</p>
                        <CidLink hexCid={selectedRag.metadata.schemaCid} label="" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow Steps with Timeline */}
                {selectedRag.metadata.steps && selectedRag.metadata.steps.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <h4 className="font-semibold text-gray-900">{t('workflows.multiStep')}</h4>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                        {selectedRag.metadata.steps.length} {selectedRag.metadata.steps.length > 1 ? t('workflows.steps') : t('workflows.step')}
                      </span>
                    </div>
                    <div className="relative space-y-3">
                      {/* Vertical Timeline Line */}
                      <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#003399] to-blue-200"></div>
                      
                      {selectedRag.metadata.steps.map((stepHash, i) => {
                        const stepRag = allRags.find(r => r.hash === stepHash);
                        const isFirst = i === 0;
                        const isLast = i === selectedRag.metadata.steps.length - 1;
                        
                        return (
                          <div 
                            key={i} 
                            className="relative flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:from-blue-50 hover:to-white border border-gray-200 hover:border-[#003399] cursor-pointer transition-all shadow-sm hover:shadow-md"
                            onClick={() => stepRag && selectRag(stepRag)}
                          >
                            {/* Step Number Badge */}
                            <div className={`relative flex-shrink-0 w-10 h-10 ${isFirst ? 'bg-green-500' : isLast ? 'bg-[#003399]' : 'bg-blue-500'} text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md z-10`}>
                              {i + 1}
                            </div>
                            
                            {/* Step Content */}
                            <div className="flex-1 min-w-0 pt-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{stepRag?.metadata.name || t('workflows.unknownStep')}</div>
                                  {stepRag?.metadata.description && (
                                    <div className="text-sm text-gray-600 mt-1 leading-relaxed">{stepRag.metadata.description}</div>
                                  )}
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              {isFirst && (
                                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                  Start Here
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      )}

        {/* Form Generation */}
        {selectedRag && (
          <div id="workflow-form-section" className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#003399] to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Execute Workflow</h2>
                <p className="text-sm text-gray-600">Fill in the required information to start</p>
              </div>
            </div>

            {loadingSchema && (
              <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-xl">
                <div className="w-16 h-16 border-4 border-[#003399] border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="text-lg font-medium text-gray-700">Loading schema from IPFS...</span>
                <span className="text-sm text-gray-500 mt-2">Please wait while we fetch the workflow schema</span>
              </div>
            )}

            {schema && !loadingSchema && (
              <form onSubmit={submitWorkflow} className="space-y-6">
                {/* Dynamic Form Fields - Generated by FormGenerator */}
                <div 
                  ref={formContainerRef}
                  id="dynamic-form-fields" 
                  className="space-y-4 bg-gray-50 rounded-xl p-6 border border-gray-200"
                />

                {/* Recipient Address */}
                <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <label className="block text-sm font-bold text-gray-900">
                      Recipient Address *
                    </label>
                  </div>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="5Exxx... or 0x..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003399] focus:border-[#003399] transition-all font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Enter the Substrate address of the workflow recipient
                  </p>
                </div>

                {/* Wallet Check */}
                {!selectedAccount && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-orange-900 mb-1">Wallet Required</h4>
                        <p className="text-sm text-orange-800">
                          Please connect your wallet to start the workflow
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-6 border-t-2 border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting || !selectedAccount}
                    className="w-full px-6 py-4 bg-gradient-to-r from-[#003399] to-blue-700 hover:from-[#002266] hover:to-blue-800 text-white rounded-xl transition-all font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Start Workflow
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    This will sign your data with your wallet and submit it to the blockchain.
                  </p>
                </div>
              </form>
            )}

            {/* Success Result */}
            {result && result.success && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-lg text-green-900">Workflow Started Successfully!</div>
                  <div className="text-sm text-green-700">{result.message}</div>
                </div>
              </div>

              <div className="mt-4 bg-white rounded-lg p-4">
                <h3 className="font-medium mb-3">Proof Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Workflow:</span>
                    <span className="text-gray-700 mt-1">{result.details.workflowName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Step:</span>
                    <span className="text-gray-700 mt-1">{result.details.stepName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Content Hash:</span>
                    <span className="font-mono text-xs text-gray-700 break-all mt-1">{result.details.contentHash}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Block Hash:</span>
                    <span className="font-mono text-xs text-gray-700 break-all mt-1">{result.details.blockHash}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Proof File:</span>
                    <span className="text-gray-700 mt-1">Downloaded (proof_{result.details.contentHash.slice(0, 10)}...json)</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Next step:</strong> To continue the workflow, go to the <strong>Verify</strong> page and upload or paste your proof file. 
                  The system will automatically detect the workflow and show you the next step.
                </p>
              </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
