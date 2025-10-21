import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Home = () => {
  const { t } = useTranslation();
  
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#003399] text-white rounded-full text-sm font-medium mb-6">
            {t('home.badge')}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{t('home.title')}</h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-4 font-light">
            {t('home.heroTitle')}
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('home.heroDesc')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link
              to="/workflows"
              className="px-8 py-4 bg-[#003399] text-white rounded-lg hover:bg-[#002266] transition font-medium text-lg shadow-lg hover:shadow-xl"
            >
              {t('home.ctaStart')}
            </Link>
            <Link 
              to="/verify" 
              className="px-8 py-4 border-2 border-[#003399] text-[#003399] rounded-lg hover:bg-gray-50 transition font-medium text-lg"
            >
              {t('home.ctaVerify')}
            </Link>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-8 border-t border-[#003399]/20">
            <div>
              <div className="text-3xl font-bold text-[#003399]">{t('home.metric1')}</div>
              <div className="text-sm text-gray-600 mt-1">{t('home.metric1Desc')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#003399]">{t('home.metric2')}</div>
              <div className="text-sm text-gray-600 mt-1">{t('home.metric2Desc')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#003399]">{t('home.metric3')}</div>
              <div className="text-sm text-gray-600 mt-1">{t('home.metric3Desc')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Simple 3 Steps */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('home.howItWorksTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.howItWorksDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-[#003399]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-[#003399]">1</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t('home.step1Title')}</h3>
              <p className="text-gray-600 leading-relaxed text-justify">
                {t('home.step1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-[#003399]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-[#003399]">2</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t('home.step2Title')}</h3>
              <p className="text-gray-600 leading-relaxed text-justify">
                {t('home.step2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-[#003399]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-[#003399]">3</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t('home.step3Title')}</h3>
              <p className="text-gray-600 leading-relaxed text-justify">
                {t('home.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('home.useCasesTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.useCasesDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Audit Logistique */}
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-[#003399] transition">
              <div className="w-12 h-12 bg-[#003399]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t('home.useCase1Title')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t('home.useCase1Desc')}
              </p>
            </div>

            {/* Archivage Légal */}
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-[#003399] transition">
              <div className="w-12 h-12 bg-[#003399]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t('home.useCase2Title')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t('home.useCase2Desc')}
              </p>
            </div>

            {/* Supply Chain */}
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-[#003399] transition">
              <div className="w-12 h-12 bg-[#003399]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t('home.useCase3Title')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t('home.useCase3Desc')}
              </p>
            </div>

            {/* Certification Qualité */}
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-[#003399] transition">
              <div className="w-12 h-12 bg-[#003399]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t('home.useCase4Title')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t('home.useCase4Desc')}
              </p>
            </div>

            {/* Procédures Administratives */}
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-[#003399] transition">
              <div className="w-12 h-12 bg-[#003399]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t('home.useCase5Title')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t('home.useCase5Desc')}
              </p>
            </div>

            {/* Contrôle de Gestion */}
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-[#003399] transition">
              <div className="w-12 h-12 bg-[#003399]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t('home.useCase6Title')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t('home.useCase6Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interoperability */}
      <section className="py-20 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('home.interopTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.interopDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Local Server Interface */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-[#003399] transition">
              <div className="w-14 h-14 bg-[#003399]/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t('home.interopFeature1Title')}</h3>
              <p className="text-gray-600 leading-relaxed text-justify">
                {t('home.interopFeature1Desc')}
              </p>
            </div>

            {/* With or Without AI */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-[#003399] transition">
              <div className="w-14 h-14 bg-[#003399]/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t('home.interopFeature2Title')}</h3>
              <p className="text-gray-600 leading-relaxed text-justify">
                {t('home.interopFeature2Desc')}
              </p>
            </div>

            {/* Certified Data Exchange */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-[#003399] transition">
              <div className="w-14 h-14 bg-[#003399]/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t('home.interopFeature3Title')}</h3>
              <p className="text-gray-600 leading-relaxed text-justify">
                {t('home.interopFeature3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-3">{t('home.deploymentTitle')}</h2>
          <p className="text-center text-gray-600 mb-12">{t('home.deploymentSubtitle')}</p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* EBSI */}
            <div className="bg-white p-8 rounded-xl border-2 border-[#003399]/20 hover:border-[#003399] transition flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#003399]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <a href="https://ec.europa.eu/digital-building-blocks/sites/spaces/EBSI/pages/447687044/Home" target="_blank" rel="noopener noreferrer" className="text-xl font-semibold text-[#003399] hover:underline">
                  {t('home.ebsiTitle')}
                </a>
              </div>
              <p className="text-gray-600 mb-4 text-justify flex-1">
                {t('home.ebsiDesc')}
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mt-auto">
                <li className="flex items-start gap-2">
                  <span className="text-[#003399]">✓</span>
                  <span>{t('home.ebsiFeature1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#003399]">✓</span>
                  <span>{t('home.ebsiFeature2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#003399]">✓</span>
                  <span>{t('home.ebsiFeature3')}</span>
                </li>
              </ul>
            </div>

            {/* Tanssi / Security */}
            <div className="bg-white p-8 rounded-xl border-2 border-[#003399]/20 hover:border-[#003399] transition flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#003399]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <a href="https://www.tanssi.network/" target="_blank" rel="noopener noreferrer" className="text-xl font-semibold text-[#003399] hover:underline">
                  {t('home.polkadotTitle')}
                </a>
              </div>
              <p className="text-gray-600 mb-4 text-justify flex-1">
                {t('home.polkadotDesc')}
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mt-auto">
                <li className="flex items-start gap-2">
                  <span className="text-[#003399]">✓</span>
                  <span>{t('home.polkadotFeature1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#003399]">✓</span>
                  <span>{t('home.polkadotFeature2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#003399]">✓</span>
                  <span>{t('home.polkadotFeature3')}</span>
                </li>
              </ul>
            </div>

            {/* Solana */}
            <div className="bg-white p-8 rounded-xl border-2 border-[#003399]/20 hover:border-[#003399] transition flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#003399]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <a href="https://solana.com/solutions/real-world-assets" target="_blank" rel="noopener noreferrer" className="text-xl font-semibold text-[#003399] hover:underline">
                  {t('home.solanaTitle')}
                </a>
              </div>
              <p className="text-gray-600 mb-4 text-justify flex-1">
                {t('home.solanaDesc')}
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mt-auto">
                <li className="flex items-start gap-2">
                  <span className="text-[#003399]">✓</span>
                  <span>{t('home.solanaFeature1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#003399]">✓</span>
                  <span>{t('home.solanaFeature2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#003399]">✓</span>
                  <span>{t('home.solanaFeature3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t('home.roadmapTitle')}</h2>
          
          <div className="space-y-8">
            {/* Q4 2025 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-32 h-16 bg-[#003399]/10 rounded-lg flex items-center justify-center border-2 border-[#003399]/20">
                  <span className="text-lg font-bold text-[#003399]">{t('home.q4_2025')}</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-xl font-semibold mb-2 text-[#003399]">{t('home.q4_2025_title')}</h3>
                <p className="text-gray-600 text-justify">
                  {t('home.q4_2025_desc')}
                </p>
              </div>
            </div>

            {/* Q2 2026 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-32 h-16 bg-[#003399]/10 rounded-lg flex items-center justify-center border-2 border-[#003399]/20">
                  <span className="text-lg font-bold text-[#003399]">{t('home.q2_2026')}</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-xl font-semibold mb-2 text-[#003399]">{t('home.q2_2026_title')}</h3>
                <p className="text-gray-600 text-justify">
                  {t('home.q2_2026_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-16 bg-[#003399] text-white">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-3xl font-bold mb-4">{t('home.ctaTitle')}</h2>
          <p className="text-lg text-gray-100 mb-8">
            {t('home.ctaDesc')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/workflows"
              className="px-8 py-4 bg-white text-[#003399] rounded-lg hover:bg-gray-100 transition font-medium text-lg"
            >
              {t('home.ctaExplore')}
            </Link>
            <Link
              to="/quick-sign"
              className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-[#003399] transition font-medium text-lg"
            >
              {t('home.ctaQuickSign')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

