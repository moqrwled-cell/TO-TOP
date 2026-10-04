import { useState, useEffect, useRef } from 'react';
import { Compass, BookOpen, Heart, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

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
  const [locationError, setLocationError] = useState(null);
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  const notifiedPrayers = useRef({});

  // --- Quran State ---
  const [surahs, setSurahs] = useState([]);
  const [loadingSurahs, setLoadingSurahs] = useState(false);
  const [activeSurah, setActiveSurah] = useState(null);
  const [surahContent, setSurahContent] = useState(null);
  const [loadingAyahs, setLoadingAyahs] = useState(false);

  const [adhkarFilter, setAdhkarFilter] = useState('morning');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // --- 1. Load Prayer Times ---
  useEffect(() => {
    if (activeTab === 'prayers' && !timings) {
      if (!isOnline) {
        setLocationError("أنت الآن في وضع عدم الاتصال (بدون إنترنت). يرجى الاتصال لجلب أوقات الصلاة.");
        setLoadingPrayers(false);
        return;
      }
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=4`)
              .then(res => res.json())
              .then(data => {
                setTimings(data.data.timings);
                setLoadingPrayers(false);
              })
              .catch(err => {
                setLocationError("حدث خطأ أثناء جلب أوقات الصلاة");
                setLoadingPrayers(false);
              });
          },
          (error) => {
            setLocationError("يرجى السماح بالوصول للموقع الجغرافي للحصول على أوقات الصلاة الدقيقة.");
            setLoadingPrayers(false);
          }
        );
      } else {
        setLocationError("المتصفح الخاص بك لا يدعم تحديد الموقع.");
        setLoadingPrayers(false);
      }
    }
  }, [activeTab, timings, isOnline]);

  // --- 2. Prayer Notifications ---
  useEffect(() => {
    if (!timings) return;
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      prayerKeys.forEach(key => {
        const timeStr = timings[key];
        if (timeStr) {
          const match = timeStr.match(/(\d{2}):(\d{2})/);
          if (match) {
            let p_hour = parseInt(match[1], 10);
            let p_min = parseInt(match[2], 10);
            p_min -= 10;
            if (p_min < 0) { p_min += 60; p_hour -= 1; }
            if (currentHour === p_hour && currentMin === p_min) {
              const notifyKey = `${key}-${now.toDateString()}`;
              if (!notifiedPrayers.current[notifyKey]) {
                if (Notification.permission === "granted") {
                  new Notification("تنبيه الصلاة 🕌", { body: `متبقي 10 دقائق على أذان صلاة ${t('worship.' + key.toLowerCase())}` });
                }
                notifiedPrayers.current[notifyKey] = true;
              }
            }
          }
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [timings, t]);

  // --- 3. Load Quran Surahs ---
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

  // --- 4. Adhkar Logic ---
  const handleDhikrClick = (dhikr) => {
    const current = adhkarCounts[dhikr.id] || 0;
    if (current < dhikr.count) {
      updateUserData({ 
        adhkarCounts: { ...adhkarCounts, [dhikr.id]: current + 1 } 
      });
    }
  };

  // --- Helpers ---
  const formatTime12Hour = (timeString) => {
    if (!timeString) return '';
    const timeMatch = timeString.match(/(\d{2}):(\d{2})/);
    if (!timeMatch) return timeString;
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2];
    const ampm = hour >= 12 ? (i18n.language === 'ar' ? 'م' : 'PM') : (i18n.language === 'ar' ? 'ص' : 'AM');
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  const prayerNames = { 
    Fajr: t('worship.fajr'), 
    Sunrise: t('worship.sunrise'), 
    Dhuhr: t('worship.dhuhr'), 
    Asr: t('worship.asr'), 
    Maghrib: t('worship.maghrib'), 
    Isha: t('worship.isha') 
  };

  return (
    <div className="worship-view animate-fade-up">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <Compass size={64} style={{ marginBottom: '1rem', opacity: 0.8, color: 'var(--text-primary)' }} />
        <h1 className="text-gradient">{t('worship.title')}</h1>
        <div className="quote-text" style={{ fontSize: '1.4rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>{t('worship.quote')}</div>
      </div>
      
      {/* Top Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('prayers')}
          style={{ 
            padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', 
            borderRadius: '12px', border: '1px solid var(--surface-border)', 
            background: activeTab === 'prayers' ? 'var(--text-primary)' : 'var(--surface-color)', 
            color: activeTab === 'prayers' ? 'var(--bg-color)' : 'var(--text-primary)', 
            fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s' 
          }}
        >
          <Compass size={20} /> {t('worship.prayer_times')}
        </button>
        <button 
          onClick={() => setActiveTab('quran')}
          style={{ 
            padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', 
            borderRadius: '12px', border: '1px solid var(--surface-border)', 
            background: activeTab === 'quran' ? 'var(--text-primary)' : 'var(--surface-color)', 
            color: activeTab === 'quran' ? 'var(--bg-color)' : 'var(--text-primary)', 
            fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s' 
          }}
        >
          <BookOpen size={20} /> {t('worship.quran')}
        </button>
        <button 
          onClick={() => setActiveTab('adhkar')}
          style={{ 
            padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', 
            borderRadius: '12px', border: '1px solid var(--surface-border)', 
            background: activeTab === 'adhkar' ? 'var(--text-primary)' : 'var(--surface-color)', 
            color: activeTab === 'adhkar' ? 'var(--bg-color)' : 'var(--text-primary)', 
            fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s' 
          }}
        >
          <Heart size={20} /> {t('worship.adhkar')}
        </button>
      </div>

      {/* --- Prayers Tab --- */}
      {activeTab === 'prayers' && (
        <div className="animate-fade-up">
          {locationError && <div className="glass-panel" style={{ padding: '1.5rem', color: '#ffaaaa', marginBottom: '2rem', border: '1px solid rgba(255,100,100,0.3)', textAlign: 'center' }}>{locationError}</div>}
          {loadingPrayers && <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{t('worship.getting_location')}</div>}
          
          {timings && (
            <div className="cards-grid delay-1">
              {Object.keys(prayerNames).map(key => (
                <div key={key} className="feature-card glass-panel" style={{ minHeight: 'auto', padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.6rem', color: 'var(--text-secondary)' }}>{prayerNames[key]}</h3>
                  <div className="time-large" style={{ direction: 'ltr', display: 'inline-block', color: 'var(--text-primary)' }}>{formatTime12Hour(timings[key])}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Quran Tab --- */}
      {activeTab === 'quran' && (
        <div className="animate-fade-up">
          {!isOnline && surahs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', fontSize: '1.5rem', color: '#ffaaaa' }}>
              {t('worship.offline_quran')}
            </div>
          ) : !activeSurah ? (
            <>
              {loadingSurahs ? (
                <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{t('worship.loading_quran')}</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                  {surahs.map(surah => (
                    <button 
                      key={surah.number} 
                      onClick={() => openSurah(surah.number)}
                      style={{ 
                        background: 'var(--surface-color)', border: '1px solid var(--surface-border)', 
                        padding: '1.5rem 1rem', borderRadius: '12px', color: 'var(--text-primary)', cursor: 'pointer', 
                        fontFamily: 'var(--font-quote)', fontSize: '1.5rem', transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-highlight)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'var(--surface-color)'}
                    >
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontFamily: 'var(--font-ui)' }}>{surah.number}</div>
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
                style={{ position: 'sticky', top: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--text-primary)', color: 'var(--bg-color)', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', zIndex: 10 }}
              >
                <ArrowRight size={20} /> {t('worship.back_to_index')}
              </button>
              
              {loadingAyahs ? (
                <div style={{ textAlign: 'center', padding: '4rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{t('worship.loading_surah')}</div>
              ) : (
                surahContent && (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-quote)', color: '#ffd700', marginBottom: '2rem' }}>{surahContent.name}</h2>
                    
                    {/* Only show Bismillah if it's not Surah Al-Fatiha (which has it as Ayah 1) or Surah At-Tawbah */}
                    {surahContent.number !== 1 && surahContent.number !== 9 && (
                      <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-quote)', marginBottom: '3rem', color: 'var(--text-primary)' }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                    )}
                    
                    <div style={{ fontSize: '2rem', lineHeight: '2.5', fontFamily: 'var(--font-quote)', color: 'var(--text-primary)', textAlign: 'justify', direction: 'rtl' }}>
                      {surahContent.ayahs.map(ayah => (
                        <span key={ayah.numberInSurah}>
                          {surahContent.number !== 1 && ayah.numberInSurah === 1 ? ayah.text.replace('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ', '') : ayah.text}
                          <span style={{ color: '#ffd700', fontSize: '1.5rem', margin: '0 10px' }}>﴿{ayah.numberInSurah}﴾</span>
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              onClick={() => setAdhkarFilter('morning')}
              style={{ padding: '0.8rem 2rem', background: adhkarFilter === 'morning' ? '#4da8da' : 'transparent', color: adhkarFilter === 'morning' ? '#fff' : 'var(--text-primary)', border: adhkarFilter === 'morning' ? 'none' : '1px solid var(--surface-border)', borderRadius: '12px', cursor: 'pointer' }}
            >{t('worship.morning')}</button>
            <button 
              onClick={() => setAdhkarFilter('evening')}
              style={{ padding: '0.8rem 2rem', background: adhkarFilter === 'evening' ? '#f39c12' : 'transparent', color: adhkarFilter === 'evening' ? '#fff' : 'var(--text-primary)', border: adhkarFilter === 'evening' ? 'none' : '1px solid var(--surface-border)', borderRadius: '12px', cursor: 'pointer' }}
            >{t('worship.evening')}</button>
            <button 
              onClick={() => setAdhkarFilter('general')}
              style={{ padding: '0.8rem 2rem', background: adhkarFilter === 'general' ? '#e91e63' : 'transparent', color: adhkarFilter === 'general' ? '#fff' : 'var(--text-primary)', border: adhkarFilter === 'general' ? 'none' : '1px solid var(--surface-border)', borderRadius: '12px', cursor: 'pointer' }}
            >{t('worship.general')}</button>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {ADHKAR_DB.filter(d => d.type === adhkarFilter).map(dhikr => {
              const count = adhkarCounts[dhikr.id] || 0;
              const isCompleted = count >= dhikr.count;
              
              return (
                <div key={dhikr.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: isCompleted ? '4px solid #4caf50' : '1px solid var(--surface-border)', opacity: isCompleted ? 0.7 : 1 }}>
                  <p style={{ fontSize: '1.6rem', fontFamily: 'var(--font-quote)', lineHeight: '1.8', color: 'var(--text-primary)' }}>{dhikr.text}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{t('worship.target')} {dhikr.count}</div>
                    
                    <button 
                      onClick={() => handleDhikrClick(dhikr)}
                      disabled={isCompleted}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', 
                        padding: '1rem 2rem', fontSize: '1.2rem', fontWeight: 'bold', 
                        borderRadius: '12px', cursor: isCompleted ? 'default' : 'pointer',
                        background: isCompleted ? '#4caf50' : 'var(--surface-color)', 
                        color: isCompleted ? '#fff' : 'var(--text-primary)', border: '1px solid var(--surface-border)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isCompleted ? (
                        <><CheckCircle2 size={24} /> {t('worship.completed')}</>
                      ) : (
                        `${t('worship.click')} (${count}/${dhikr.count})`
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  );
}
