import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { RagClient } from '../lib/core/rag-client.js';
import { CidConverter } from '../lib/core/cid-converter.js';
import { FormGenerator } from '../lib/core/form-generator.js';
import { showError, toastTx } from '../lib/toast';
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
  
  // Generate Polkadot.js Apps explorer link for a block number
  const getBlockExplorerLink = (blockNumber) => {
    if (!substrateClient?.rpcUrl) return null;
    
    // Convert HTTP(S) RPC URL to WebSocket
    const wsUrl = substrateClient.rpcUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    
    return `https://polkadot.js.org/apps/?rpc=${encodeURIComponent(wsUrl)}#/explorer/query/${blockNumber}`;
  };
  
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
  
  // Ref for form container
  const formContainerRef = useRef(null);
  
  // Auto-fill recipient address with connected wallet address
  useEffect(() => {
    if (selectedAccount) {
      setRecipientAddress(selectedAccount);
    }
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
      
      console.log('Loading RAGs from blockchain...');
      const ragClient = new RagClient(substrateClient);
      const loadedRags = await ragClient.getAllRags();
      
      // Store ALL RAGs (needed for step resolution)
      setAllRags(loadedRags);
      
      // Filter only RAG masters (workflows with steps) for display
      const ragMasters = loadedRags.filter(rag => {
        const hasSteps = rag.metadata?.steps && rag.metadata.steps.length > 0;
        if (!hasSteps) {
          console.log(`Filtering out RAG without steps: ${rag.metadata?.name || 'Unnamed'}`);
        }
        return hasSteps;
      });
      
      console.log(`Loaded ${ragMasters.length} RAG master(s) with steps (filtered from ${loadedRags.length} total)`);
      setDisplayRags(ragMasters);
    } catch (err) {
      console.error('Failed to load RAGs:', err);
      setError('Failed to load workflows from blockchain');
    } finally {
      setLoading(false);
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
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-light mb-4">{t('workflows.title')}</h1>
      <p className="text-gray-600 mb-8">{t('workflows.description')}</p>

      {/* How Workflows Work */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-[#003399] mb-6">{t('workflows.howItWorksTitle')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('workflows.step1Title')}</h3>
            <p className="text-sm text-gray-700 text-justify">{t('workflows.step1Desc')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('workflows.step2Title')}</h3>
            <p className="text-sm text-gray-700 text-justify">{t('workflows.step2Desc')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('workflows.step3Title')}</h3>
            <p className="text-sm text-gray-700 text-justify">{t('workflows.step3Desc')}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* RAG Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">{t('workflows.available')}</h2>
          <button
            onClick={loadRags}
            className="px-3 py-1.5 text-sm bg-[#003399] text-white rounded-lg hover:bg-[#002266] transition"
          >
            {t('workflows.refresh')}
          </button>
        </div>

        {displayRags.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2"></div>
            <p>{t('workflows.noWorkflows')}</p>
            <p className="text-sm mt-2">{t('workflows.tryRefresh')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayRags.map((rag) => (
              <button
                key={rag.hash}
                onClick={() => selectRag(rag)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                  selectedRag?.hash === rag.hash
                    ? 'border-[#003399] bg-gray-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{rag.metadata.name || t('workflows.unnamed')}</div>
                    {rag.metadata.description && (
                      <div className="text-sm text-gray-600 mt-1">{rag.metadata.description}</div>
                    )}
                  </div>
                  {rag.metadata.steps && rag.metadata.steps.length > 0 && (
                    <div className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {rag.metadata.steps.length} step{rag.metadata.steps.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RAG Details */}
      {selectedRag && (
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
      )}

      {/* Form Generation */}
      {selectedRag && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4">Execute Workflow</h2>

          {loadingSchema && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin text-2xl">...</div>
              <span className="ml-3 text-gray-600">Loading schema from IPFS...</span>
            </div>
          )}

          {schema && !loadingSchema && (
            <form onSubmit={submitWorkflow} className="space-y-4">
              {/* Dynamic Form Fields - Generated by FormGenerator */}
              <div 
                ref={formContainerRef}
                id="dynamic-form-fields" 
                className="space-y-4"
              />

              {/* Recipient Address */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Recipient Address *
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="5Exxx... or 0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003399] focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500">
                  Enter the Substrate address of the workflow recipient
                </p>
              </div>

              {/* Wallet Check */}
              {!selectedAccount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm text-[#003399]">
                      Please connect your wallet to start the workflow
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 border-t">
                <button
                  type="submit"
                  disabled={submitting || !selectedAccount}
                  className="w-full px-4 py-3 bg-[#003399] hover:bg-[#002266] text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Start Workflow'}
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">
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
  );
};
