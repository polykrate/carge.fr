import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Home = () => {
  const { t } = useTranslation();
  
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h1 className="text-6xl font-bold mb-4">{t('home.title')}</h1>
          <h2 className="text-3xl font-light text-gray-700 mb-6">{t('home.subtitle')}</h2>
          <p className="text-xl text-gray-800 mb-4 font-medium">
            {t('home.tagline')}
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('home.description')}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/quick-sign"
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
            >
              {t('home.ctaQuickSign')}
            </Link>
            <Link to="/verify" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              {t('home.ctaVerify')}
            </Link>
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="py-16 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl font-light text-center mb-4">{t('home.techTitle')}</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('home.techDesc')}
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Blockchain */}
            <div className="p-8 bg-gray-50 border border-gray-300 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🔗</div>
                <div>
                  <h3 className="text-xl font-medium">{t('home.blockchain.title')}</h3>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                {t('home.blockchain.desc')}
              </p>

              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex flex-col">
                  <span className="font-semibold">{t('home.blockchain.pki')}</span>
                  <span className="text-gray-600">{t('home.blockchain.pkiDesc')}</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold">{t('home.blockchain.cryptoTrail')}</span>
                  <span className="text-gray-600">{t('home.blockchain.cryptoTrailDesc')}</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold">{t('home.blockchain.rag')}</span>
                  <span className="text-gray-600">{t('home.blockchain.ragDesc')}</span>
                </li>
              </ul>
            </div>

            {/* AI */}
            <div className="p-8 bg-gray-50 border border-gray-300 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🤖</div>
                <div>
                  <h3 className="text-xl font-medium">{t('home.ai.title')}</h3>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                {t('home.ai.desc')}
              </p>

              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex flex-col">
                  <span className="font-semibold">{t('home.ai.nl')}</span>
                  <span className="text-gray-600">{t('home.ai.nlDesc')}</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold">{t('home.ai.local')}</span>
                  <span className="text-gray-600">{t('home.ai.localDesc')}</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold">{t('home.ai.auto')}</span>
                  <span className="text-gray-600">{t('home.ai.autoDesc')}</span>
                </li>
              </ul>
            </div>

            {/* Electronic Signature */}
            <div className="p-8 bg-gray-50 border border-gray-300 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">✍️</div>
                <div>
                  <h3 className="text-xl font-medium">{t('home.signature.title')}</h3>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                {t('home.signature.desc')}
              </p>

              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex flex-col">
                  <span className="font-semibold">{t('home.signature.identity')}</span>
                  <span className="text-gray-600">{t('home.signature.identityDesc')}</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold">{t('home.signature.demat')}</span>
                  <span className="text-gray-600">{t('home.signature.dematDesc')}</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold">{t('home.signature.cert')}</span>
                  <span className="text-gray-600">{t('home.signature.certDesc')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

    </>
  );
};

