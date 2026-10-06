import { useState, useEffect, useCallback } from 'react';
import { 
  Compass, BookOpen, Heart, ArrowRight, CheckCircle2, 
  Bell, BellOff, RefreshCw, MapPin, Clock 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  getPrayerTimes, 
  calculatePrayerTimes, 
  getNextPrayer, 
  formatTime12Hour 
} from '../../services/prayerService';
import { getDefaultLocation } from '../../services/locationService';
import { 
  schedulePrayerNotifications, 
  requestNotificationPermission 
} from '../../services/notificationService';

const ADHKAR_DB = [
  { id: 1, type: 'morning', text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ...', count: 1 },
  { id: 2, type: 'morning', text: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ.', count: 1 },
  { id: 3, type: 'morning', text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ.', count: 100 },
  { id: 4, type: 'morning', text: 'اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ ، خَلَقْتَنِي وَأَنَا عَبْدُكَ ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ...', count: 1 },
  { id: 5, type: 'evening', text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ...', count: 1 },
  { id: 6, type: 'evening', text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ.', count: 1 },
  { id: 7, type: 'evening', text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.', count: 3 },
  { id: 8, type: 'general', text: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ.', count: 100 },
  { id: 9, type: 'general', text: 'لا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّهِ.', count: 100 },
  { id: 10, type: 'general', text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ.', count: 10 },
];

export default function WorshipView() {
  const { t, i18n } = useTranslation();
  const { userData, updateUserData } = useAuth();
  const adhkarCounts = userData.adhkarCounts || {};
  
  const [activeTab, setActiveTab] = useState('prayers');

  // --- Prayer State ---
  const [timings, setTimings] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [_prayerSource, setPrayerSource] = useState('offline-astronomical');
  const [locationError, setLocationError] = useState(null);
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextPrayerInfo, setNextPrayerInfo] = useState(null);

  // --- Prayer Notifications State ---
  const [prayerNotifsEnabled, setPrayerNotifsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('to_top_prayer_notifs_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isSchedulingNotifs, setIsSchedulingNotifs] = useState(false);
  const [notificationFeedback, setNotificationFeedback] = useState(null);

  // --- Quran State ---
  const [surahs, setSurahs] = useState([]);
  const [loadingSurahs, setLoadingSurahs] = useState(false);
  const [activeSurah, setActiveSurah] = useState(null);
  const [surahContent, setSurahContent] = useState(null);
  const [loadingAyahs, setLoadingAyahs] = useState(false);

  const [adhkarFilter, setAdhkarFilter] = useState('morning');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- 1. Load Prayer Times (Online & Offline via prayerService) ---
  const loadPrayerTimes = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setLoadingPrayers(true);
      }
      setLocationError(null);

      // getPrayerTimes automatically checks cache, detects location (with Makkah fallback),
      // attempts online sync if available, and computes astronomical timings offline if not.
      const result = await getPrayerTimes({ forceRefresh });
      if (result?.timings) {
        setTimings(result.timings);
        setLocationInfo(result.location);
        setPrayerSource(result.source || 'offline-astronomical');
        
        // Initial next prayer computation
        const next = getNextPrayer(result.timings, new Date());
        setNextPrayerInfo(next);

        // Auto-schedule local notifications if enabled
        if (prayerNotifsEnabled) {
          schedulePrayerNotifications(result.timings, result.location).catch((err) => {
            console.warn('[WorshipView] Auto-schedule prayer notifications warning:', err);
          });
        }
      }
    } catch (err) {
      console.warn('[WorshipView] getPrayerTimes error, falling back to pure offline calculation:', err);
      // Resilient 100% offline fallback: never show a blocking failure
      const fallbackLoc = getDefaultLocation();
      const offlineTimings = calculatePrayerTimes(fallbackLoc);
      setTimings(offlineTimings);
      setLocationInfo(fallbackLoc);
      setPrayerSource('offline-astronomical');
      const next = getNextPrayer(offlineTimings, new Date());
      setNextPrayerInfo(next);
      if (prayerNotifsEnabled) {
        schedulePrayerNotifications(offlineTimings, fallbackLoc).catch(() => {});
      }
    } finally {
      setLoadingPrayers(false);
      setIsRefreshing(false);
    }
  }, [prayerNotifsEnabled]);

  useEffect(() => {
    if (activeTab === 'prayers' && !timings) {
      loadPrayerTimes();
    }
  }, [activeTab, timings, loadPrayerTimes]);

  // --- 2. Live Countdown to Next Prayer (1-second tick) ---
  useEffect(() => {
    if (!timings || activeTab !== 'prayers') return;

    // Immediately calculate
    setNextPrayerInfo(getNextPrayer(timings, new Date()));

    const timer = setInterval(() => {
      const next = getNextPrayer(timings, new Date());
      setNextPrayerInfo(next);
    }, 1000);

    return () => clearInterval(timer);
  }, [timings, activeTab]);

  // --- 3. Toggle & Schedule Prayer Notifications ---
  const handleTogglePrayerNotifications = async () => {
    if (isSchedulingNotifs) return;
    setIsSchedulingNotifs(true);

    try {
      if (!prayerNotifsEnabled) {
        // Request permissions
        const perm = await requestNotificationPermission();
        if (perm.granted) {
          setPrayerNotifsEnabled(true);
          try {
            localStorage.setItem('to_top_prayer_notifs_enabled', 'true');
          } catch {}

          if (timings) {
            const scheduled = await schedulePrayerNotifications(timings, locationInfo);
            setNotificationFeedback({
              type: 'success',
              msg: t('worship.notifs_scheduled', `تم تفعيل وجدولة تنبيهات الأذان (${scheduled.length} صلوات) بنجاح!`)
            });
          }
        } else {
          setNotificationFeedback({
            type: 'error',
            msg: t('worship.notifs_denied', 'يرجى تفعيل صلاحية الإشعارات من إعدادات جهازك لتلقي تنبيهات الأذان.')
          });
        }
      } else {
        // Disable notifications
        setPrayerNotifsEnabled(false);
        try {
          localStorage.setItem('to_top_prayer_notifs_enabled', 'false');
        } catch {}

        setNotificationFeedback({
          type: 'info',
          msg: t('worship.notifs_disabled', 'تم إيقاف تنبيهات الأذان.')
        });
      }
    } catch (err) {
      console.warn('[WorshipView] handleTogglePrayerNotifications error:', err);
    } finally {
      setIsSchedulingNotifs(false);
      setTimeout(() => setNotificationFeedback(null), 4000);
    }
  };

  // --- 4. Load Quran Surahs ---
  useEffect(() => {
    if (activeTab === 'quran' && surahs.length === 0) {
      if (!isOnline) return;
      setLoadingSurahs(true);
      fetch('https://api.alquran.cloud/v1/surah')
        .then(res => res.json())
        .then(data => {
          setSurahs(data.data);
          setLoadingSurahs(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingSurahs(false);
        });
    }
  }, [activeTab, surahs.length, isOnline]);

  const openSurah = (surahNumber) => {
    if (!isOnline) {
      alert(t('worship.offline_quran'));
      return;
    }
    setLoadingAyahs(true);
    setActiveSurah(surahNumber);
    fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`)
      .then(res => res.json())
      .then(data => {
        setSurahContent(data.data);
        setLoadingAyahs(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingAyahs(false);
      });
  };

  const closeSurah = () => {
    setActiveSurah(null);
    setSurahContent(null);
  };

  // --- 5. Adhkar Logic ---
  const handleDhikrClick = (dhikr) => {
    const current = adhkarCounts[dhikr.id] || 0;
    if (current < dhikr.count) {
      updateUserData({ 
        adhkarCounts: { ...adhkarCounts, [dhikr.id]: current + 1 } 
      });
    }
  };

  const prayerNames = { 
    Fajr: t('worship.fajr', 'الفجر'), 
    Sunrise: t('worship.sunrise', 'الشروق'), 
    Dhuhr: t('worship.dhuhr', 'الظهر'), 
    Asr: t('worship.asr', 'العصر'), 
    Maghrib: t('worship.maghrib', 'المغرب'), 
    Isha: t('worship.isha', 'العشاء') 
  };

  return (
    <div className="worship-view animate-fade-up">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Compass size={56} style={{ marginBottom: '0.8rem', opacity: 0.85, color: 'var(--text-primary)' }} />
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{t('worship.title')}</h1>
        <div className="quote-text" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{t('worship.quote')}</div>
      </div>
      
      {/* Top Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('prayers')}
          style={{ 
            padding: '0.8rem 1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', 
            borderRadius: '12px', border: '1px solid var(--surface-border)', 
            background: activeTab === 'prayers' ? 'var(--text-primary)' : 'var(--surface-color)', 
            color: activeTab === 'prayers' ? 'var(--bg-color)' : 'var(--text-primary)', 
            fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s' 
          }}
        >
          <Compass size={18} /> {t('worship.prayer_times')}
        </button>
        <button 
          onClick={() => setActiveTab('quran')}
          style={{ 
            padding: '0.8rem 1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', 
            borderRadius: '12px', border: '1px solid var(--surface-border)', 
            background: activeTab === 'quran' ? 'var(--text-primary)' : 'var(--surface-color)', 
            color: activeTab === 'quran' ? 'var(--bg-color)' : 'var(--text-primary)', 
            fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s' 
          }}
        >
          <BookOpen size={18} /> {t('worship.quran')}
        </button>
        <button 
          onClick={() => setActiveTab('adhkar')}
          style={{ 
            padding: '0.8rem 1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', 
            borderRadius: '12px', border: '1px solid var(--surface-border)', 
            background: activeTab === 'adhkar' ? 'var(--text-primary)' : 'var(--surface-color)', 
            color: activeTab === 'adhkar' ? 'var(--bg-color)' : 'var(--text-primary)', 
            fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s' 
          }}
        >
          <Heart size={18} /> {t('worship.adhkar')}
        </button>
      </div>

      {/* --- Prayers Tab --- */}
      {activeTab === 'prayers' && (
        <div className="animate-fade-up">
          {locationError && (
            <div className="glass-panel" style={{ padding: '1rem', color: '#ffaaaa', marginBottom: '1.5rem', border: '1px solid rgba(255,100,100,0.3)', textAlign: 'center' }}>
              {locationError}
            </div>
          )}

          {/* Hero Next Prayer & Live Countdown Card */}
          {nextPrayerInfo && timings && (
            <div 
              className="glass-panel" 
              style={{
                padding: '2rem',
                borderRadius: '24px',
                marginBottom: '2rem',
                background: 'linear-gradient(135deg, rgba(77, 168, 218, 0.15) 0%, rgba(20, 24, 36, 0.8) 100%)',
                border: '1px solid rgba(77, 168, 218, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
              }}
            >
              {/* Decorative background glow */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-50px',
                  left: '-50px',
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(77, 168, 218, 0.25) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} 
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.2rem', position: 'relative', zIndex: 1 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      background: 'var(--accent-color)', 
                      color: '#000', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold', 
                      padding: '0.2rem 0.8rem', 
                      borderRadius: '20px' 
                    }}>
                      {t('worship.next_prayer', 'الصلاة القادمة')}
                    </span>
                    {nextPrayerInfo.isTomorrow && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        ({t('worship.tomorrow', 'غداً')})
                      </span>
                    )}
                  </div>
                  
                  <h2 style={{ fontSize: '2.4rem', fontWeight: '800', margin: '0.2rem 0', color: 'var(--text-primary)' }}>
                    {t(`worship.${nextPrayerInfo.key.toLowerCase()}`, nextPrayerInfo.name)}
                  </h2>

                  <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                    <Clock size={18} />
                    <span style={{ direction: 'ltr', fontWeight: '600' }}>
                      {formatTime12Hour(nextPrayerInfo.time, i18n.language)}
                    </span>
                  </div>
                </div>

                {/* Countdown Box */}
                <div style={{ textAlign: 'left', direction: 'ltr', minWidth: '180px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right', direction: 'rtl', marginBottom: '0.3rem' }}>
                    {t('worship.remaining_time', 'متبقي على الأذان')}
                  </div>
                  <div 
                    style={{ 
                      fontSize: '2.4rem', 
                      fontWeight: '800', 
                      fontFamily: 'monospace', 
                      color: 'var(--accent-color)', 
                      letterSpacing: '2px',
                      textShadow: '0 2px 10px rgba(77, 168, 218, 0.4)' 
                    }}
                  >
                    {nextPrayerInfo.formattedCountdown}
                  </div>
                </div>
              </div>

              {/* Location & Controls Bar */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: '1.5rem', 
                  paddingTop: '1rem', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  flexWrap: 'wrap',
                  gap: '0.8rem'
                }}
              >
                {/* Location Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <MapPin size={16} color="var(--accent-color)" />
                  <span>
                    {locationInfo?.isFallback 
                      ? t('worship.makkah_fallback', 'مكة المكرمة (الموقع الافتراضي)') 
                      : (locationInfo?.city || t('worship.my_location', 'موقعك الحالي'))}
                  </span>
                </div>

                {/* Refresh & Notification Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={() => loadPrayerTimes(true)}
                    disabled={isRefreshing}
                    className="btn-icon"
                    style={{
                      background: 'var(--surface-color)',
                      border: '1px solid var(--surface-border)',
                      borderRadius: '10px',
                      padding: '0.5rem 0.8rem',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                    title={t('worship.refresh_times', 'تحديث المواقيت')}
                  >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                    <span>{t('worship.refresh', 'تحديث')}</span>
                  </button>

                  <button
                    onClick={handleTogglePrayerNotifications}
                    disabled={isSchedulingNotifs}
                    style={{
                      background: prayerNotifsEnabled ? 'rgba(76, 175, 80, 0.15)' : 'var(--surface-color)',
                      border: `1px solid ${prayerNotifsEnabled ? '#4caf50' : 'var(--surface-border)'}`,
                      borderRadius: '10px',
                      padding: '0.5rem 0.8rem',
                      color: prayerNotifsEnabled ? '#4caf50' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    title={prayerNotifsEnabled ? t('worship.notifs_on', 'التنبيهات مفعلة') : t('worship.notifs_off', 'التنبيهات معطلة')}
                  >
                    {prayerNotifsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                    <span>
                      {prayerNotifsEnabled 
                        ? t('worship.notifs_active', 'تنبيهات الأذان مفعلة') 
                        : t('worship.notifs_inactive', 'تفعيل تنبيهات الأذان')}
                    </span>
                  </button>
                </div>
              </div>

              {notificationFeedback && (
                <div 
                  style={{
                    marginTop: '0.8rem',
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    background: notificationFeedback.type === 'error' ? 'rgba(255, 107, 107, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                    color: notificationFeedback.type === 'error' ? '#ff6b6b' : '#4caf50',
                    border: `1px solid ${notificationFeedback.type === 'error' ? '#ff6b6b' : '#4caf50'}`
                  }}
                >
                  {notificationFeedback.msg}
                </div>
              )}
            </div>
          )}

          {loadingPrayers && (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              {t('worship.getting_location')}
            </div>
          )}
          
          {timings && (
            <div className="cards-grid delay-1">
              {Object.keys(prayerNames).map(key => {
                const isNext = nextPrayerInfo?.key === key;
                return (
                  <div 
                    key={key} 
                    className="feature-card glass-panel" 
                    style={{ 
                      minHeight: 'auto', 
                      padding: '1.5rem',
                      border: isNext ? '2px solid var(--accent-color)' : '1px solid var(--surface-border)',
                      background: isNext ? 'rgba(77, 168, 218, 0.08)' : 'var(--surface-color)',
                      transform: isNext ? 'scale(1.02)' : 'none',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                  >
                    {isNext && (
                      <div 
                        style={{ 
                          position: 'absolute', 
                          top: '10px', 
                          insetInlineEnd: '10px', 
                          background: 'var(--accent-color)', 
                          color: '#000', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold', 
                          padding: '2px 8px', 
                          borderRadius: '12px' 
                        }}
                      >
                        {t('worship.next_badge', 'التالية')}
                      </div>
                    )}
                    <h3 style={{ fontSize: '1.4rem', color: isNext ? 'var(--accent-color)' : 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      {prayerNames[key]}
                    </h3>
                    <div className="time-large" style={{ direction: 'ltr', display: 'inline-block', color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 'bold' }}>
                      {formatTime12Hour(timings[key], i18n.language)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- Quran Tab --- */}
      {activeTab === 'quran' && (
        <div className="animate-fade-up">
          {!isOnline && surahs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', fontSize: '1.3rem', color: '#ffaaaa' }}>
              {t('worship.offline_quran')}
            </div>
          ) : !activeSurah ? (
            <>
              {loadingSurahs ? (
                <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.3rem', color: 'var(--text-primary)' }}>{t('worship.loading_quran')}</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                  {surahs.map(surah => (
                    <button 
                      key={surah.number} 
                      onClick={() => openSurah(surah.number)}
                      style={{ 
                        background: 'var(--surface-color)', border: '1px solid var(--surface-border)', 
                        padding: '1.2rem 1rem', borderRadius: '12px', color: 'var(--text-primary)', cursor: 'pointer', 
                        fontFamily: 'var(--font-quote)', fontSize: '1.4rem', transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-highlight)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'var(--surface-color)'}
                    >
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-ui)' }}>{surah.number}</div>
                      {surah.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
              <button 
                onClick={closeSurah}
                style={{ position: 'sticky', top: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--text-primary)', color: 'var(--bg-color)', border: 'none', padding: '0.7rem 1.4rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', zIndex: 10 }}
              >
                <ArrowRight size={18} /> {t('worship.back_to_index')}
              </button>
              
              {loadingAyahs ? (
                <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.3rem', color: 'var(--text-primary)' }}>{t('worship.loading_surah')}</div>
              ) : (
                surahContent && (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-quote)', color: '#ffd700', marginBottom: '1.5rem' }}>{surahContent.name}</h2>
                    
                    {/* Only show Bismillah if it's not Surah Al-Fatiha (which has it as Ayah 1) or Surah At-Tawbah */}
                    {surahContent.number !== 1 && surahContent.number !== 9 && (
                      <div style={{ fontSize: '2.2rem', fontFamily: 'var(--font-quote)', marginBottom: '2.5rem', color: 'var(--text-primary)' }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                    )}
                    
                    <div style={{ fontSize: '1.8rem', lineHeight: '2.4', fontFamily: 'var(--font-quote)', color: 'var(--text-primary)', textAlign: 'justify', direction: 'rtl' }}>
                      {surahContent.ayahs.map(ayah => (
                        <span key={ayah.numberInSurah}>
                          {surahContent.number !== 1 && ayah.numberInSurah === 1 ? ayah.text.replace('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ', '') : ayah.text}
                          <span style={{ color: '#ffd700', fontSize: '1.4rem', margin: '0 8px' }}>﴿{ayah.numberInSurah}﴾</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* --- Adhkar Tab --- */}
      {activeTab === 'adhkar' && (
        <div className="animate-fade-up">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
            <button 
              onClick={() => setAdhkarFilter('morning')}
              style={{ padding: '0.7rem 1.8rem', background: adhkarFilter === 'morning' ? '#4da8da' : 'transparent', color: adhkarFilter === 'morning' ? '#fff' : 'var(--text-primary)', border: adhkarFilter === 'morning' ? 'none' : '1px solid var(--surface-border)', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
            >{t('worship.morning')}</button>
            <button 
              onClick={() => setAdhkarFilter('evening')}
              style={{ padding: '0.7rem 1.8rem', background: adhkarFilter === 'evening' ? '#f39c12' : 'transparent', color: adhkarFilter === 'evening' ? '#fff' : 'var(--text-primary)', border: adhkarFilter === 'evening' ? 'none' : '1px solid var(--surface-border)', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
            >{t('worship.evening')}</button>
            <button 
              onClick={() => setAdhkarFilter('general')}
              style={{ padding: '0.7rem 1.8rem', background: adhkarFilter === 'general' ? '#e91e63' : 'transparent', color: adhkarFilter === 'general' ? '#fff' : 'var(--text-primary)', border: adhkarFilter === 'general' ? 'none' : '1px solid var(--surface-border)', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
            >{t('worship.general')}</button>
          </div>

          <div style={{ display: 'grid', gap: '1.2rem' }}>
            {ADHKAR_DB.filter(d => d.type === adhkarFilter).map(dhikr => {
              const count = adhkarCounts[dhikr.id] || 0;
              const isCompleted = count >= dhikr.count;
              
              return (
                <div 
                  key={dhikr.id} 
                  className="glass-panel" 
                  style={{ 
                    padding: '1.8rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.2rem', 
                    borderInlineStart: isCompleted ? '4px solid #4caf50' : '1px solid var(--surface-border)', 
                    opacity: isCompleted ? 0.7 : 1 
                  }}
                >
                  <p style={{ fontSize: '1.5rem', fontFamily: 'var(--font-quote)', lineHeight: '1.8', color: 'var(--text-primary)', margin: 0 }}>{dhikr.text}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{t('worship.target')} {dhikr.count}</div>
                    
                    <button 
                      onClick={() => handleDhikrClick(dhikr)}
                      disabled={isCompleted}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', 
                        padding: '0.8rem 1.8rem', fontSize: '1.1rem', fontWeight: 'bold', 
                        borderRadius: '12px', cursor: isCompleted ? 'default' : 'pointer',
                        background: isCompleted ? '#4caf50' : 'var(--surface-color)', 
                        color: isCompleted ? '#fff' : 'var(--text-primary)', border: '1px solid var(--surface-border)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isCompleted ? (
                        <><CheckCircle2 size={22} /> {t('worship.completed')}</>
                      ) : (
                        `${t('worship.click')} (${count}/${dhikr.count})`
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
