import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { ProofVerifier } from '../lib/core/proof-verifier.js';
import { showError, showSuccess, showLoading, dismiss } from '../lib/toast';

export const Verify = () => {
  const { t } = useTranslation();
  const { substrateClient } = useApp();
  const [mode, setMode] = useState('file'); // 'file' or 'json'
  const [jsonInput, setJsonInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Example proof JSON
  const exampleProof = {
    "ragData": {
      "ragHash": "0x3bda44d8460eb05bee5487c433f3d8a9a2bbdc056f3622dac36810012a7972b8",
      "stepHash": "0xc9ab2efad8f54abaf263987bc217ca4169a690ea8db7613099e27e2fe1b82afe",
      "livrable": {
        "entity": {
          "entityType": "company",
          "legalName": "CryptoTrading France SAS",
          "country": "FR",
          "registrationNumber": "85234567800015",
          "legalStructure": "SAS",
          "beneficialOwners": [
            {
              "name": "Sophie Bernard",
              "ownershipPercentage": 55,
              "nationality": "FR"
            },
            {
              "name": "Lucas Moreau",
              "ownershipPercentage": 45,
              "nationality": "FR"
            }
          ]
        },
        "identity": {
          "documentType": "national_id",
          "documentNumber": "FR298765432",
          "expiryDate": "2029-05-20",
          "documentCid": "bafkreiyb3zl56brrvyrl27gkwklolhrxxjr3ez32fdxa2mtt4ddlsocr2q",
          "proofOfAddressType": "utility_bill",
          "proofOfAddressCid": "bafkreiho3a6qpuyjouxg6ot5ozdj4wiu24x2ur2oh7vbqlawdytsqn4zsg",
          "proofOfAddressDate": "2025-09-15",
          "sourceOfFunds": "business_income",
          "pepStatus": false
        },
        "risk_profile": {
          "operatingJurisdictions": [
            "FR",
            "DE",
            "BE"
          ],
          "monthlyVolume": "100k_1m",
          "transactionFrequency": "daily",
          "cryptoActivities": [
            "exchange_trading",
            "defi_staking"
          ],
          "customerBase": "retail",
          "highRiskJurisdictions": [],
          "riskLevel": "medium",
          "riskMitigationMeasures": [
            "aml_program",
            "transaction_monitoring",
            "sanctions_screening",
            "compliance_officer",
            "kyc_verification"
          ]
        },
        "wallet_monitoring": {
          "wallets": [
            {
              "blockchain": "ethereum",
              "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
              "walletType": "hot_wallet",
              "primaryUse": "business_operations"
            },
            {
              "blockchain": "bitcoin",
              "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
              "walletType": "cold_wallet",
              "primaryUse": "treasury"
            }
          ],
          "transactionPatterns": "Daily exchange trading 10-50K EUR, weekly DeFi staking deposits 5-20K EUR, monthly treasury consolidation",
          "counterpartyTypes": [
            "regulated_exchange",
            "defi_protocol"
          ],
          "alertThreshold": 50000,
          "monitoringConsent": true,
          "monitoringFrequency": "daily"
        },
        "compliance": {
          "fullName": "CryptoTrading France SAS",
          "aliases": [
            "CTF"
          ],
          "sanctionsScreeningConsent": true,
          "sanctionsScreeningResult": "clear",
          "adverseMediaFound": false,
          "criminalRecord": false,
          "beneficialOwnerScreening": "all_clear",
          "monitoringFrequency": "monthly",
          "sarAcknowledgment": true,
          "complianceOfficer": {
            "name": "Sophie Bernard",
            "email": "compliance@cryptotrading-fr.example",
            "certification": "CAMS"
          },
          "attestations": {
            "informationAccurate": true,
            "noMaterialChanges": true,
            "consentToMonitoring": true,
            "consentToRegulatorSharing": true,
            "amlProgramInPlace": true,
            "understandSARObligations": true
          }
        }
      }
    }
  };

  const loadExampleProof = () => {
    setJsonInput(JSON.stringify(exampleProof, null, 2));
    setMode('json'); // Switch to JSON mode when loading example
  };
  
  // Generate Polkadot.js Apps explorer link for a block number
  const getBlockExplorerLink = (blockNumber) => {
    if (!substrateClient?.rpcUrl) return null;
    
    // Convert HTTP(S) RPC URL to WebSocket
    const wsUrl = substrateClient.rpcUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    
    return `https://polkadot.js.org/apps/?rpc=${encodeURIComponent(wsUrl)}#/explorer/query/${blockNumber}`;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = showLoading('Processing file...');

    try {
      setVerifying(true);
      setError(null);
      setResult(null);

      console.log('📂 Processing file:', file.name);
      const text = await file.text();
      
      // Try to parse as JSON proof first
      try {
        const proof = JSON.parse(text);
        
        // Check if it's a valid proof structure (has ragData field)
        if (proof.ragData) {
          console.log('✓ Valid proof JSON detected, verifying...');
          await verifyProof(proof, toastId);
        } else {
          // JSON but not a proof structure - hash the file content
          console.log('→ JSON file but not a proof structure, hashing content...');
          await verifyFileHash(text, file.name, toastId);
        }
      } catch {
        // Not JSON - hash the raw file content
        console.log('→ Not JSON, hashing file content...');
        await verifyFileHash(text, file.name, toastId);
      }
    } catch (err) {
      console.error('File upload error:', err);
      setError(err.message || 'Failed to process file');
      dismiss(toastId);
      showError(err.message || 'Failed to process file');
    } finally {
      setVerifying(false);
    }
  };

  const handleJsonSubmit = async (e) => {
    e.preventDefault();
    
    const toastId = showLoading('Verifying proof...');
    
    try {
      setVerifying(true);
      setError(null);
      setResult(null);

      const proof = JSON.parse(jsonInput);
      await verifyProof(proof, toastId);
    } catch (err) {
      console.error('JSON verification error:', err);
      setError(err.message || 'Failed to verify proof');
      dismiss(toastId);
      showError(err.message || 'Failed to verify proof');
    } finally {
      setVerifying(false);
    }
  };

  const verifyProof = async (proof, toastId) => {
    try {
      console.log('Starting proof verification...');
      const verifier = new ProofVerifier(substrateClient);
      const verification = await verifier.verifyProof(proof);
      
      console.log('Verification result:', verification);
      
      // Format result for display
      const signatureValid = verification.trail?.signatureValid ?? false;
      
      // Calculate wrapped message hash for display
      const { stringToU8a, hexToU8a } = await import('@polkadot/util');
      const contentHashBytes = hexToU8a(verification.contentHash);
      const wrappedMessage = new Uint8Array([
        ...stringToU8a('<Bytes>'),
        ...contentHashBytes,
        ...stringToU8a('</Bytes>')
      ]);
      const wrappedHashBuffer = await crypto.subtle.digest('SHA-256', wrappedMessage);
      const wrappedHashArray = Array.from(new Uint8Array(wrappedHashBuffer));
      const wrappedMessageHash = '0x' + wrappedHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const result = {
        isValid: verification.found && signatureValid,
        message: verification.found 
          ? (signatureValid 
              ? 'Proof found on blockchain with valid signature!' 
              : 'Proof found but signature verification failed!')
          : 'Proof not found on blockchain',
        details: verification.found ? {
          contentHash: verification.contentHash,
          wrappedMessageHash,
          creator: verification.trail.creatorAddress,
          createdAt: verification.trail.createdAt,
          expiresAt: verification.trail.expiresAt,
          signature: verification.trail.substrateSignature,
          signatureValid: signatureValid ? 'Valid' : 'Invalid',
        } : {
          contentHash: verification.contentHash,
          wrappedMessageHash,
          status: 'Not found in blockchain storage'
        }
      };
      
      setResult(result);
      
      if (result.isValid) {
        dismiss(toastId);
        showSuccess('Proof verified successfully!');
      } else {
        dismiss(toastId);
        showError(result.message);
      }
    } catch (err) {
      console.error('Verification error:', err);
      dismiss(toastId);
      showError(err.message || 'Verification failed');
      throw err;
    }
  };

  const verifyFileHash = async (content, filename, toastId) => {
    try {
      console.log('Verifying file hash for:', filename);
      
      // Hash the content using the same method as Quick Sign
      const encoder = new TextEncoder();
      const contentBytes = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', contentBytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const contentHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log('Content hash:', contentHash);
      
      // Calculate wrapped message hash for display
      const { stringToU8a, hexToU8a } = await import('@polkadot/util');
      const contentHashBytes = hexToU8a(contentHash);
      const wrappedMessage = new Uint8Array([
        ...stringToU8a('<Bytes>'),
        ...contentHashBytes,
        ...stringToU8a('</Bytes>')
      ]);
      const wrappedHashBuffer = await crypto.subtle.digest('SHA-256', wrappedMessage);
      const wrappedHashArray = Array.from(new Uint8Array(wrappedHashBuffer));
      const wrappedMessageHash = '0x' + wrappedHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Query blockchain for this hash
      const verifier = new ProofVerifier(substrateClient);
      const trail = await verifier.queryBlockchain(contentHash);
      
      if (trail) {
        const signatureValid = trail.signatureValid ?? false;
        console.log('✓ File hash found on blockchain!');
        console.log('✓ Signature valid:', signatureValid);
        
        const result = {
          isValid: signatureValid,
          message: signatureValid 
            ? `File hash found on blockchain with valid signature!`
            : `File hash found but signature verification failed!`,
          details: {
            contentHash,
            wrappedMessageHash,
            filename,
            creator: trail.creatorAddress,
            createdAt: trail.createdAt,
            expiresAt: trail.expiresAt,
            signature: trail.substrateSignature,
            signatureValid: signatureValid ? 'Valid' : 'Invalid',
          }
        };
        
        setResult(result);
        
        if (result.isValid) {
          dismiss(toastId);
          showSuccess('File hash verified successfully!');
        } else {
          dismiss(toastId);
          showError(result.message);
        }
      } else {
        console.log('✗ File hash not found on blockchain');
        const result = {
          isValid: false,
          message: 'File hash not found on blockchain',
          details: {
            contentHash,
            wrappedMessageHash,
            filename,
            status: 'Not found in blockchain storage'
          }
        };
        
        setResult(result);
        dismiss(toastId);
        showError(result.message);
      }
    } catch (err) {
      console.error('File hash verification error:', err);
      dismiss(toastId);
      showError(err.message || 'File hash verification failed');
      throw err;
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-light mb-4">{t('verify.title')}</h1>
      <p className="text-gray-600 mb-8">
        {t('verify.description')}
      </p>

      {/* Type of Proof */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-[#003399] mb-6">{t('verify.howItWorksTitle')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('verify.step1Title')}</h3>
            <p className="text-sm text-gray-700 text-justify">{t('verify.step1Desc')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('verify.step2Title')}</h3>
            <p className="text-sm text-gray-700 text-justify">{t('verify.step2Desc')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('verify.step3Title')}</h3>
            <p className="text-sm text-gray-700 text-justify">{t('verify.step3Desc')}</p>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">{t('verify.title')}</h2>
          <button
            type="button"
            onClick={loadExampleProof}
            className="px-4 py-2 text-sm bg-[#003399] text-white rounded-lg hover:bg-[#002266] transition font-medium"
          >
            {t('verify.testExample')}
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('file')}
            className={`px-4 py-2 rounded-lg transition ${
              mode === 'file'
                ? 'bg-[#003399] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('verify.uploadFile')}
          </button>
          <button
            onClick={() => setMode('json')}
            className={`px-4 py-2 rounded-lg transition ${
              mode === 'json'
                ? 'bg-[#003399] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('verify.orPaste')}
          </button>
        </div>

        {/* File Upload Mode */}
        {mode === 'file' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={verifying}
              aria-label="Upload proof file"
              aria-describedby="upload-description"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-700 font-medium mb-2">{t('verify.dragDrop')}</p>
              <p className="text-sm text-gray-500" id="upload-description">{t('verify.uploadDesc')}</p>
            </label>
          </div>
        )}

        {/* JSON Paste Mode */}
        {mode === 'json' && (
          <form onSubmit={handleJsonSubmit}>
            <label className="text-sm text-gray-600 block mb-2">{t('verify.pasteDesc')}</label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={t('verify.pasteDesc')}
              className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#003399] mb-4"
              disabled={verifying}
              aria-label="Proof JSON input"
              aria-describedby="json-description"
            />
            <button
              type="submit"
              disabled={verifying || !jsonInput.trim()}
              className="w-full px-4 py-3 bg-[#003399] hover:bg-[#002266] text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? t('verify.verifying') : t('verify.verifyButton')}
            </button>
          </form>
        )}
      </div>

      {/* Verifying Status */}
      {verifying && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <div className="font-medium text-blue-900">{t('verify.verifying')}</div>
              <div className="text-sm text-blue-700">{t('common.loading')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <div>
              <div className="font-medium text-red-900">{t('verify.invalid')}</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div role="region" aria-label="Verification results" className={`border rounded-lg p-6 ${
          result.isValid
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            {result.isValid ? (
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
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
              <div className="space-y-2 text-sm">
                {Object.entries(result.details).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-gray-500 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    {key === 'createdAt' || key === 'expiresAt' ? (
                      <a 
                        href={getBlockExplorerLink(value)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-600 hover:underline break-all mt-1"
                      >
                        Block #{value} →
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-gray-700 break-all mt-1">{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

