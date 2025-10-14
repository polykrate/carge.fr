import { useTranslation } from 'react-i18next';

export const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 text-xs font-medium rounded transition ${
          i18n.language === 'en'
            ? 'bg-[#003399] text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('fr')}
        className={`px-2 py-1 text-xs font-medium rounded transition ${
          i18n.language === 'fr'
            ? 'bg-[#003399] text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Passer au français"
      >
        FR
      </button>
    </div>
  );
};

