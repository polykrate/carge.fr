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

        <h2 className="text-2xl font-medium mt-8 mb-4">{t('about.openSource')}</h2>
        <p className="text-gray-700 mb-4">
          {t('about.openSourceDesc')}
        </p>

        <h2 className="text-2xl font-medium mt-8 mb-4">{t('about.contact')}</h2>
        <p className="text-gray-700">
          {t('about.contactDesc')}{' '}
          <a href="https://github.com" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
            {t('about.github')}
          </a>{' '}
          {t('about.or')}
        </p>
      </div>
    </div>
  );
};

