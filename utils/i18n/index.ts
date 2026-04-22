import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import frCommon from './locales/fr/common.json';
import enCommon from './locales/en/common.json';

const resources = {
  fr: {
    common: frCommon,
  },
  en: {
    common: enCommon,
  },
} as const;

export function initI18n(): void {
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'fr';
  const supportedLanguages = ['fr', 'en'] as const;
  const language = supportedLanguages.includes(deviceLocale as (typeof supportedLanguages)[number])
    ? deviceLocale
    : 'fr';

  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: 'fr',
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
    });
  }
}

export default i18n;
