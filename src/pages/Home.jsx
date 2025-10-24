  import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export const Home = () => {
  const { t } = useTranslation();
  const [selectedStep, setSelectedStep] = useState(1);
  
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-10 w-72 h-72 bg-[#003399]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 text-center max-w-6xl relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#003399] text-white rounded-full text-sm font-medium mb-8 shadow-lg">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {t('home.badge')}
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-gray-900 via-[#003399] to-gray-900 bg-clip-text text-transparent">
            {t('home.title')}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-3xl font-semibold text-gray-800 mb-8 leading-tight">
            {t('home.subtitle')}
          </p>

          {/* Value Proposition - 3 key points */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-base md:text-lg text-gray-700 mb-6 font-medium max-w-4xl mx-auto flex-wrap">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#003399]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('home.heroPoint1')}
            </span>
            <span className="hidden sm:inline text-[#003399]">•</span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#003399]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              {t('home.heroPoint2')}
            </span>
            <span className="hidden sm:inline text-[#003399]">•</span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#003399]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('home.heroPoint3')}
            </span>
          </div>

          {/* Target audience */}
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            {t('home.heroDesc')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link
              to="/workflows"
              className="group px-8 py-4 bg-[#003399] text-white rounded-lg hover:bg-[#002266] transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2"
            >
              {t('home.ctaStart')}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link 
              to="/verify" 
              className="px-8 py-4 border-2 border-[#003399] text-[#003399] rounded-lg hover:bg-[#003399] hover:text-white transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105"
            >
              {t('home.ctaVerify')}
            </Link>
            <a
              href="https://github.com/polykrate/carge"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              {t('home.ctaGitHub')}
            </a>
          </div>
          
          {/* Trust Indicators / Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-12 border-t-2 border-[#003399]/20">
            <div className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-gray-200 hover:border-[#003399] transition-colors">
              <div className="text-2xl md:text-3xl font-bold text-[#003399] mb-1">{t('home.metric1')}</div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">{t('home.metric1Desc')}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-gray-200 hover:border-[#003399] transition-colors">
              <div className="text-2xl md:text-3xl font-bold text-[#003399] mb-1">{t('home.metric2')}</div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">{t('home.metric2Desc')}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-gray-200 hover:border-[#003399] transition-colors">
              <div className="text-2xl md:text-3xl font-bold text-[#003399] mb-1">{t('home.metric3')}</div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">{t('home.metric3Desc')}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/50 backdrop-blur-sm border border-gray-200 hover:border-[#003399] transition-colors">
              <div className="text-2xl md:text-3xl font-bold text-[#003399] mb-1">{t('home.metric4')}</div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">{t('home.metric4Desc')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Example */}
      <section className="py-20 bg-gradient-to-b from-white via-blue-50/30 to-white border-t border-gray-100 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#003399]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          {/* Header with badge */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#003399]/10 to-blue-500/10 border border-[#003399]/20 rounded-full mb-6">
              <svg className="w-4 h-4 text-[#003399]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-[#003399]">Real-World Use Case</span>
            </div>
            <h2 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-[#003399] via-blue-600 to-[#003399] bg-clip-text text-transparent">
              {t('home.workflowExampleTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('home.workflowExampleDesc')}
            </p>
          </div>

          {/* Timeline */}
          <div className="relative mb-16">
            {/* Connection Line with gradient */}
            <div className="absolute top-10 left-0 right-0 h-1.5 bg-gradient-to-r from-gray-300 via-[#003399]/30 to-gray-300 hidden md:block rounded-full" style={{ left: '4%', right: '4%' }}></div>
            
            {/* Steps */}
            <div className="relative flex justify-between items-start">
              {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                <button
                  key={step}
                  onClick={() => setSelectedStep(step)}
                  className={`group flex flex-col items-center transition-all duration-500 ${
                    selectedStep === step ? 'scale-110 -translate-y-1' : 'hover:scale-105 hover:-translate-y-0.5'
                  }`}
                >
                  <div
                    className={`relative w-20 h-20 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl mb-3 transition-all duration-500 ${
                      selectedStep === step
                        ? 'bg-gradient-to-br from-[#003399] to-blue-600 shadow-2xl shadow-[#003399]/40 ring-4 ring-[#003399]/20'
                        : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg hover:shadow-xl hover:from-gray-500 hover:to-gray-600'
                    }`}
                  >
                    {selectedStep === step && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                    )}
                    <span className="relative z-10">{step}</span>
                  </div>
                  <div className={`text-sm font-semibold transition-all duration-300 text-center px-2 ${
                    selectedStep === step ? 'text-[#003399]' : 'text-gray-500 group-hover:text-gray-700'
                  }`}>
                    {step === 1 && '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Macallan'}
                    {step === 2 && '🇬🇧 Edrington'}
                    {step === 3 && '🇫🇷 Paris'}
                    {step === 4 && '🇭🇰 HK'}
                    {step === 5 && '🇨🇳 Shanghai'}
                    {step === 6 && '🏛️ Cave'}
                    {step === 7 && '👤 Collector'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Step Details */}
          <div className="relative bg-white rounded-3xl p-10 border border-gray-200 shadow-2xl transition-all duration-500 hover:shadow-3xl overflow-hidden group">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#003399]/5 via-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#003399]/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-400/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex items-start gap-8">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-[#003399] to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-[#003399]/30 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  {selectedStep === 1 && (
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {selectedStep === 2 && (
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  {selectedStep === 3 && (
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {selectedStep === 4 && (
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                  {selectedStep === 5 && (
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  )}
                  {selectedStep === 6 && (
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  )}
                  {selectedStep === 7 && (
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#003399]/10 to-blue-500/10 border border-[#003399]/20">
                    <span className="text-2xl font-extrabold text-[#003399]">{selectedStep}</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {selectedStep === 1 && t('home.workflowStep1')}
                    {selectedStep === 2 && t('home.workflowStep2')}
                    {selectedStep === 3 && t('home.workflowStep3')}
                    {selectedStep === 4 && t('home.workflowStep4')}
                    {selectedStep === 5 && t('home.workflowStep5')}
                    {selectedStep === 6 && t('home.workflowStep6')}
                    {selectedStep === 7 && t('home.workflowStep7')}
                  </h3>
                </div>
                <div className="pl-16">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {selectedStep === 1 && t('home.workflowStep1Desc')}
                    {selectedStep === 2 && t('home.workflowStep2Desc')}
                    {selectedStep === 3 && t('home.workflowStep3Desc')}
                    {selectedStep === 4 && t('home.workflowStep4Desc')}
                    {selectedStep === 5 && t('home.workflowStep5Desc')}
                    {selectedStep === 6 && t('home.workflowStep6Desc')}
                    {selectedStep === 7 && t('home.workflowStep7Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy by Design - Call to Action */}
          <div className="mt-12 relative bg-gradient-to-br from-[#003399]/10 via-blue-100/30 to-transparent rounded-2xl p-8 border border-[#003399]/30 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#003399]/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#003399]/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-[#003399] to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-[#003399]/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-xl font-bold text-[#003399]">Privacy by Design</h4>
                  <div className="h-1 w-1 bg-[#003399]/50 rounded-full"></div>
                  <span className="text-sm font-semibold text-[#003399]/70">Zero-Knowledge Proof</span>
                </div>
                <p className="text-base text-gray-700 leading-relaxed mb-5">{t('home.workflowExampleNote')}</p>
                <Link 
                  to="/verify" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#003399] to-blue-600 text-white font-semibold rounded-xl hover:from-[#002266] hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group/btn"
                >
                  <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t('home.verifyExampleButton')}</span>
                  <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core CaaS Principles */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#003399]">{t('home.principlesTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.principlesDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Principle 1 */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.principle1Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.principle1Desc')}
              </p>
            </div>

            {/* Principle 2 */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.principle2Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.principle2Desc')}
              </p>
            </div>

            {/* Principle 3 */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.principle3Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.principle3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-blue-50/30 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#003399]">{t('home.useCasesTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.useCasesDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Use Case 1 - Wine Traceability */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.useCase1Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.useCase1Desc')}
              </p>
            </div>

            {/* Use Case 2 - Automotive Parts */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.useCase2Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.useCase2Desc')}
              </p>
            </div>

            {/* Use Case 3 - Agriculture */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.useCase3Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.useCase3Desc')}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Connection Modes */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#003399]">{t('home.connectionTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.connectionDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Web Interface */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.connection1Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.connection1Desc')}
              </p>
            </div>

            {/* Database Event Script */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.connection2Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.connection2Desc')}
              </p>
            </div>

            {/* AI Agent via MCP */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.connection3Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.connection3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section className="py-20 bg-blue-50/30 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#003399]">{t('home.deploymentTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('home.deploymentSubtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* EBSI */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#003399]/10 rounded-xl flex items-center justify-center group-hover:bg-[#003399]/20 transition-colors">
                  <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <a href="https://ec.europa.eu/digital-building-blocks/sites/spaces/EBSI/pages/447687044/Home" target="_blank" rel="noopener noreferrer" className="text-xl font-semibold text-[#003399] hover:underline">
                  {t('home.ebsiTitle')}
                </a>
              </div>
              <p className="text-gray-600 mb-4 flex-1 leading-relaxed">
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
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#003399]/10 rounded-xl flex items-center justify-center group-hover:bg-[#003399]/20 transition-colors">
                  <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <a href="https://www.tanssi.network/" target="_blank" rel="noopener noreferrer" className="text-xl font-semibold text-[#003399] hover:underline">
                  {t('home.polkadotTitle')}
                </a>
              </div>
              <p className="text-gray-600 mb-4 flex-1 leading-relaxed">
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
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#003399]/10 rounded-xl flex items-center justify-center group-hover:bg-[#003399]/20 transition-colors">
                  <svg className="w-6 h-6 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <a href="https://solana.com/solutions/real-world-assets" target="_blank" rel="noopener noreferrer" className="text-xl font-semibold text-[#003399] hover:underline">
                  {t('home.solanaTitle')}
                </a>
              </div>
              <p className="text-gray-600 mb-4 flex-1 leading-relaxed">
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
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#003399]">{t('home.roadmapTitle')}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Q4 2025 */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-24 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center group-hover:bg-[#003399]/20 transition-colors">
                  <span className="text-lg font-bold text-[#003399]">{t('home.q4_2025')}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.q4_2025_title')}</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {t('home.q4_2025_desc')}
              </p>
            </div>

            {/* Q2 2026 */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-24 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center group-hover:bg-[#003399]/20 transition-colors">
                  <span className="text-lg font-bold text-[#003399]">{t('home.q2_2026')}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.q2_2026_title')}</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {t('home.q2_2026_desc')}
              </p>
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

