import { createContext, useContext } from 'react';
import { TRANSLATIONS } from './translations';

export const LANGUAGES = [
  { id: 'uk', label: 'Українська' },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];

const FALLBACK = 'ru';
const STORAGE_KEY = 'astro-app:language';

/** Saved language, else the browser's language if supported, else Russian. */
export function loadLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TRANSLATIONS[saved]) return saved;
  } catch {
    // Storage unavailable — fall through to the browser language.
  }
  const browser = (navigator.language || '').slice(0, 2).toLowerCase();
  return TRANSLATIONS[browser] ? browser : FALLBACK;
}

export function saveLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Storage unavailable — the choice just won't persist.
  }
}

export function translate(lang, key, vars) {
  const text = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS[FALLBACK][key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '') : text;
}

export const I18nContext = createContext({ lang: FALLBACK, setLang: () => {} });

/** `{ lang, setLang, t }` where t(key, vars) returns the string in the current language. */
export function useI18n() {
  const { lang, setLang } = useContext(I18nContext);
  return { lang, setLang, t: (key, vars) => translate(lang, key, vars) };
}

/** Display name of the birth place: translated for the default city, as found by search otherwise. */
export const placeName = (birth, t) => (birth.placeKey ? t(`place.${birth.placeKey}`) : birth.place);
