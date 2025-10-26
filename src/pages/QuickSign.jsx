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
      
      // Calculate blake2-256 hash of the content (Substrate-compatible)
      const { blake2AsU8a } = await import('@polkadot/util-crypto');
      
      const encoder = new TextEncoder();
      const data = encoder.encode(contentToHash);
      const hashArray = blake2AsU8a(data, 256);
      const fileHashHex = '0x' + Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
      
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
    <>
      {/* Compact Header */}
      <section className="bg-gradient-to-r from-[#003399] to-blue-700 py-8 shadow-md">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {t('quickSign.title')}
            </h1>
          </div>
          <p className="text-blue-100 text-lg">
            {t('quickSign.description')}
          </p>
        </div>
      </section>

      {/* Key Benefits */}
      <div className="bg-gray-50 py-8 border-b border-gray-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#003399] transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-[#003399] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t('quickSign.step1Title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t('quickSign.step1Desc')}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#003399] transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-[#003399] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t('quickSign.step2Title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t('quickSign.step2Desc')}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#003399] transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-[#003399] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t('quickSign.step3Title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t('quickSign.step3Desc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">

        {/* File Upload */}
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#003399] to-blue-700 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('quickSign.selectFile')}</h2>
              <p className="text-sm text-gray-600">Upload any file to sign</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-[#003399] hover:bg-gray-50 transition-all">
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={signing}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">{t('verify.dragDrop')}</p>
              <p className="text-sm text-gray-500">{t('quickSign.anyFileType')}</p>
            </label>
          </div>

          {/* File Info */}
          {fileName && (
            <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 mb-1">{fileName}</div>
                    <div className="text-xs text-gray-600 font-mono bg-white px-3 py-2 rounded-lg break-all border border-gray-200">
                      <span className="font-semibold">Hash:</span> {fileHash.substring(0, 20)}...{fileHash.substring(fileHash.length - 10)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="ml-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition border border-gray-300 hover:border-gray-400"
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
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-orange-900 mb-1">Wallet Required</h4>
                <p className="text-sm text-orange-800">{t('quickSign.connectWallet')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sign Button */}
        {fileName && selectedAccount && !result && (
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 mb-6">
            <button
              onClick={handleSign}
              disabled={signing}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#003399] to-blue-700 hover:from-[#002266] hover:to-blue-800 text-white rounded-xl transition-all font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
            >
              {signing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('quickSign.signing')}
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  {t('quickSign.signButton')}
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-3 flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('quickSign.signDesc')}
            </p>
          </div>
        )}

        {/* Signing Status */}
        {signing && (
          <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold text-blue-900 text-lg mb-1">{t('quickSign.signing')}</div>
                <div className="text-sm text-blue-700">{t('quickSign.confirmWallet')}</div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold text-red-900 text-lg mb-1">Signature Failed</div>
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && result.success && (
          <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-8 shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold text-2xl text-green-900 mb-1">File Signed Successfully!</div>
                <div className="text-sm text-green-700">Crypto trail created on blockchain</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Signature Details
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">File</span>
                  <div className="font-bold text-gray-900 mt-1 break-all">{result.fileName}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Content Hash</span>
                  <div className="font-mono text-xs text-gray-700 mt-1 break-all">{result.contentHash}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Wrapped Hash</span>
                  <div className="font-mono text-xs text-gray-700 mt-1 break-all">{result.wrappedMessageHash}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Signer</span>
                  <div className="font-mono text-xs text-gray-700 mt-1 break-all">{result.signer}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Block Hash</span>
                  <div className="font-mono text-xs text-gray-700 mt-1 break-all">{result.blockHash}</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-900 flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>The wrapped hash is what was actually signed (SHA256 of &lt;Bytes&gt;contentHash&lt;/Bytes&gt;)</span>
                </p>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-[#003399] to-blue-700 hover:from-[#002266] hover:to-blue-800 text-white rounded-xl transition-all font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Sign Another File
            </button>
          </div>
        )}
      </div>
    </>
  );
};

