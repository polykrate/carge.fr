# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Carge, please report it responsibly:

### 🔒 **Private Disclosure**
- **DO NOT** open a public issue
- Contact via GitHub Security Advisories (recommended)
- Or email: security@carge.io (if available)

### 📧 **What to Include**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### ⏱️ **Response Time**
- We aim to acknowledge reports within **48 hours**
- Security patches will be prioritized

### 🛡️ **Supported Versions**
Currently, we provide security updates for:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## Security Considerations

### Client-Side Security
- All private keys remain in your browser wallet
- No server-side storage of credentials
- Local-first architecture

### Blockchain Security
- All transactions are cryptographically signed
- Immutable audit trail on Substrate
- IPFS for decentralized storage

### Known Limitations
- Relies on Polkadot.js Extension security
- Browser security is user responsibility
- Testnet deployment - not production ready

## Best Practices
1. Always verify transaction details before signing
2. Use hardware wallets for high-value operations
3. Keep your wallet extension updated
4. Never share your seed phrase or private keys

