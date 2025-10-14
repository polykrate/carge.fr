import { useApp } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';

export const WalletSelector = () => {
  const { t } = useTranslation();
  const { installedWallets, connectWallet, setIsWalletSelectOpen } = useApp();

  // Detect if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleRetryDetection = async () => {
    console.log('🔄 Retrying wallet detection...');
    // Force page reload to re-trigger wallet detection
    window.location.reload();
  };

  if (installedWallets.length === 0) {
    return (
      <div className="absolute top-16 right-0 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-900">{t('wallet.selectWallet')}</div>
          <div className="text-xs text-gray-500 mt-0.5">{t('wallet.selectAccount')}</div>
        </div>

        <div className="px-4 py-8 text-center">
          <div className="text-4xl mb-4">🔌</div>
          <p className="text-gray-700 font-medium mb-2">{t('wallet.noWallets')}</p>
          
          {isMobile ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {t('wallet.mobileInstructions')}
              </p>
              <div className="space-y-2">
                <a
                  href="https://novawallet.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="block px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg transition text-sm font-medium"
                >
                  {t('wallet.downloadNova')}
                </a>
                <a
                  href="https://subwallet.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm font-medium"
                >
                  {t('wallet.downloadSubWallet')}
                </a>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
                  <p className="text-xs text-blue-800 font-medium mb-1">{t('wallet.howToConnect')}</p>
                  <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                    <li>{t('wallet.step1')}</li>
                    <li>{t('wallet.step2')}</li>
                    <li>{t('wallet.step3')}</li>
                    <li>{t('wallet.step4')}</li>
                  </ol>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{t('wallet.noWalletsDesc')}</p>
              <div className="space-y-2">
                <a
                  href="https://polkadot.js.org/extension/"
                  target="_blank"
                  rel="noreferrer"
                  className="block px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition text-sm font-medium"
                >
                  {t('wallet.downloadPolkadot')}
                </a>
                <a
                  href="https://talisman.xyz/"
                  target="_blank"
                  rel="noreferrer"
                  className="block px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition text-sm font-medium"
                >
                  {t('wallet.downloadTalisman')}
                </a>
                <a
                  href="https://subwallet.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm font-medium"
                >
                  {t('wallet.downloadSubWallet')}
                </a>
              </div>
            </>
          )}
        </div>

        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 space-y-2">
          {isMobile && (
            <button
              onClick={handleRetryDetection}
              className="w-full px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition font-medium"
            >
              {t('wallet.retryDetection')}
            </button>
          )}
          <button
            onClick={() => setIsWalletSelectOpen(false)}
            className="w-full px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition font-medium"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-16 right-0 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-900">Select Wallet</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {installedWallets.length} wallet{installedWallets.length > 1 ? 's' : ''} detected
        </div>
      </div>

      <div className="py-2">
        {installedWallets.map((wallet) => (
          <button
            key={wallet.id}
            onClick={() => connectWallet(wallet.id)}
            className="w-full px-4 py-3 hover:bg-gray-50 transition text-left flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
          >
            <div className="text-3xl">{wallet.logo}</div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 text-sm">{wallet.name}</div>
              <div className="text-xs text-green-600">✓ Installed</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <button
          onClick={() => setIsWalletSelectOpen(false)}
          className="w-full px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

