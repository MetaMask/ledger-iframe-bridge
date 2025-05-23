import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const languageOptions = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: '中文' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage =
    languageOptions.find((lang) => lang.code === i18n.language) ||
    languageOptions[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button
        type="button"
        className="language-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        title="Change language"
      >
        {currentLanguage.name}
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {languageOptions.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`language-option ${
                lang.code === i18n.language ? 'active' : ''
              }`}
              onClick={() => changeLanguage(lang.code)}
              aria-label={`Change language to ${lang.name}`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
