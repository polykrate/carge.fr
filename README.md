# Carge - Decentralized Workflow Verification

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react)](https://reactjs.org/)
[![Powered by Polkadot](https://img.shields.io/badge/Powered%20by-Polkadot-E6007A?logo=polkadot)](https://polkadot.network/)

**Source**: [github.com/polykrate/carge](https://github.com/polykrate/carge)

## Technical Overview

Client-side application for cryptographically verifiable AI/LLM workflows anchored on **Ragchain**, a Substrate parachain. Combines Retrieval-Augmented Generation (RAG) metadata with on-chain proofs and IPFS content addressing.

**What is RAG here?**
RAG (Retrieval-Augmented Generation) workflows are composed of three IPFS-stored components:
- **Instruction CID**: AI prompt/instructions (what to do)
- **Resource CID**: Context documents/data (knowledge base)
- **Schema CID**: JSON Schema for validation (expected output structure)

Optional: **Workflow steps** for multi-step processes (e.g., KYC → Verification → Approval)

**Core Properties:**
- **Zero server trust**: All cryptographic operations in browser
- **On-chain RAG registry**: Metadata indexed by hash(instruction + resource + schema)
- **Client-side encryption**: X25519 ECDH, ChaCha20-Poly1305 AEAD for private workflows
- **Decentralized storage**: IPFS for content, Ragchain for integrity proofs
- **Self-sovereign data**: Users control encryption keys and workflow access

## Interfaces

**Three ways to interact with Ragchain:**

### 1. Human Interface (this repo)
Web application at **carge.fr** for direct user interaction:
- Visual workflow builder and executor
- Wallet integration (Polkadot.js extension)
- Proof verification and history browsing
- Multi-language support (EN/FR)

### 2. AI Agent Interface (MCP)
**Human Context Protocol** - Model Context Protocol server for AI agents:
- MCP tools for Claude Desktop, Cursor, etc.
- Programmatic workflow execution
- Autonomous proof verification
- Multi-agent coordination (Alice/Bob scenarios)

### 3. Backend Integration (MCP Server Mode)
**Same MCP server** can be integrated with enterprise systems:
- ERP/CRM workflow automation
- Legacy system bridging (SAP, Salesforce, etc.)
- Business process orchestration
- Headless compliance operations

**Repository**: `github.com/polykrate/human-context-protocol` *(unreleased)*

**Architecture**:
```
Humans    → carge.fr (React)        ┐
                                     │
AI Agents → MCP Client (Claude)     ├─→ MCP Server ──→ Ragchain (3 pallets)
                                     │      +                  +
ERP/SI    → HTTP/gRPC Bridge        ┘   IPFS Node          IPFS Network
```

All three interfaces share identical cryptographic primitives and blockchain logic.

## Security Architecture

### Cryptographic Stack
```
Signature: sr25519 (Substrate native)
Key Exchange: X25519 ECDH (Curve25519)
Encryption: ChaCha20-Poly1305 IETF (AEAD)
Hashing: BLAKE2b-256 (on-chain) / SHA-256 (IPFS)
Random: crypto.getRandomValues (CSPRNG)
```

### Data Flow
```
1. User generates ephemeral X25519 keypair
2. ECDH with recipient's exchange key → shared secret
3. ChaCha20-Poly1305 encryption (content + CID)
4. Upload to IPFS → immutable CID
5. Submit encrypted metadata + proof to blockchain
6. On-chain verification: hash(content) == stored hash
```

### Trust Model
- **Blockchain**: Immutable audit trail, no data storage
- **IPFS**: Content addressing, no encryption (use client-side)
- **Client**: Key generation, encryption, signature verification
- **No server-side secrets**: Application is fully static (served via CDN)

### Threat Model

**Mitigated:**
- ✅ Server compromise (no server)
- ✅ Data tampering (content-addressed storage + on-chain hashes)
- ✅ XSS attacks (React auto-escaping, no innerHTML)
- ✅ MITM (HTTPS/WSS only, SRI for CDN resources)

**Not Mitigated (User Responsibility):**
- ⚠️ Wallet phishing (use official Polkadot.js extension)
- ⚠️ Browser extensions (can intercept all data)
- ⚠️ Compromised client device
- ⚠️ Social engineering

**Known Limitations:**
- No forward secrecy (ephemeral keys not rotated)
- IPFS metadata leakage (CIDs are public)
- Front-running possible (public mempool)

## Technology Stack

```
Frontend:     React 18, Vite, TailwindCSS
Blockchain:   Ragchain (Substrate parachain), @polkadot/api
Storage:      IPFS/Helia (browser), Kubo (local node)
Crypto:       @noble/curves, @noble/ciphers
Testing:      Vitest, React Testing Library
```

## Quick Start

### Prerequisites
- Node.js 18+
- [Polkadot.js Extension](https://polkadot.js.org/extension/)
- (Optional) [Kubo IPFS node](https://docs.ipfs.tech/install/command-line/) for broadcast mode

### Install & Run
```bash
npm install
npm run dev  # → http://localhost:5173
```

### Build for Production
```bash
npm run build  # Output: dist/
```

## IPFS Storage: Browser vs Full Node

### Browser Mode (Helia)
Default mode when no local Kubo node is detected.

**Capabilities:**
- Content retrieval via WebRTC/WebSockets transports
- Bitswap protocol for block exchange
- HTTP gateway fallback for public CIDs
- Local blockstore in IndexedDB

**Limitations:**
- Cannot accept inbound connections (browser security model)
- No DHT server mode (read-only DHT client)
- Uploads only to HTTP gateway (localhost:5001 or public)
- Content not announced to DHT (no provider records)

**Technical reason:** Browser APIs (WebRTC, WebSocket) cannot listen for incoming connections. Helia operates as a DHT client only.

### Full Node Mode (Kubo)
Activated when local Kubo daemon detected at `http://127.0.0.1:5001`.

**Additional Capabilities:**
- Full DHT participation (announce/discover providers)
- Content pinning and persistent storage
- Serve blocks to P2P network via Bitswap
- Direct upload to local node (no public gateway dependency)

**Data Sovereignty:**
With Kubo, you control:
- Which content is pinned (persistent vs garbage collection)
- Network bandwidth allocation
- Gateway access (localhost only or public)
- Peer connections and swarm configuration

### Kubo Installation

**Linux/macOS:**
```bash
# Install Kubo
wget https://dist.ipfs.tech/kubo/v0.25.0/kubo_v0.25.0_linux-amd64.tar.gz
tar -xvzf kubo_v0.25.0_linux-amd64.tar.gz
cd kubo && sudo bash install.sh

# Configure CORS (required for browser access)
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:5173"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["POST", "GET"]'

# Start daemon
ipfs daemon
```

**Windows:**
Use [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/) (GUI wrapper for Kubo)

**Verification:**
```bash
# Check API endpoint
curl -X POST http://127.0.0.1:5001/api/v0/version

# Expected: {"Version":"0.25.0","Commit":"..."}
```

Application will auto-detect Kubo and display "IPFS Broadcast (X peers)" in header.

## Architecture

### Directory Structure
```
src/
├── components/
│   ├── DynamicForm.jsx         # React-based form renderer (XSS-safe)
│   ├── Header.jsx              # Connection status, wallet selector
│   ├── Layout.jsx              # Page wrapper, navigation
│   └── ErrorBoundary.jsx       # React error isolation
├── contexts/
│   └── AppContext.jsx          # Global state (blockchain, IPFS, wallet)
├── lib/
│   ├── core/
│   │   ├── substrate-client.js     # Polkadot.js RPC wrapper
│   │   ├── ipfs-client.js          # Helia node management
│   │   ├── encryption-utils.js     # X25519 + ChaCha20-Poly1305
│   │   ├── blockchain-utils.js     # Transaction submission
│   │   ├── proof-verifier.js       # On-chain proof verification
│   │   ├── cid-converter.js        # CID ↔ chain format
│   │   └── wallet-connector.js     # Polkadot.js extension API
│   ├── config.js               # RPC endpoints, IPFS gateways
│   ├── i18n.js                 # Internationalization (EN/FR)
│   └── toast.js                # Notification system
├── pages/
│   ├── Home.jsx                # Landing, feature overview
│   ├── Workflows.jsx           # RAG workflow creation
│   ├── Verify.jsx              # Proof verification, workflow continuation
│   ├── QuickSign.jsx           # Simple content signing
│   └── WalletDebug.jsx         # Development tools
└── App.jsx                     # React Router, ErrorBoundary, Toaster

dist/                           # Production build (static files)
public/                         # Static assets
```

### Core Modules

**`substrate-client.js`**
- WebSocket RPC connection with auto-reconnect
- Block polling for proof verification
- Query interface for 3 custom pallets:
  - `pki`: Public key infrastructure (X25519 keys + libp2p peer IDs)
  - `cryptoTrail`: Encrypted CID trails with ephemeral keys
  - `rag`: RAG metadata (instruction/resource/schema CIDs + workflow steps)
- Transaction signing via Polkadot.js extension

**`ipfs-client.js`**
- Helia node lifecycle (start/stop)
- Dual upload: Kubo API (if available) or gateway fallback
- Content retrieval with multi-gateway failover
- WebRTC/WebSocket transports for P2P
- Bootstrap nodes: Protocol Labs + custom

**`encryption-utils.js`**
- `generateEphemeralKeypair()`: X25519 keypair via @noble/curves
- `deriveSharedSecret()`: ECDH key exchange
- `encrypt()`: ChaCha20-Poly1305 with 24-byte nonce
- `decrypt()`: Verify authentication tag, return plaintext
- All operations use `Uint8Array` (no string encoding)

**`blockchain-utils.js`**
- `encryptRagData()`: Orchestrates encryption for RAG workflows
- `submitRagWorkflowStep()`: Dual encryption (content + CID)
- `fetchPkiProfile()`: Retrieve recipient's exchange key
- Content hash calculation (SHA-256)
- CID validation and format conversion

### Data Models (Ragchain Pallets)

**PKI Pallet** - Decentralized key/peer registry for IPFS network:
```rust
struct PkiProfile {
    exchange_key: [u8; 32],        // X25519 public key for ECDH
    peer_id: [u8; 38],             // libp2p multihash peer ID
    profile_cid: Option<[u8; 36]>, // Optional CIDv1 for extended profile
    staked_amount: Balance,        // Anti-spam stake
    created_at: BlockNumber,
    expires_at: BlockNumber,       // TTL for automatic cleanup
}
```

**CryptoTrail Pallet** - Encrypted CID transmission with proof:
```rust
struct CryptoTrail {
    creator: AccountId,            // Who created this trail
    encrypted_cid: [u8; 52],       // ChaCha20-Poly1305 encrypted CIDv1 (36 + 16 auth tag)
    ephemeral_pubkey: [u8; 32],    // Ephemeral X25519 public key
    cid_nonce: [u8; 12],           // Nonce for CID encryption
    content_nonce: [u8; 12],       // Nonce for content encryption
    content_hash: [u8; 32],        // BLAKE2b-256 hash of original content
    substrate_signature: [u8; 64], // Sr25519 signature of content_hash
    created_at: BlockNumber,
    expires_at: BlockNumber,       // TTL (default: 1 month, extendable)
}
```

**RAG Pallet** - Workflow metadata registry:
```rust
struct RagMetadata {
    instruction_cid: [u8; 36],     // CIDv1: AI prompt/instructions
    resource_cid: [u8; 36],        // CIDv1: Context documents/data
    schema_cid: [u8; 36],          // CIDv1: JSON Schema for validation
    steps: BoundedVec<[u8; 32], 64>, // Workflow steps (hashes of RAG metadata)
    created_at: BlockNumber,
    expires_at: BlockNumber,       // TTL for automatic cleanup
    staked_amount: Balance,        // Anti-spam stake
    publisher: AccountId,
    name: BoundedVec<u8, 50>,      // RAG name (max 50 chars)
    description: BoundedVec<u8, 300>, // Description (max 300 chars)
    tags: BoundedVec<BoundedVec<u8, 15>, 10>, // Up to 10 tags (15 chars each)
}
```

**Storage Keys:**
- PKI: Indexed by `AccountId`
- CryptoTrail: Indexed by `content_hash` (BLAKE2-256)
- RAG: Indexed by `hash(instruction_cid || resource_cid || schema_cid || steps)`

### Ragchain Pallet Interactions

**Workflow execution pattern:**

1. **PKI Setup** (once per user):
   ```rust
   pki.set_profile(
     exchange_key,  // X25519 public key
     peer_id,       // libp2p peer ID for IPFS
     profile_cid,   // Optional: extended profile on IPFS
     ttl            // Time-to-live for auto-cleanup
   )
   ```

2. **RAG Publication** (workflow creator):
   ```rust
   rag.store_metadata(
     instruction_cid,  // AI prompt (IPFS)
     resource_cid,     // Context data (IPFS)
     schema_cid,       // JSON Schema (IPFS)
     steps,            // Optional: [hash1, hash2, ...] for multi-step
     name, description, tags  // Metadata for discovery
   )
   ```

3. **CryptoTrail Submission** (workflow execution):
   ```rust
   cryptoTrail.store_trail(
     encrypted_cid,        // ChaCha20 encrypted CIDv1 of result
     ephemeral_pubkey,     // X25519 ephemeral key
     cid_nonce,            // Nonce for CID encryption
     content_nonce,        // Nonce for content encryption
     content_hash,         // BLAKE2-256 of original content
     substrate_signature   // Sr25519 signature
   )
   ```

**Data flow:**
```
Alice → PKI (register exchange_key + peer_id)
     ↓
Alice → RAG (publish workflow: instruction + resource + schema)
     ↓
Bob   → Fetch RAG metadata, execute workflow, encrypt result
     ↓
Bob   → CryptoTrail (submit encrypted CID + proof)
     ↓
Alice → Decrypt CID using Bob's ephemeral_pubkey + her exchange_key
     ↓
Alice → Retrieve content from IPFS using decrypted CID
```

### Configuration (`src/lib/config.js`)

```javascript
export const config = {
  // Ragchain (Substrate parachain on Tanssi)
  SUBSTRATE_WS_URL: 'wss://fraa-flashbox-4667-rpc.a.stagenet.tanssi.network',
  CHAIN_NAME: 'Ragchain',
  
  // IPFS
  IPFS_UPLOAD_URL: 'http://127.0.0.1:5001/api/v0/add',
  IPFS_PUBLIC_GATEWAYS: [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
  ],
  
  // App
  APP_NAME: 'Carge',
  APP_VERSION: '1.0.0',
};
```

### Security Considerations

**Client-Side Only:**
- All private keys remain in browser memory (no server)
- Ephemeral X25519 keys generated per-session
- Wallet private key never exposed (Polkadot.js extension API)

**XSS Prevention:**
- React auto-escaping for all user content
- No `dangerouslySetInnerHTML` usage
- Dynamic forms rendered via `React.createElement` (no HTML injection)

**IPFS Security:**
- CIDs are content-addressed (tamper-evident)
- Content encryption before upload (IPFS nodes see only ciphertext)
- Schema validation for user-provided JSON

**Blockchain Security:**
- Proofs are immutable (append-only ledger)
- Signature verification via sr25519
- Transaction replay protection (nonce, era)

## Development

### Testing
```bash
npm run test          # Run unit tests (Vitest)
npm run test:ui       # Test UI with coverage
```

**Test Coverage:**
- `encryption-utils.test.js`: Cryptographic primitives
- `cid-converter.test.js`: IPFS CID encoding/decoding
- `proof-verifier.test.js`: On-chain verification logic
- `substrate-client.test.js`: Blockchain RPC mocking

### Build
```bash
npm run build         # Production build → dist/
npm run preview       # Test production build locally
```

**Build Configuration:**
- Vite bundles: Code splitting by route
- Vendor chunks: `react-vendor`, `polkadot-vendor`, `ipfs-vendor`
- Content Security Policy: See `netlify.toml`

## Security

**Reporting Vulnerabilities:**
See [SECURITY.md](SECURITY.md) for responsible disclosure process.

**Known Issues:**
- IPFS gateway timeout: 30s (may fail for large CIDs)
- Substrate RPC: Single endpoint (no fallback yet)
- Browser memory limits: ~50MB for large IPFS blocks

**Audit Status:**
- ❌ No external security audit (as of 2025-01)
- ✅ Static analysis: ESLint, TypeScript (dev time)
- ✅ Dependency audit: `npm audit` (regular)

## Contributing

Pull requests accepted. See [CONTRIBUTING.md](CONTRIBUTING.md) for code style and review process.

**Development Priorities:**
1. Schema validation for RAG workflows (XSS prevention)
2. Multi-RPC fallback for Substrate (reliability)
3. IPFS pinning service integration (w3.storage, Pinata)
4. Hardware wallet support (Ledger, Trezor)

## License

GPL-3.0 © 2025 Jean-François Meneust

**Support Development:**
Polkadot: `5C4kKzKyDuZTu3Qa89soZWdRfFRJzvTjVVDTNqAKPuzXcaRa`
