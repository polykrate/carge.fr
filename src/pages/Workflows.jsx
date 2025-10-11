export const Workflows = () => {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-light mb-4">Workflows</h1>
      <p className="text-gray-600 mb-12">Select a workflow from the blockchain and execute it with your signature</p>

      {/* Coming Soon Message */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🚧</div>
        <h2 className="text-2xl font-medium mb-2">Under Development</h2>
        <p className="text-gray-600 mb-4">
          The workflow execution interface is currently being developed. This feature will allow you to:
        </p>
        <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700 mb-6">
          <li>• Browse AI-generated compliance workflows from the blockchain</li>
          <li>• Execute workflows step-by-step with dynamic form generation</li>
          <li>• Sign each step with your Polkadot wallet</li>
          <li>• Generate cryptographic proofs for each completed workflow</li>
        </ul>
        <p className="text-sm text-gray-500">Check back soon for updates!</p>
      </div>

      {/* Technical Preview */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-3">How It Will Work</h3>
        <div className="space-y-4 text-sm text-gray-700">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-medium">
              1
            </div>
            <div>
              <h4 className="font-medium mb-1">Select Workflow</h4>
              <p className="text-gray-600">
                Browse available workflows (RAGs) stored on the Ragchain parachain
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-medium">
              2
            </div>
            <div>
              <h4 className="font-medium mb-1">Dynamic Form Generation</h4>
              <p className="text-gray-600">
                Forms are automatically generated from JSON schemas stored on IPFS
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-medium">
              3
            </div>
            <div>
              <h4 className="font-medium mb-1">Cryptographic Signing</h4>
              <p className="text-gray-600">
                Sign each step with your wallet to create verifiable proofs
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-medium">
              4
            </div>
            <div>
              <h4 className="font-medium mb-1">Blockchain Proof</h4>
              <p className="text-gray-600">
                The complete workflow execution is recorded on-chain with timestamps
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

