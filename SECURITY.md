# Security Policy

## ⚠️ NO WARRANTY - USE AT YOUR OWN RISK

**This software is provided "AS IS" without warranty of any kind, express or implied.**

As stated in the GNU General Public License v3.0 (sections 15-16):

> **15. Disclaimer of Warranty.**
> 
> THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY APPLICABLE LAW. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU.

> **16. Limitation of Liability.**
> 
> IN NO EVENT WILL ANY COPYRIGHT HOLDER BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OR INABILITY TO USE THE PROGRAM.

**You use this software entirely at your own risk. The authors and contributors accept NO responsibility for:**
- Loss of funds or assets
- Data corruption or loss
- Security breaches
- System failures
- Any direct or indirect damages

---

## Your Responsibilities

By using Carge, you acknowledge that:

1. **You are solely responsible for**:
   - Securing your wallet and private keys
   - Verifying all transactions before signing
   - Understanding the risks of blockchain technology
   - Backing up your data and seed phrases

2. **You understand that**:
   - This is experimental software (testnet deployment)
   - No external security audit has been conducted
   - Bugs may exist despite testing efforts
   - Blockchain transactions are irreversible

3. **You accept that**:
   - The authors provide no guarantees of availability, correctness, or security
   - Support is provided on a best-effort basis
   - No SLA or uptime guarantees exist
   - The software may change or be discontinued at any time

---

## Known Risks & Limitations

### Critical Dependencies
- **Polkadot.js Extension**: Security is user responsibility
- **Browser Security**: Client-side execution environment
- **IPFS Network**: Content availability not guaranteed
- **Ragchain Testnet**: Experimental blockchain (not production-ready)

### Attack Vectors
- Phishing attacks (fake websites, malicious wallets)
- Browser extension compromise
- Social engineering
- Supply chain attacks (NPM packages)
- Man-in-the-middle attacks (use HTTPS only)

### Technical Limitations
- IPFS retrieval timeouts (30s limit)
- Single RPC endpoint (no fallback yet)
- Browser memory constraints (~50MB for IPFS)
- Testnet may be reset without notice

---

## Responsible Disclosure

If you discover a security vulnerability, we appreciate responsible disclosure:

### Reporting
- **Email**: contact@carge.fr
- **Subject**: "Security: [Brief description]"
- **DO NOT** open public GitHub issues for vulnerabilities

### Include
- Vulnerability description
- Steps to reproduce
- Potential impact assessment

### Response
- Best-effort response (no guaranteed timeline)
- Security patches prioritized when feasible
- No bug bounty program currently

---

## Best Practices (Your Responsibility)

1. ✅ **Verify everything**: URLs, wallet addresses, transaction details
2. ✅ **Use hardware wallets**: For any significant operations
3. ✅ **Keep software updated**: Browser, extensions, OS
4. ✅ **Backup seed phrases**: Store securely offline
5. ✅ **Test with small amounts**: Before large transactions
6. ✅ **Understand the code**: It's open source for a reason
7. ✅ **Assume the worst**: Always have a recovery plan

---

## Legal Notice

**NO FINANCIAL ADVICE. NO GUARANTEES. NO LIABILITY.**

This software is a tool. Like any tool, it can be misused or fail. You are responsible for how you use it and any consequences that arise.

**By using Carge, you agree to hold harmless the authors, contributors, and maintainers from any claims, damages, or losses.**

---

*GPL-3.0 License - See LICENSE file for full legal terms*

