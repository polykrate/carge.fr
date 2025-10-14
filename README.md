# Carge - Code as Law

> **Built on the synergies of blockchain and LLMs**

A Web3 platform that transforms regulatory and technical processes into executable workflows with cryptographic audit trails. Connect your existing systems via a local server interface - fully decentralized, with or without AI.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react)](https://reactjs.org/)
[![Powered by Polkadot](https://img.shields.io/badge/Powered%20by-Polkadot-E6007A?logo=polkadot)](https://polkadot.network/)

## 🌐 Live Demo

- **Website**: [http://carge.fr](http://carge.fr)
- **GitHub**: [https://github.com/polykrate/carge](https://github.com/polykrate/carge)

## 📖 What is Carge?

Carge enables organizations to:
- **Transform processes into code**: AI-powered workflow generation from natural language
- **Execute with proof**: Every action leaves a cryptographic audit trail on-chain
- **Export to authorities**: Deploy as W3C Verifiable Credentials (EBSI) or NFT-gated access (Solana)
- **Connect existing systems**: Local server interface for decentralized integration

### Key Features
- 🤖 **AI + Human collaboration**: Workflows executed together with cryptographic signatures
- 🔗 **Decentralized**: No intermediaries, direct blockchain connection
- 🔐 **Verifiable**: Immutable audit trails on Substrate + IPFS
- 🌍 **Interoperable**: Works with legacy systems, ERPs, or modern SaaS

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Blockchain**: Substrate (Polkadot) via @polkadot/api
- **Wallet**: Polkadot.js Extension
- **Storage**: IPFS (Helia browser client)
- **Styling**: Tailwind CSS

## 📦 Features

- ✅ **SPA Architecture** - No page reloads, persistent wallet connections
- ✅ **React Context** - Global state management for wallet, blockchain, and IPFS
- ✅ **React Router** - Client-side routing with clean URLs
- ✅ **Modular Components** - Reusable Header, Layout, and Page components
- ✅ **Web3 Integration** - Substrate blockchain + IPFS + Polkadot wallet

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Polkadot.js browser extension

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

Output: `dist/` folder ready for deployment

## 🌐 Deployment

### Netlify

The project is deployed at [carge.fr](http://carge.fr) using Netlify.

**Steps:**
1. Build: `npm run build`
2. Deploy the `dist/` folder to Netlify
3. Configure custom domain in Netlify dashboard
4. The `netlify.toml` file handles SPA routing automatically

**Custom Domain Setup:**
- Add your domain in Netlify: Site settings → Domain management
- Configure DNS records to point to Netlify
- SSL certificate is automatically provisioned

### Manual Deployment

Upload the `dist/` folder to any static hosting provider that supports SPA routing.

## 📁 Project Structure

```
src/
├── components/      # Reusable React components
│   ├── Header.jsx
│   └── Layout.jsx
├── contexts/        # React Context for global state
│   └── AppContext.jsx
├── lib/             # Core JavaScript modules
│   ├── core/        # Blockchain, IPFS, Wallet modules
│   └── config.js
├── pages/           # Page components
│   ├── Home.jsx
│   ├── Workflows.jsx
│   ├── Verify.jsx
│   └── About.jsx
├── App.jsx          # Main app with router
└── main.jsx         # Entry point
```

## 🔧 Configuration

Edit `src/lib/config.js` to configure:

- Substrate RPC URL
- IPFS gateway
- Chain name

## 📝 Compared to HTML Version

**Old (HTML):**
- ❌ Full page reload on navigation
- ❌ Lost wallet connection between pages
- ❌ Duplicate code (header in every page)
- ❌ No module bundling

**New (React SPA):**
- ✅ Single page, no reloads
- ✅ Persistent wallet/blockchain connections
- ✅ Shared components (Header once)
- ✅ Optimized builds with Vite

## 🤝 Contributing

We welcome contributions! Please see:
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](SECURITY.md) - Security policy and vulnerability reporting

## 🗺️ Roadmap

- **Q4 2025**: Testnet & Beta Access
- **Q2 2026**: MVP & Public Launch with EBSI/Solana integration

See the [project roadmap](https://github.com/polykrate/carge-react/issues) for detailed milestones.

## 💝 Support the Project

If you find Carge useful, consider supporting development:

**Polkadot/Substrate Address:**
```
5C4kKzKyDuZTu3Qa89soZWdRfFRJzvTjVVDTNqAKPuzXcaRa
```

Your support helps maintain and improve Carge. Thank you! 🙏

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [carge.fr](http://carge.fr)
- **GitHub**: [github.com/polykrate/carge](https://github.com/polykrate/carge)
- **Discussions**: [GitHub Discussions](https://github.com/polykrate/carge/discussions)
- **Issues**: [Report a bug](https://github.com/polykrate/carge/issues/new)

---

**Built with ❤️ on the synergies of blockchain and LLMs**
