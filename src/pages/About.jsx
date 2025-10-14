import { useTranslation } from 'react-i18next';

export const About = () => {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-light mb-4">{t('about.title')}</h1>
      <p className="text-gray-600 mb-8">{t('about.subtitle')}</p>

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-medium mt-8 mb-4">{t('about.whatIs')}</h2>
        <p className="text-gray-700 mb-4">
          {t('about.whatIsDesc')}
        </p>

        <h2 className="text-2xl font-medium mt-8 mb-4">{t('about.features')}</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>
            <strong>{t('about.feature1')}:</strong> {t('about.feature1Desc')}
          </li>
          <li>
            <strong>{t('about.feature2')}:</strong> {t('about.feature2Desc')}
          </li>
          <li>
            <strong>{t('about.feature3')}:</strong> {t('about.feature3Desc')}
          </li>
          <li>
            <strong>{t('about.feature4')}:</strong> {t('about.feature4Desc')}
          </li>
          <li>
            <strong>{t('about.feature5')}:</strong> {t('about.feature5Desc')}
          </li>
        </ul>

        <h2 className="text-2xl font-medium mt-8 mb-4">{t('about.techStack')}</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              <strong>Blockchain:</strong> Substrate Parachain on Polkadot (Tanssi parachain)
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

        <h2 className="text-2xl font-medium mt-8 mb-4">{t('about.openSource')}</h2>
        <p className="text-gray-700 mb-4">
          {t('about.openSourceDesc')}
        </p>

        <h2 className="text-2xl font-medium mt-8 mb-4">{t('about.legalReferences')}</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
          <div className="mb-6">
            <h3 className="font-semibold text-[#003399] mb-2">{t('about.legalRef1Title')}</h3>
            <p className="text-sm text-gray-700 text-justify mb-2">
              {t('about.legalRef1Desc')}
            </p>
            <a 
              href="https://eur-lex.europa.eu/eli/reg/2024/1183" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-[#003399] hover:underline flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {t('about.legalRef1Link')}
            </a>
          </div>
          <div>
            <h3 className="font-semibold text-[#003399] mb-2">{t('about.legalRef2Title')}</h3>
            <p className="text-sm text-gray-700 text-justify mb-2">
              {t('about.legalRef2Desc')}
            </p>
            <a 
              href="https://www.doctrine.fr/d/TJ/Marseille/2025/U5266E268A3AFBC83910E" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-[#003399] hover:underline flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {t('about.legalRef2Link')}
            </a>
          </div>
        </div>

        <h2 className="text-2xl font-medium mt-8 mb-4">{t('about.contact')}</h2>
        <p className="text-gray-700">
          {t('about.contactDesc')}{' '}
          <a href="https://github.com/polykrate" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
            {t('about.github')}
          </a>
          {' '}{t('about.or')}{' '}
          <a href="https://www.linkedin.com/company/carge-fr" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
            {t('about.linkedin')}
          </a>.
        </p>
      </div>
    </div>
  );
};

