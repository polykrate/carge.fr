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
      <div className="absolute top-16 right-0 w-[440px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
        {/* Header with icon */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#003399] to-[#0055cc] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-gray-900">{t('wallet.noWallets')}</div>
              <div className="text-xs text-gray-600">{t('wallet.noWalletsDesc')}</div>
            </div>
          </div>
        </div>

        {/* What is a Wallet explanation */}
        <div className="px-6 py-5 bg-gradient-to-br from-white to-gray-50 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('wallet.whatIsWallet')}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {t('wallet.walletExplanation')}
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-lg p-2.5 border border-green-100 text-center">
              <div className="w-8 h-8 mx-auto mb-1.5 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs font-medium text-gray-900">{t('wallet.walletFree')}</div>
              <div className="text-xs text-gray-500">{t('wallet.walletFreeDesc')}</div>
            </div>
            <div className="bg-white rounded-lg p-2.5 border border-blue-100 text-center">
              <div className="w-8 h-8 mx-auto mb-1.5 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-xs font-medium text-gray-900">{t('wallet.walletSecure')}</div>
              <div className="text-xs text-gray-500">{t('wallet.walletSecureDesc')}</div>
            </div>
            <div className="bg-white rounded-lg p-2.5 border border-purple-100 text-center">
              <div className="w-8 h-8 mx-auto mb-1.5 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-xs font-medium text-gray-900">{t('wallet.walletSimple')}</div>
              <div className="text-xs text-gray-500">{t('wallet.walletSimpleDesc')}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            {isMobile ? t('wallet.mobileWallets') : t('wallet.browserExtensions')}
          </div>
          
          {isMobile ? (
            <>
              <div className="space-y-2 mb-4">
                <a
                  href="https://novawallet.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border border-gray-200 hover:border-pink-300 rounded-lg transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-md flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">N</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t('wallet.downloadNova')}</div>
                      <div className="text-xs text-gray-500">{t('wallet.novaDesc')}</div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-pink-500 transform group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                
                <a
                  href="https://subwallet.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 bg-[#003399] rounded-md flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t('wallet.downloadSubWallet')}</div>
                      <div className="text-xs text-gray-500">{t('wallet.subwalletPopular')}</div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="text-xs text-amber-800">
                    <p className="font-medium mb-0.5">{t('wallet.howToConnect')}</p>
                    <p className="text-amber-700">{t('wallet.mobileInstructions')}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                <a
                  href="https://polkadot.js.org/extension/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-lg transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="2" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t('wallet.downloadPolkadot')}</div>
                      <div className="text-xs text-gray-500">{t('wallet.polkadotDesc')}</div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transform group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                
                <a
                  href="https://talisman.xyz/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t('wallet.downloadTalisman')}</div>
                      <div className="text-xs text-gray-500">{t('wallet.talismanDesc')}</div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transform group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                
                <a
                  href="https://subwallet.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 bg-[#003399] rounded-md flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t('wallet.downloadSubWallet')}</div>
                      <div className="text-xs text-gray-500">{t('wallet.subwalletDesc')}</div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-green-800">
                    <p className="font-medium">{t('wallet.nextStepDesktop')}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
          {isMobile && (
            <button
              onClick={handleRetryDetection}
              className="w-full px-3 py-2 text-sm bg-[#003399] hover:bg-[#002266] text-white rounded-lg transition-all font-medium mb-2"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t('wallet.retryDetection')}</span>
              </div>
            </button>
          )}
          <button
            onClick={() => setIsWalletSelectOpen(false)}
            className="w-full px-3 py-2 text-sm bg-white hover:bg-gray-50 text-gray-600 rounded-lg transition-all font-medium border border-gray-300 hover:border-gray-400"
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

