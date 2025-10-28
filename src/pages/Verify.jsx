import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ProofVerifier } from '../lib/core/proof-verifier.js';
import { RagClient } from '../lib/core/rag-client.js';
import { FormGenerator } from '../lib/core/form-generator.js';
import { DeliverableDisplay } from '../components/DeliverableDisplay';
import { showError, showSuccess, showLoading, dismiss, update, toastTx } from '../lib/toast';
import {
  waitForPolkadot,
  connectToApi,
  submitRagWorkflowStep,
  handleTransactionResult,
  downloadProofFile
} from '../lib/core/blockchain-utils.js';

// QR Code Scanner Component
const QRCodeScanner = ({ onScan, scanning, setScanning, verifying, autoStart = false }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const autoStartedRef = useRef(false);

  const startScanning = async () => {
    try {
      setScanning(true);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          // Start scanning loop
          scanIntervalRef.current = setInterval(scanQRCode, 300);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      showError('Unable to access camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    // Stop scanning loop
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      try {
        // Use jsQR to decode
        const { default: jsQR } = await import('jsqr');
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          console.log('QR Code detected:', code.data);
          stopScanning();
          onScan(code.data);
        }
      } catch (err) {
        console.error('QR scan error:', err);
      }
    }
  };

  // Auto-start camera if autoStart is true
  useEffect(() => {
    if (autoStart && !scanning && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startScanning();
    }
  }, [autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop scanning loop
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      
      // Stop video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {!scanning ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <p className="text-gray-700 font-medium mb-2">Scan a QR Code</p>
          <p className="text-sm text-gray-500 mb-4">
            Position the QR code within the camera frame
          </p>
          <button
            onClick={startScanning}
            disabled={verifying}
            className="px-6 py-3 bg-[#003399] hover:bg-[#002266] text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Camera
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-auto"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-[#003399] rounded-lg w-64 h-64 opacity-75">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={stopScanning}
              disabled={verifying}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-medium disabled:opacity-50"
            >
              Stop Camera
            </button>
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            Scanning for QR code...
          </p>
        </div>
      )}
    </div>
  );
};

