import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { ProofVerifier } from '../lib/core/proof-verifier.js';

export const Verify = () => {
  const { substrateClient } = useApp();
  const [mode, setMode] = useState('file'); // 'file' or 'json'
  const [jsonInput, setJsonInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setVerifying(true);
      setError(null);
      setResult(null);

      const text = await file.text();
      const proof = JSON.parse(text);
      
      await verifyProof(proof);
    } catch (err) {
      console.error('File upload error:', err);
      setError(err.message || 'Failed to process file');
    } finally {
      setVerifying(false);
    }
  };

  const handleJsonSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setVerifying(true);
      setError(null);
      setResult(null);

      const proof = JSON.parse(jsonInput);
      await verifyProof(proof);
    } catch (err) {
      console.error('JSON verification error:', err);
      setError(err.message || 'Failed to verify proof');
    } finally {
      setVerifying(false);
    }
  };

  const verifyProof = async (proof) => {
    const verifier = new ProofVerifier(substrateClient);
    const verification = await verifier.verifyProof(proof);
    setResult(verification);
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-light mb-4">Verify Proof</h1>
      <p className="text-gray-600 mb-12">
        Upload a proof file to instantly verify it on the blockchain. You'll see who created it, when, and get the
        cryptographic proof.
      </p>

      {/* Mode Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">Proof Verification</h2>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('file')}
            className={`px-4 py-2 rounded-lg transition ${
              mode === 'file'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📁 Upload File
          </button>
          <button
            onClick={() => setMode('json')}
            className={`px-4 py-2 rounded-lg transition ${
              mode === 'json'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📝 Paste JSON
          </button>
        </div>

        {/* File Upload Mode */}
        {mode === 'file' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={verifying}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-gray-700 font-medium mb-2">Drop proof file here or click to browse</p>
              <p className="text-sm text-gray-500">Accepts JSON proof files (proof_*.json)</p>
            </label>
          </div>
        )}

        {/* JSON Paste Mode */}
        {mode === 'json' && (
          <form onSubmit={handleJsonSubmit}>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste your proof JSON here...'
              className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
              disabled={verifying}
            />
            <button
              type="submit"
              disabled={verifying || !jsonInput.trim()}
              className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifying...' : 'Verify Proof'}
            </button>
          </form>
        )}
      </div>

      {/* Verifying Status */}
      {verifying && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin">⏳</div>
            <div>
              <div className="font-medium text-blue-900">Verifying proof...</div>
              <div className="text-sm text-blue-700">Checking blockchain records</div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">❌</div>
            <div>
              <div className="font-medium text-red-900">Verification Failed</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`border rounded-lg p-6 ${
          result.isValid
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-3xl">{result.isValid ? '✅' : '❌'}</div>
            <div>
              <div className="font-medium text-lg">
                {result.isValid ? 'Proof Valid' : 'Proof Invalid'}
              </div>
              <div className="text-sm text-gray-700">{result.message}</div>
            </div>
          </div>

          {result.details && (
            <div className="mt-4 bg-white rounded-lg p-4">
              <h3 className="font-medium mb-3">Proof Details</h3>
              <pre className="text-xs font-mono whitespace-pre-wrap break-all text-gray-700">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

