import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from '@/lib/translations';

const resources = Object.fromEntries(Object.entries(translations).map(([locale, translation]) => [locale, { translation }]));

i18n.use(initReactI18next).init({ resources, lng: 'en', fallbackLng: 'en', interpolation: { escapeValue: false } });

export default i18n;