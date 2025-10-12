import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { RagClient } from '../lib/core/rag-client.js';
import { CidConverter } from '../lib/core/cid-converter.js';
import { FormGenerator } from '../lib/core/form-generator.js';

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
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false); // Accordion state for workflow details
  
  // Ref for form container
  const formContainerRef = useRef(null);
  
  // Convert hex address to SS58
  const hexToSS58 = async (hexAddress) => {
    try {
      const { encodeAddress, decodeAddress } = await import('@polkadot/util-crypto');
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

  // Load RAGs on mount
  useEffect(() => {
    loadRags();
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
        console.log('🔗 Master RAG detected, loading first step schema');
        const firstStepHash = rag.metadata.steps[0];
        
        // Find the step RAG in ALL RAGs (not just displayed masters)
        const stepRag = allRags.find(r => r.hash === firstStepHash);
        if (!stepRag) {
          throw new Error(`First step RAG not found. Looking for hash: ${firstStepHash}`);
        }
        
        console.log(`✅ Found step RAG: ${stepRag.metadata?.name || 'Unnamed'}`);
        schemaCidHex = stepRag.metadata.schemaCid;
      } else {
        // Simple RAG - load its own schema
        schemaCidHex = rag.metadata.schemaCid;
      }
      
      // Convert hex CID to string
      const cidString = CidConverter.hexToString(schemaCidHex);
      console.log('📦 Loading schema from IPFS:', cidString);
      
      // Download schema from IPFS via Helia
      const schemaText = await ipfsClient.downloadText(cidString);
      const schemaObj = JSON.parse(schemaText);
      
      console.log('Schema loaded:', schemaObj);
      setSchema(schemaObj);
    } catch (err) {
      console.error('Failed to load schema:', err);
      setError(`Failed to load workflow schema: ${err.message}`);
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = FormGenerator.getFormData('dynamic-form-fields');
    console.log('Form data:', data);
    
    const validation = FormGenerator.validateForm(data, schema);
    if (!validation.valid) {
      alert('Please fill all required fields:\n' + validation.errors.join('\n'));
      return;
    }
    
    alert('Workflow execution is under development. This will sign and submit to blockchain.\n\nData: ' + JSON.stringify(data, null, 2));
  };

  // Helper to create clickable CID link
  const CidLink = ({ hexCid, label }) => {
    try {
      const cidString = CidConverter.hexToString(hexCid);
      const url = `https://ipfs.io/ipfs/${cidString}`;
      
      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">{label}:</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
            title="Open in IPFS gateway"
          >
            {cidString}
          </a>
          <button
            onClick={() => navigator.clipboard.writeText(cidString)}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
            title="Copy CID"
          >
            📋
          </button>
        </div>
      );
    } catch (err) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">{label}:</span>
          <span className="font-mono text-xs text-red-500">Invalid CID</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl font-light mb-4">{t('workflows.title')}</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin text-4xl">⏳</div>
          <span className="ml-4 text-gray-600">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-light mb-4">{t('workflows.title')}</h1>
      <p className="text-gray-600 mb-8">{t('workflows.description')}</p>

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
            className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            {t('workflows.refresh')}
          </button>
        </div>

        {displayRags.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
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
                    ? 'border-gray-900 bg-gray-50'
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
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium mb-4">Workflow Details</h2>
          
          <div className="space-y-4">
            {/* Name & Description */}
            <div className="pb-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedRag.metadata.name || t('workflows.unnamed')}</h3>
              {selectedRag.metadata.description && (
                <p className="text-gray-600 text-sm">{selectedRag.metadata.description}</p>
              )}
            </div>

            {/* Workflow Details Toggle */}
            <button
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-left"
            >
              <span className="font-medium text-gray-900">{t('workflows.detailsToggle')}</span>
              <svg 
                className={`w-5 h-5 text-gray-600 transition-transform ${isDetailsExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Collapsible Details Section */}
            {isDetailsExpanded && (
              <div className="space-y-4 animate-slideDown">
                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pb-4 border-b">
                  <div>
                    <span className="text-gray-500">{t('workflows.publisher')}:</span>
                    <p className="font-mono text-xs mt-1 break-all">{selectedRag.metadata.publisherSS58 || selectedRag.metadata.publisher}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('workflows.createdAt')}:</span>
                    <a
                      href={getBlockExplorerLink(selectedRag.metadata.createdAt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-blue-600 hover:text-blue-800 hover:underline font-medium inline-block"
                      title="View block in explorer"
                    >
                      #{selectedRag.metadata.createdAt.toLocaleString()}
                    </a>
                  </div>
                  {selectedRag.metadata.expiresAt && (
                    <div>
                      <span className="text-gray-500">{t('workflows.expiresAt')}:</span>
                      <a
                        href={getBlockExplorerLink(selectedRag.metadata.expiresAt)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-blue-600 hover:text-blue-800 hover:underline font-medium inline-block"
                        title="View block in explorer"
                      >
                        #{selectedRag.metadata.expiresAt.toLocaleString()}
                      </a>
                    </div>
                  )}
                  {selectedRag.metadata.stakedAmount && selectedRag.metadata.stakedAmount !== '0' && (
                    <div>
                      <span className="text-gray-500">{t('workflows.staked')}:</span>
                      <p className="mt-1 font-medium">{selectedRag.metadata.stakedAmount} {t('common.units')}</p>
                    </div>
                  )}
                </div>

                {/* CIDs Section */}
                <div className="space-y-3 pb-4 border-b">
                  <h4 className="font-medium text-gray-900">{t('workflows.ipfsResources')}</h4>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    <CidLink hexCid={selectedRag.metadata.instructionCid} label={t('workflows.instructions')} />
                    <CidLink hexCid={selectedRag.metadata.resourceCid} label={t('workflows.resources')} />
                    <CidLink hexCid={selectedRag.metadata.schemaCid} label={t('workflows.schema')} />
                  </div>
                </div>

                {/* Steps (for Master RAGs) */}
                {selectedRag.metadata.steps && selectedRag.metadata.steps.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">
                      {t('workflows.multiStep')} ({selectedRag.metadata.steps.length} {selectedRag.metadata.steps.length > 1 ? t('workflows.steps') : t('workflows.step')})
                    </h4>
                    <div className="space-y-2">
                      {selectedRag.metadata.steps.map((stepHash, i) => {
                        const stepRag = allRags.find(r => r.hash === stepHash);
                        return (
                          <div 
                            key={i} 
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                            onClick={() => stepRag && selectRag(stepRag)}
                          >
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{stepRag?.metadata.name || t('workflows.unknownStep')}</div>
                              {stepRag?.metadata.description && (
                                <div className="text-xs text-gray-600 mt-1">{stepRag.metadata.description}</div>
                              )}
                              <div className="text-xs font-mono text-blue-600 mt-1 break-all hover:underline">
                                {stepHash}
                              </div>
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
              <div className="animate-spin text-2xl">⏳</div>
              <span className="ml-3 text-gray-600">Loading schema from IPFS...</span>
            </div>
          )}

          {schema && !loadingSchema && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dynamic Form Fields - Generated by FormGenerator */}
              <div 
                ref={formContainerRef}
                id="dynamic-form-fields" 
                className="space-y-4"
              />

              {/* Submit Button */}
              <div className="pt-4 border-t">
                <button
                  type="submit"
                  disabled
                  className="w-full px-4 py-3 bg-gray-400 text-gray-200 rounded-lg cursor-not-allowed font-medium"
                >
                  Submit (In Development)
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
