import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { u8aToHex } from '@polkadot/util';
import { showError, showSuccess, toastTx } from '../lib/toast';
import { quickSignSchema, validate, formatValidationErrors } from '../lib/validation';

export const QuickSign = () => {
  const { substrateClient, selectedAccount, walletConnector } = useApp();
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

      // Read and hash file
      console.log('📂 Reading file:', selectedFile.name);
      const text = await selectedFile.text();
      
      // Calculate SHA-256 hash of file content
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
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
      console.log('Connecting to Substrate API...');
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const wsProvider = new WsProvider(substrateClient.rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://'));
      const api = await ApiPromise.create({ provider: wsProvider });
      
      console.log('API connected');

      // Get the injector from the selected account
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(selectedAccount);
      
      if (!injector || !injector.signer) {
        throw new Error('Failed to get wallet signer');
      }

      // Get signer for transaction signing (not for content signing)
      const signer = injector.signer;
      
      // IMPORTANT: In browser with Polkadot.js extension, we can't replicate account.sign()
      // directly. The extension's signRaw wraps messages in "<Bytes>...</Bytes>" which changes
      // what gets signed. Instead, we need to use the Polkadot API to sign properly.
      
      console.log('Preparing to sign content hash...');
      console.log('Content hash:', fileHash);
      
      // Import SignerPayloadRaw and signRaw utilities
      const { signatureVerify, cryptoWaitReady } = await import('@polkadot/util-crypto');
      await cryptoWaitReady();
      
      // Sign the file hash with the wallet
      // The extension will wrap it as: <Bytes>0x...fileHash...</Bytes> before signing
      console.log('Signing file hash:', fileHash);
      
      const signResult = await signer.signRaw({
        address: selectedAccount,
        data: fileHash,
        type: 'bytes'
      });

      const signature = signResult.signature;
      console.log('Signature obtained:', signature);
      console.log('Signature length:', signature.length, 'chars (includes 0x prefix)');
      
      // Update toast to broadcasting
      toastTx.broadcasting(toastId);
      
      // Calculate the wrapped message hash for display (what was actually signed)
      const { stringToU8a, u8aToHex, hexToU8a } = await import('@polkadot/util');
      const fileHashBytes = hexToU8a(fileHash);
      const wrappedMessage = new Uint8Array([
        ...stringToU8a('<Bytes>'),
        ...fileHashBytes,
        ...stringToU8a('</Bytes>')
      ]);
      const wrappedHashBuffer = await crypto.subtle.digest('SHA-256', wrappedMessage);
      const wrappedHashArray = Array.from(new Uint8Array(wrappedHashBuffer));
      const wrappedMessageHash = '0x' + wrappedHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Verify the signature locally
      const verified = signatureVerify(fileHash, signature, selectedAccount);
      console.log('Local signature verification:', verified.isValid ? 'VALID' : 'INVALID');
      
      // The contentHash stored on-chain is the fileHash
      // The pallet will reconstruct the wrapped message for verification
      const contentHash = fileHash;

      // For Quick Sign, we don't encrypt or store on IPFS
      // We just create a trail with the hash
      const emptyHex = '0x' + '00'.repeat(52); // 52 bytes for encryptedCid
      const emptyPubkey = '0x' + '00'.repeat(32); // 32 bytes for ephemeral pubkey
      const emptyNonce = '0x' + '00'.repeat(12); // 12 bytes for nonces

      console.log('Submitting crypto trail to blockchain...');
      console.log('Transaction parameters:');
      console.log('  - contentHash (file hash):', contentHash);
      console.log('  - signature:', signature);
      console.log('  - account:', selectedAccount);
      console.log('  - note: pallet will reconstruct wrapped message for verification');
      
      // Create and submit transaction
      const tx = api.tx.cryptoTrail.storeTrail(
        emptyHex,        // encryptedCid (empty for quick sign)
        emptyPubkey,     // ephemeralPubkey (empty)
        emptyNonce,      // cidNonce (empty)
        emptyNonce,      // contentNonce (empty)
        contentHash,     // contentHash (hash of wrapped message)
        signature        // signature
      );

      // Sign and send transaction
      console.log('Transaction created, awaiting signature...');
      
      const unsub = await tx.signAndSend(selectedAccount, { signer }, (result) => {
        console.log('Transaction status:', result.status.type);
        console.log('Full result:', {
          status: result.status.toHuman(),
          events: result.events?.length || 0,
          dispatchError: result.dispatchError?.toHuman()
        });
        
        // Check for errors
        if (result.dispatchError) {
          let errorMessage = 'Transaction failed';
          
          if (result.dispatchError.isModule) {
            // Module error
            const decoded = api.registry.findMetaError(result.dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
            console.error('Module error:', errorMessage);
          } else {
            // Other error
            errorMessage = result.dispatchError.toString();
            console.error('Dispatch error:', errorMessage);
          }
          
          toastTx.error(errorMessage, toastId);
          setError(errorMessage);
          setSigning(false);
          unsub();
          api.disconnect();
          return;
        }
        
        if (result.status.isInBlock) {
          console.log('Transaction included in block:', result.status.asInBlock.toHex());
          console.log('Events:', result.events.map(e => e.event.method).join(', '));
          
          setResult({
            success: true,
            blockHash: result.status.asInBlock.toHex(),
            contentHash: contentHash,  // File hash
            wrappedMessageHash: wrappedMessageHash,  // Hash of wrapped message
            fileName: fileName,
            signer: selectedAccount
          });
          
          toastTx.success('Crypto trail created successfully!', toastId);
          setSigning(false);
          unsub();
          
          // Disconnect API
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
      });

    } catch (err) {
      console.error('Signature error:', err);
      const errorMsg = err.message || 'Failed to sign and submit';
      toastTx.error(errorMsg, toastId);
      setError(errorMsg);
      setSigning(false);
    }
  };

  const waitForPolkadot = async () => {
    while (!window.polkadotUtil || !window.polkadotUtilCrypto) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await window.polkadotUtilCrypto.cryptoWaitReady();
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
      <h1 className="text-4xl font-light mb-4">Quick Sign</h1>
      <p className="text-gray-600 mb-12">
        Quickly sign any file and create a cryptographic trail on the blockchain. 
        Perfect for timestamping documents, files, or any content.
      </p>

      {/* File Upload */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">Select File to Sign</h2>

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
            <p className="text-gray-700 font-medium mb-2">Drop file here or click to browse</p>
            <p className="text-sm text-gray-500">Any file type accepted</p>
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
                Change
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Check */}
      {!selectedAccount && fileName && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-yellow-800">
              Please connect your wallet to sign this file
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
            className="w-full px-6 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signing ? 'Signing and submitting to blockchain...' : 'Sign & Create Crypto Trail'}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            This will sign the file hash with your wallet and create a permanent record on the blockchain
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
              <div className="font-medium text-blue-900">Signing transaction...</div>
              <div className="text-sm text-blue-700">Please confirm in your wallet and wait for blockchain confirmation</div>
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
            className="w-full mt-4 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition font-medium"
          >
            Sign Another File
          </button>
        </div>
      )}
    </div>
  );
};

