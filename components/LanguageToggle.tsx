'use client';

import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const languages = ['en', 'de', 'ar'];
    const currentIndex = languages.indexOf(i18n.language);
    const nextLanguage = languages[(currentIndex + 1) % languages.length];
    i18n.changeLanguage(nextLanguage);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label="Change language"
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center gap-2"
    >
      <Languages size={20} />
      <span className="text-sm font-medium">{i18n.language.toUpperCase()}</span>
    </button>
  );
}
