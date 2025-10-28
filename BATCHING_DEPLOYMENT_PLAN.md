# Batching Deployment Plan

## Current Problem
- Each RAG step requires a separate wallet signature
- Sequential uploads slow down the process
- User must sign 5+ times for a typical workflow

## Solution: 3-Phase Batched Deployment

### Phase 1: Upload ALL CIDs to IPFS (Parallel)
```javascript
const uploadPromises = [];

// Upload all step CIDs in parallel
for (step of steps) {
  uploadPromises.push(uploadStepCids(step));
}

// Upload master CIDs in parallel
uploadPromises.push(uploadMasterCids(master));

const allCids = await Promise.all(uploadPromises);
```

### Phase 2: Prepare ALL Extrinsics (No Signing Yet)
```javascript
const extrinsics = [];

// Prepare step extrinsics
for (step of steps) {
  const ex = api.tx.rag.storeMetadata(...);
  extrinsics.push(ex);
}

// Calculate step hashes for master
const stepHashes = extrinsics.map(ex => calculateMetadataHash(ex));

// Prepare master extrinsic with step hashes
const masterEx = api.tx.rag.storeMetadata(..., stepHashes, ...);
extrinsics.push(masterEx);
```

### Phase 3: Batch and Sign Once
```javascript
// Batch all transactions together
const batchTx = api.tx.utility.batchAll(extrinsics);

// Sign and send - ONLY ONE SIGNATURE!
await batchTx.signAndSend(account, { signer }, (result) => {
  if (result.status.isInBlock) {
    // Extract all metadata hashes from events
    const metadataStoredEvents = result.events
      .filter(({ event }) => event.section === 'rag' && event.method === 'MetadataStored');
    
    const stepHashes = metadataStoredEvents.slice(0, -1).map(e => e.event.data[0]);
    const masterHash = metadataStoredEvents[metadataStoredEvents.length - 1].event.data[0];
  }
});
```

## Benefits
- ✅ **Single signature** for entire workflow
- ✅ **Parallel IPFS uploads** (5x faster)
- ✅ **Better UX** - user signs once at the end
- ✅ **Atomic deployment** - all or nothing (with batchAll)

## Implementation Files
- `/src/lib/core/rag-client.js` - Add `prepareRagMetadataExtrinsic()`
- `/src/pages/AI.jsx` - Refactor `deployWorkflow()` to 3 phases

