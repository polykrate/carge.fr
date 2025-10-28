import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { scrollToElement } from '../utils/scroll';

export const Home = () => {
  const { t } = useTranslation();
  const [selectedStep, setSelectedStep] = useState(1);
  const [openFaq, setOpenFaq] = useState(null);
  const workflowSectionRef = useRef(null);

  const scrollToWorkflow = () => {
    scrollToElement(workflowSectionRef);
  };
  
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
          <p className="text-xl md:text-2xl font-medium text-gray-700 mb-12 max-w-3xl mx-auto leading-tight">
            {t('home.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link 
              to="/verify#qr" 
              className="px-8 py-4 bg-[#003399] text-white rounded-lg hover:bg-[#002266] transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {t('home.ctaVerify')}
            </Link>
            <button
              onClick={scrollToWorkflow}
              className="group px-8 py-4 border-2 border-[#003399] text-[#003399] rounded-lg hover:bg-[#003399] hover:text-white transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
            >
              {t('home.ctaSeeExample')}
              <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
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

      {/* What Makes the Difference */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#003399]">{t('home.differenceTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.differenceDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Difference 1 - AI */}
            <div className="group bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-[#003399] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-purple-700 transition-colors">{t('home.difference1Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.difference1Desc')}
              </p>
            </div>

            {/* Difference 2 - Privacy */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.difference2Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.difference2Desc')}
              </p>
            </div>

            {/* Difference 3 - Automation */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.difference3Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.difference3Desc')}
              </p>
            </div>

            {/* Difference 4 - Traceability */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-[#003399] transition-colors">{t('home.difference4Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.difference4Desc')}
              </p>
            </div>
          </div>

          {/* CTA: Try AI Builder */}
          <div className="mt-12 text-center">
            <Link
              to="/ai"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-[#003399] text-white rounded-lg hover:from-purple-700 hover:to-[#002266] transition-all font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Try AI Builder
            </Link>
            <p className="mt-3 text-sm text-gray-600">
              Create custom workflows in 2 minutes with ChatGPT or Claude
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Example */}
      <section ref={workflowSectionRef} className="py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#003399]">{t('home.workflowExampleTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.workflowExampleDesc')}
            </p>
          </div>

          {/* Vertical Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#003399] via-blue-400 to-[#003399]"></div>

            {/* Timeline Steps */}
            <div className="space-y-8">
              {[1, 2, 3, 4, 5, 6, 7].map((step) => {
                const stepData = {
                  1: { title: t('home.workflowStep1'), desc: t('home.workflowStep1Desc'), icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                  2: { title: t('home.workflowStep2'), desc: t('home.workflowStep2Desc'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  3: { title: t('home.workflowStep3'), desc: t('home.workflowStep3Desc'), icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  4: { title: t('home.workflowStep4'), desc: t('home.workflowStep4Desc'), icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
                  5: { title: t('home.workflowStep5'), desc: t('home.workflowStep5Desc'), icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
                  6: { title: t('home.workflowStep6'), desc: t('home.workflowStep6Desc'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                  7: { title: t('home.workflowStep7'), desc: t('home.workflowStep7Desc'), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
                };
                
                const data = stepData[step];
                const isExpanded = selectedStep === step;

                return (
                  <div key={step} className="relative flex items-start gap-6">
                    {/* Circle Badge */}
                    <button
                      onClick={() => setSelectedStep(step)}
                      className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl transition-all duration-300 shadow-lg ${
                        isExpanded
                          ? 'bg-[#003399] text-white ring-4 ring-[#003399]/20 scale-110'
                          : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-[#003399] hover:text-[#003399]'
                      }`}
                    >
                      {step}
                    </button>

                    {/* Card Content */}
                    <div className="flex-1 pb-4 min-w-0">
                      <button
                        onClick={() => setSelectedStep(step)}
                        className={`w-full text-left bg-white rounded-xl border-2 transition-all duration-300 ${
                          isExpanded
                            ? 'border-[#003399] shadow-xl'
                            : 'border-gray-200 shadow-md hover:border-[#003399]/50 hover:shadow-lg'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="p-4 sm:p-6">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                              {/* Icon */}
                              <div className="flex-shrink-0">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                                  isExpanded ? 'bg-[#003399]' : 'bg-gray-100'
                                }`}>
                                  <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${isExpanded ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={data.icon} />
                                  </svg>
                                </div>
                              </div>

                              {/* Title */}
                              <div className="flex-1 min-w-0 pt-1">
                                <h3 className={`text-base sm:text-xl font-bold transition-colors duration-300 break-words ${
                                  isExpanded ? 'text-[#003399]' : 'text-gray-900'
                                }`}>
                                  {data.title}
                                </h3>
                              </div>
                            </div>

                            {/* Expand Icon */}
                            <svg
                              className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Expandable Description */}
                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="bg-gradient-to-br from-[#003399]/5 to-blue-50 rounded-lg p-3 sm:p-4 max-h-[500px] overflow-y-auto">
                              <div className="text-sm sm:text-base text-gray-700 leading-relaxed font-mono">
                                {data.desc.split('\n').map((line, idx) => (
                                  <div key={idx} className="mb-1.5 last:mb-0">
                                    {line.includes(':') ? (
                                      <>
                                        <span className="font-semibold text-[#003399]">{line.split(':')[0]}:</span>
                                        <span className="ml-1">{line.split(':').slice(1).join(':')}</span>
                                      </>
                                    ) : (
                                      line
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div className="mt-8 bg-gradient-to-r from-[#003399]/10 to-blue-100/50 border-2 border-[#003399]/30 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0 text-[#003399] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="flex-1">
                <div className="font-semibold text-[#003399] mb-1">{t('home.workflowExampleNoteTitle')}</div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{t('home.workflowExampleNote')}</p>
                <Link 
                  to="/verify"
                  state={{ loadExample: true }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#003399] text-white text-sm font-medium rounded-lg hover:bg-[#002266] transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('home.verifyExampleButton')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries We Protect */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
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


      {/* Why Trust CARGE */}
      <section className="py-20 bg-gradient-to-br from-[#003399]/5 via-white to-blue-50/30 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-[#003399]">{t('home.trustTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.trustDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {/* Legally Recognized */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 text-center group-hover:text-[#003399] transition-colors">{t('home.trust1Title')}</h3>
              <p className="text-gray-600 leading-relaxed text-center">
                {t('home.trust1Desc')}
              </p>
            </div>

            {/* Blockchain-Certified */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 text-center group-hover:text-[#003399] transition-colors">{t('home.trust2Title')}</h3>
              <p className="text-gray-600 leading-relaxed text-center">
                {t('home.trust2Desc')}
              </p>
            </div>

            {/* Open Source */}
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#003399] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-[#003399]/10 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:bg-[#003399]/20 transition-colors">
                <svg className="w-8 h-8 text-[#003399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 text-center group-hover:text-[#003399] transition-colors">{t('home.trust3Title')}</h3>
              <p className="text-gray-600 leading-relaxed text-center">
                {t('home.trust3Desc')}
              </p>
            </div>
          </div>

        {/* Learn More Link */}
        <div className="text-center">
          <Link
            to="/verify"
            state={{ loadExample: true }}
            className="inline-flex items-center gap-2 text-[#003399] font-semibold hover:underline text-lg"
          >
            {t('home.trustLearnMore')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-[#003399]">{t('home.faqTitle')}</h2>
            <p className="text-xl text-gray-600">
              {t('home.faqDesc')}
            </p>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
              const isOpen = openFaq === num;
              
              return (
                <div key={num} className="bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-[#003399] transition-all duration-300">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : num)}
                    className="w-full text-left p-6 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {t(`home.faq${num}Q`)}
                      </h3>
                    </div>
                    <svg
                      className={`w-6 h-6 text-[#003399] flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-6">
                      <p className="text-gray-700 leading-relaxed">
                        {t(`home.faq${num}A`)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
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
            <a
              href="mailto:admin@carge.fr?subject=Demo%20Request%20-%20CARGE%20Anti-Counterfeiting&body=Hello,%0D%0A%0D%0AI'm%20interested%20in%20a%20demo%20of%20CARGE%20for%20my%20brand.%0D%0A%0D%0ACompany:%20%0D%0AIndustry:%20%0D%0AUse%20Case:%20%0D%0A%0D%0AThank%20you!"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-[#003399] text-white rounded-lg hover:from-purple-700 hover:to-[#002266] transition font-medium text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('home.ctaDemo')}
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

