import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { RagClient } from '../lib/core/rag-client.js';
import { CidConverter } from '../lib/core/cid-converter.js';
import { showSuccess, showError } from '../lib/toast';
import { logger } from '../lib/logger';
import { addFavorite, isFavorite } from '../lib/favorites';

const AI_INSTRUCTIONS = `# Blockchain Workflow Builder

Create workflows with two clear phases:
1. **BEFORE ORDER** - Build trust through storytelling OR guarantee
2. **AFTER ORDER** - Coordinate logistics between actors

Ask me what I want to track, then build the JSON.

## Step 1: Ask These Questions

1. **What product?** (jewelry, spirits, miniatures, electronics, pharmaceuticals, etc.)

2. **PHASE 1 - BEFORE ORDER**: Choose one approach:
   
   **A. STORYTELLING** (artisan, luxury, handmade)
   - Capture: maker's name, inspiration, techniques, photos, time invested
   - Goal: Customer feels emotional connection to creation
   - Example: Jewelry design → sourcing → crafting → photography
   
   **B. MANUFACTURER GUARANTEE** (industrial, safety, compliance)
   - Capture: production date, batch number, quality tests, certifications
   - Goal: Prove conformity, safety, authenticity
   - Example: Electronics production → testing → quality control → packaging

3. **PHASE 2 - AFTER ORDER** (coordination):
   - Capture: order confirmation, tracking number, carrier, delivery date
   - Goal: Transparent logistics between actors
   - NO handoff objects - just: carrier, tracking, shipping date

4. **Client validation?** Should client approve at key moments? (e.g., design before printing)

## Step 2: Generate JSON

Generate complete JSON with this structure:

\`\`\`json
{
  "master": {
    "name": "short-name-v1",
    "description": "Brief workflow description",
    "instruction": "MASTER WORKFLOW - [Title]\\n\\n[Description]\\n\\nWorkflow Steps:\\n1. [STEP 1] - [Description]\\n   Responsible: [Person/Organization]\\n   Key: [stepKey]\\n...",
    "resource": "Real-world example story",
    "tags": ["industry", "master", "v1"],
    "workflowType": "master",
    "version": "1.0"
  },
  "steps": [
    {
      "stepKey": "step-identifier",
      "stepName": "Human Readable Name",
      "description": "What this step does (max 300 chars)",
      "instruction": "How to fill this form with examples",
      "resource": "Concrete example for this specific step",
      "tags": ["industry", "step-identifier", "step-1", "v1"],
      "schema": {
        "type": "object",
        "required": ["step-identifier"],
        "properties": {
          "step-identifier": {
            "type": "object",
            "required": ["responsibleIdentity"],
            "properties": {
              "responsibleIdentity": {
                "type": "string",
                "minLength": 1,
                "maxLength": 200,
                "description": "Name of person/org (FIRST FIELD - ALWAYS REQUIRED)"
              },
              "otherFieldsHere": {
                "type": "string",
                "description": "Add your step-specific fields (no timestamp needed - automatic from blockchain)"
              }
            }
          }
        }
      }
    }
  ]
}
\`\`\`

## Schema Examples by Step Type

**Storytelling step** (design):
\`\`\`json
"properties": {
  "responsibleIdentity": {"type": "string", "minLength": 1, "maxLength": 200},
  "inspirationStory": {"type": "string", "maxLength": 1000},
  "sketchCid": {"type": "string", "pattern": "^[Qb][a-zA-Z0-9]{40,}$", "description": "IPFS CID (e.g., bafkreiabcd...)"},
  "hoursWorked": {"type": "number"}
}
\`\`\`

**Guarantee step** (testing):
\`\`\`json
"properties": {
  "responsibleIdentity": {"type": "string", "minLength": 1, "maxLength": 200},
  "batchNumber": {"type": "string", "maxLength": 100},
  "testResults": {"type": "string", "maxLength": 500},
  "certificationCid": {"type": "string", "pattern": "^[Qb][a-zA-Z0-9]{40,}$", "description": "IPFS CID (e.g., bafkreiabcd...)"}
}
\`\`\`

**Logistics step** (shipping):
\`\`\`json
"properties": {
  "responsibleIdentity": {"type": "string", "minLength": 1, "maxLength": 200},
  "carrier": {"type": "string", "maxLength": 100},
  "trackingNumber": {"type": "string", "maxLength": 100},
  "shippingDate": {"type": "string", "format": "date"}
}
\`\`\`

**Client validation step**:
\`\`\`json
"properties": {
  "responsibleIdentity": {"type": "string", "minLength": 1, "maxLength": 200},
  "validated": {"type": "boolean"},
  "comment": {"type": "string", "maxLength": 1000}
}
\`\`\`

---

## Step 3: Fix Errors (If Validation Fails)

If I give you validation errors, **ONLY fix what's broken**. Don't regenerate everything.

For example, if I say:
\`\`\`
Error: master.description exceeds 300 characters
\`\`\`

Then respond:
\`\`\`
I'll shorten the master.description. Here's the corrected master object:
\`\`\`json
{
  "master": {
    "description": "[Shortened version under 300 chars]"
  }
}
\`\`\`

Just paste this into your existing JSON to fix it.
\`\`\`

## BLOCKCHAIN LIMITS

| Field | Limit |
|-------|-------|
| master.name | ≤ 50 chars |
| master.description | ≤ 300 chars |
| master.tags | ≤ 10 tags, ≤ 15 chars each |
| step.stepKey | ≤ 50 chars |
| step.description | ≤ 300 chars |
| step.tags | ≤ 10 tags, ≤ 15 chars each |
| steps array | ≤ 64 steps |
| **RAG Name** | **≤ 50 chars (stepKey + "-" + master.name)** |
| responsibleIdentity | ≤ 200 chars |

**Example**: If master.name = "jewelry-v1" (11 chars), then stepKey max = 38 chars

## Critical Rules

1. **FIRST field** in each step schema MUST be **\`responsibleIdentity\`** (string, 1-200 chars) - the name of the person/organization responsible for this step
   - Examples: "Marie Dubois", "Macallan Distillery", "La Poste", "FedEx Tracking"
   - This field is ALWAYS first and ALWAYS named \`responsibleIdentity\` for consistency
   - **Note**: No need for \`timestamp\` field - it's captured automatically from the blockchain transaction
2. **Each step MUST include these fields**:
   - \`stepKey\` (identifier) - REQUIRED
   - \`stepName\` (human-readable title) - REQUIRED
   - \`description\` (what this step does, max 300 chars) - REQUIRED
   - \`instruction\` (how to fill the form) - RECOMMENDED
   - \`resource\` (real-world example) - RECOMMENDED
   - \`tags\` (for search, max 10 tags, 15 chars each) - REQUIRED
   - \`schema\` (JSON Schema structure) - REQUIRED
3. Schema follows JSON Schema standard (type, required, properties, etc.)
4. Tags format: \`["industry", "stepKey", "step-N", "version"]\`
5. **Always check**: \`stepKey.length + 1 + master.name.length ≤ 50\`
6. **All field names** in English (camelCase): "harvestDate" not "dateRecolte"
7. **IPFS CID fields**: Use pattern \`^[Qb][a-zA-Z0-9]{40,}$\` to accept all CID formats
   - MCP generates CIDs in format: \`bafkrei...\` (CIDv1 raw, ~59 chars)
   - Pattern also accepts: \`Qm...\` (CIDv0), \`bafy...\` (CIDv1 dag-pb), \`bafybei...\`, etc.
   - Example: "photoCid": {"type": "string", "pattern": "^[Qb][a-zA-Z0-9]{40,}$", "description": "IPFS CID (e.g., bafkreiabcd...)"}
8. **For SENSITIVE data transfer** (STL files, passwords, private documents): Use the encrypted crypto-trail mechanism
   - Example: Designer creates STL → encrypted in crypto-trail → only Printer can decrypt
   - The blockchain proves transfer without exposing the data
9. **For COORDINATION** (logistics, tracking): Add simple fields directly in the step
   - Use: \`carrier\`, \`trackingNumber\`, \`shippingDate\`
   - Example: shipping step → add "carrier": "Chronopost", "trackingNumber": "FR123456"
10. **Client validation**: Create separate onchain steps where client approves critical moments
   - Examples: "design-validation", "painting-validation", "delivery-confirmation"
   - Schema: responsibleIdentity (client), validated (boolean), comment (feedback)

---

## Quick Examples

**Artisan Jewelry** (storytelling):
- PHASE 1: design → sourcing → crafting → photography
- PHASE 2: order → packaging → shipping → delivery

**Craft Spirits** (guarantee):
- PHASE 1: distillation → aging → bottling → quality-test
- PHASE 2: order → distribution → delivery

**3D Miniatures** (storytelling + validation):
- PHASE 1: commission → design → design-validation (client) → printing → painting → painting-validation (client)
- PHASE 2: order → packaging → shipping → delivery-confirmation (client)

---

Ready to start? Tell me what you want to track!`;

