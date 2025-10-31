# Carge - Cryptographic Authenticity & RAG Protocol

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react)](https://reactjs.org/)
[![Powered by Polkadot](https://img.shields.io/badge/Powered%20by-Polkadot-E6007A?logo=polkadot)](https://polkadot.network/)

**Source**: [github.com/polykrate/carge](https://github.com/polykrate/carge)  
**Web App**: [carge.fr](https://carge.fr)

## Universal Cryptographic Certification Protocol

**CARGE** is a blockchain-based protocol for creating unfakeable certificates with complete audit trails. Fight counterfeiting, certify documents, and build verifiable multi-party workflows using cryptographic signatures anchored on an immutable ledger.

**Zero Trust Architecture.** No centralized server. No database to hack. Just client-side cryptography and blockchain verification. Works for Human-Human, AI-Human, or AI-AI interactions with identical security guarantees.

## Technical Overview

Client-side web application for cryptographically verifiable workflows anchored on **Ragchain**, a Substrate parachain. Combines multi-party signatures, RAG (Retrieval-Augmented Generation) metadata, on-chain proofs, and IPFS content addressing to create tamper-proof audit trails.

**Workflow Components:**
- **Instruction CID**: Workflow instructions/prompts (what needs to be done)
- **Resource CID**: Supporting documents/data (product info, legal docs, etc.)
- **Schema CID**: JSON Schema for data validation (expected output format)
- **Workflow Steps**: Multi-step processes with cryptographic chain of trust (e.g., Production → Export → Import → Retail → Customer)

**Core Properties:**
- **Zero server trust**: All cryptographic operations in browser, no centralized infrastructure
- **On-chain registry**: Workflow metadata and proofs indexed by cryptographic hash
- **Client-side encryption**: X25519 ECDH, ChaCha20-Poly1305 AEAD for private multi-party workflows
- **Decentralized storage**: IPFS for content, Ragchain for integrity proofs
- **Universal protocol**: Same cryptographic primitives whether participants are humans, automated systems, or AI agents

## Use Cases

### 1. Anti-Counterfeiting & Supply Chain Traceability
Track premium products (wines, automotive parts, luxury goods) through their entire supply chain. Each actor cryptographically signs their step, creating an unfakeable chain of custody from production to customer.

**Example:** Macallan 25 Years whisky tracked from Scottish distillery → UK export → French import → Hong Kong logistics → Chinese customs → retail store → final customer. Each QR scan verifies the complete blockchain-certified history.

### 2. Document Certification & Legal Proof
Certify contracts, diplomas, certificates, or any document with blockchain-anchored timestamps. Legally recognized in France (2025 Marseille precedent validates cryptographic signatures as court evidence).

**Example:** Sign employment contracts with legally-binding timestamps. No notary required, instant verification, permanent immutable proof.

### 3. Multi-Party Business Workflows
Build complex workflows requiring validation from multiple parties (KYC processes, regulatory compliance, cross-organization approvals). Each step cryptographically signed and verifiable.

**Example:** Export compliance workflow where customs authorities, freight companies, and importers all sign their validation steps. Complete audit trail for regulatory authorities.

### 4. RAG Context Certification (Advanced)
AI agents can connect to the protocol via MCP (Model Context Protocol) to retrieve certified contexts for verifiable AI execution. **Note:** MCP server not yet publicly released - contact for early access.

## Why This Matters

**$461B Lost to Counterfeiting Annually**

Traditional authentication methods (certificates, holograms, QR codes) are easily faked. Centralized databases can be hacked. Paper trails can be forged.

**The Problem with Existing Solutions:**
- **Centralized databases**: Single point of failure, can be compromised or manipulated
- **Paper certificates**: Trivial to forge, no real-time verification
- **Simple QR codes**: Can be copied and reused on counterfeit products
- **No audit trail**: Impossible to reconstruct complete chain of custody

**CARGE's Cryptographic Solution:**
- **Immutable**: Signatures published on blockchain cannot be retroactively modified
- **Verifiable**: Anyone can cryptographically verify authenticity without trusting a central authority
- **Traceable**: Complete audit trail showing who signed what, when
- **Unfakeable**: Would require stealing multiple private keys and rewriting blockchain history

**Protocol-First Design**: CARGE is fundamentally a cryptographic protocol. The web interface is one way to use it. Backend systems can integrate directly via the Substrate API. AI agents can connect via MCP for autonomous verification.

## How to Use CARGE

**Multiple integration options for developers:**

### 1. Web Interface (This Repository)
Web application at **[carge.fr](https://carge.fr)** for direct user interaction:
- **AI-Assisted Workflow Builder**: Create complex workflows with AI guidance (copy prompts → paste JSON → validate → deploy)
- Visual workflow executor with dynamic forms
- Browser-based wallet integration (Polkadot.js extension)
- Proof verification and QR code scanning
- Multi-language support (EN/FR)
- **Use Case**: Quick prototyping, manual workflows, customer-facing verification

### 2. Direct Blockchain Integration
Integrate directly with Ragchain using Substrate APIs:
- Full control over transaction submission and signature logic
- Custom workflow orchestration in your backend
- ERP/CRM integration for automated compliance
- Headless business process execution
- **Use Case**: Enterprise systems, automated supply chain tracking, custom implementations

### 3. AI Agent Interface via MCP (Coming Soon)
**Human Context Protocol** - Model Context Protocol server for AI agents:
- Native integration with Claude Desktop, Cursor, and MCP-compatible AI clients
- AI agents can read/write certified contexts and verify proofs autonomously
- **Status**: Not yet publicly released - contact `jf.meneust@gmail.com` for early access
- **Repository**: `github.com/polykrate/human-context-protocol` (private)
- **Use Case**: Autonomous AI verification, AI-assisted compliance workflows

---

**Universal Cryptographic Protocol**: All three interfaces use identical cryptographic primitives and blockchain logic. Whether you're building for humans, backend systems, or AI agents, the security guarantees are the same.

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
- ✅ **Prompt poisoning** (contexts stored on immutable blockchain, cryptographically signed)
- ✅ **Server compromise** (no server - fully client-side and on-chain)
- ✅ **Context tampering** (content-addressed storage + on-chain hashes verify integrity)
- ✅ **Unauthorized context modification** (signature verification for all updates)
- ✅ **XSS attacks** (React auto-escaping, no innerHTML)
- ✅ **MITM** (HTTPS/WSS only, SRI for CDN resources)

**Not Mitigated (User Responsibility):**
- ⚠️ Wallet phishing (use official Polkadot.js extension)
- ⚠️ Browser extensions (can intercept all data)
- ⚠️ Compromised client device
- ⚠️ Social engineering

**Known Limitations:**
- No forward secrecy (ephemeral keys not rotated)
- IPFS metadata leakage (CIDs are public, content-addressed)
- Front-running possible (public mempool)

## Technology Stack

```
Frontend:     React 18, Vite, TailwindCSS
Blockchain:   Ragchain (Substrate/Tanssi), @polkadot/api
Security:     Symbiotic restaking protocol ($250M+ stake)
Storage:      IPFS/Helia (browser), Kubo (local node)
Crypto:       @noble/curves, @noble/ciphers
Testing:      Vitest, React Testing Library
```

**Security Infrastructure:**
- [Symbiotic Network](https://app.symbiotic.fi/network/0x8c1a46D032B7b30D9AB4F30e51D8139CC3E85Ce3) - Restaking protocol securing the network with $250M+ in staked assets

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
│   ├── AI.jsx                  # AI-assisted workflow builder (NEW)
│   ├── Workflows.jsx           # RAG workflow creation and execution
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
- Query interface for Ragchain pallets
- Transaction signing via Polkadot.js extension

**`ipfs-client.js`**
- Helia node lifecycle management
- Dual upload: Kubo (if available) or gateway fallback
- Multi-gateway content retrieval

**`encryption-utils.js`**
- Ephemeral keypair generation
- ECDH key exchange
- AEAD encryption/decryption

**`blockchain-utils.js`**
- Workflow submission orchestration
- PKI profile management
- Content hashing and CID conversion

### Blockchain Integration

**Ragchain Pallets:**

Carge interacts with a custom Substrate parachain featuring specialized pallets for:
- **PKI**: Decentralized public key registry (exchange keys + peer IDs)
- **CryptoTrail**: Encrypted proof submissions with ephemeral keys
- **RAG**: Workflow metadata registry (instruction/resource/schema CIDs)

All pallets feature:
- Anti-spam staking mechanisms
- TTL-based automatic cleanup
- Content-addressed storage keys

**Workflow Pattern:**
```
1. Register PKI profile (exchange keys + peer ID)
2. Publish RAG workflow metadata on-chain
3. Execute workflow → encrypt result
4. Submit encrypted proof via CryptoTrail pallet
5. Recipient decrypts CID → retrieves content from IPFS
```

For detailed pallet specifications, see Ragchain repository (contact: jf.meneust@gmail.com).

### Configuration (`src/lib/config.js`)

Configuration includes:
- Ragchain RPC endpoints (WebSocket + HTTP)
- IPFS gateway URLs (public + optional local Kubo)
- Application metadata (name, version)

See `src/lib/config.js` for current network endpoints.

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
- Polkadot: `5C4kKzKyDuZTu3Qa89soZWdRfFRJzvTjVVDTNqAKPuzXcaRa`
- Ethereum: `0x99dAE932C2252A6f7d65A2C0f176F754F69a1e0e`