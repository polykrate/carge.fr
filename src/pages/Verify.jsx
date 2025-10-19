import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { ProofVerifier } from '../lib/core/proof-verifier.js';
import { RagClient } from '../lib/core/rag-client.js';
import { FormGenerator } from '../lib/core/form-generator.js';
import { showError, showSuccess, showLoading, dismiss, toastTx } from '../lib/toast';
import {
  waitForPolkadot,
  connectToApi,
  submitRagWorkflowStep,
  handleTransactionResult,
  downloadProofFile
} from '../lib/core/blockchain-utils.js';

export const Verify = () => {
  const { t } = useTranslation();
  const { substrateClient, ipfsClient, selectedAccount } = useApp();
  const [mode, setMode] = useState('file'); // 'file' or 'json'
  const [jsonInput, setJsonInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [proofData, setProofData] = useState(null); // Store the proof data for workflow continuation
  const [workflowHistory, setWorkflowHistory] = useState(null); // Store reconstructed workflow history
  
  // Workflow continuation states
  const [allRags, setAllRags] = useState([]);
  const [nextStepSchema, setNextStepSchema] = useState(null);
  const [workflowInfo, setWorkflowInfo] = useState(null); // { masterRag, currentStep, nextStepRag, livrable }
  const [loadingNextStep, setLoadingNextStep] = useState(false);
  const [submittingStep, setSubmittingStep] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const formContainerRef = useRef(null);
  
  // Auto-fill recipient address with connected wallet address
  useEffect(() => {
    if (selectedAccount) {
      setRecipientAddress(selectedAccount);
    }
  }, [selectedAccount]);
  
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
  
  // Load all RAGs on mount (needed for workflow continuation)
  useEffect(() => {
    const loadRags = async () => {
      try {
        console.log('Loading RAGs from blockchain for workflow detection...');
        const ragClient = new RagClient(substrateClient);
        const loadedRags = await ragClient.getAllRags();
        setAllRags(loadedRags);
        console.log(`Loaded ${loadedRags.length} RAGs`);
      } catch (err) {
        console.error('Failed to load RAGs:', err);
      }
    };
    
    if (substrateClient) {
      loadRags();
    }
  }, [substrateClient]);

  // Generate form when schema is loaded
  useEffect(() => {
    if (nextStepSchema && formContainerRef.current) {
      FormGenerator.generateForm(nextStepSchema, 'next-step-form-fields');
    }
  }, [nextStepSchema]);

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
      setWorkflowHistory(null);

      console.log('Processing file:', file.name);
      const text = await file.text();
      
      // Try to parse as JSON proof first
      try {
        const proof = JSON.parse(text);
        
        // Check if it's a valid proof structure (has ragData field)
        if (proof.ragData) {
          console.log('Valid proof JSON detected, verifying...');
          await verifyProof(proof, toastId);
        } else {
          // JSON but not a proof structure - hash the file content
          console.log('JSON file but not a proof structure, hashing content...');
          await verifyFileHash(text, file.name, toastId);
        }
      } catch {
        // Not JSON - hash the raw file content
        console.log('Not JSON, hashing file content...');
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
      setWorkflowHistory(null);

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
      
      // Store proof data for workflow continuation
      if (result.isValid && proof.ragData) {
        setProofData(proof.ragData);
      }
      
      // If proof is valid and contains workflow data, reconstruct and verify workflow history
      if (result.isValid && proof.ragData && proof.ragData.ragHash && proof.ragData.stepHash && proof.ragData.livrable) {
        console.log('Valid workflow proof detected, reconstructing history...');
        try {
          const ragClient = new RagClient(substrateClient);
          const history = await verifier.reconstructWorkflowHistory(proof, ragClient, ipfsClient);
          setWorkflowHistory(history);
          console.log('📜 Workflow history reconstructed:', history);
          
          // Also try to load next step
          await loadNextWorkflowStep(proof.ragData);
        } catch (err) {
          console.error('Failed to reconstruct workflow history:', err);
          // Don't fail the whole verification, just log it
        }
      }
      
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

  const loadNextWorkflowStep = async (ragData) => {
    try {
      setLoadingNextStep(true);
      
      const { ragHash, stepHash, livrable } = ragData;
      console.log('Loading workflow continuation:', { ragHash, stepHash });
      
      // Find the master RAG
      const masterRag = allRags.find(r => r.hash === ragHash);
      if (!masterRag) {
        console.warn(`Master workflow not found. RAG Hash: ${ragHash}`);
        return;
      }

      if (!masterRag.metadata.steps || masterRag.metadata.steps.length === 0) {
        console.warn('This is not a multi-step workflow');
        return;
      }

      // Find current step index
      const currentStepIndex = masterRag.metadata.steps.findIndex(
        hash => hash === stepHash
      );
      
      if (currentStepIndex === -1) {
        console.warn('Current step not found in workflow');
        return;
      }

      // Check if there's a next step
      if (currentStepIndex >= masterRag.metadata.steps.length - 1) {
        console.log('This is the last step of the workflow. No next step available.');
        setWorkflowInfo({
          masterRag,
          currentStep: currentStepIndex + 1,
          totalSteps: masterRag.metadata.steps.length,
          livrable,
          isLastStep: true
        });
        return;
      }

      const nextStepHash = masterRag.metadata.steps[currentStepIndex + 1];
      const nextStepRag = allRags.find(r => r.hash === nextStepHash);
      
      if (!nextStepRag) {
        console.warn(`Next step RAG not found. Hash: ${nextStepHash}`);
        return;
      }

      console.log(`Moving from step ${currentStepIndex + 1} to ${currentStepIndex + 2}`);
      console.log('Next step:', nextStepRag.metadata.name);

      // Load next step's schema from IPFS (hex CID)
      console.log('Loading next step schema from IPFS (hex CID):', nextStepRag.metadata.schemaCid);
      const schemaObj = await ipfsClient.downloadJsonFromHex(nextStepRag.metadata.schemaCid);
      
      console.log('Schema loaded successfully');
      setNextStepSchema(schemaObj);
      
      setWorkflowInfo({
        masterRag,
        currentStep: currentStepIndex + 2, // Next step (1-indexed)
        totalSteps: masterRag.metadata.steps.length,
        nextStepRag,
        livrable,
        isLastStep: false
      });

    } catch (err) {
      console.error('Failed to load next workflow step:', err);
      throw err;
    } finally {
      setLoadingNextStep(false);
    }
  };

  const submitNextStep = async (e) => {
    e.preventDefault();
    
    // Validate form data against schema using Zod
    const formData = FormGenerator.getFormData('next-step-form-fields');
    const validation = FormGenerator.validateForm(formData, nextStepSchema);
    
    if (!validation.valid) {
      showError('Please fill all required fields:\n' + validation.errors.join('\n'));
      return;
    }

    // Check wallet connection
    if (!selectedAccount) {
      showError('Please connect your wallet to submit the next step');
      return;
    }

    const toastId = toastTx.signing();
    let api = null;

    try {
      setSubmittingStep(true);

      console.log('Submitting next workflow step...');
      console.log('Form data:', formData);
      console.log('Previous livrable:', workflowInfo.livrable);
      console.log('Recipient:', recipientAddress);

      // Merge data: previous livrable + new form data (new takes priority)
      const mergedLivrable = {
        ...workflowInfo.livrable,
        ...formData
      };

      console.log('Merged livrable:', mergedLivrable);

      // Create RAG object with workflow hash, NEXT step hash, and merged livrable
      const ragData = {
        ragHash: workflowInfo.masterRag.hash,
        stepHash: workflowInfo.nextStepRag.hash, // IMPORTANT: next step hash, not current
        livrable: mergedLivrable
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
            setSubmittingStep(false);
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
              ? 'Workflow step submitted successfully! Encrypted proof sent to recipient.'
              : 'Workflow step submitted successfully!';
            toastTx.success(successMsg, toastId);
            
            // Reset workflow state and show success message
            setWorkflowInfo(null);
            setNextStepSchema(null);
            setProofData(null);
            
            setResult({
              isValid: true,
              message: useEncryption 
                ? 'Workflow step completed and encrypted proof sent!'
                : 'Workflow step completed!',
              details: {
                contentHash,
                ipfsCid: ipfsCid || 'N/A (simple mode)',
                recipient: recipientAddress || 'Self',
                stepName: workflowInfo.nextStepRag.metadata.name,
                blockHash: txResult.status.asInBlock.toHex(),
                proofDownloaded: true,
                encrypted: useEncryption
              }
            });
            
            setSubmittingStep(false);
            unsub();
            api.disconnect();
          }
        }
      });

    } catch (err) {
      console.error('Step submission error:', err);
      const errorMsg = err.message || 'Failed to submit step';
      toastTx.error(errorMsg, toastId);
      setSubmittingStep(false);
      
      // Cleanup API connection on error
      if (api) {
        api.disconnect();
      }
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
        console.log('File hash found on blockchain!');
        console.log('Signature valid:', signatureValid);
        
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

          {/* Continue Workflow Button for valid RAG proofs */}
          {result.isValid && proofData && proofData.ragHash && proofData.stepHash && (
            <div className="mt-6 pt-6 border-t border-green-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    This is a valid workflow proof
                  </span>
                </div>
                {!workflowInfo && !loadingNextStep && (
                  <button
                    onClick={() => loadNextWorkflowStep(proofData)}
                    className="px-6 py-2 bg-[#003399] hover:bg-[#002266] text-white rounded-lg transition font-medium text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Continue Workflow
                  </button>
                )}
              </div>
              {workflowInfo && (
                <div className="mt-2 text-xs text-gray-600">
                  ↓ Workflow continuation loaded below
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Workflow History Section */}
      {workflowHistory && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Workflow History</h2>
              {workflowHistory.allStepsVerified ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  All Steps Verified
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Some Steps Unverified
                </span>
              )}
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {workflowHistory.currentStepIndex + 1} / {workflowHistory.totalSteps} Steps
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>Workflow:</strong> {workflowHistory.masterWorkflowName}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              Hash: {workflowHistory.masterWorkflowHash}
            </p>
          </div>

          {/* Timeline of steps */}
          <div className="space-y-4">
            {workflowHistory.history.map((step, index) => (
              <div
                key={step.stepIndex}
                className={`border rounded-lg p-4 ${
                  step.blockchainVerified
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {step.blockchainVerified ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <h3 className="font-semibold text-gray-900">
                      Step {step.stepIndex + 1}: {step.stepName}
                    </h3>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      step.blockchainVerified
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {step.blockchainVerified ? 'Verified' : 'Not Found'}
                  </span>
                </div>

                {/* Step Details */}
                <div className="bg-white rounded p-3 space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500 font-medium">Content Hash:</span>
                    <p className="font-mono text-gray-700 break-all">{step.contentHash}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Step Hash:</span>
                    <p className="font-mono text-gray-700 break-all">{step.stepHash}</p>
                  </div>
                  
                  {step.blockchainData && (
                    <>
                      <div>
                        <span className="text-gray-500 font-medium">Creator:</span>
                        <p className="font-mono text-gray-700 break-all">{step.blockchainData.creator}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-gray-500 font-medium">Created:</span>
                          <a 
                            href={getBlockExplorerLink(step.blockchainData.createdAt)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-mono text-blue-600 hover:underline ml-1"
                          >
                            Block #{step.blockchainData.createdAt} →
                          </a>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">Signature:</span>
                          <span
                            className={`ml-1 px-2 py-0.5 rounded text-xs ${
                              step.blockchainData.signatureValid
                                ? 'bg-green-200 text-green-800'
                                : 'bg-red-200 text-red-800'
                            }`}
                          >
                            {step.blockchainData.signatureValid ? 'Valid' : 'Invalid'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Show delivrable keys for this step */}
                  <div>
                    <span className="text-gray-500 font-medium">Delivrable Keys:</span>
                    <p className="text-gray-700 mt-1">
                      {Object.keys(step.delivrable).length > 0
                        ? Object.keys(step.delivrable).join(', ')
                        : 'None'}
                    </p>
                  </div>
                </div>

                {/* Collapsible delivrable data */}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-900">
                    Show delivrable data
                  </summary>
                  <pre className="mt-2 bg-gray-100 rounded p-2 text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(step.delivrable, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow Continuation Section */}
      {workflowInfo && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Workflow Continuation</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              Step {workflowInfo.currentStep} / {workflowInfo.totalSteps}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Workflow:</strong> {workflowInfo.masterRag?.metadata?.name || 'Unknown'}
            </p>
            {workflowInfo.masterRag?.metadata?.description && (
              <p className="text-sm text-gray-600">
                <strong>Description:</strong> {workflowInfo.masterRag.metadata.description}
              </p>
            )}
          </div>

          {/* Previous Step Data */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Completed Step Data:</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                {JSON.stringify(workflowInfo.livrable, null, 2)}
              </pre>
            </div>
          </div>

          {/* Next Step Form or Completion Message */}
          {workflowInfo.isLastStep ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3"></div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Workflow Complete!</h3>
              <p className="text-sm text-green-700">
                This was the final step of the workflow. All steps have been completed.
              </p>
            </div>
          ) : (
            <>
              {loadingNextStep ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin text-2xl">...</div>
                  <span className="ml-3 text-gray-600">Loading next step from IPFS...</span>
                </div>
              ) : nextStepSchema ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Step {workflowInfo.currentStep}: {workflowInfo.nextStepRag?.metadata?.name || 'Next Step'}
                  </h3>
                  
                  {workflowInfo.nextStepRag?.metadata?.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {workflowInfo.nextStepRag.metadata.description}
                    </p>
                  )}

                  <form onSubmit={submitNextStep}>
                    {/* Dynamic Form Fields */}
                    <div 
                      ref={formContainerRef}
                      id="next-step-form-fields" 
                      className="space-y-4 mb-6"
                    />

                    {/* Recipient Address */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 mb-6">
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
                        Enter the Substrate address of the next recipient in the workflow
                      </p>
                    </div>

                    {/* Wallet Check */}
                    {!selectedAccount && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="text-sm text-[#003399]">
                            Please connect your wallet to submit the next step
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4 border-t">
                      <button
                        type="submit"
                        disabled={submittingStep || !selectedAccount}
                        className="w-full px-4 py-3 bg-[#003399] hover:bg-[#002266] text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingStep ? 'Submitting...' : 'Submit Next Step'}
                      </button>
                      <p className="text-xs text-gray-500 text-center mt-3">
                        This will merge your data with previous steps, sign it with your wallet, and submit to the blockchain.
                      </p>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No next step schema available</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

