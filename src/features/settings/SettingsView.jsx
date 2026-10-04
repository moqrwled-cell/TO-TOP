import { Moon, Sun, Type, Globe, Settings as SettingsIcon } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from 'react-i18next';

export default function SettingsView() {
  const { theme, setTheme, language, setLanguage, uiScale, setUiScale } = useSettings();
  const { t } = useTranslation();

  return (
    <div className="settings-view animate-fade-up">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <SettingsIcon size={64} style={{ marginBottom: '1rem', opacity: 0.8 }} />
        <h1 className="text-gradient">{t('settings.title')}</h1>
      </div>

      <div className="cards-grid delay-1" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Appearance Settings */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
            {t('settings.appearance')}
          </h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setTheme('dark')}
              className="btn-premium" 
              style={{ flex: 1, padding: '1rem', background: theme === 'dark' ? 'var(--accent-color)' : 'transparent', color: theme === 'dark' ? 'var(--bg-color)' : 'var(--text-primary)', border: '1px solid var(--surface-border)' }}
            >
              <Moon size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: '0.5rem' }} />
              {t('settings.dark_mode')}
            </button>
            <button 
              onClick={() => setTheme('light')}
              className="btn-premium" 
              style={{ flex: 1, padding: '1rem', background: theme === 'light' ? 'var(--accent-color)' : 'transparent', color: theme === 'light' ? 'var(--bg-color)' : 'var(--text-primary)', border: '1px solid var(--surface-border)' }}
            >
              <Sun size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: '0.5rem' }} />
              {t('settings.light_mode')}
            </button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Globe size={24} />
            {t('settings.language')}
          </h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setLanguage('ar')}
              className="btn-premium" 
              style={{ flex: 1, padding: '1rem', background: language === 'ar' ? 'var(--accent-color)' : 'transparent', color: language === 'ar' ? 'var(--bg-color)' : 'var(--text-primary)', border: '1px solid var(--surface-border)' }}
            >
              {t('settings.arabic')}
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className="btn-premium" 
              style={{ flex: 1, padding: '1rem', background: language === 'en' ? 'var(--accent-color)' : 'transparent', color: language === 'en' ? 'var(--bg-color)' : 'var(--text-primary)', border: '1px solid var(--surface-border)' }}
            >
              {t('settings.english')}
            </button>
          </div>
        </div>

        {/* UI Scale Settings */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Type size={24} />
            {t('settings.ui_scale')}
          </h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setUiScale(0.85)}
              className="btn-premium" 
              style={{ flex: 1, padding: '1rem', background: uiScale === 0.85 ? 'var(--accent-color)' : 'transparent', color: uiScale === 0.85 ? 'var(--bg-color)' : 'var(--text-primary)', border: '1px solid var(--surface-border)', fontSize: '0.9rem' }}
            >
              {t('settings.scale_small')}
            </button>
            <button 
              onClick={() => setUiScale(1)}
              className="btn-premium" 
              style={{ flex: 1, padding: '1rem', background: uiScale === 1 ? 'var(--accent-color)' : 'transparent', color: uiScale === 1 ? 'var(--bg-color)' : 'var(--text-primary)', border: '1px solid var(--surface-border)', fontSize: '1rem' }}
            >
              {t('settings.scale_medium')}
            </button>
            <button 
              onClick={() => setUiScale(1.15)}
              className="btn-premium" 
              style={{ flex: 1, padding: '1rem', background: uiScale === 1.15 ? 'var(--accent-color)' : 'transparent', color: uiScale === 1.15 ? 'var(--bg-color)' : 'var(--text-primary)', border: '1px solid var(--surface-border)', fontSize: '1.1rem' }}
            >
              {t('settings.scale_large')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
