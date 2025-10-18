# Carge - Code as Law

> Transform regulatory and technical processes into executable workflows with cryptographic audit trails.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react)](https://reactjs.org/)
[![Powered by Polkadot](https://img.shields.io/badge/Powered%20by-Polkadot-E6007A?logo=polkadot)](https://polkadot.network/)

**Website**: [carge.fr](http://carge.fr) | **GitHub**: [polykrate/carge](https://github.com/polykrate/carge)

## What is Carge?

A Web3 platform for executable compliance workflows with:
- 🔐 **Cryptographic audit trails** - Every action recorded on Substrate blockchain
- 📦 **IPFS storage** - Decentralized content addressing
- 🤖 **AI-powered** - Natural language to executable workflows
- 🌍 **Interoperable** - W3C Verifiable Credentials, NFT-gated access

## Tech Stack

React 18 • Vite • Substrate/Polkadot • IPFS/Helia • Tailwind CSS

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

## IPFS: Limited vs Broadcast Mode

Carge uses IPFS for decentralized storage with two modes:

### 🟠 Limited Mode (Browser only - Helia)
**What you get:**
- ✅ Download CIDs from multiple sources (P2P + gateways)
- ✅ Local cache in browser (IndexedDB)
- ✅ Connect to P2P network (WebRTC + WebSockets)

**Limitations:**
- ❌ Cannot accept incoming P2P connections (browser security)
- ❌ Cannot broadcast/serve CIDs to the network
- ❌ Your uploaded content only available via public gateways

**Why?** Browsers cannot listen for incoming connections or run DHT servers. Helia works as a **client-only** P2P node.

### 🟢 Broadcast Mode (Kubo node)
**What you get:**
- ✅ Everything from Limited mode
- ✅ **Upload AND broadcast** CIDs to IPFS network
- ✅ **Serve content** to other peers via DHT
- ✅ **Announce to network** that you have specific CIDs
- ✅ Act as a full IPFS node

**Why install Kubo?**
When you upload content in Limited mode, only public HTTP gateways can serve it. With Kubo:
1. You become a **seed** for your content
2. Content is **announced to DHT** (other nodes can discover it)
3. P2P retrieval works globally (not just HTTP gateways)
4. You control your data persistence

### Installing Kubo (5 minutes)

**macOS / Linux:**
```bash
# Download and install
wget https://dist.ipfs.tech/kubo/v0.25.0/kubo_v0.25.0_linux-amd64.tar.gz
tar -xvzf kubo_v0.25.0_linux-amd64.tar.gz
cd kubo
sudo bash install.sh

# Initialize and start
ipfs init
ipfs daemon

# Kubo runs on localhost:5001
# Carge will auto-detect and switch to Broadcast mode
```

**Windows:**
Download from [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/) (includes GUI)

**Verify:**
- Open Carge → Header shows **"IPFS Broadcast"** instead of "IPFS Limited"
- Upload will now broadcast to the global IPFS network

**Learn more:** [IPFS Command Line Quick Start](https://docs.ipfs.tech/how-to/command-line-quick-start/)

## Architecture

```
src/
├── components/      # Header, Layout, WalletSelector
├── contexts/        # AppContext (global state)
├── lib/core/        # Blockchain, IPFS, Encryption
├── pages/           # Home, Workflows, Verify, QuickSign
└── App.jsx          # Router + providers
```

**Configuration:** `src/lib/config.js` (Substrate RPC, IPFS gateways)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines and [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Support

**Polkadot Address:** `5C4kKzKyDuZTu3Qa89soZWdRfFRJzvTjVVDTNqAKPuzXcaRa`

## License

GPL-3.0 © 2025 Jean-François Meneust / Carge

---

**Built on the synergies of blockchain and LLMs** • [carge.fr](http://carge.fr) • [@polykrate](https://github.com/polykrate)
