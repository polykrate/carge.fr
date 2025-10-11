import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { RagClient } from '../lib/core/rag-client.js';
import { CidConverter } from '../lib/core/cid-converter.js';
import { FormGenerator } from '../lib/core/form-generator.js';

export const Workflows = () => {
  const { substrateClient, ipfsClient, selectedAccount } = useApp();
  
  // State
  const [rags, setRags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRag, setSelectedRag] = useState(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  // Load RAGs on mount
  useEffect(() => {
    loadRags();
  }, []);

  const loadRags = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 Loading RAGs from blockchain...');
      const ragClient = new RagClient(substrateClient);
      const allRags = await ragClient.getAllRags();
      
      console.log(`✅ Loaded ${allRags.length} RAG(s)`);
      setRags(allRags);
    } catch (err) {
      console.error('❌ Failed to load RAGs:', err);
      setError('Failed to load workflows from blockchain');
    } finally {
      setLoading(false);
    }
  };

  const selectRag = async (rag) => {
    try {
      setSelectedRag(rag);
      setLoadingSchema(true);
      setError(null);
      setSchema(null);
      
      console.log('📋 Selected RAG:', rag.metadata.name);
      
      // Determine which schema to load
      let schemaCidHex;
      if (rag.metadata.steps && rag.metadata.steps.length > 0) {
        // Master RAG - load first step's schema
        console.log('🔗 Master RAG detected, loading first step schema');
        const firstStepHash = rag.metadata.steps[0];
        
        // Find the step RAG
        const stepRag = rags.find(r => r.hash === firstStepHash);
        if (!stepRag) {
          throw new Error('First step RAG not found');
        }
        
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
      
      console.log('✅ Schema loaded:', schemaObj);
      setSchema(schemaObj);
    } catch (err) {
      console.error('❌ Failed to load schema:', err);
      setError(`Failed to load workflow schema: ${err.message}`);
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Workflow execution is under development. This will sign and submit to blockchain.');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl font-light mb-4">Workflows</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin text-4xl">⏳</div>
          <span className="ml-4 text-gray-600">Loading workflows from blockchain...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-light mb-4">Workflows</h1>
      <p className="text-gray-600 mb-8">Select a workflow from the blockchain and execute it with your signature</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* RAG Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">Available Workflows</h2>
          <button
            onClick={loadRags}
            className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Refresh
          </button>
        </div>

        {rags.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No workflows found on blockchain</p>
            <p className="text-sm mt-2">Try refreshing or check your connection</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rags.map((rag) => (
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
                    <div className="font-medium text-gray-900">{rag.metadata.name || 'Unnamed Workflow'}</div>
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
          
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-4 gap-4 pb-3 border-b">
              <div className="text-gray-500">Name:</div>
              <div className="col-span-3 font-medium">{selectedRag.metadata.name}</div>
            </div>
            
            {selectedRag.metadata.description && (
              <div className="grid grid-cols-4 gap-4 pb-3 border-b">
                <div className="text-gray-500">Description:</div>
                <div className="col-span-3">{selectedRag.metadata.description}</div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4 pb-3 border-b">
              <div className="text-gray-500">Schema CID:</div>
              <div className="col-span-3 font-mono text-xs break-all">
                {CidConverter.hexToString(selectedRag.metadata.schemaCid)}
              </div>
            </div>

            {selectedRag.metadata.steps && selectedRag.metadata.steps.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-gray-500">Steps:</div>
                <div className="col-span-3 space-y-1">
                  {selectedRag.metadata.steps.map((step, i) => (
                    <div key={i} className="text-xs font-mono">
                      {i + 1}. {step.substring(0, 16)}...
                    </div>
                  ))}
                </div>
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
              {/* Dynamic Form Fields */}
              <div id="dynamic-form-fields" className="space-y-4">
                {schema.properties && Object.entries(schema.properties).map(([key, prop]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {prop.title || key}
                      {schema.required?.includes(key) && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {prop.type === 'string' && (
                      <input
                        type="text"
                        value={formData[key] || ''}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        required={schema.required?.includes(key)}
                        placeholder={prop.description}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    )}
                    
                    {prop.type === 'number' && (
                      <input
                        type="number"
                        value={formData[key] || ''}
                        onChange={(e) => setFormData({ ...formData, [key]: Number(e.target.value) })}
                        required={schema.required?.includes(key)}
                        placeholder={prop.description}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    )}

                    {prop.type === 'boolean' && (
                      <input
                        type="checkbox"
                        checked={formData[key] || false}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        className="w-4 h-4"
                      />
                    )}

                    {prop.description && (
                      <p className="text-xs text-gray-500 mt-1">{prop.description}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Button (Disabled) */}
              <div className="pt-4 border-t">
                <button
                  type="submit"
                  disabled
                  className="w-full px-4 py-3 bg-gray-400 text-gray-200 rounded-lg cursor-not-allowed font-medium"
                  title="Workflow execution is under development"
                >
                  Submit (In Development)
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Workflow execution and signing will be implemented soon
                </p>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
