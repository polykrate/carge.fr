export const About = () => {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-light mb-4">About Carge</h1>
      <p className="text-gray-600 mb-8">Law as Code - Turning regulatory processes into executable workflows</p>

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-medium mt-8 mb-4">What is Carge?</h2>
        <p className="text-gray-700 mb-4">
          Carge is a Web3 platform that transforms regulatory and technical processes into executable workflows with
          cryptographic audit trails. By combining AI, blockchain technology, and electronic signatures, we create a
          complete trust infrastructure for administrative compliance.
        </p>

        <h2 className="text-2xl font-medium mt-8 mb-4">Key Features</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>
            <strong>AI-Powered Workflow Generation:</strong> Transform natural language requirements into executable
            compliance workflows
          </li>
          <li>
            <strong>Blockchain Traceability:</strong> Every action is recorded on-chain with immutable proof
          </li>
          <li>
            <strong>Electronic Signatures:</strong> eIDAS-compliant digital signatures for legal validity
          </li>
          <li>
            <strong>IPFS Storage:</strong> Decentralized, permanent storage for workflow definitions and proofs
          </li>
          <li>
            <strong>Web3 Native:</strong> Built on Polkadot with Substrate parachain technology
          </li>
        </ul>

        <h2 className="text-2xl font-medium mt-8 mb-4">Technology Stack</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              <strong>Blockchain:</strong> Substrate Parachain on Polkadot (Tanssi Ragchain)
            </li>
            <li>
              <strong>Storage:</strong> IPFS (Helia browser client)
            </li>
            <li>
              <strong>Wallet:</strong> Polkadot.js Extension
            </li>
            <li>
              <strong>Frontend:</strong> React + Vite
            </li>
            <li>
              <strong>Standards:</strong> W3C Verifiable Credentials, eIDAS, JSON Schema
            </li>
          </ul>
        </div>

        <h2 className="text-2xl font-medium mt-8 mb-4">Open Source</h2>
        <p className="text-gray-700 mb-4">
          Carge is open source and licensed under GPL-3.0. We believe in transparency and community-driven development.
        </p>

        <h2 className="text-2xl font-medium mt-8 mb-4">Contact</h2>
        <p className="text-gray-700">
          For more information, visit our{' '}
          <a href="https://github.com" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
            GitHub repository
          </a>{' '}
          or reach out to the development team.
        </p>
      </div>
    </div>
  );
};

