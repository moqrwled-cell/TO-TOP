import { useState, useEffect } from 'react';
import { Compass, Target, Clock, Coins, Trophy, Sparkles, Settings, MessageSquare, Flame, TrendingUp, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Dashboard({ setActiveTab }) {
  const { userData } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    points: 0,
    completedTasks: 0,
    totalTasks: 0,
    activeGoals: 0,
    streak: 0,
  });
  
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Calculate Greeting
    const hour = currentTime.getHours();
    if (hour >= 4 && hour < 12) setGreeting(t('dashboard.greeting_morning', 'صباح الإنجاز المشرق 🌅'));
    else if (hour >= 12 && hour < 15) setGreeting(t('dashboard.greeting_noon', 'طاب نهارك بالعمل الصالح ☀️'));
    else if (hour >= 15 && hour < 18) setGreeting(t('dashboard.greeting_afternoon', 'عصر الطموح والسعي المستمر ☕'));
    else if (hour >= 18 && hour < 22) setGreeting(t('dashboard.greeting_evening', 'مساء الهدوء والإنجاز العظيم 🌙'));
    else setGreeting(t('dashboard.greeting_night', 'وقت الراحة والتأمل، غداً يوم أجمل 🌌'));

    // Fetch Stats from Firebase Context
    const points = userData.points || 0;
    const tasks = userData.tasks || [];
    const goals = userData.goals || [];
    
    // Check if streak exists, else mock it
    const streak = userData.streak || Math.floor(Math.random() * 5) + 1;
    
    setStats({
      points,
      completedTasks: tasks.filter(t => t.isCompleted).length,
      totalTasks: tasks.length,
      activeGoals: goals.filter(g => g.progress < 100).length,
      streak
    });
  }, [userData, t, currentTime]);

  return (
    <div className="dashboard animate-fade-up" style={{ paddingBottom: '2rem' }}>
      
      {/* Top Navbar Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-color), #4da8da)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            {(userData?.displayName || 'م').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>{userData?.displayName || 'مستخدم نحو الأفضل'}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={14} /> {currentTime.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button 
            onClick={() => setActiveTab('support')} 
            className="btn-icon" 
            style={{ background: 'var(--surface-color)', padding: '0.7rem', borderRadius: '12px', color: 'var(--text-primary)', border: '1px solid var(--surface-border)', cursor: 'pointer', transition: 'all 0.3s' }}
            title={t('nav.support')}
          >
            <MessageSquare size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className="btn-icon" 
            style={{ background: 'var(--surface-color)', padding: '0.7rem', borderRadius: '12px', color: 'var(--text-primary)', border: '1px solid var(--surface-border)', cursor: 'pointer', transition: 'all 0.3s' }}
            title={t('nav.settings')}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Hero / Greeting Section */}
      <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', position: 'relative', overflow: 'hidden', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(145deg, var(--surface-color), rgba(0,0,0,0.2))' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(77, 168, 218, 0.15) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>{greeting}</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: '1.6' }}>
            {t('dashboard.welcome_msg', 'النجاح ليس صدفة، بل هو تراكم لعادات صغيرة تقوم بها كل يوم. دعنا نبدأ ببناء يوم عظيم!')}
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #ffd700' }}>
          <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '1rem', borderRadius: '14px' }}>
            <Coins size={28} color="#ffd700" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{t('dashboard.focus_points', 'نقاط التركيز')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.points}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #ff6b6b' }}>
          <div style={{ background: 'rgba(255, 107, 107, 0.1)', padding: '1rem', borderRadius: '14px' }}>
            <Flame size={28} color="#ff6b6b" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{t('dashboard.streak', 'أيام الاستمرار')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.streak} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>أيام</span></div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #4caf50' }}>
          <div style={{ background: 'rgba(76, 175, 80, 0.1)', padding: '1rem', borderRadius: '14px' }}>
            <Trophy size={28} color="#4caf50" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{t('dashboard.completed_tasks', 'المهام المنجزة')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.completedTasks} / {stats.totalTasks}</div>
          </div>
        </div>

      </div>

      {/* Main Navigation Services */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <TrendingUp size={22} color="var(--accent-color)" /> {t('dashboard.next_destination', 'وجهتك القادمة')}
        </h3>
      </div>
      
      <div className="cards-grid delay-1 animate-fade-up">
        <div className="feature-card glass-panel" onClick={() => setActiveTab('worship')} style={{ padding: '2rem', borderRadius: '20px', borderTop: '4px solid #4da8da', cursor: 'pointer', textAlign: 'right', alignItems: 'flex-start' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(77, 168, 218, 0.1)', padding: '1.2rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
            <Compass size={32} color="#4da8da" />
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>{t('nav.worship', 'العبادة')}</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>{t('dashboard.desc_worship', 'القرآن، الأذكار، والصلاة. غذّي روحك لتنطلق بقوة وطمأنينة.')}</p>
        </div>
        
        <div className="feature-card glass-panel" onClick={() => setActiveTab('organizer')} style={{ padding: '2rem', borderRadius: '20px', borderTop: '4px solid #f39c12', cursor: 'pointer', textAlign: 'right', alignItems: 'flex-start' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(243, 156, 18, 0.1)', padding: '1.2rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
            <Clock size={32} color="#f39c12" />
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>{t('nav.organizer', 'تنظيم اليوم')}</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>{t('dashboard.desc_organizer', 'برمج مهامك، سيطر على وقتك، ونظم أولوياتك اليومية بذكاء.')}</p>
        </div>
        
        <div className="feature-card glass-panel" onClick={() => setActiveTab('goals')} style={{ padding: '2rem', borderRadius: '20px', borderTop: '4px solid #e91e63', cursor: 'pointer', textAlign: 'right', alignItems: 'flex-start' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(233, 30, 99, 0.1)', padding: '1.2rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
            <Target size={32} color="#e91e63" />
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>{t('nav.goals', 'الأهداف')}</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>{t('dashboard.desc_goals', 'ضع رؤيتك الواضحة للمستقبل وتتبع إنجازاتك الكبرى خطوة بخطوة.')}</p>
        </div>
      </div>
      
    </div>
  );
}
