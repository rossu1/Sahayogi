import { I18n } from 'i18n-js';
import { en } from './en';
import { ne } from './ne';

export const i18n = new I18n({
  en,
  ne,
});

i18n.defaultLocale = 'ne';
i18n.locale = 'ne';
i18n.enableFallback = true;

export const setLocale = (locale: 'en' | 'ne') => {
  i18n.locale = locale;
};

export const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key, options);

export type { TranslationKeys } from './en';
