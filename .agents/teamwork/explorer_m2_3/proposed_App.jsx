import { useState, useEffect } from 'react'
import { LayoutDashboard, Compass, Target, Clock, BookOpen, BookMarked, TreePine, LogOut, MessageSquare, Settings } from 'lucide-react'
import './index.css'
import WorshipView from './features/worship/WorshipView'
import GoalsView from './features/goals/GoalsView'
import Dashboard from './components/Dashboard'
import OrganizerView from './features/organizer/OrganizerView'
import ThoughtsView from './features/thoughts/ThoughtsView'
import WisdomView from './features/wisdom/WisdomView'
import PomodoroView from './features/pomodoro/PomodoroView'
import SettingsView from './features/settings/SettingsView'
import MessageModal from './components/MessageModal'
import LoginView from './components/LoginView'
import SupportView from './features/support/SupportView'
import { useAuth } from './contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import {
  requestNotificationPermission,
  initializeNotificationChannels,
  schedulePrayerNotifications
} from './services/notificationService'
import { getCurrentLocation } from './services/locationService'
import { getPrayerTimes } from './services/prayerService'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();

  // Centralized, non-blocking startup permissions flow with graceful fallbacks
  useEffect(() => {
    let isMounted = true;

    const initStartupPermissions = async () => {
      try {
        // 1. Initialize Android notification channels (safe across native and web)
        await initializeNotificationChannels().catch(err => {
          console.warn('[App] Notification channels init warning:', err?.message || err);
        });

        // 2. Request permissions in parallel (non-blocking, never halts UI)
        await Promise.allSettled([
          requestNotificationPermission(),
          getCurrentLocation({ timeout: 6000 })
        ]);

        if (!isMounted) return;

        // 3. Pre-schedule today's 5 prayers in background using resolved location or canonical Makkah fallback
        try {
          const prayerData = await getPrayerTimes();
          if (prayerData?.timings) {
            await schedulePrayerNotifications(prayerData.timings, prayerData.location);
          }
        } catch (prayerErr) {
          console.info('[App] Background prayer schedule warning:', prayerErr?.message || prayerErr);
        }
      } catch (err) {
        // Absolute fallback: app remains 100% functional, zero modal lockups
        console.warn('[App] Startup flow completed with fallback:', err?.message || err);
      }
    };

    initStartupPermissions();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!currentUser) {
    return (
      <>
        <div className="bg-animation"></div>
        <LoginView />
      </>
    );
  }

  const isPasswordUser = currentUser?.providerData?.some(p => p.providerId === 'password');
  
  if (!currentUser.emailVerified && isPasswordUser) {
    return (
      <>
        <div className="bg-animation"></div>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="glass-panel animate-fade-up" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
            <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1rem' }}>تأكيد البريد الإلكتروني</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1.2rem', marginBottom: '2rem' }}>
              لقد أرسلنا رابط تفعيل إلى بريدك الإلكتروني ({currentUser.email}). 
              يرجى فتح صندوق الوارد والضغط على الرابط لتفعيل حسابك، ثم قم بتحديث هذه الصفحة.
            </p>
            <button onClick={() => window.location.reload()} className="btn-premium" style={{ padding: '1rem 2rem', marginBottom: '1rem', width: '100%', justifyContent: 'center' }}>
              لقد قمت بتفعيل حسابي
            </button>
            <button onClick={() => logout()} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1rem' }}>
              تسجيل الخروج
            </button>
          </div>
        </div>
      </>
    );
  }

  const NavItems = () => (
    <>
      <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
        <LayoutDashboard size={24} /> <span>{t('nav.dashboard')}</span>
      </li>
      <li className={activeTab === 'worship' ? 'active' : ''} onClick={() => setActiveTab('worship')}>
        <Compass size={24} /> <span>{t('nav.worship')}</span>
      </li>
      <li className={activeTab === 'organizer' ? 'active' : ''} onClick={() => setActiveTab('organizer')}>
        <Clock size={24} /> <span>{t('nav.organizer')}</span>
      </li>
      <li className={activeTab === 'goals' ? 'active' : ''} onClick={() => setActiveTab('goals')}>
        <Target size={24} /> <span>{t('nav.goals')}</span>
      </li>
      <li className={activeTab === 'pomodoro' ? 'active' : ''} onClick={() => setActiveTab('pomodoro')}>
        <TreePine size={24} /> <span>{t('nav.pomodoro')}</span>
      </li>
      <li className={activeTab === 'thoughts' ? 'active' : ''} onClick={() => setActiveTab('thoughts')}>
        <BookOpen size={24} /> <span>{t('nav.thoughts')}</span>
      </li>
      <li className={activeTab === 'wisdom' ? 'active' : ''} onClick={() => setActiveTab('wisdom')}>
        <BookMarked size={24} /> <span>{t('nav.wisdom')}</span>
      </li>
      <li className={activeTab === 'support' ? 'active' : ''} onClick={() => setActiveTab('support')}>
        <MessageSquare size={24} /> <span>{t('nav.support')}</span>
      </li>
      <li className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
        <Settings size={24} /> <span>{t('nav.settings')}</span>
      </li>
      <li onClick={() => logout()} style={{ color: '#ff6b6b' }}>
        <LogOut size={24} /> <span>{t('nav.logout')}</span>
      </li>
    </>
  );

  return (
    <>
      <MessageModal />
      <div className="bg-animation"></div>
      <div className="app-container">
        {/* Desktop Sidebar */}
        <nav className="sidebar glass-panel desktop-sidebar">
          <div className="logo animate-fade-up" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src="/icon.jpg" alt="نحو الأفضل" style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '0.5rem', borderRadius: '15px' }} />
          </div>
          <ul className="nav-links animate-fade-up delay-1">
            <NavItems />
          </ul>
        </nav>
        
        <main className="main-content">
          <div className="glass-panel main-glass-panel" style={{ minHeight: '100%', padding: '3rem', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
            {activeTab === 'worship' && <WorshipView />}
            {activeTab === 'goals' && <GoalsView />}
            {activeTab === 'organizer' && <OrganizerView />}
            {activeTab === 'pomodoro' && <PomodoroView />}
            {activeTab === 'thoughts' && <ThoughtsView />}
            {activeTab === 'wisdom' && <WisdomView />}
            {activeTab === 'support' && <SupportView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <ul>
          <NavItems />
        </ul>
      </nav>
    </>
  )
}

export default App
