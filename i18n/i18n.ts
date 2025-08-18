// i18n/i18n.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';

const LANGUAGE_KEY = 'APP_LANGUAGE';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

const initI18n = async () => {
  const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
  const fallbackLang = Localization.locale?.startsWith('fr') ? 'fr' : 'en';
  const lng = storedLang || fallbackLang;

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng,
      fallbackLng: 'en',
      compatibilityJSON: 'v3',
      interpolation: {
        escapeValue: false,
      },
    });
};

export const changeAppLanguage = async (lang: 'en' | 'fr') => {
  try {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (e) {
    console.error('Erreur changement langue :', e);
  }
};

export const loadAppLanguage = async () => {
  const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (storedLang && (storedLang === 'en' || storedLang === 'fr')) {
    await i18n.changeLanguage(storedLang);
  }
};

export { initI18n };
export default i18n;
