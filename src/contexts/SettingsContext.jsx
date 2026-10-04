import { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('totop-language') || 'ar');
  const [uiScale, setUiScale] = useState(() => parseFloat(localStorage.getItem('totop-uiscale')) || 1);

  // Update Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Update Language
  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('totop-language', language);
  }, [language]);

  // Update UI Scale
  useEffect(() => {
    document.documentElement.style.setProperty('--ui-scale', uiScale);
    localStorage.setItem('totop-uiscale', uiScale);
  }, [uiScale]);

  const value = {
    theme,
    setTheme,
    language,
    setLanguage,
    uiScale,
    setUiScale,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
