import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h1 className="text-6xl font-bold mb-4">CARGE</h1>
          <h2 className="text-3xl font-light text-gray-700 mb-6">Law as Code</h2>
          <p className="text-xl text-gray-800 mb-4 font-medium">
            Turn regulatory and technical processes into executable workflows with cryptographic audit trails.
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Send your processes to AI. AI codes them on-chain. Execute them with verifiable proof.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/workflows"
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
            >
              Execute Workflows
            </Link>
            <Link to="/verify" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Verify a Proof
            </Link>
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="py-16 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl font-light text-center mb-4">Technical Architecture</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            CARGE leverages the synergies between AI, blockchain, and electronic signature to create a complete trust
            infrastructure.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Blockchain */}
            <div className="p-8 bg-gray-50 border border-gray-300 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🔗</div>
                <div>
                  <h3 className="text-xl font-medium">Blockchain: Traceability & Encryption</h3>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                Substrate Parachain deployed on Polkadot with 3 specialized pallets:
              </p>

              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex flex-col">
                  <span className="font-semibold">PKI Pallet</span>
                  <span className="text-gray-600">Public Key Infrastructure</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold">Crypto Trail</span>
                  <span className="text-gray-600">Audit & Encryption</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold">RAG Pallet</span>
                  <span className="text-gray-600">Compliance & Form</span>
                </li>
              </ul>
            </div>

            {/* AI */}
            <div className="p-8 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🤖</div>
                <div>
                  <h3 className="text-xl font-medium">AI: Data Analysis & Transformation</h3>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                Model Context Protocol (MCP) server running locally with stdio.
              </p>

              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex flex-col">
                  <span className="font-semibold">Natural Language</span>
                  <span className="text-gray-600">Intuitive interaction</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold">Local Execution</span>
                  <span className="text-gray-600">Full data privacy</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold">Automated Logic</span>
                  <span className="text-gray-600">DApp integration</span>
                </li>
              </ul>
            </div>

            {/* Electronic Signature */}
            <div className="p-8 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">✍️</div>
                <div>
                  <h3 className="text-xl font-medium">Electronic Signature: Certification & Trust</h3>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                Digital identity, dematerialization, and data certification based on W3C standards.
              </p>

              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex flex-col">
                  <span className="font-semibold">Digital Identity</span>
                  <span className="text-gray-600">W3C compliant</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold">Dematerialization</span>
                  <span className="text-gray-600">Secure workflows</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold">Data Certification</span>
                  <span className="text-gray-600">Trusted attestations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-gray-600">
          <p>Carge - Built on Ragchain (Tanssi Parachain)</p>
          <p className="mt-2 text-xs">Open Source · GPL-3.0 License</p>
        </div>
      </footer>
    </>
  );
};