export const Agent = () => {
  const { t } = useTranslation();
  const { ipfsClient, substrateClient, selectedAccount } = useApp();
  
  const [workflowJson, setWorkflowJson] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [validatedWorkflow, setValidatedWorkflow] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deploymentLog, setDeploymentLog] = useState([]);
  const [deployedMasterHash, setDeployedMasterHash] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isDeployedFavorited, setIsDeployedFavorited] = useState(false);
  
  const textareaRef = useRef(null);
  const logRef = useRef(null);

  // Auto-favorite deployed workflow
  useEffect(() => {
    if (deployedMasterHash && selectedAccount) {
      const alreadyFavorited = isFavorite(selectedAccount, deployedMasterHash);
      if (!alreadyFavorited) {
        addFavorite(selectedAccount, deployedMasterHash);
        setIsDeployedFavorited(true);
        console.log('⭐ Auto-favorited deployed workflow');
      } else {
        setIsDeployedFavorited(true);
      }
    }
  }, [deployedMasterHash, selectedAccount]);

  /**
   * Copy AI instructions to clipboard
   */
  const copyInstructions = () => {
    navigator.clipboard.writeText(AI_INSTRUCTIONS);
    showSuccess('Instructions copied! Paste them to your AI assistant.');
  };

  /**
   * Copy validation errors to clipboard
   */
  const copyErrors = () => {
    const errorText = `My workflow JSON has validation errors. Please fix them:\n\n${validationErrors.join('\n')}`;
    navigator.clipboard.writeText(errorText);
    showSuccess('Errors copied! Give them to your AI to fix.');
  };

  /**
   * Validate workflow JSON against schema
   */
  const validateWorkflow = () => {
    try {
      setValidationErrors([]);
      setValidatedWorkflow(null);
      
      // Parse JSON
      const workflow = JSON.parse(workflowJson);
      const errors = [];
      
      // Validate master
      if (!workflow.master) {
        errors.push('Missing "master" object');
      } else {
        if (!workflow.master.name) {
          errors.push('master.name is required');
        } else if (workflow.master.name.length > 50) {
          errors.push('master.name must be ≤ 50 characters (blockchain limit)');
        }
        
        if (!workflow.master.description) {
          errors.push('master.description is required');
        } else if (workflow.master.description.length > 300) {
          errors.push('master.description must be ≤ 300 characters (blockchain limit)');
        }
        
        // Warn if instruction or resource are missing (not blocking, but recommended)
        if (!workflow.master.instruction || workflow.master.instruction.trim() === '') {
          errors.push('master: WARNING - Missing \'instruction\' field (recommended for workflow overview)');
        }
        if (!workflow.master.resource || workflow.master.resource.trim() === '') {
          errors.push('master: WARNING - Missing \'resource\' field (recommended for real-world example story)');
        }
        
        if (!workflow.master.tags || !Array.isArray(workflow.master.tags)) {
          errors.push('master.tags must be an array');
        } else {
          if (workflow.master.tags.length > 10) {
            errors.push('master.tags: maximum 10 tags allowed (blockchain limit)');
          }
          workflow.master.tags.forEach((tag, i) => {
            if (tag.length > 15) {
              errors.push(`master.tags[${i}]: tag "${tag}" is too long (max 15 chars, blockchain limit)`);
            }
          });
        }
        
        if (workflow.master.workflowType !== 'master') {
          errors.push('master.workflowType must be "master"');
        }
      }
      
      // Validate steps
      if (!workflow.steps || !Array.isArray(workflow.steps)) {
        errors.push('Missing "steps" array');
      } else {
        if (workflow.steps.length === 0) {
          errors.push('At least one step is required');
        }
        if (workflow.steps.length > 64) {
          errors.push('Maximum 64 steps allowed (blockchain limit)');
        }
        
        workflow.steps.forEach((step, i) => {
          const prefix = `steps[${i}]`;
          
          if (!step.stepKey) {
            errors.push(`${prefix}.stepKey is required`);
          } else if (step.stepKey.length > 50) {
            errors.push(`${prefix}.stepKey must be ≤ 50 characters (blockchain limit)`);
          } else if (workflow.master && workflow.master.name) {
            // Check combined RAG step name: stepKey-masterName
            const ragStepName = `${step.stepKey}-${workflow.master.name}`;
            if (ragStepName.length > 50) {
              errors.push(`${prefix}.stepKey: Combined RAG name "${ragStepName}" exceeds 50 chars (${ragStepName.length} chars). Shorten stepKey or master.name.`);
            }
          }
          
          if (!step.stepName) {
            errors.push(`${prefix}.stepName is required`);
          }
          
          if (!step.description) {
            errors.push(`${prefix}.description is required`);
          } else if (step.description.length > 300) {
            errors.push(`${prefix}.description must be ≤ 300 characters (blockchain limit)`);
          }
          
          // Warn if instruction or resource are missing (not blocking, but recommended)
          if (!step.instruction || step.instruction.trim() === '') {
            errors.push(`${prefix}: WARNING - Missing 'instruction' field (recommended for better UX)`);
          }
          if (!step.resource || step.resource.trim() === '') {
            errors.push(`${prefix}: WARNING - Missing 'resource' field (recommended for real-world examples)`);
          }
          
          if (!step.schema) errors.push(`${prefix}.schema is required`);
          
          if (!step.tags || !Array.isArray(step.tags)) {
            errors.push(`${prefix}.tags must be an array`);
          } else {
            if (step.tags.length > 10) {
              errors.push(`${prefix}.tags: maximum 10 tags allowed (blockchain limit)`);
            }
            step.tags.forEach((tag, j) => {
              if (tag.length > 15) {
                errors.push(`${prefix}.tags[${j}]: tag "${tag}" is too long (max 15 chars, blockchain limit)`);
              }
            });
          }
          
          // Validate schema structure
          if (step.schema) {
            if (step.schema.type !== 'object') {
              errors.push(`${prefix}.schema.type must be "object"`);
            }
            if (!step.schema.required || !Array.isArray(step.schema.required)) {
              errors.push(`${prefix}.schema.required must be an array`);
            } else if (!step.schema.required.includes(step.stepKey)) {
              errors.push(`${prefix}.schema.required must include "${step.stepKey}"`);
            }
            if (!step.schema.properties || !step.schema.properties[step.stepKey]) {
              errors.push(`${prefix}.schema.properties must have "${step.stepKey}" key`);
            } else {
              const stepSchema = step.schema.properties[step.stepKey];
              if (!stepSchema.properties) {
                errors.push(`${prefix}.schema.properties.${step.stepKey}.properties is required`);
              } else {
                // Check first field is responsibleIdentity (NEW STANDARD)
                const firstField = Object.keys(stepSchema.properties)[0];
                if (firstField !== 'responsibleIdentity') {
                  errors.push(`${prefix}: First field in schema MUST be "responsibleIdentity" (person/organization responsible for this step). Got: "${firstField}"`);
                }
                
                // Verify responsibleIdentity has correct type and constraints
                const responsibleIdentityField = stepSchema.properties.responsibleIdentity;
                if (responsibleIdentityField) {
                  if (responsibleIdentityField.type !== 'string') {
                    errors.push(`${prefix}.responsibleIdentity must be type "string"`);
                  }
                  if (!responsibleIdentityField.minLength || responsibleIdentityField.minLength < 1) {
                    errors.push(`${prefix}.responsibleIdentity must have minLength >= 1`);
                  }
                  if (!responsibleIdentityField.maxLength || responsibleIdentityField.maxLength > 200) {
                    errors.push(`${prefix}.responsibleIdentity must have maxLength <= 200`);
                  }
                }
              }
            }
          }
        });
      }
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        showError(`Validation failed: ${errors.length} error(s) found`);
        return;
      }
      
      // Validation successful
      setValidatedWorkflow(workflow);
      showSuccess('Workflow validated successfully! Review and deploy.');
      
    } catch (error) {
      setValidationErrors([`Invalid JSON: ${error.message}`]);
      showError('Invalid JSON format');
    }
  };

  /**
   * Deploy workflow to blockchain
   */
  const deployWorkflow = async () => {
    if (!selectedAccount) {
      showError('Please connect your wallet first');
      return;
    }
    
    if (!validatedWorkflow) {
      showError('Please validate the workflow first');
      return;
    }
    
    setDeploying(true);
    setDeploymentLog([]);
    setDeployedMasterHash(null);
    
    const addLog = (message, type = 'info') => {
      setDeploymentLog(prev => [...prev, { message, type, timestamp: new Date() }]);
      // Auto-scroll to bottom
      setTimeout(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    };
    
    try {
      addLog('Starting workflow deployment...', 'info');
      
      // Create RagClient instance
      const ragClient = new RagClient(substrateClient);
      
      // Create a valid empty CID v1 (36 bytes)
      const createEmptyCid = () => {
        const cid = new Uint8Array(36);
        cid[0] = 0x01; // CID version 1
        cid[1] = 0x55; // Codec: raw (0x55)
        cid[2] = 0x12; // Multihash type: sha2-256 (0x12)
        cid[3] = 0x20; // Multihash length: 32 bytes (0x20)
        // Rest is zeros (empty hash)
        return cid;
      };
      
      // ==================================================================
      // PHASE 1: Upload ALL CIDs to IPFS (in parallel for speed)
      // ==================================================================
      addLog('\nPHASE 1: Uploading all content to IPFS in parallel...', 'info');
      
      const { u8aToHex } = await import('@polkadot/util');
      
      // Upload all step CIDs in parallel
      const stepUploadsPromises = validatedWorkflow.steps.map(async (step, i) => {
        const result = {
          stepIndex: i,
          stepKey: step.stepKey,
          stepName: step.stepName,
          description: step.description,
          tags: step.tags
        };
        
        // Upload schema
        const schemaJson = JSON.stringify(step.schema);
        const schemaBytes = new TextEncoder().encode(schemaJson);
        result.schemaCid = await ipfsClient.uploadFile(schemaBytes);
        
        // Upload instruction if provided
        if (step.instruction) {
          const instructionBytes = new TextEncoder().encode(step.instruction);
          result.instructionCid = await ipfsClient.uploadFile(instructionBytes);
        }
        
        // Upload resource if provided
        if (step.resource) {
          const resourceBytes = new TextEncoder().encode(step.resource);
          result.resourceCid = await ipfsClient.uploadFile(resourceBytes);
        }
        
        // Generate step name with 50 char limit
        let stepName = `${step.stepKey}-${validatedWorkflow.master.name}`;
        if (stepName.length > 50) {
          const maxMasterNameLength = 50 - step.stepKey.length - 1;
          const truncatedMasterName = validatedWorkflow.master.name.substring(0, maxMasterNameLength);
          stepName = `${step.stepKey}-${truncatedMasterName}`;
        }
        result.fullStepName = stepName;
        
        // Convert to chain format
        result.schemaHex = result.schemaCid 
          ? u8aToHex(CidConverter.toChainFormat(result.schemaCid))
          : u8aToHex(createEmptyCid());
        result.instructionHex = result.instructionCid 
          ? u8aToHex(CidConverter.toChainFormat(result.instructionCid))
          : u8aToHex(createEmptyCid());
        result.resourceHex = result.resourceCid 
          ? u8aToHex(CidConverter.toChainFormat(result.resourceCid))
          : u8aToHex(createEmptyCid());
        
        return result;
      });
      
      // Upload master CIDs in parallel
      const masterUploadsPromise = (async () => {
        const result = {};
        
        if (validatedWorkflow.master.instruction) {
          const instructionBytes = new TextEncoder().encode(validatedWorkflow.master.instruction);
          result.instructionCid = await ipfsClient.uploadFile(instructionBytes);
        }
        
        if (validatedWorkflow.master.resource) {
          const resourceBytes = new TextEncoder().encode(validatedWorkflow.master.resource);
          result.resourceCid = await ipfsClient.uploadFile(resourceBytes);
        }
        
        return result;
      })();
      
      // Wait for all uploads
      const [stepResults, masterResults] = await Promise.all([
        Promise.all(stepUploadsPromises),
        masterUploadsPromise
      ]);
      
      addLog(`All CIDs uploaded to IPFS!`, 'success');
      stepResults.forEach((step, i) => {
        addLog(`Step ${i + 1}:`, 'info');
        if (step.instructionCid) {
          addLog(`  Instruction ${step.instructionCid}`, 'info');
        }
        if (step.resourceCid) {
          addLog(`  Resource ${step.resourceCid}`, 'info');
        }
        addLog(`  Schema ${step.schemaCid}`, 'info');
      });
      if (masterResults.instructionCid || masterResults.resourceCid) {
        addLog(`Master:`, 'info');
        if (masterResults.instructionCid) {
          addLog(`  Instruction ${masterResults.instructionCid}`, 'info');
        }
        if (masterResults.resourceCid) {
          addLog(`  Resource ${masterResults.resourceCid}`, 'info');
        }
      }
      
      // ==================================================================
      // PHASE 2: Prepare all extrinsics and calculate hashes locally
      // ==================================================================
      addLog('\nPHASE 2: Preparing blockchain transactions...', 'info');
      
      const extrinsics = [];
      const stepHashes = [];
      
      // Prepare step extrinsics and calculate their hashes
      for (const stepData of stepResults) {
        // Calculate hash locally (same algorithm as blockchain)
        const stepHash = await ragClient.calculateMetadataHash(
          stepData.instructionHex,
          stepData.resourceHex,
          stepData.schemaHex,
          [], // No steps for step RAGs
          stepData.fullStepName,
          stepData.description,
          stepData.tags
        );
        
        stepHashes.push({
          stepNumber: stepData.stepIndex + 1,
          stepKey: stepData.stepKey,
          stepName: stepData.stepName,
          hash: stepHash,
          schemaCid: stepData.schemaCid,
          instructionCid: stepData.instructionCid,
          resourceCid: stepData.resourceCid
        });
        
        // Prepare extrinsic (will be batched later)
        const { extrinsic, api: stepApi } = await ragClient.prepareRagMetadataExtrinsic(
          stepData.fullStepName,
          stepData.description,
          stepData.instructionHex,
          stepData.resourceHex,
          stepData.schemaHex,
          [], // No steps for step RAGs
          stepData.tags,
          null
        );
        
        extrinsics.push(extrinsic);
        
        // Close API connection (we'll reuse one later)
        if (stepApi) await stepApi.disconnect();
      }
      
      addLog(`Prepared ${extrinsics.length} step transactions`, 'success');
      
      // Prepare master extrinsic with calculated step hashes
      const masterInstructionHex = masterResults.instructionCid 
        ? u8aToHex(CidConverter.toChainFormat(masterResults.instructionCid))
        : u8aToHex(createEmptyCid());
      const masterResourceHex = masterResults.resourceCid 
        ? u8aToHex(CidConverter.toChainFormat(masterResults.resourceCid))
        : u8aToHex(createEmptyCid());
      const masterSchemaHex = u8aToHex(createEmptyCid()); // No schema for master
      
      const masterTags = validatedWorkflow.master.tags.includes('master') 
        ? validatedWorkflow.master.tags 
        : ['master', ...validatedWorkflow.master.tags];
      
      // Calculate master hash locally
      const masterHash = await ragClient.calculateMetadataHash(
        masterInstructionHex,
        masterResourceHex,
        masterSchemaHex,
        stepHashes.map(s => s.hash),
        validatedWorkflow.master.name,
        validatedWorkflow.master.description,
        masterTags
      );
      
      const { extrinsic: masterExtrinsic, api: masterApi } = await ragClient.prepareRagMetadataExtrinsic(
        validatedWorkflow.master.name,
        validatedWorkflow.master.description,
        masterInstructionHex,
        masterResourceHex,
        masterSchemaHex,
        stepHashes.map(s => s.hash),
        masterTags,
        null
      );
      
      extrinsics.push(masterExtrinsic);
      addLog(`Prepared master transaction`, 'success');
      
      // ==================================================================
      // PHASE 3: Batch all transactions and sign ONCE
      // ==================================================================
      addLog('\nPHASE 3: Batching transactions and requesting signature...', 'info');
      addLog(`Total transactions to sign: ${extrinsics.length} (${extrinsics.length - 1} steps + 1 master)`, 'info');
      
      // Get wallet signer (with proper web3Enable initialization)
      const { getWalletSigner } = await import('../lib/core/blockchain-utils.js');
      const injector = await getWalletSigner(selectedAccount);
      
      // Create batch transaction (atomic - all or nothing)
      const batchTx = masterApi.tx.utility.batchAll(extrinsics);
      
      addLog(`Waiting for wallet signature...`, 'info');
      
      // Sign and send - ONLY ONE SIGNATURE!
      await new Promise((resolve, reject) => {
        batchTx.signAndSend(selectedAccount, { signer: injector.signer }, ({ status, events, dispatchError }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = masterApi.registry.findMetaError(dispatchError.asModule);
              const { docs, name, section } = decoded;
              reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
            } else {
              reject(new Error(dispatchError.toString()));
            }
            return;
          }
          
          if (status.isInBlock) {
            addLog(`Transaction included in block: ${status.asInBlock.toHex()}`, 'success');
            
            // Verify events
            const metadataStoredEvents = events
              .filter(({ event }) => event.section === 'rag' && event.method === 'MetadataStored');
            
            addLog(`Verified ${metadataStoredEvents.length} RAG metadata stored on blockchain`, 'success');
            
            setDeployedMasterHash(masterHash);
            
            // Success summary
            addLog(`\nDEPLOYMENT SUCCESSFUL!`, 'success');
            addLog(`\nWorkflow Details:`, 'info');
            addLog(`  Name: ${validatedWorkflow.master.name}`, 'info');
            addLog(`  Master Hash: ${masterHash}`, 'success');
            addLog(`  Total Steps: ${stepHashes.length}`, 'info');
            addLog(`\nStep Hashes:`, 'info');
            stepHashes.forEach(s => {
              addLog(`  ${s.stepNumber}. ${s.stepName} (${s.stepKey}): ${s.hash}`, 'info');
            });
            
            showSuccess('Workflow deployed successfully with a single signature!');
            
            // Disconnect
            masterApi.disconnect();
            resolve();
          }
        });
      });
      
    } catch (error) {
      logger.error('Deployment failed:', error);
      addLog(`\nDEPLOYMENT FAILED: ${error.message}`, 'error');
      showError('Deployment failed. Check logs for details.');
    } finally {
      setDeploying(false);
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
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-[#003399] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {t('ai.title')}
                </h1>
              </div>
              <p className="text-gray-600">
                {t('ai.subtitle')}
              </p>
            </div>

            {/* How it works button */}
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-gray-200 hover:border-purple-600"
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
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-4 hover:bg-purple-50 hover:border-purple-300 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('ai.step1Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('ai.step1Desc')}</p>
                </div>
                <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-4 hover:bg-purple-50 hover:border-purple-300 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('ai.step2Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('ai.step2Desc')}</p>
                </div>
                <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-4 hover:bg-purple-50 hover:border-purple-300 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('ai.step3Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('ai.step3Desc')}</p>
                </div>
                <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-4 hover:bg-purple-50 hover:border-purple-300 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">4</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('ai.step4Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('ai.step4Desc')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-6xl">

        {/* Step 1: Copy AI Instructions */}
        <div className="mb-8 bg-gradient-to-r from-purple-600 to-[#003399] rounded-xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{t('ai.instructionsTitle')}</h2>
              <p className="text-white/90">{t('ai.instructionsSubtitle')}</p>
            </div>
          </div>
          
          <button
            onClick={copyInstructions}
            className="w-full px-6 py-4 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-all font-bold text-lg shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 group"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t('ai.copyInstructionsBtn')}
          </button>
        </div>

        {/* Step 2: Paste & Validate Workflow JSON */}
        <div className="mb-8 bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-[#003399] rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('ai.pasteTitle')}</h2>
              <p className="text-gray-600">{t('ai.pasteSubtitle')}</p>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={workflowJson}
            onChange={(e) => setWorkflowJson(e.target.value)}
            placeholder={t('ai.pastePlaceholder')}
            rows={12}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition font-mono text-sm resize-y"
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={validateWorkflow}
              disabled={!workflowJson.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-[#003399] text-white rounded-lg hover:from-purple-700 hover:to-[#002266] transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('ai.validateBtn')}
            </button>
            <button
              onClick={() => {
                setWorkflowJson('');
                setValidationErrors([]);
                setValidatedWorkflow(null);
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
            >
              {t('ai.clearBtn')}
            </button>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-8 bg-red-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  {t('ai.validationErrorsTitle')} ({validationErrors.length})
                </h3>
                <div className="bg-white rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                  <ul className="space-y-1 text-sm font-mono text-red-800">
                    {validationErrors.map((error, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-500 flex-shrink-0">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={copyErrors}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {t('ai.copyErrorsBtn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validated Workflow Summary */}
        {validatedWorkflow && (
          <div className="mb-8 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-900">{t('ai.validatedTitle')}</h2>
                <p className="text-green-700">{t('ai.validatedSubtitle')}</p>
              </div>
            </div>

            {/* Master Info */}
            <div className="bg-white rounded-lg p-6 mb-6 border-2 border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('ai.masterWorkflowTitle')}
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-600">{t('ai.nameLabel')}</span>
                  <div className="mt-1 font-mono text-purple-600">{validatedWorkflow.master.name}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">{t('ai.versionLabel')}</span>
                  <div className="mt-1">{validatedWorkflow.master.version}</div>
                </div>
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-600">{t('ai.descriptionLabel')}</span>
                  <div className="mt-1 text-gray-700">{validatedWorkflow.master.description}</div>
                </div>
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-600">{t('ai.tagsLabel')}</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {validatedWorkflow.master.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="bg-white rounded-lg p-6 border-2 border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t('ai.stepsTitle')} ({validatedWorkflow.steps.length})
              </h3>
              
              <div className="relative space-y-4">
                {/* Vertical line */}
                <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
                
                {validatedWorkflow.steps.map((step, i) => (
                  <div key={i} className="relative flex items-start gap-4 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                    {/* Step number */}
                    <div className="relative z-10 flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                      {i + 1}
                    </div>
                    
                    {/* Step content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-gray-900">{step.stepName}</h4>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                          {step.stepKey}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {step.tags.map((tag, j) => (
                          <span key={j} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deploy Button */}
            <div className="mt-6 pt-6 border-t-2 border-green-200">
              <button
                onClick={deployWorkflow}
                disabled={deploying || !selectedAccount}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-[#003399] hover:from-purple-700 hover:to-[#002266] text-white rounded-lg transition-all font-bold text-lg shadow-2xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
              >
                {deploying ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('ai.deployingBtn')}
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t('ai.deployBtn')}
                  </>
                )}
              </button>
              {!selectedAccount && (
                <p className="text-center text-sm text-orange-600 mt-3">
                  {t('ai.walletWarning')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Deployment Timeline */}
        {deploymentLog.length > 0 && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t('ai.deploymentLogTitle')}
            </h3>
            <div
              ref={logRef}
              className="relative space-y-3 max-h-[32rem] overflow-y-auto pr-2"
            >
              {/* Vertical timeline line */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-purple-200 via-blue-200 to-green-200"></div>
              
              {deploymentLog.map((log, i) => {
                // Determine icon and colors based on message content and type
                const getLogStyle = () => {
                  const msg = log.message.toLowerCase();
                  
                  // Phase headers
                  if (msg.includes('phase 1') || msg.includes('uploading')) {
                    return {
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      ),
                      bgColor: 'bg-blue-100',
                      iconColor: 'text-blue-600',
                      borderColor: 'border-blue-200'
                    };
                  }
                  if (msg.includes('phase 2') || msg.includes('preparing')) {
                    return {
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ),
                      bgColor: 'bg-purple-100',
                      iconColor: 'text-purple-600',
                      borderColor: 'border-purple-200'
                    };
                  }
                  if (msg.includes('phase 3') || msg.includes('batching') || msg.includes('signature')) {
                    return {
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      ),
                      bgColor: 'bg-orange-100',
                      iconColor: 'text-orange-600',
                      borderColor: 'border-orange-200'
                    };
                  }
                  
                  // Status types
                  if (log.type === 'success') {
                    return {
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                      bgColor: 'bg-green-100',
                      iconColor: 'text-green-600',
                      borderColor: 'border-green-200'
                    };
                  }
                  if (log.type === 'error') {
                    return {
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                      bgColor: 'bg-red-100',
                      iconColor: 'text-red-600',
                      borderColor: 'border-red-200'
                    };
                  }
                  if (log.type === 'warning') {
                    return {
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ),
                      bgColor: 'bg-yellow-100',
                      iconColor: 'text-yellow-600',
                      borderColor: 'border-yellow-200'
                    };
                  }
                  
                  // Default info style
                  return {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    bgColor: 'bg-gray-100',
                    iconColor: 'text-gray-600',
                    borderColor: 'border-gray-200'
                  };
                };
                
                const style = getLogStyle();
                const isIndented = log.message.startsWith('  ') || log.message.startsWith('›');
                
                return (
                  <div
                    key={i}
                    className={`relative flex items-start gap-3 animate-fadeIn ${isIndented ? 'ml-20' : ''}`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {/* Icon */}
                    {!isIndented && (
                      <div className={`relative z-10 flex-shrink-0 w-12 h-12 ${style.bgColor} ${style.iconColor} rounded-xl flex items-center justify-center shadow-md border-2 ${style.borderColor}`}>
                        {style.icon}
                      </div>
                    )}
                    
                    {/* Content card */}
                    <div className={`flex-1 ${!isIndented ? 'bg-white' : 'bg-gray-50/50'} rounded-lg ${!isIndented ? 'border-2 ' + style.borderColor : 'border border-gray-200'} p-3 ${!isIndented ? 'shadow-sm' : ''} hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${log.type === 'error' ? 'text-red-700 font-semibold' : log.type === 'success' ? 'text-green-700' : 'text-gray-700'} break-words`}>
                            {log.message}
                          </p>
                        </div>
                        {log.timestamp && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Success Result */}
        {deployedMasterHash && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl shadow-xl p-8">
            {/* Success Header with big checkmark like Verify */}
            <div className="flex items-start space-x-4 mb-8">
              <svg className="h-12 w-12 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{t('ai.successTitle')}</h2>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    DEPLOYED
                  </span>
                  {isDeployedFavorited && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full whitespace-nowrap flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      FAVORITED
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-6">{t('ai.successSubtitle')}</p>

                {/* Execute Button */}
                <Link
                  to="/workflows"
                  state={{ prefilledHash: deployedMasterHash }}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-[#003399] text-white rounded-xl hover:from-purple-700 hover:to-[#002266] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 group"
                >
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {t('ai.executeWorkflow')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

