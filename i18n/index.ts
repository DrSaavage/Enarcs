// i18n/index.ts
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      settings: {
        title: 'Paramètres',
        language: 'Langue',
        theme: 'Thème',
        notifications: 'Notifications',
      },
    },
  },
  en: {
    translation: {
      settings: {
        title: 'Settings',
        language: 'Language',
        theme: 'Theme',
        notifications: 'Notifications',
      },
    },
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      lng: (Localization?.locale ?? 'fr').split('-')[0],
      fallbackLng: 'fr',
      resources,
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
