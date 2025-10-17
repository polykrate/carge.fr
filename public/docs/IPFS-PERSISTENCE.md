# IPFS Data Persistence Guide

## Understanding IPFS

### What IPFS Is
- **Decentralized**: Content-addressed storage distributed across multiple nodes
- **Content-Addressed**: Files are identified by their cryptographic hash (CID)
- **Peer-to-Peer**: No central authority, nodes communicate directly

### What IPFS Is NOT
- **NOT Permanent by Default**: Files disappear when no node hosts them
- **NOT Automatic Backup**: Requires active pinning for persistence
- **NOT Blockchain**: IPFS is a separate distributed file system

## The Pinning Problem

### How IPFS Works
1. You upload a file → Get a CID (e.g., `bafybeiexample...`)
2. File is stored on your local node
3. Other nodes can retrieve it **while your node is online**
4. When your node goes offline → File becomes unavailable
5. After garbage collection → File is permanently lost

### The Solution: Pinning
**Pinning** prevents garbage collection and keeps files available:

```bash
# Pin a file on your local Kubo node
ipfs pin add <CID>

# List pinned files
ipfs pin ls

# Remove a pin (file becomes eligible for garbage collection)
ipfs pin rm <CID>
```

## Production Deployment Strategies

### Option 1: Self-Hosted Pinning
Run your own IPFS node and pin critical content:

```bash
# Start Kubo daemon
ipfs daemon

# Pin your content
ipfs pin add <CID>

# Ensure the daemon runs 24/7 (systemd, docker, etc.)
```

**Pros**: Full control, no third-party dependency  
**Cons**: Requires infrastructure, monitoring, backups

### Option 2: Pinning Services (Recommended for Production)

#### Pinata
```bash
# Upload via API
curl -X POST "https://api.pinata.cloud/pinning/pinFileToIPFS" \
  -H "pinata_api_key: YOUR_API_KEY" \
  -H "pinata_secret_api_key: YOUR_SECRET_KEY" \
  -F "file=@myfile.json"
```

**Pricing**: Free tier available, paid plans for more storage  
**Website**: https://pinata.cloud

#### Web3.Storage
```javascript
import { Web3Storage } from 'web3.storage'

const client = new Web3Storage({ token: API_TOKEN })
const cid = await client.put(files)
```

**Pricing**: Free (backed by Filecoin)  
**Website**: https://web3.storage

#### Infura IPFS
```bash
curl -X POST "https://ipfs.infura.io:5001/api/v0/add" \
  -u "PROJECT_ID:PROJECT_SECRET" \
  -F file=@myfile.json
```

**Pricing**: Free tier, paid plans available  
**Website**: https://infura.io/product/ipfs

### Option 3: Filecoin (Long-term Archival)
Use Filecoin for permanent, incentivized storage:

```javascript
// Store on Filecoin via Web3.Storage
// Data is automatically backed by Filecoin deals
const cid = await client.put(files)
```

**Pros**: Cryptoeconomic guarantees, permanent storage  
**Cons**: Higher latency for retrieval, more complex

## Carge Implementation

### Current Architecture
1. **Upload**: Files uploaded to local Kubo node (`http://127.0.0.1:5001`)
2. **Blockchain**: Only CID stored on-chain (not the file content)
3. **Retrieval**: Browser client tries Helia (P2P) then HTTP gateways

### What You Need to Do

#### For Development
```bash
# Start local Kubo node
ipfs daemon

# Upload via Carge interface
# CID is stored on blockchain

# Pin important data manually
ipfs pin add <CID>
```

#### For Production
**CRITICAL**: Implement pinning service integration:

1. **Sign up** for pinning service (Pinata, Web3.Storage, Infura)
2. **Modify** `src/lib/core/ipfs-client.js`:
   ```javascript
   async uploadFile(data) {
     // Upload to pinning service instead of local node
     const response = await fetch('https://api.pinata.cloud/pinning/...', {
       method: 'POST',
       headers: {
         'pinata_api_key': PINATA_KEY,
         'pinata_secret_api_key': PINATA_SECRET
       },
       body: formData
     });
     
     const { IpfsHash: cid } = await response.json();
     
     // Now the file is pinned permanently by Pinata
     return cid;
   }
   ```
3. **Monitor** pinning status via service dashboard
4. **Backup** critical CIDs and data separately

## Best Practices

### ✅ Do
- Pin all production data on reliable nodes/services
- Use multiple pinning services for critical content (redundancy)
- Monitor pinning status regularly
- Store CIDs on blockchain for verification
- Test data retrieval from different networks/locations

### ❌ Don't
- Rely on local-only IPFS nodes for production
- Assume uploaded data is permanent without pinning
- Use IPFS for time-sensitive critical data without backups
- Forget to budget for pinning service costs

## Verification

### Check if Data is Available
```bash
# Via IPFS CLI
ipfs cat <CID>

# Via HTTP Gateway
curl https://ipfs.io/ipfs/<CID>

# Via Helia (browser)
const text = await ipfsClient.downloadText(cid)
```

### Monitor Pinning Status
```bash
# Pinata API
curl "https://api.pinata.cloud/data/pinList?status=pinned" \
  -H "pinata_api_key: YOUR_KEY"

# Web3.Storage
curl "https://api.web3.storage/user/uploads" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Cost Estimation

### Typical Use Case (Carge Workflow)
- **Workflow Schema**: ~10KB JSON
- **Encrypted RAG Data**: ~50-200KB
- **Monthly Uploads**: ~1000 workflows
- **Total Storage**: ~60-210 MB/month

### Pinning Service Costs
| Service | Free Tier | Cost (100GB) |
|---------|-----------|--------------|
| Pinata | 1GB | $20/month |
| Web3.Storage | Unlimited* | Free** |
| Infura IPFS | 5GB | $50/month |

*Subject to fair use policy  
**Backed by Filecoin protocol

## Security Considerations

### Data Privacy
- **IPFS is PUBLIC**: Anyone with CID can access data
- **Encryption Required**: Carge encrypts sensitive data before upload
- **CID Reveals Content**: Same file = same CID (hash)

### Mitigation Strategies
1. **Encrypt before upload** (Carge already does this)
2. **Don't share CIDs publicly** unless intended
3. **Use private IPFS networks** for sensitive deployments
4. **Implement access control** at application layer (NFT-gated, etc.)

## FAQ

### Q: If I pin data, is it permanent forever?
**A**: As long as you (or the pinning service) keeps it pinned. Cancel subscription = data may be deleted.

### Q: Can I delete data from IPFS?
**A**: You can unpin it from your nodes, but if others pinned it, it remains available.

### Q: What happens if my pinning service shuts down?
**A**: Your data becomes unavailable. Use multiple services for critical content.

### Q: Is IPFS slower than traditional hosting?
**A**: Initial retrieval can be slower. Use HTTP gateways as fallback (Carge does this).

### Q: Do I need blockchain AND IPFS?
**A**: For Carge's use case:
- **Blockchain**: Stores CID + proof (small, permanent, expensive)
- **IPFS**: Stores large files (cheap, requires pinning)

## Resources

- [IPFS Documentation](https://docs.ipfs.tech/)
- [Pinning Services Comparison](https://docs.ipfs.tech/how-to/work-with-pinning-services/)
- [Filecoin Documentation](https://docs.filecoin.io/)
- [Carge GitHub](https://github.com/polykrate/carge-react)

---

**Last Updated**: October 17, 2025  
**Maintainer**: Carge Team