export const Verify = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { substrateClient, ipfsClient, selectedAccount } = useApp();
  const [mode, setMode] = useState('file'); // 'file', 'json', or 'qr'
  const [jsonInput, setJsonInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [proofData, setProofData] = useState(null); // Store the proof data for workflow continuation
  const [workflowHistory, setWorkflowHistory] = useState(null); // Store reconstructed workflow history
  const [expandedSteps, setExpandedSteps] = useState({}); // Track which steps are expanded
  const [isProofDetailsExpanded, setIsProofDetailsExpanded] = useState(false); // Accordion state for proof details
  const [verifyingChainOfTrust, setVerifyingChainOfTrust] = useState(false); // Track chain of trust verification
  const [blockTimestamps, setBlockTimestamps] = useState({}); // Cache for block timestamps
  const [chronologicalOrderValid, setChronologicalOrderValid] = useState(null); // Track chronological order validation
  const [showHowItWorks, setShowHowItWorks] = useState(false); // Show/hide explanations
  
  // Product QR verification states
  const [showProductQRScanner, setShowProductQRScanner] = useState(false);
  const [scanningProductQR, setScanningProductQR] = useState(false);
  const [productQRResult, setProductQRResult] = useState(null);
  const [firstStepHash, setFirstStepHash] = useState(null); // Store first step hash for product verification
  
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
  
  // Helper function to extract step identity (first meaningful field)
  const extractStepIdentity = (stepData, stepKey) => {
    if (!stepData || typeof stepData !== 'object') return null;
    
    // Priority fields for identity extraction (v5 with first field naming)
    const identityFields = [
      'producerName',      // production step
      'distributorName',   // nationalDistribution step
      'importerName',      // import1 and import2 steps
      'exporterName',      // export step
      'retailerName',      // retail step
      'consumerName',      // consumer step
      'distilleryName',    // legacy compatibility
      'companyName',
      'organizationName',
      'name',
      'supplier',
      'manufacturer'
    ];
    
    // Try to find a matching identity field
    for (const field of identityFields) {
      if (stepData[field]) {
        return stepData[field];
      }
    }
    
    // Fallback: return first non-technical string field
    for (const [key, value] of Object.entries(stepData)) {
      if (typeof value === 'string' && 
          !key.startsWith('_') && 
          !key.toLowerCase().includes('date') &&
          !key.toLowerCase().includes('notes') &&
          !key.toLowerCase().includes('number') &&
          !key.toLowerCase().includes('certificate') &&
          value.length > 3 && value.length < 100) {
        return value;
      }
    }
    
    return 'Unknown';
  };
  
  // Helper function to format step function name (from key)
  const formatStepFunction = (stepKey) => {
    if (!stepKey) return 'Unknown';
    
    // Convert camelCase or snake_case to Title Case with spaces
    return stepKey
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/\d+/g, '') // Remove numbers (like import1 -> import)
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Helper function to truncate text with ellipsis
  const truncateText = (text, maxLength = 30) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    
    try {
      const date = new Date(timestamp);
      
      // Format: "Oct 26, 11:14 AM"
      const options = {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      
      return date.toLocaleString('en-US', options);
    } catch (err) {
      console.error('Failed to format timestamp:', err);
      return null;
    }
  };
  
  // Helper function to format duration between two timestamps
  const formatDuration = (startTimestamp, endTimestamp) => {
    if (!startTimestamp || !endTimestamp) return null;
    
    const diffMs = endTimestamp - startTimestamp;
    
    if (diffMs < 0) return null; // Invalid duration
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      const hours = diffHours % 24;
      return `${diffDays}d ${hours}h`;
    } else if (diffHours > 0) {
      const minutes = diffMinutes % 60;
      return `${diffHours}h ${minutes}m`;
    } else if (diffMinutes > 0) {
      const seconds = diffSeconds % 60;
      return `${diffMinutes}m ${seconds}s`;
    } else {
      return `${diffSeconds}s`;
    }
  };
  
  // Load block timestamp for a given block number
  const loadBlockTimestamp = async (blockNumber) => {
    // Check cache first
    if (blockTimestamps[blockNumber]) {
      return blockTimestamps[blockNumber];
    }
    
    try {
      const timestamp = await substrateClient.getBlockTimestamp(blockNumber);
      if (timestamp) {
        setBlockTimestamps(prev => ({ ...prev, [blockNumber]: timestamp }));
        return timestamp;
      }
    } catch (err) {
      console.error('Failed to load timestamp for block', blockNumber, err);
    }
    
    return null;
  };
  
  // Verify chronological order of steps
  const verifyChronologicalOrder = async (history) => {
    if (!history || history.length < 2) {
      return true; // Single step or no steps, order is valid
    }
    
    console.log('🕐 Verifying chronological order of steps...');
    
    // Load all timestamps first
    const timestampsPromises = history.map(step => {
      if (step.blockchainData?.createdAt) {
        return loadBlockTimestamp(step.blockchainData.createdAt);
      }
      return Promise.resolve(null);
    });
    
    const timestamps = await Promise.all(timestampsPromises);
    
    // Check if all timestamps are in ascending order
    for (let i = 1; i < timestamps.length; i++) {
      const prevTimestamp = timestamps[i - 1];
      const currentTimestamp = timestamps[i];
      
      if (!prevTimestamp || !currentTimestamp) {
        console.warn(`⚠️ Missing timestamp for step ${i - 1} or ${i}`);
        continue; // Skip if timestamps are not available
      }
      
      if (currentTimestamp < prevTimestamp) {
        console.error(`❌ Chronological order violation: Step ${i} (${new Date(currentTimestamp).toISOString()}) is before Step ${i - 1} (${new Date(prevTimestamp).toISOString()})`);
        return false;
      }
      
      console.log(`  ✓ Step ${i - 1} → Step ${i}: ${new Date(prevTimestamp).toISOString()} → ${new Date(currentTimestamp).toISOString()}`);
    }
    
    console.log('✅ All steps are in chronological order');
    return true;
  };
  
  // Load timestamps for all steps in the workflow history and verify chronological order
  useEffect(() => {
    if (workflowHistory && workflowHistory.history) {
      // Load timestamps for all steps and verify chronological order
      const verifyOrder = async () => {
        const isValid = await verifyChronologicalOrder(workflowHistory.history);
        setChronologicalOrderValid(isValid);
        
        // Update result if chronological order is invalid
        if (!isValid) {
          setResult(prev => ({
            ...prev,
            isValid: false,
            message: 'Proof found on blockchain with valid signature, but steps are NOT in chronological order!',
            chronologicalOrderValid: false
          }));
        }
      };
      
      verifyOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowHistory]);
  
  // Example proof JSON - Macallan 25 Years Workflow V5 (7 steps: Production → Consumer)
  // Real executed workflow with proof hash: 0xd865ea4852dc632c9d31e7e82751d6c334057621cb4559b48f093af6bd598691
  const exampleProof = {
    "ragData": {
      "ragHash": "0x8a8874f71768ad02a5d2ce15af202135becfd9aa455a2c41a22e0214bc5c36e8",
      "stepHash": "0xaef9ea84831037c3e7f78f10cee4a6fb21ecb5261ecfffc8042e9afe201f7d6c",
      "livrable": {
        "production": {
          "producerName": "The Macallan Distillery",
          "spiritType": "whisky",
          "productName": "The Macallan 25 Year Old Sherry Oak",
          "batchNumber": "B47",
          "bottleNumberRange": "1-2400",
          "totalBottlesProduced": 2400,
          "distillationYear": 1999,
          "bottlingYear": 2024,
          "ageYears": 25,
          "volumePerBottle": 0.7,
          "alcoholPercentage": 43,
          "distillationLocation": "Easter Elchies, Craigellachie, Speyside, Scotland",
          "caskType": "Hand-picked Sherry Oak Casks",
          "caskOrigin": "Jerez, Spain",
          "colorDescription": "Deep mahogany with rich amber highlights",
          "qrCodeApplied": true,
          "certifications": ["Scotch Whisky Association", "Protected Geographical Indication"],
          "productionNotes": "25 years maturation in Scottish Speyside. Hand-picked sherry oak casks from Jerez, Spain. Only 2,400 bottles produced in this exclusive batch.",
          "_targetAddress": "5DXBoe8maXbydrgqiKX1PCY9PS19Kfaq59vrroiXp4se7MgU"
        },
        "nationalDistribution": {
          "distributorName": "Edrington UK - Official Guardian",
          "transferDate": "2024-02-15",
          "fromEntity": "The Macallan Distillery",
          "batchNumber": "B47",
          "bottleNumberRange": "1-2400",
          "bottlesInLot": 2400,
          "volumeTotal": 1680,
          "storageConditions": "High-security vault, 16°C climate control, 24/7 monitoring ensures perfect conditions",
          "qualityCheck": "conforme",
          "qualityInspection": "Each bottle inspected before distribution. All seals intact, labels perfect, no damage detected.",
          "transportMethod": "Secured truck with GPS tracking, direct delivery from distillery to vault",
          "customsDocLicense": "UK-SPIRITS-2024-B47",
          "transferNotes": "Complete batch B47 received and secured in climate-controlled vault. Ready for international distribution selection.",
          "_targetAddress": "5DXBoe8maXbydrgqiKX1PCY9PS19Kfaq59vrroiXp4se7MgU"
        },
        "import1": {
          "batchNumber": "B47",
          "bottleNumberRange": "1-500",
          "storageConditions": "Temperature-controlled warehouse, 18°C, humidity 65%, preparing for Asian premium market",
          "authenticityVerified": true,
          "importerName": "La Maison du Whisky, Paris",
          "destinationCountry": "France",
          "originCountry": "United Kingdom",
          "bottlesInLot": 500,
          "fromEntity": "Edrington UK - Official Guardian",
          "originCertificate": "UK-SPIRITS-ORIGIN-B47-2024",
          "qualityCheck": "conforme",
          "importLicense": "FR-IMPORT-2024-WHISKY-500",
          "transferDate": "2024-03-10",
          "transferNotes": "500 bottles selected for French market and Asia distribution. Full customs clearance completed. Authenticity certificate verified.",
          "transportMethod": "Temperature-controlled truck Paris route with GPS tracking",
          "volumeTotal": 350,
          "_targetAddress": "5DXBoe8maXbydrgqiKX1PCY9PS19Kfaq59vrroiXp4se7MgU"
        },
        "export": {
          "batchNumber": "B47",
          "bottleNumberRange": "1-150",
          "volumeTotal": 105,
          "exporterName": "Golden Dragon Spirits - Premium Asian Import",
          "bottlesInLot": 150,
          "fromEntity": "La Maison du Whisky, Paris",
          "insuranceCurrency": "EUR",
          "transferDate": "2024-04-05",
          "customsDeclaration": "EU-CUSTOMS-SPIRITS-B47-150",
          "originCountry": "France",
          "transferNotes": "150 bottles chosen for Chinese collectors market. Air cargo Paris to Hong Kong with GPS tracking. €180,000 insurance coverage. Climate-controlled secured container throughout journey.",
          "airWaybill": "AF-AWB-2024-0405-MAC25",
          "gpsTracking": true,
          "finalDestinationCountry": "China",
          "transportMethod": "Air cargo Paris → Hong Kong, GPS tracked. Flight AF129. ETA 24 hours",
          "qualityCheck": "conforme",
          "exportLicense": "FR-EXP-SPIRITS-2024-0405",
          "insuranceValue": 180000,
          "storageConditions": "Climate 18°C maintained during transport, secured container",
          "_targetAddress": "5DXBoe8maXbydrgqiKX1PCY9PS19Kfaq59vrroiXp4se7MgU"
        },
        "import2": {
          "gaccCertificate": "GACC-HEALTH-CERT-2024-0420-SPIRITS",
          "qrBlockchainVerified": true,
          "batchNumber": "B47",
          "bottleNumberRange": "1-150",
          "bilingualLabeling": true,
          "volumeTotal": 105,
          "bottlesInLot": 150,
          "fromEntity": "Golden Dragon Spirits - Premium Asian Import",
          "destinationCountry": "China",
          "transferDate": "2024-04-20",
          "transferNotes": "Chinese customs cleared. GACC health certificate obtained. Bilingual labels applied (EN/CN). All 150 bottles QR-verified on blockchain. Stored in Shanghai free trade zone bonded warehouse.",
          "transportMethod": "Secured ground transport Hong Kong to Shanghai bonded zone",
          "qualityCheck": "conforme",
          "importerName": "Shanghai Premium Imports",
          "importLicense": "CN-IMPORT-SPIRITS-2024-SH-B47",
          "labelingLanguages": ["EN", "CN"],
          "storageConditions": "Free trade zone bonded warehouse, 18°C, 65% humidity",
          "healthCertificate": "CN-HEALTH-SPIRITS-2024-B47-150",
          "_targetAddress": "5DXBoe8maXbydrgqiKX1PCY9PS19Kfaq59vrroiXp4se7MgU"
        },
        "retail": {
          "volumeUnit": 0.7,
          "blockchainVerified": true,
          "retailerName": "Emperor's Cellar - Ultra-Premium Specialist",
          "fromEntity": "Shanghai Premium Imports",
          "batchNumber": "B47",
          "bottleNumber": "92",
          "transferDate": "2024-05-05",
          "retailCurrency": "CNY",
          "vipServicesIncluded": true,
          "retailPriceEUR": 3600,
          "transferNotes": "Ultra-premium specialist receives bottle 92 from batch B47. Climate cellar 18°C, 65% humidity. Blockchain verification shows complete provenance Scotland → Shanghai. Price: ¥28,800 (~€3,600). VIP services included.",
          "transportMethod": "White-glove secured delivery to premium retail cellar",
          "provenanceVerified": "Complete provenance verified: Scotland → UK → France → Hong Kong → Shanghai. All 5 transfers cryptographically signed on blockchain.",
          "qualityCheck": "conforme",
          "storageConditions": "Climate cellar 18°C, 65% humidity, high-security display, VIP tasting room",
          "retailPrice": 28800,
          "_targetAddress": "5DXBoe8maXbydrgqiKX1PCY9PS19Kfaq59vrroiXp4se7MgU"
        },
        "consumer": {
          "consumerRating": 5,
          "purchaseDate": "2024-10-15",
          "finalDestination": "Private collection, Shanghai penthouse",
          "bottleNumber": "92",
          "consumerType": "collectionneur",
          "purchaseLocation": "Shanghai, China",
          "batchNumber": "B47",
          "purchaseCurrency": "CNY",
          "tastingNotes": "Rich dried fruits, sherry sweetness, oak complexity, dark chocolate, hint of spice. Smooth finish with lingering warmth.",
          "fromEntity": "Emperor's Cellar - Ultra-Premium Specialist",
          "usage": "Collection",
          "feedback": "Simply extraordinary. The deep mahogany color promises richness, and it delivers. The sherry oak influence is sublime – dark chocolate, dried fruit, rich spices. Each sip reveals another layer. 25 years of Scottish craftsmanship in a glass. The QR blockchain verification gives me confidence in its authenticity. Worth every yuan. A true collector's piece.",
          "consumerName": "Mr. Wei Chen, Private Collector",
          "retailerName": "Emperor's Cellar - Ultra-Premium Specialist",
          "purchasePrice": 28800,
          "_targetAddress": "5DXBoe8maXbydrgqiKX1PCY9PS19Kfaq59vrroiXp4se7MgU"
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

  // Load example proof when arriving from Home page
  useEffect(() => {
    if (location.state?.loadExample) {
      console.log('Loading example proof from Home page...');
      loadExampleProof();
    }
  }, [location.state?.loadExample]);

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
      setExpandedSteps({});
      setIsProofDetailsExpanded(false);
      setVerifyingChainOfTrust(false);
      setChronologicalOrderValid(null);
      
      // Reset workflow continuation states (but keep allRags - needed for workflow detection)
      setProofData(null);
      setNextStepSchema(null);
      setWorkflowInfo(null);
      setLoadingNextStep(false);
      setSubmittingStep(false);
      
      // Reset product QR verification states
      setShowProductQRScanner(false);
      setScanningProductQR(false);
      setProductQRResult(null);
      setFirstStepHash(null);

      console.log('Processing file:', file.name);
      
      // Check if it's an image file
      if (file.type.startsWith('image/')) {
        console.log('Image file detected, scanning for QR code...');
        dismiss(toastId);
        const qrToastId = showLoading('Scanning QR code from image...');
        
        try {
          // Read image and decode QR code
          const qrContent = await decodeQRCodeFromImage(file);
          
          if (qrContent) {
            console.log('QR code found in image:', qrContent);
            dismiss(qrToastId);
            await handleQRScan(qrContent);
          } else {
            console.log('No QR code found in image, hashing image content...');
            dismiss(qrToastId);
            const text = await file.text();
            await verifyFileHash(text, file.name, showLoading('Hashing file...'));
          }
        } catch (err) {
          console.error('Failed to scan QR from image:', err);
          dismiss(qrToastId);
          showError('Failed to scan QR code from image');
          throw err;
        }
        return;
      }
      
      // Not an image - process as text/JSON
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

  // Helper function to decode QR code from an image file
  const decodeQRCodeFromImage = async (imageFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const img = new Image();
          
          img.onload = async () => {
            // Create canvas to draw image
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            
            // Get image data
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Decode QR code
            const { default: jsQR } = await import('jsqr');
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              console.log('✓ QR code decoded from image:', code.data);
              resolve(code.data);
            } else {
              console.log('✗ No QR code found in image');
              resolve(null);
            }
          };
          
          img.onerror = () => {
            reject(new Error('Failed to load image'));
          };
          
          img.src = event.target.result;
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      
      reader.readAsDataURL(imageFile);
    });
  };

  const handleJsonSubmit = async (e) => {
    e.preventDefault();
    
    const toastId = showLoading('Verifying proof...');
    
    try {
      setVerifying(true);
      setError(null);
      setResult(null);
      setWorkflowHistory(null);
      setExpandedSteps({});
      setIsProofDetailsExpanded(false);
      setVerifyingChainOfTrust(false);
      setChronologicalOrderValid(null);
      
      // Reset workflow continuation states (but keep allRags - needed for workflow detection)
      setProofData(null);
      setNextStepSchema(null);
      setWorkflowInfo(null);
      setLoadingNextStep(false);
      setSubmittingStep(false);
      
      // Reset product QR verification states
      setShowProductQRScanner(false);
      setScanningProductQR(false);
      setProductQRResult(null);
      setFirstStepHash(null);

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
    let isChainOfTrustNonVerifiable = false;
    let isValidWithChainOfTrust;
    let messageWithChainOfTrust;
    
    try {
      console.log('Starting proof verification...');
      
      // Step 1: Calculate hash
      update(toastId, {
        render: '🔢 Calculating proof hash...',
        type: 'info',
        isLoading: true
      });
      
      const verifier = new ProofVerifier(substrateClient);
      
      // Small delay so user can see the message
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 2: Search blockchain
      update(toastId, {
        render: 'Searching blockchain...',
        type: 'info',
        isLoading: true
      });
      
      const verification = await verifier.verifyProof(proof);
      
      console.log('Verification result:', verification);
      
      // Step 3: Check if found and verify signature
      if (verification.found) {
        update(toastId, {
          render: 'Proof found! Verifying signature...',
          type: 'info',
          isLoading: true
        });
      } else {
        // Proof not found - show error immediately
        update(toastId, {
          render: 'Proof not found on blockchain',
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
      }
      
      // Format result for display
      const signatureValid = verification.trail?.signatureValid ?? false;
      
      // Show signature result
      if (verification.found) {
        if (signatureValid) {
          await new Promise(resolve => setTimeout(resolve, 300));
          update(toastId, {
            render: 'Signature verified successfully!',
            type: 'info',
            isLoading: true
          });
        } else {
          // Signature invalid - show error immediately
          update(toastId, {
            render: 'Signature verification failed!',
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
        }
      }
      
      // Calculate wrapped message hash for display
      const { stringToU8a, hexToU8a } = await import('@polkadot/util');
      const { blake2AsU8a } = await import('@polkadot/util-crypto');
      const contentHashBytes = hexToU8a(verification.contentHash);
      const wrappedMessage = new Uint8Array([
        ...stringToU8a('<Bytes>'),
        ...contentHashBytes,
        ...stringToU8a('</Bytes>')
      ]);
      
      // Use blake2 for hashing (compatible with Substrate)
      const wrappedHashArray = blake2AsU8a(wrappedMessage, 256);
      const wrappedMessageHash = '0x' + Array.from(wrappedHashArray).map(b => b.toString(16).padStart(2, '0')).join('');
      
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
      
      // Initialize with result values (will be updated if chain of trust is checked)
      isValidWithChainOfTrust = result.isValid;
      messageWithChainOfTrust = result.message;
      
      // Store proof data for workflow continuation
      if (result.isValid && proof.ragData) {
        setProofData(proof.ragData);
      }
      
      // If proof is valid and contains workflow data, reconstruct and verify workflow history
      if (result.isValid && proof.ragData && proof.ragData.ragHash && proof.ragData.stepHash && proof.ragData.livrable) {
        console.log('Valid workflow proof detected, reconstructing history...');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Step 4: Workflow detected
        update(toastId, {
          render: 'Workflow detected! Analyzing steps...',
          type: 'info',
          isLoading: true
        });
        
        // Set intermediate state - proof found but chain of trust not verified yet
        setVerifyingChainOfTrust(true);
        
        try {
          const ragClient = new RagClient(substrateClient);
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Step 5: Reconstruct workflow
          update(toastId, {
            render: 'Reconstructing workflow history...',
            type: 'info',
            isLoading: true
          });
          
          const history = await verifier.reconstructWorkflowHistory(proof, ragClient, ipfsClient);
          setWorkflowHistory(history);
          console.log('📜 Workflow history reconstructed:', history);
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Step 6: Verify chain of trust
          update(toastId, {
            render: 'Verifying chain of trust...',
            type: 'info',
            isLoading: true
          });
          
          // Store first step hash for product QR verification (only when workflow history is available)
          if (history.history && history.history.length > 0) {
            setFirstStepHash(history.history[0].contentHash);
            console.log('💾 First step hash stored for product verification:', history.history[0].contentHash);
          }
          
          // Update result color based on chain of trust
          // If chainOfTrustValid is null (not verifiable), keep verifying state (gray)
          // If chainOfTrustValid is false (broken), mark as invalid
          // If chainOfTrustValid is true (valid), keep current isValid state
          isValidWithChainOfTrust = history.chainOfTrustValid === false ? false : result.isValid;
          messageWithChainOfTrust = history.chainOfTrustValid === false 
            ? 'Proof hash found on blockchain with valid signature, but Chain of Trust is broken!' 
            : result.message;
          
          setResult(prev => ({
            ...prev,
            chainOfTrustValid: history.chainOfTrustValid,
            chainOfTrustVerifiable: history.chainOfTrustVerifiable,
            isValid: isValidWithChainOfTrust,
            message: messageWithChainOfTrust
          }));
          
          // Track if chain of trust is not verifiable
          isChainOfTrustNonVerifiable = (history.chainOfTrustValid === null);
          
          // Only exit verifying state if chain of trust is actually verified (true or false)
          // Keep gray state if not verifiable (null)
          if (history.chainOfTrustValid !== null) {
            setVerifyingChainOfTrust(false);
          }
        } catch (err) {
          console.error('Failed to reconstruct workflow history:', err);
          // Don't fail the whole verification, just log it
          setVerifyingChainOfTrust(false);
        }
      }
      
      // Don't show success/error toasts if chain of trust is not verifiable (gray state)
      if (!isChainOfTrustNonVerifiable) {
        if (isValidWithChainOfTrust) {
          update(toastId, {
            render: 'Proof verified successfully!',
            type: 'success',
            isLoading: false,
            autoClose: 5000
          });
        } else {
          update(toastId, {
            render: messageWithChainOfTrust,
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
        }
      } else {
        // Just dismiss the toast for gray state (non-verifiable)
        update(toastId, {
          render: 'Proof verified - Chain of trust not verifiable',
          type: 'info',
          isLoading: false,
          autoClose: 5000
        });
      }
    } catch (err) {
      console.error('Verification error:', err);
      update(toastId, {
        render: err.message || 'Verification failed',
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
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

  const handleQRScan = async (qrContent) => {
    const toastId = showLoading('Processing QR code...');
    
    try {
      setVerifying(true);
      setError(null);
      setResult(null);
      setWorkflowHistory(null);
      setExpandedSteps({});
      setIsProofDetailsExpanded(false);
      setVerifyingChainOfTrust(false);
      setChronologicalOrderValid(null);
      
      // Reset workflow continuation states (but keep allRags - needed for workflow detection)
      setProofData(null);
      setNextStepSchema(null);
      setWorkflowInfo(null);
      setLoadingNextStep(false);
      setSubmittingStep(false);
      
      // Reset product QR verification states
      setShowProductQRScanner(false);
      setScanningProductQR(false);
      setProductQRResult(null);
      setFirstStepHash(null);

      console.log('QR Code scanned:', qrContent);
      
      // Check if it's a hash (starts with 0x and is 66 chars)
      if (qrContent.startsWith('0x') && qrContent.length === 66) {
        console.log('QR contains a hash, querying blockchain directly...');
        await verifyDirectHash(qrContent, toastId);
        return;
      }
      
      // Try to parse as JSON
      try {
        const proof = JSON.parse(qrContent);
        
        // Check if it's a valid proof structure (has ragData field)
        if (proof.ragData) {
          console.log('QR contains valid proof JSON, verifying...');
          await verifyProof(proof, toastId);
        } else {
          // JSON but not a proof structure - hash the content
          console.log('QR contains JSON but not a proof structure, hashing content...');
          await verifyFileHash(qrContent, 'QR Code Data', toastId);
        }
      } catch {
        // Not JSON - hash the content
        console.log('QR does not contain JSON, hashing content...');
        await verifyFileHash(qrContent, 'QR Code Data', toastId);
      }
    } catch (err) {
      console.error('QR scan error:', err);
      setError(err.message || 'Failed to process QR code');
      dismiss(toastId);
      showError(err.message || 'Failed to process QR code');
    } finally {
      setVerifying(false);
      setScanning(false);
    }
  };

  const verifyDirectHash = async (hash, toastId) => {
    try {
      console.log('Verifying hash directly:', hash);
      
      // Calculate wrapped message hash for display
      const { stringToU8a, hexToU8a } = await import('@polkadot/util');
      const { blake2AsU8a } = await import('@polkadot/util-crypto');
      const contentHashBytes = hexToU8a(hash);
      const wrappedMessage = new Uint8Array([
        ...stringToU8a('<Bytes>'),
        ...contentHashBytes,
        ...stringToU8a('</Bytes>')
      ]);
      
      // Use blake2 for hashing (compatible with Substrate)
      const wrappedHashArray = blake2AsU8a(wrappedMessage, 256);
      const wrappedMessageHash = '0x' + Array.from(wrappedHashArray).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Query blockchain for this hash
      const verifier = new ProofVerifier(substrateClient);
      const trail = await verifier.queryBlockchain(hash);
      
      if (trail) {
        const signatureValid = trail.signatureValid ?? false;
        console.log('Hash found on blockchain!');
        console.log('Signature valid:', signatureValid);
        
        const result = {
          isValid: signatureValid,
          message: signatureValid 
            ? `Hash found on blockchain with valid signature!`
            : `Hash found but signature verification failed!`,
          details: {
            contentHash: hash,
            wrappedMessageHash,
            source: 'QR Code',
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
          showSuccess('Hash verified successfully!');
        } else {
          dismiss(toastId);
          showError(result.message);
        }
      } else {
        console.log('✗ Hash not found on blockchain');
        const result = {
          isValid: false,
          message: 'Hash not found on blockchain',
          details: {
            contentHash: hash,
            wrappedMessageHash,
            source: 'QR Code',
            status: 'Not found in blockchain storage'
          }
        };
        
        setResult(result);
        dismiss(toastId);
        showError(result.message);
      }
    } catch (err) {
      console.error('Hash verification error:', err);
      throw err;
    }
  };

  const handleProductQRScan = async (qrContent) => {
    try {
      console.log('Product QR scanned:', qrContent);
      
      // Check if it's a hash (starts with 0x and is 66 chars)
      let scannedHash = qrContent.trim();
      
      if (!scannedHash.startsWith('0x')) {
        // Try to parse as JSON in case it's a proof
        try {
          const parsed = JSON.parse(scannedHash);
          if (parsed.ragData && parsed.ragData.contentHash) {
            scannedHash = parsed.ragData.contentHash;
          }
        } catch {
          // Not JSON, might be hash without 0x prefix
          scannedHash = '0x' + scannedHash.replace(/^0x/, '');
        }
      }
      
      console.log('Comparing scanned hash:', scannedHash);
      console.log('With first step hash:', firstStepHash);
      
      if (scannedHash === firstStepHash) {
        setProductQRResult({
          isValid: true,
          message: 'Product is authentic!',
          details: 'The scanned QR code matches the first step of the verified workflow. This confirms the product\'s authenticity.'
        });
        showSuccess('Product verified! QR code matches the workflow.');
      } else {
        setProductQRResult({
          isValid: false,
          message: 'Product verification failed!',
          details: 'The scanned QR code does NOT match the first step of the verified workflow. This product may be counterfeit.'
        });
        showError('Product QR does not match the workflow!');
      }
    } catch (err) {
      console.error('Product QR verification error:', err);
      setProductQRResult({
        isValid: false,
        message: 'Verification error',
        details: err.message || 'Failed to verify product QR code'
      });
      showError('Failed to verify product QR code');
    }
  };

  const verifyFileHash = async (content, filename, toastId) => {
    try {
      console.log('Verifying file hash for:', filename);
      
      // Hash the content using blake2 (Substrate-compatible)
      const { stringToU8a, hexToU8a } = await import('@polkadot/util');
      const { blake2AsU8a } = await import('@polkadot/util-crypto');
      
      const encoder = new TextEncoder();
      const contentBytes = encoder.encode(content);
      const hashArray = blake2AsU8a(contentBytes, 256);
      const contentHash = '0x' + Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log('Content hash:', contentHash);
      
      // Calculate wrapped message hash for display
      const contentHashBytes = hexToU8a(contentHash);
      const wrappedMessage = new Uint8Array([
        ...stringToU8a('<Bytes>'),
        ...contentHashBytes,
        ...stringToU8a('</Bytes>')
      ]);
      
      const wrappedHashArray = blake2AsU8a(wrappedMessage, 256);
      const wrappedMessageHash = '0x' + Array.from(wrappedHashArray).map(b => b.toString(16).padStart(2, '0')).join('');
      
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {t('verify.title')}
                </h1>
              </div>
              <p className="text-gray-600">
                {t('verify.description')}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('verify.step1Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('verify.step1Desc')}</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('verify.step2Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('verify.step2Desc')}</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('verify.step3Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('verify.step3Desc')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Mode Tabs */}
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('verify.title')}</h2>
              <p className="text-sm text-gray-600">Choose your verification method</p>
            </div>
            <button
              type="button"
              onClick={loadExampleProof}
              className="px-4 py-2 text-sm bg-white border-2 border-[#003399] text-[#003399] rounded-lg hover:bg-[#003399] hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
            >
              {t('verify.testExample')}
            </button>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => {
                setMode('file');
                // Trigger file input click after a small delay to ensure mode switch completes
                setTimeout(() => {
                  document.getElementById('file-upload')?.click();
                }, 100);
              }}
              className={`flex-1 px-6 py-3 rounded-lg transition-all font-semibold shadow-sm ${
                mode === 'file'
                  ? 'bg-[#003399] text-white shadow-lg'
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
          <button
            onClick={() => {
              setMode('qr');
              setScanning(false);
            }}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              mode === 'qr'
                ? 'bg-[#003399] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan QR Code
          </button>
        </div>

        {/* File Upload Mode */}
        {mode === 'file' && (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const fakeEvent = {
                  target: {
                    files: e.dataTransfer.files
                  }
                };
                handleFileUpload(fakeEvent);
              }
            }}
          >
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

        {/* QR Code Scan Mode */}
        {mode === 'qr' && (
          <QRCodeScanner
            onScan={handleQRScan}
            scanning={scanning}
            setScanning={setScanning}
            verifying={verifying}
            autoStart={true}
          />
        )}
      </div>

      {/* Verifying Status - Removed: Toast indicator is sufficient */}

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

      {/* Result - Progressive 3-Level View */}
      {result && (
        <div role="region" aria-label="Verification results" className={`border-2 rounded-lg overflow-hidden ${
          verifyingChainOfTrust
            ? 'bg-gray-50 border-gray-300'
            : result.isValid
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {/* NIVEAU 0: Header + Status + Timeline - Always visible */}
          <div className="p-6">
            {/* Status Header */}
            <div className="flex items-center space-x-3 mb-4">
              {verifyingChainOfTrust ? (
                result.chainOfTrustVerifiable === false ? (
                  <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-8 w-8 text-gray-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )
              ) : result.isValid ? (
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className="flex-1">
                <div className="font-semibold text-xl">
                  {verifyingChainOfTrust 
                    ? (result.chainOfTrustVerifiable === false 
                        ? 'Proof Valid - Chain of Trust Not Verifiable'
                        : 'Verifying Chain of Trust...')
                    : result.isValid 
                      ? 'Proof Valid' 
                      : 'Proof Invalid'}
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  {verifyingChainOfTrust 
                    ? (result.chainOfTrustVerifiable === false
                        ? 'Workflow steps verified on blockchain, but participant identities cannot be traced (no _targetAddress metadata)'
                        : 'Proof found on blockchain, checking workflow chain of trust...')
                    : result.message}
                </div>
                {result.chainOfTrustValid === false && !verifyingChainOfTrust && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-xs text-red-800">
                      <strong className="font-bold">Security Alert:</strong> At least one step in the workflow was not created by the intended recipient of the previous step. This indicates a potential security issue or tampering.
                    </div>
                  </div>
                )}
                {chronologicalOrderValid === false && !verifyingChainOfTrust && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-red-800">
                      <strong className="font-bold">Chronological Order Violation:</strong> The workflow steps are NOT in chronological order. This indicates that the timestamps have been manipulated or the workflow was not executed sequentially.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow Summary + Vertical Steps Timeline (mobile-optimized) */}
            {workflowHistory && !verifyingChainOfTrust && (
              <div className="mt-6 space-y-4">
                {/* Compact Workflow Summary */}
                <div className="bg-white bg-opacity-70 rounded-lg p-4 sm:p-6 border border-gray-200">
                  {/* Title and Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {workflowHistory.masterWorkflowName}
                    </h3>
                    {workflowHistory.allStepsVerified && workflowHistory.chainOfTrustValid === true && workflowHistory.allSchemasValid !== false && chronologicalOrderValid !== false ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        VERIFIED
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        ISSUES FOUND
                      </span>
                    )}
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Steps</div>
                        <div className="font-semibold text-gray-900">{workflowHistory.totalSteps}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Participants</div>
                        <div className="font-semibold text-gray-900">{(() => {
                          const uniqueParticipants = new Set(
                            workflowHistory.history
                              .filter(step => step.blockchainData?.creator)
                              .map(step => step.blockchainData.creator)
                          );
                          return uniqueParticipants.size;
                        })()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Duration</div>
                        <div className="font-semibold text-gray-900">{(() => {
                          const firstBlock = workflowHistory.history[0]?.blockchainData?.createdAt;
                          const lastBlock = workflowHistory.history[workflowHistory.history.length - 1]?.blockchainData?.createdAt;
                          
                          if (firstBlock && lastBlock && blockTimestamps[firstBlock] && blockTimestamps[lastBlock]) {
                            const duration = formatDuration(blockTimestamps[firstBlock], blockTimestamps[lastBlock]);
                            return duration || '—';
                          }
                          return '—';
                        })()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        workflowHistory.history.filter(h => h.blockchainVerified).length === workflowHistory.history.length
                          ? 'bg-green-50'
                          : 'bg-yellow-50'
                      }`}>
                        <svg className={`w-4 h-4 ${
                          workflowHistory.history.filter(h => h.blockchainVerified).length === workflowHistory.history.length
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Verified</div>
                        <div className="font-semibold text-gray-900">{workflowHistory.history.filter(h => h.blockchainVerified).length}/{workflowHistory.history.length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Checks - Only show if there are issues */}
                  {(workflowHistory.chainOfTrustValid === false || workflowHistory.allSchemasValid === false || chronologicalOrderValid === false) && (
                    <div className="border-t pt-3 space-y-2">
                      {workflowHistory.chainOfTrustValid === false && (
                        <div className="flex items-center gap-2 text-xs text-red-700">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01" />
                          </svg>
                          <span className="font-medium">Chain of trust broken - unauthorized participant detected</span>
                        </div>
                      )}
                      {workflowHistory.allSchemasValid === false && (
                        <div className="flex items-center gap-2 text-xs text-orange-700">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01" />
                          </svg>
                          <span className="font-medium">Some deliverables have data validation errors</span>
                        </div>
                      )}
                      {chronologicalOrderValid === false && (
                        <div className="flex items-center gap-2 text-xs text-red-700">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Steps are not in chronological order</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Timeline Steps */}
                <div className="space-y-4">
                  {workflowHistory.history.map((step, i) => {
                    // Extract step identity and function
                    const stepKey = Object.keys(proofData?.livrable || {})[i] || step.stepName;
                    const stepData = (proofData?.livrable || {})[stepKey] || step.delivrable;
                    const stepIdentity = extractStepIdentity(stepData, stepKey);
                    const stepFunction = formatStepFunction(stepKey);
                    const isExpanded = expandedSteps[step.stepIndex];
                    
                    return (
                      <div key={step.stepIndex} className="w-full">
                          <button
                            onClick={() => setExpandedSteps(prev => ({
                              ...prev,
                              [step.stepIndex]: !prev[step.stepIndex]
                            }))}
                            className={`w-full text-left bg-white rounded-xl border-2 transition-all duration-300 ${
                              step.chainOfTrustValid === false
                                ? 'border-red-500 shadow-xl'
                                : !step.blockchainVerified
                                ? 'border-red-300 shadow-lg'
                                : isExpanded
                                ? 'border-[#003399] shadow-xl'
                                : 'border-gray-200 shadow-md hover:border-[#003399]/50 hover:shadow-lg'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="p-3 sm:p-6">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                                  {/* Step Number Badge with Chronological Indicator */}
                                  <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                                    <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-bold text-sm sm:text-lg transition-colors duration-300 ${
                                      step.chainOfTrustValid === false
                                        ? 'bg-red-500 text-white'
                                        : !step.blockchainVerified
                                        ? 'bg-red-500 text-white'
                                        : isExpanded ? 'bg-[#003399] text-white' : 'bg-[#003399]/10 text-[#003399]'
                                    }`}>
                                      {step.stepIndex + 1}
                                    </div>
                                    {/* Chronological arrow indicator */}
                                    {i < workflowHistory.history.length - 1 && (
                                      <svg className="w-3 h-3 text-[#003399]/50" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>

                                  {/* Title */}
                                  <div className="flex-1 min-w-0 pt-1">
                                    <h3 className={`text-sm sm:text-xl font-bold transition-colors duration-300 break-words ${
                                      step.chainOfTrustValid === false || !step.blockchainVerified
                                        ? 'text-red-600'
                                        : isExpanded ? 'text-[#003399]' : 'text-gray-900'
                                    }`}>
                                      {stepFunction}
                                    </h3>
                                    <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                                      {stepIdentity}
                                    </div>
                                    {/* Status badges - small and discrete */}
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      {step.chainOfTrustValid === false && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded">
                                          Chain Broken
                                        </span>
                                      )}
                                      {step.schemaValidation?.valid === true && (
                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                          {t('verify.schemaValid')}
                                        </span>
                                      )}
                                      {step.schemaValidation?.valid === false && (
                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                                          {t('verify.schemaInvalid')}
                                        </span>
                                      )}
                                      {step.blockchainData?.createdAt && blockTimestamps[step.blockchainData.createdAt] && (
                                        <span className="text-xs text-gray-500">
                                          {formatTimestamp(blockTimestamps[step.blockchainData.createdAt])}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Expand Icon */}
                                <svg
                                  className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>

                            {/* Expandable Description - Like Home */}
                            {isExpanded && (
                              <div className="px-3 sm:px-6 pb-3 sm:pb-6">
                                {/* Chain of Trust Warning */}
                                {step.chainOfTrustValid === false && (
                                  <div className="bg-red-100 border-l-4 border-red-600 p-3 rounded mb-4">
                                    <div className="flex items-start gap-2">
                                      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                      </svg>
                                      <div className="flex-1">
                                        <h4 className="text-red-900 font-bold text-sm mb-1">Chain of Trust Broken</h4>
                                        <p className="text-red-800 text-xs">
                                          The creator of this step does NOT match the target address of the previous step.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Step Deliverable - Like Home style */}
                                <div className="bg-gradient-to-br from-[#003399]/5 to-blue-50 rounded-lg p-2.5 sm:p-4">
                                  <div className="text-xs sm:text-base text-gray-700 leading-relaxed font-mono">
                                    {(() => {
                                      const data = step.stepOnlyData || step.delivrable;
                                      
                                      return Object.entries(data).map(([key, value], idx) => {
                                        // Skip internal fields starting with _
                                        if (key.startsWith('_')) return null;
                                        
                                        // Handle different value types - format like Home
                                        if (typeof value === 'object' && value !== null) {
                                          // For objects, flatten and display each property
                                          return Object.entries(value).map(([subKey, subValue], subIdx) => {
                                            if (subKey.startsWith('_')) return null;
                                            return (
                                              <div key={`${idx}-${subIdx}`} className="mb-1.5 last:mb-0">
                                                <span className="font-semibold text-[#003399]">{subKey}:</span>
                                                <span className="ml-1">{String(subValue)}</span>
                                              </div>
                                            );
                                          });
                                        } else {
                                          // For simple values, check if it contains newlines (multi-line format)
                                          const valueStr = String(value);
                                          if (valueStr.includes('\n')) {
                                            // Split by newlines and display each line
                                            return valueStr.split('\n').map((line, lineIdx) => {
                                              if (!line.trim()) return null;
                                              return (
                                                <div key={`${idx}-${lineIdx}`} className="mb-1.5 last:mb-0">
                                                  {line.includes(':') ? (
                                                    <>
                                                      <span className="font-semibold text-[#003399]">{line.split(':')[0]}:</span>
                                                      <span className="ml-1">{line.split(':').slice(1).join(':')}</span>
                                                    </>
                                                  ) : (
                                                    line
                                                  )}
                                                </div>
                                              );
                                            });
                                          } else {
                                            return (
                                              <div key={idx} className="mb-1.5 last:mb-0">
                                                <span className="font-semibold text-[#003399]">{key}:</span>
                                                <span className="ml-1">{valueStr}</span>
                                              </div>
                                            );
                                          }
                                        }
                                      });
                                    })()}
                                  </div>
                                </div>

                                {/* Technical Details - Collapsible */}
                                <details 
                                  className="mt-4 pt-2 border-t"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 py-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                    Technical Details
                                  </summary>
                                  <div className="mt-3 space-y-3 pl-2 sm:pl-6 text-xs pr-2">
                                    <div>
                                      <span className="text-gray-500 font-medium block mb-1">Content Hash:</span>
                                      <p className="font-mono text-gray-700 break-all mt-0.5 bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap overflow-wrap-anywhere">{step.contentHash}</p>
                                    </div>
                                    {step.blockchainData && (
                                      <>
                                        <div>
                                          <span className="text-gray-500 font-medium block mb-1">Full Creator Address:</span>
                                          <p className="font-mono text-gray-700 break-all mt-0.5 bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap overflow-wrap-anywhere">{step.blockchainData.creator}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 font-medium block mb-1">Signature Status:</span>
                                          <span
                                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                              step.blockchainData.signatureValid
                                                ? 'bg-green-200 text-green-900'
                                                : 'bg-red-200 text-red-900'
                                            }`}
                                          >
                                            {step.blockchainData.signatureValid ? '✓ Valid' : '✗ Invalid'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 font-medium block mb-1">Block Number:</span>
                                          <a 
                                            href={getBlockExplorerLink(step.blockchainData.createdAt)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-block text-blue-600 hover:underline font-mono text-xs"
                                          >
                                            #{step.blockchainData.createdAt} →
                                          </a>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </details>
                              </div>
                            )}
                          </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Technical Proof Details (for non-workflow proofs) */}
            {!workflowHistory && result.details && (
              <div className="mt-6">
                <button
                  onClick={() => setIsProofDetailsExpanded(!isProofDetailsExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition text-left border ${
                    verifyingChainOfTrust
                      ? 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                      : result.isValid
                      ? 'bg-green-50 hover:bg-green-100 border-green-200'
                      : 'bg-red-50 hover:bg-red-100 border-red-200'
                  }`}
                >
                  <span className="font-medium text-gray-900">Proof Details</span>
                  <svg 
                    className={`w-5 h-5 text-gray-600 transition-transform ${isProofDetailsExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isProofDetailsExpanded && (
                  <div className="mt-4 space-y-2 text-sm">
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
                )}
              </div>
            )}
          </div>

          {/* Continue Workflow Button for valid RAG proofs */}
          {result.isValid && proofData && proofData.ragHash && proofData.stepHash && (
            <div className={`px-6 pb-6 ${result.details && isProofDetailsExpanded ? 'pt-4 border-t' : ''}`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    This is a valid workflow proof
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Product QR Verification Button */}
                  {firstStepHash && !showProductQRScanner && (
                    <button
                      onClick={() => {
                        setShowProductQRScanner(true);
                        setProductQRResult(null);
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      Verify Product QR
                    </button>
                  )}
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
                {loadingNextStep && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Loading workflow...
              </div>
                )}
                {workflowInfo && workflowInfo.isLastStep && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Workflow Complete!</span>
                  </div>
                )}
              </div>
              {workflowInfo && !workflowInfo.isLastStep && (
                <div className="mt-2 text-xs text-gray-600">
                  ↓ Workflow continuation loaded below
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Product QR Scanner Section */}
      {showProductQRScanner && firstStepHash && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Verify Product QR Code</h2>
            <button
              onClick={() => {
                setShowProductQRScanner(false);
                setScanningProductQR(false);
                setProductQRResult(null);
              }}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Instructions:</strong> Scan the QR code on the product (e.g., bottle label) to verify if it matches the first step of this workflow.
            </p>
            <p className="text-xs text-blue-700 mt-2">
              Expected hash: <code className="bg-blue-100 px-2 py-1 rounded font-mono">{firstStepHash.substring(0, 20)}...{firstStepHash.substring(firstStepHash.length - 10)}</code>
            </p>
            {firstStepHash === '0x610b90a3472cab175af976348cf4d1c3e7b76b928ec1c37ce9617a55a55b03e9' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-300 rounded-lg">
                <p className="text-xs text-green-900">
                  <strong>{t('about.qrExampleHint')}</strong> {' '}
                  <a href="/about" className="text-[#003399] font-semibold hover:underline">{t('about.aboutPage')}</a>.
                  {' '}{t('about.downloadOrScan')}
                </p>
              </div>
            )}
          </div>

          {/* QR Scanner */}
          {!productQRResult && (
            <QRCodeScanner
              onScan={handleProductQRScan}
              scanning={scanningProductQR}
              setScanning={setScanningProductQR}
              verifying={false}
              autoStart={true}
            />
          )}

          {/* Product Verification Result */}
          {productQRResult && (
            <div className={`p-6 rounded-lg border-2 ${
              productQRResult.isValid 
                ? 'bg-green-50 border-green-300' 
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-start gap-3 mb-4">
                {productQRResult.isValid ? (
                  <svg className="w-8 h-8 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${
                    productQRResult.isValid ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {productQRResult.message}
                  </h3>
                  <p className={`text-sm ${
                    productQRResult.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {productQRResult.details}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setProductQRResult(null);
                    setScanningProductQR(false);
                  }}
                  className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                >
                  Scan Another QR
                </button>
                <button
                  onClick={() => {
                    setShowProductQRScanner(false);
                    setScanningProductQR(false);
                    setProductQRResult(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-medium text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workflow Continuation Section */}
      {workflowInfo && (
        <div className="bg-white bg-opacity-70 rounded-lg p-6 mt-8 border-2 border-[#003399]/20 shadow-lg">
          {/* Header - Like workflow summary */}
          <div className="bg-gradient-to-br from-[#003399]/5 to-blue-50 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#003399] mb-2">
                  {workflowInfo.masterRag?.metadata?.name || 'Workflow Continuation'}
                </h2>
                {workflowInfo.masterRag?.metadata?.description && (
                  <p className="text-sm text-gray-700">
                    {workflowInfo.masterRag.metadata.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[#003399] text-white text-sm font-medium rounded-full whitespace-nowrap">
                  Step {workflowInfo.currentStep} / {workflowInfo.totalSteps}
                </span>
              </div>
            </div>
          </div>

          {/* Next Step Form or Completion Message */}
          {workflowInfo.isLastStep ? (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-8 text-center shadow-md">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">Workflow Complete!</h3>
              <p className="text-base text-green-700">
                This was the final step of the workflow. All steps have been completed.
              </p>
            </div>
          ) : (
            <>
              {loadingNextStep ? (
                <div className="bg-gradient-to-br from-[#003399]/5 to-blue-50 rounded-xl p-8 text-center">
                  <div className="animate-spin text-4xl text-[#003399] mb-4">⚙</div>
                  <span className="text-lg text-gray-700 font-medium">Loading next step from IPFS...</span>
                </div>
              ) : nextStepSchema ? (
                <div>
                  <div className="bg-white border-2 border-[#003399]/30 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-[#003399] mb-2">
                      Step {workflowInfo.currentStep}: {workflowInfo.nextStepRag?.metadata?.name || 'Next Step'}
                    </h3>
                    
                    {workflowInfo.nextStepRag?.metadata?.description && (
                      <p className="text-sm text-gray-600">
                        {workflowInfo.nextStepRag.metadata.description}
                      </p>
                    )}
                  </div>

                  <form onSubmit={submitNextStep}>
                    {/* Dynamic Form Fields */}
                    <div 
                      ref={formContainerRef}
                      id="next-step-form-fields" 
                      className="space-y-4 mb-6"
                    />

                    {/* Recipient Address */}
                    <div className="bg-gradient-to-br from-[#003399]/5 to-blue-50 border-2 border-[#003399]/30 rounded-xl p-4 space-y-3 mb-6">
                      <label className="block text-sm font-bold text-[#003399]">
                        Recipient Address *
                      </label>
                      <input
                        type="text"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        placeholder="5Exxx... or 0x..."
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003399] focus:border-[#003399] transition-all font-mono"
                        required
                      />
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Enter the Substrate address of the next recipient in the workflow
                      </p>
                    </div>

                    {/* Wallet Check & Target Address Validation */}
                    {!selectedAccount ? (
                      <div className="bg-gradient-to-r from-blue-50 to-[#003399]/10 border-2 border-[#003399]/30 rounded-xl p-4 mb-4">
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="text-sm font-medium text-[#003399]">
                            Please connect your wallet to submit the next step
                          </div>
                        </div>
                      </div>
                    ) : (() => {
                      // Check if connected account matches target address from last step
                      let targetAddress = null;
                      if (workflowInfo.livrable) {
                        // Look for _targetAddress in any section of the delivrable (last one found = most recent)
                        for (const key of Object.keys(workflowInfo.livrable)) {
                          if (workflowInfo.livrable[key] && typeof workflowInfo.livrable[key] === 'object' && workflowInfo.livrable[key]._targetAddress) {
                            targetAddress = workflowInfo.livrable[key]._targetAddress;
                          }
                        }
                      }
                      
                      const isCorrectRecipient = !targetAddress || selectedAccount === targetAddress;
                      
                      return !isCorrectRecipient ? (
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-4 mb-4 shadow-md">
                          <div className="flex items-start space-x-3">
                            <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="text-sm text-orange-900">
                              <div className="font-bold text-base mb-2">{t('verify.wrongWalletTitle')}</div>
                              <div className="mb-3">{t('verify.wrongWalletDesc')}</div>
                              <div className="text-xs font-mono bg-white border border-orange-200 p-3 rounded-lg break-all mb-2">
                                <span className="font-bold text-orange-700">{t('verify.wrongWalletExpected')}</span> {targetAddress}
                              </div>
                              <div className="text-xs font-mono bg-white border border-orange-200 p-3 rounded-lg break-all">
                                <span className="font-bold text-orange-700">{t('verify.wrongWalletConnected')}</span> {selectedAccount}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Submit Button */}
                    <div className="pt-6 border-t-2 border-gray-200">
                      <button
                        type="submit"
                        disabled={submittingStep || !selectedAccount || (() => {
                          // Disable if connected account doesn't match target address
                          let targetAddress = null;
                          if (workflowInfo.livrable) {
                            for (const key of Object.keys(workflowInfo.livrable)) {
                              if (workflowInfo.livrable[key] && typeof workflowInfo.livrable[key] === 'object' && workflowInfo.livrable[key]._targetAddress) {
                                targetAddress = workflowInfo.livrable[key]._targetAddress;
                              }
                            }
                          }
                          return targetAddress && selectedAccount !== targetAddress;
                        })()}
                        className="w-full px-6 py-4 bg-[#003399] hover:bg-[#002266] text-white rounded-xl transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
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
    </>
  );
};

