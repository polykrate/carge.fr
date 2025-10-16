import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { showError, toastTx } from '../lib/toast';
import { quickSignSchema, validate, formatValidationErrors } from '../lib/validation';
import {
  waitForPolkadot,
  connectToApi,
  getWalletSigner,
  signContentHash,
  calculateWrappedHash,
  submitCryptoTrail,
  handleTransactionResult
} from '../lib/core/blockchain-utils.js';

export const QuickSign = () => {
  const { t } = useTranslation();
  const { substrateClient, selectedAccount } = useApp();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileHash, setFileHash] = useState('');
  const [signing, setSigning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    try {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
      setResult(null);

      // Read file
      console.log('Reading file:', selectedFile.name);
      const text = await selectedFile.text();
      
      let contentToHash = text;
      
      // Try to parse as JSON proof first
      try {
        const proof = JSON.parse(text);
        
        // Check if it's a valid proof structure (has ragData field)
        if (proof.ragData) {
          console.log('Valid proof JSON detected, extracting ragData for hashing...');
          // Use the same method as ProofVerifier: JSON.stringify(proof.ragData)
          contentToHash = JSON.stringify(proof.ragData);
          console.log('Hashing ragData using JSON.stringify (same as ProofVerifier)');
        } else {
          // JSON but not a proof structure - hash the whole file
          console.log('JSON file but not a proof structure, hashing full content...');
        }
      } catch {
        // Not JSON - hash the raw file content
        console.log('Not JSON, hashing file content as-is...');
      }
      
      // Calculate SHA-256 hash of the content
      const encoder = new TextEncoder();
      const data = encoder.encode(contentToHash);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setFileHash(fileHashHex);
      console.log('File hash calculated:', fileHashHex);
      console.log('Hash length:', hashArray.length, 'bytes');
    } catch (err) {
      console.error('File processing error:', err);
      setError(err.message || 'Failed to process file');
    }
  };

  const handleSign = async () => {
    // Validation with Zod
    const validation = validate(quickSignSchema, {
      file: file,
      account: selectedAccount,
    });

    if (!validation.success) {
      const errorMessage = formatValidationErrors(validation.errors);
      showError(errorMessage);
      setError(errorMessage);
      return;
    }

    const toastId = toastTx.signing();
    let api = null;

    try {
      setSigning(true);
      setError(null);
      setResult(null);

      console.log('Starting signature process...');
      console.log('Content hash:', fileHash);
      console.log('Signer account:', selectedAccount);

      // Wait for Polkadot.js to be ready
      await waitForPolkadot();

      // Create API connection
      api = await connectToApi(substrateClient.rpcUrl);

      // Get wallet signer
      const injector = await getWalletSigner(selectedAccount);
      
      // Sign the file hash
      const signature = await signContentHash(injector.signer, selectedAccount, fileHash);
      
      // Calculate the wrapped message hash for display
      const wrappedMessageHash = await calculateWrappedHash(fileHash);
      
      // Verify the signature locally
      if (window.polkadotUtilCrypto) {
        const { signatureVerify } = window.polkadotUtilCrypto;
        const verified = signatureVerify(fileHash, signature, selectedAccount);
        console.log('Local signature verification:', verified.isValid ? 'VALID' : 'INVALID');
      }
      
      // Update toast to broadcasting
      toastTx.broadcasting(toastId);
      
      // The contentHash stored on-chain is the fileHash
      const contentHash = fileHash;

      // Submit crypto trail transaction
      const unsub = await submitCryptoTrail({
        api,
        accountAddress: selectedAccount,
        signer: injector.signer,
        contentHash,
        signature,
        onStatusChange: (result) => {
          // Handle transaction errors
          const error = handleTransactionResult(result, api);
          if (error) {
            toastTx.error(error.message, toastId);
            setError(error.message);
            setSigning(false);
            unsub();
            api.disconnect();
            return;
          }
          
          // Handle success (transaction in block)
          if (result.status.isInBlock) {
            console.log('Transaction included in block:', result.status.asInBlock.toHex());
            console.log('Events:', result.events.map(e => e.event.method).join(', '));
            
            setResult({
              success: true,
              blockHash: result.status.asInBlock.toHex(),
              contentHash: contentHash,
              wrappedMessageHash: wrappedMessageHash,
              fileName: fileName,
              signer: selectedAccount
            });
            
            toastTx.success('Crypto trail created successfully!', toastId);
            setSigning(false);
            unsub();
            api.disconnect();
          } else if (result.status.isFinalized) {
            console.log('Transaction finalized in block:', result.status.asFinalized.toHex());
          } else if (result.status.isInvalid || result.status.isDropped || result.status.isUsurped) {
            console.error('Transaction invalid/dropped/usurped');
            const errorMsg = `Transaction ${result.status.type}`;
            toastTx.error(errorMsg, toastId);
            setError(errorMsg);
            setSigning(false);
            unsub();
            api.disconnect();
          }
        }
      });

    } catch (err) {
      console.error('Signature error:', err);
      const errorMsg = err.message || 'Failed to sign and submit';
      toastTx.error(errorMsg, toastId);
      setError(errorMsg);
      setSigning(false);
      
      // Cleanup API connection on error
      if (api) {
        api.disconnect();
      }
    }
  };

  const resetForm = () => {
    setFile(null);
    setFileName('');
    setFileHash('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-light mb-4">{t('quickSign.title')}</h1>
      <p className="text-gray-600 mb-8">
        {t('quickSign.description')}
      </p>

      {/* How Identity Linking Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-[#003399] mb-6">{t('quickSign.howItWorksTitle')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('quickSign.step1Title')}</h3>
            <p className="text-sm text-gray-700 text-justify">{t('quickSign.step1Desc')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('quickSign.step2Title')}</h3>
            <p className="text-sm text-gray-700 text-justify">{t('quickSign.step2Desc')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('quickSign.step3Title')}</h3>
            <p className="text-sm text-gray-700 text-justify">{t('quickSign.step3Desc')}</p>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">{t('quickSign.selectFile')}</h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition">
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={signing}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-700 font-medium mb-2">{t('verify.dragDrop')}</p>
            <p className="text-sm text-gray-500">{t('quickSign.anyFileType')}</p>
          </label>
        </div>

        {/* File Info */}
        {fileName && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="font-medium text-sm">{fileName}</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    Hash: {fileHash.substring(0, 20)}...{fileHash.substring(fileHash.length - 10)}
                  </div>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition"
                disabled={signing}
              >
                {t('quickSign.change')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Check */}
      {!selectedAccount && fileName && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-[#003399]">
              {t('quickSign.connectWallet')}
            </div>
          </div>
        </div>
      )}

      {/* Sign Button */}
      {fileName && selectedAccount && !result && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <button
            onClick={handleSign}
            disabled={signing}
            className="w-full px-6 py-4 bg-[#003399] hover:bg-[#002266] text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signing ? t('quickSign.signing') : t('quickSign.signButton')}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            {t('quickSign.signDesc')}
          </p>
        </div>
      )}

      {/* Signing Status */}
      {signing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <div className="font-medium text-blue-900">{t('quickSign.signing')}</div>
              <div className="text-sm text-blue-700">{t('quickSign.confirmWallet')}</div>
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
              <div className="font-medium text-red-900">Signature Failed</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && result.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-medium text-lg text-green-900">File Signed Successfully!</div>
              <div className="text-sm text-green-700">Crypto trail created on blockchain</div>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-lg p-4">
            <h3 className="font-medium mb-3">Signature Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="text-gray-500 w-32">File:</span>
                <span className="font-medium break-all">{result.fileName}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Content Hash:</span>
                <span className="font-mono text-xs break-all">{result.contentHash}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Wrapped Hash:</span>
                <span className="font-mono text-xs break-all">{result.wrappedMessageHash}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Signer:</span>
                <span className="font-mono text-xs break-all">{result.signer}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-32">Block Hash:</span>
                <span className="font-mono text-xs break-all">{result.blockHash}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              The wrapped hash is what was actually signed (SHA256 of &lt;Bytes&gt;contentHash&lt;/Bytes&gt;)
            </p>
          </div>

          <button
            onClick={resetForm}
            className="w-full mt-4 px-4 py-2 bg-[#003399] hover:bg-[#002266] text-white rounded-lg transition font-medium"
          >
            Sign Another File
          </button>
        </div>
      )}
    </div>
  );
};

