# Carge - Law as Code

A Web3 platform that transforms regulatory and technical processes into executable workflows with cryptographic audit trails.

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

### Netlify (Recommended)

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to Netlify
3. The `netlify.toml` file handles SPA routing

### Manual Deployment

Upload the `dist/` folder to any static hosting provider.

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

## 📄 License

GPL-3.0
