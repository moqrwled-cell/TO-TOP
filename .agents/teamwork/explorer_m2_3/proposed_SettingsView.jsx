import { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Type,
  Globe,
  Settings as SettingsIcon,
  Bell,
  BellRing,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  Navigation,
  RefreshCw
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from 'react-i18next';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  testNotification
} from '../../services/notificationService';
import {
  getCurrentLocation,
  getLastKnownLocation,
  getDefaultLocation,
  FALLBACK_CITIES,
  setManualLocation
} from '../../services/locationService';
import { getPrayerTimes } from '../../services/prayerService';
import { schedulePrayerNotifications } from '../../services/notificationService';

export default function SettingsView() {
  const { theme, setTheme, language, setLanguage, uiScale, setUiScale } = useSettings();
  const { t } = useTranslation();

  // --- Notification State ---
  const [notifState, setNotifState] = useState({
    status: 'checking',
    granted: false,
    message: ''
  });
  const [testingNotif, setTestingNotif] = useState(false);
  const [testFeedback, setTestFeedback] = useState(null);

  // --- Location State ---
  const [locState, setLocState] = useState({
    city: 'مكة المكرمة',
    isFallback: true,
    latitude: 21.4225,
    longitude: 39.8262,
    loading: false
  });
  const [locFeedback, setLocFeedback] = useState(null);

  // Load initial permission and location states
  useEffect(() => {
    let isMounted = true;

    // Check notifications status
    checkNotificationPermission().then(res => {
      if (!isMounted) return;
      setNotifState({
        status: res.status,
        granted: res.granted,
        message: ''
      });
    }).catch(() => {
      if (!isMounted) return;
      setNotifState({ status: 'unknown', granted: false, message: '' });
    });

    // Check cached or default location
    const cached = getLastKnownLocation();
    if (cached && isMounted) {
      setLocState(prev => ({
        ...prev,
        city: cached.city || 'مكة المكرمة',
        isFallback: cached.isFallback ?? false,
        latitude: cached.latitude,
        longitude: cached.longitude
      }));
    } else if (isMounted) {
      const def = getDefaultLocation();
      setLocState(prev => ({
        ...prev,
        city: def.city,
        isFallback: true,
        latitude: def.latitude,
        longitude: def.longitude
      }));
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // --- Notification Handlers ---
  const handleRequestNotification = async () => {
    try {
      const result = await requestNotificationPermission();
      setNotifState({
        status: result.status,
        granted: result.granted,
        message: ''
      });
      if (result.granted) {
        setTestFeedback({ type: 'success', text: 'تم تفعيل صلاحية الإشعارات بنجاح!' });
      } else {
        setTestFeedback({
          type: 'warning',
          text: 'تم رفض الإذن. يمكنك تفعيل الإشعارات يدوياً من إعدادات النظام للتطبيق.'
        });
      }
    } catch (err) {
      setTestFeedback({ type: 'error', text: 'حدث خطأ أثناء طلب الإذن.' });
    }
  };

  const handleTestNotification = async () => {
    setTestingNotif(true);
    setTestFeedback(null);
    try {
      const success = await testNotification();
      if (success) {
        setTestFeedback({
          type: 'success',
          text: 'تم إرسال إشعار تجريبي بنجاح! تفقد شريط التنبيهات على جهازك.'
        });
      } else {
        setTestFeedback({
          type: 'error',
          text: 'تعذر إرسال الإشعار. تأكد من منح صلاحية التنبيهات أولاً.'
        });
      }
    } catch (err) {
      setTestFeedback({ type: 'error', text: 'حدث خطأ غير متوقع أثناء إرسال الإشعار.' });
    } finally {
      setTestingNotif(false);
    }
  };

  // --- Location Handlers ---
  const handleRefreshGpsLocation = async () => {
    setLocState(prev => ({ ...prev, loading: true }));
    setLocFeedback(null);
    try {
      const loc = await getCurrentLocation({ enableHighAccuracy: true, timeout: 8000 });
      setLocState({
        city: loc.city || (loc.isFallback ? 'مكة المكرمة (احتياطي)' : 'موقعي الحالي (GPS)'),
        isFallback: loc.isFallback,
        latitude: loc.latitude,
        longitude: loc.longitude,
        loading: false
      });

      // Recalculate prayers and schedule notifications for refreshed location
      const prayerData = await getPrayerTimes({ forceRefresh: true });
      if (prayerData?.timings) {
        await schedulePrayerNotifications(prayerData.timings, prayerData.location);
      }

      setLocFeedback({
        type: 'success',
        text: loc.isFallback
          ? 'تعذر تحديد GPS، تم الاعتماد على الموقع الاحتياطي وحساب المواقيت.'
          : 'تم تحديد موقعك بدقة عبر GPS وتحديث مواقيت الصلاة بنجاح!'
      });
    } catch (err) {
      setLocState(prev => ({ ...prev, loading: false }));
      setLocFeedback({
        type: 'warning',
        text: 'تعذر الوصول إلى نظام GPS، جاري العمل بالموقع الاحتياطي.'
      });
    }
  };

  const handleSelectFallbackCity = async (e) => {
    const cityId = e.target.value;
    if (!cityId) return;

    const saved = setManualLocation(cityId);
    if (saved) {
      setLocState({
        city: saved.city,
        isFallback: true,
        latitude: saved.latitude,
        longitude: saved.longitude,
        loading: false
      });

      // Recalculate prayers with newly selected city
      try {
        const prayerData = await getPrayerTimes({ forceRefresh: true });
        if (prayerData?.timings) {
          await schedulePrayerNotifications(prayerData.timings, prayerData.location);
        }
      } catch (err) {
        console.warn('Recalculate error:', err);
      }

      setLocFeedback({
        type: 'success',
        text: `تم اعتماد مدينة (${saved.city}) وحساب مواقيت الصلاة بنجاح!`
      });
    }
  };

  // Helper for notification badge
  const renderNotifBadge = () => {
    if (notifState.granted) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#4caf50', fontWeight: 'bold' }}>
          <CheckCircle2 size={18} />
          مفعلة (نشطة)
        </span>
      );
    }
    if (notifState.status === 'denied') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#ff6b6b', fontWeight: 'bold' }}>
          <XCircle size={18} />
          معطلة / مرفوضة
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontWeight: 'bold' }}>
        <AlertCircle size={18} />
        غير محددة بعد
      </span>
    );
  };

  return (
    <div className="settings-view animate-fade-up">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <SettingsIcon size={64} style={{ marginBottom: '1rem', opacity: 0.8 }} />
        <h1 className="text-gradient">{t('settings.title')}</h1>
      </div>

      <div className="cards-grid delay-1" style={{ maxWidth: '800px', margin: '0 auto', gap: '2rem' }}>

        {/* 1. Notifications Permissions & Test */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Bell size={24} style={{ color: 'var(--accent-color)' }} />
              نظام التنبيهات والإشعارات
            </h3>
            {renderNotifBadge()}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
            يستخدم التطبيق نظام الإشعارات المحلية لتذكيرك بمواعيد الصلاة والمهام المجدولة اليومية لضمان عدم فوات أي موعد.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {!notifState.granted && (
              <button
                onClick={handleRequestNotification}
                className="btn-premium"
                style={{ flex: 1, minWidth: '180px', padding: '0.9rem 1.2rem', justifyContent: 'center' }}
              >
                <BellRing size={18} style={{ marginInlineEnd: '0.5rem' }} />
                طلب إذن الإشعارات
              </button>
            )}
            <button
              onClick={handleTestNotification}
              disabled={testingNotif}
              className="btn-premium"
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '0.9rem 1.2rem',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px solid var(--surface-border)'
              }}
            >
              <Bell size={18} style={{ marginInlineEnd: '0.5rem' }} />
              {testingNotif ? 'جاري الإرسال...' : 'إرسال إشعار تجريبي'}
            </button>
          </div>

          {testFeedback && (
            <div
              style={{
                marginTop: '1.2rem',
                padding: '0.9rem 1.2rem',
                borderRadius: '10px',
                fontSize: '0.95rem',
                background: testFeedback.type === 'success' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 107, 107, 0.15)',
                color: testFeedback.type === 'success' ? '#4caf50' : '#ff6b6b',
                border: `1px solid ${testFeedback.type === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`
              }}
            >
              {testFeedback.text}
            </div>
          )}
        </div>

        {/* 2. Geolocation & Fallback City Controls */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <MapPin size={24} style={{ color: 'var(--accent-color)' }} />
              الموقع الجغرافي ومواقيت الصلاة
            </h3>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: locState.isFallback ? '#f59e0b' : '#4caf50',
              fontWeight: 'bold'
            }}>
              {locState.isFallback ? <Compass size={18} /> : <Navigation size={18} />}
              {locState.isFallback ? 'موقع احتياطي / يدوي' : 'تحديد تلقائي دقيق (GPS)'}
            </span>
          </div>

          <div style={{
            background: 'var(--surface-color)',
            padding: '1rem 1.2rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block' }}>المدينة المعتمدة حالياً:</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>{locState.city}</strong>
            </div>
            <button
              onClick={handleRefreshGpsLocation}
              disabled={locState.loading}
              className="btn-premium"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', justifyContent: 'center' }}
            >
              <RefreshCw size={16} className={locState.loading ? 'spin' : ''} style={{ marginInlineEnd: '0.4rem' }} />
              {locState.loading ? 'جاري التحديد...' : 'تحديد عبر GPS'}
            </button>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              المدينة الاحتياطية (تُستخدم عند تعذر تشغيل GPS أو تفضيل مدينة ثابتة):
            </label>
            <select
              onChange={handleSelectFallbackCity}
              className="input-premium"
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                background: 'var(--surface-color)',
                color: 'var(--text-primary)',
                border: '1px solid var(--surface-border)',
                borderRadius: '10px'
              }}
              defaultValue=""
            >
              <option value="" disabled>-- اختر مدينة لحساب الأوقات بدقة --</option>
              {(FALLBACK_CITIES || []).map(city => (
                <option key={city.id} value={city.id}>
                  {city.name} — {city.country}
                </option>
              ))}
            </select>
          </div>

          {locFeedback && (
            <div
              style={{
                marginTop: '1.2rem',
                padding: '0.9rem 1.2rem',
                borderRadius: '10px',
                fontSize: '0.95rem',
                background: locFeedback.type === 'success' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: locFeedback.type === 'success' ? '#4caf50' : '#f59e0b',
                border: `1px solid ${locFeedback.type === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
              }}
            >
              {locFeedback.text}
            </div>
          )}
        </div>

        {/* 3. Appearance Settings */}
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

        {/* 4. Language Settings */}
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

        {/* 5. UI Scale Settings */}
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
