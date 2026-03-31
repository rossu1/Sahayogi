import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../types';
import { setLocale, i18n } from '../i18n';

const LANGUAGE_KEY = '@sahayogi_language';

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>('ne');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((saved) => {
      if (saved === 'en' || saved === 'ne') {
        setLanguageState(saved);
        setLocale(saved);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    setLocale(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key: string, options?: Record<string, unknown>) => i18n.t(key, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );

  return { language, setLanguage, t };
}
