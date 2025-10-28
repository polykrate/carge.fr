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

I need a blockchain workflow for supply chain traceability. Please help me create it step by step.

## Step 1: Gather Requirements

Ask me these questions:
1. **Industry/Product**: What type of supply chain? (e.g., spirits, food, electronics)
2. **Number of Steps**: How many stages in your supply chain?
3. **For Each Step**:
   - Step identifier (e.g., "production", "distribution")
   - Actor name (e.g., "Distillery", "Distributor", "Retailer")
   - What data to capture? (fields, types, validations)
   - Real-world example of this step

## Step 2: Generate JSON Workflow

Once I answer, generate the complete JSON in a **code artifact** (Claude) or **code block** (ChatGPT) with this exact structure:

\`\`\`json
{
  "master": {
    "name": "short-name-v1",
    "description": "Brief workflow description",
    "instruction": "MASTER WORKFLOW - [Title]\\n\\n[Description]\\n\\nWorkflow Steps:\\n1. [STEP 1] - [Description]\\n   Actor: [Name]\\n   Key: [stepKey]\\n...",
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
            "required": ["actorName", "otherRequiredFields"],
            "properties": {
              "actorName": {
                "type": "string",
                "minLength": 1,
                "maxLength": 200,
                "description": "Name of the actor performing this step"
              }
            }
          }
        }
      }
    }
  ]
}
\`\`\`

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

## BLOCKCHAIN LIMITS (Critical!)

| Field | Limit | Notes |
|-------|-------|-------|
| master.name | ≤ 50 chars | Used in all RAG step names |
| master.description | ≤ 300 chars | |
| master.tags | ≤ 10 tags, each ≤ 15 chars | |
| step.stepKey | ≤ 50 chars | |
| step.description | ≤ 300 chars | |
| step.tags | ≤ 10 tags, each ≤ 15 chars | |
| steps array | ≤ 64 steps | |
| **RAG Name** | **≤ 50 chars** | **stepKey + "-" + master.name** |

**Example**: If master.name = "spirits-v1" (10 chars), then stepKey max = 39 chars (50 - 1 for "-" - 10)

## Critical Rules

1. **FIRST field** in each step schema MUST be the actor's name (producerName, distributorName, etc.)
2. Each step needs: \`stepKey\`, \`stepName\`, \`description\`, \`instruction\`, \`resource\`, \`tags\`, \`schema\`
3. Schema follows JSON Schema standard (type, required, properties, etc.)
4. Tags format: \`["industry", "stepKey", "step-N", "version"]\`
5. **Always check**: \`stepKey.length + 1 + master.name.length ≤ 50\`

---

Ready! Ask me your questions now, then generate the JSON.`;

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
                // Check first field is actor name
                const firstField = Object.keys(stepSchema.properties)[0];
                if (!firstField || !firstField.toLowerCase().includes('name')) {
                  errors.push(`${prefix}: First field in schema must be actor's name (e.g., "producerName", "distributorName")`);
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
      addLog('🚀 Starting workflow deployment...', 'info');
      
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
      
      const stepHashes = [];
      
      // Deploy each step
      for (let i = 0; i < validatedWorkflow.steps.length; i++) {
        const step = validatedWorkflow.steps[i];
        addLog(`\n📝 Step ${i + 1}/${validatedWorkflow.steps.length}: ${step.stepName}`, 'info');
        
        // Upload schema to IPFS
        addLog(`  ⏳ Uploading schema to IPFS...`, 'info');
        const schemaJson = JSON.stringify(step.schema);
        const schemaBytes = new TextEncoder().encode(schemaJson);
        const schemaCid = await ipfsClient.uploadFile(schemaBytes);
        addLog(`  ✅ Schema CID: ${schemaCid}`, 'success');
        addLog(`  📡 Broadcasting to IPFS network...`, 'info');
        
        // Upload instruction if provided
        let instructionCid = null;
        if (step.instruction) {
          addLog(`  ⏳ Uploading instruction...`, 'info');
          const instructionBytes = new TextEncoder().encode(step.instruction);
          instructionCid = await ipfsClient.uploadFile(instructionBytes);
          addLog(`  ✅ Instruction CID: ${instructionCid}`, 'success');
          addLog(`  📡 Broadcasting to IPFS network...`, 'info');
        }
        
        // Upload resource if provided
        let resourceCid = null;
        if (step.resource) {
          addLog(`  ⏳ Uploading resource...`, 'info');
          const resourceBytes = new TextEncoder().encode(step.resource);
          resourceCid = await ipfsClient.uploadFile(resourceBytes);
          addLog(`  ✅ Resource CID: ${resourceCid}`, 'success');
          addLog(`  📡 Broadcasting to IPFS network...`, 'info');
        }
        
        // Create RAG step on blockchain
        addLog(`  ⏳ Creating RAG step on blockchain...`, 'info');
        
        // Generate step name with 50 char limit (blockchain constraint)
        let stepName = `${step.stepKey}-${validatedWorkflow.master.name}`;
        if (stepName.length > 50) {
          // Truncate intelligently: keep stepKey + truncated master name
          const maxMasterNameLength = 50 - step.stepKey.length - 1; // -1 for the dash
          const truncatedMasterName = validatedWorkflow.master.name.substring(0, maxMasterNameLength);
          stepName = `${step.stepKey}-${truncatedMasterName}`;
          addLog(`  ⚠️ Step name truncated to 50 chars: ${stepName}`, 'warning');
        }
        
        // Convert CIDs to chain format (36 bytes) and then to hex
        const { u8aToHex } = await import('@polkadot/util');
        const schemaHex = schemaCid 
          ? u8aToHex(CidConverter.toChainFormat(schemaCid))
          : u8aToHex(createEmptyCid());
        const instructionHex = instructionCid 
          ? u8aToHex(CidConverter.toChainFormat(instructionCid))
          : u8aToHex(createEmptyCid());
        const resourceHex = resourceCid 
          ? u8aToHex(CidConverter.toChainFormat(resourceCid))
          : u8aToHex(createEmptyCid());
        
        const stepHash = await ragClient.storeRagMetadata(
          selectedAccount,
          stepName,
          step.description,
          instructionHex,
          resourceHex,
          schemaHex,
          [], // No steps for step RAGs
          step.tags,
          null // Use default TTL
        );
        
        stepHashes.push({
          stepNumber: i + 1,
          stepKey: step.stepKey,
          stepName: step.stepName,
          hash: stepHash,
          schemaCid,
          instructionCid,
          resourceCid
        });
        
        // Note: storeRagMetadata logs if RAG already exists
        addLog(`  ✅ Step hash: ${stepHash}`, 'success');
      }
      
      // Create master workflow
      addLog(`\n🎯 Creating master workflow...`, 'info');
      
      // Upload master instruction
      let masterInstructionCid = null;
      if (validatedWorkflow.master.instruction) {
        addLog(`  ⏳ Uploading master instruction...`, 'info');
        const masterInstructionBytes = new TextEncoder().encode(validatedWorkflow.master.instruction);
        masterInstructionCid = await ipfsClient.uploadFile(masterInstructionBytes);
        addLog(`  ✅ Master instruction CID: ${masterInstructionCid}`, 'success');
        addLog(`  📡 Broadcasting to IPFS network...`, 'info');
      }
      
      // Upload master resource
      let masterResourceCid = null;
      if (validatedWorkflow.master.resource) {
        addLog(`  ⏳ Uploading master resource...`, 'info');
        const masterResourceBytes = new TextEncoder().encode(validatedWorkflow.master.resource);
        masterResourceCid = await ipfsClient.uploadFile(masterResourceBytes);
        addLog(`  ✅ Master resource CID: ${masterResourceCid}`, 'success');
        addLog(`  📡 Broadcasting to IPFS network...`, 'info');
      }
      
      // Create master RAG
      addLog(`  ⏳ Creating master RAG on blockchain...`, 'info');
      
      // Convert master CIDs to chain format and then to hex
      const { u8aToHex } = await import('@polkadot/util');
      const masterSchemaHex = u8aToHex(createEmptyCid()); // No schema for master
      const masterInstructionHex = masterInstructionCid 
        ? u8aToHex(CidConverter.toChainFormat(masterInstructionCid))
        : u8aToHex(createEmptyCid());
      const masterResourceHex = masterResourceCid 
        ? u8aToHex(CidConverter.toChainFormat(masterResourceCid))
        : u8aToHex(createEmptyCid());
      
      // Add 'master' tag if not present
      const masterTags = validatedWorkflow.master.tags.includes('master') 
        ? validatedWorkflow.master.tags 
        : ['master', ...validatedWorkflow.master.tags];
      
      const masterHash = await ragClient.storeRagMetadata(
        selectedAccount,
        validatedWorkflow.master.name,
        validatedWorkflow.master.description,
        masterInstructionHex,
        masterResourceHex,
        masterSchemaHex,
        stepHashes.map(s => s.hash), // All step hashes
        masterTags,
        null // Use default TTL
      );
      
      // Note: storeRagMetadata logs if RAG already exists
      addLog(`  ✅ Master hash: ${masterHash}`, 'success');
      setDeployedMasterHash(masterHash);
      
      // Success summary
      addLog(`\n🎉 DEPLOYMENT SUCCESSFUL!`, 'success');
      addLog(`\n📋 Workflow Details:`, 'info');
      addLog(`  Name: ${validatedWorkflow.master.name}`, 'info');
      addLog(`  Master Hash: ${masterHash}`, 'success');
      addLog(`  Total Steps: ${stepHashes.length}`, 'info');
      addLog(`\n📦 Step Hashes:`, 'info');
      stepHashes.forEach(s => {
        addLog(`  ${s.stepNumber}. ${s.stepName} (${s.stepKey}): ${s.hash}`, 'info');
      });
      
      showSuccess('Workflow deployed successfully!');
      
    } catch (error) {
      logger.error('Deployment failed:', error);
      addLog(`\n❌ DEPLOYMENT FAILED: ${error.message}`, 'error');
      showError('Deployment failed. Check logs for details.');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-light mb-4">{t('ai.title')}</h1>
              <p className="text-gray-600">{t('ai.subtitle')}</p>
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
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('ai.step1Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('ai.step1Desc')}</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('ai.step2Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('ai.step2Desc')}</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-[#003399] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{t('ai.step3Title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('ai.step3Desc')}</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
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

        {/* Deployment Log */}
        {deploymentLog.length > 0 && (
          <div className="mb-8 bg-gray-900 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('ai.deploymentLogTitle')}
            </h3>
            <div
              ref={logRef}
              className="bg-black rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm"
            >
              {deploymentLog.map((log, i) => (
                <div
                  key={i}
                  className={`mb-1 ${
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}
                >
                  {log.message}
                </div>
              ))}
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
  );
};

