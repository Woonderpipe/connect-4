export const localeCodes = [
  'en', 'de', 'fr', 'es', 'it', 'pt-br', 'ru', 'tr', 'ar', 'th', 'vi', 'id', 'ja', 'ko', 'zh-hans', 'zh-hant',
] as const;

export type AppLocale = (typeof localeCodes)[number];

export type LocaleDefinition = {
  code: AppLocale;
  tag: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
};

export const DEFAULT_LOCALE: AppLocale = 'en';

export const locales: readonly LocaleDefinition[] = [
  { code: 'en', tag: 'en', nativeName: 'English', direction: 'ltr' },
  { code: 'de', tag: 'de', nativeName: 'Deutsch', direction: 'ltr' },
  { code: 'fr', tag: 'fr', nativeName: 'Français', direction: 'ltr' },
  { code: 'es', tag: 'es', nativeName: 'Español', direction: 'ltr' },
  { code: 'it', tag: 'it', nativeName: 'Italiano', direction: 'ltr' },
  { code: 'pt-br', tag: 'pt-BR', nativeName: 'Português (Brasil)', direction: 'ltr' },
  { code: 'ru', tag: 'ru', nativeName: 'Русский', direction: 'ltr' },
  { code: 'tr', tag: 'tr', nativeName: 'Türkçe', direction: 'ltr' },
  { code: 'ar', tag: 'ar', nativeName: 'العربية', direction: 'rtl' },
  { code: 'th', tag: 'th', nativeName: 'ไทย', direction: 'ltr' },
  { code: 'vi', tag: 'vi', nativeName: 'Tiếng Việt', direction: 'ltr' },
  { code: 'id', tag: 'id', nativeName: 'Bahasa Indonesia', direction: 'ltr' },
  { code: 'ja', tag: 'ja', nativeName: '日本語', direction: 'ltr' },
  { code: 'ko', tag: 'ko', nativeName: '한국어', direction: 'ltr' },
  { code: 'zh-hans', tag: 'zh-Hans', nativeName: '简体中文', direction: 'ltr' },
  { code: 'zh-hant', tag: 'zh-Hant', nativeName: '繁體中文', direction: 'ltr' },
] as const;

export function isAppLocale(value: string): value is AppLocale {
  return (localeCodes as readonly string[]).includes(value);
}

export function getLocalePath(locale: AppLocale): string {
  return locale === DEFAULT_LOCALE ? '/' : `/${locale}`;
}

export function getLocale(locale: AppLocale): LocaleDefinition {
  return locales.find((item) => item.code === locale) ?? locales[0];
}

export function isRtlLocale(locale: AppLocale): boolean {
  return getLocale(locale).direction === 'rtl';
}
