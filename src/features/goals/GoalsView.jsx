import { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle, Flag, Hourglass, Info, Calendar, CalendarDays, CalendarCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function GoalsView() {
  const { t } = useTranslation();
  const { userData, updateUserData } = useAuth();
  const goals = userData.goals || [];
  
  const [activeTab, setActiveTab] = useState('daily');
  const [newGoal, setNewGoal] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newCategory, setNewCategory] = useState('daily');

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      goals.forEach(goal => {
        if (goal.time === currentTime && !goal.notified) {
          if (Notification.permission === "granted") {
            new Notification(t('goals.goal_time_alert'), {
              body: `${t('goals.goal_alert_body_1')} "${goal.title}" ${t('goals.goal_alert_body_2')}`,
            });
            updateUserData({
              goals: goals.map(g => g.id === goal.id ? { ...g, notified: true } : g)
            });
          }
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [goals, t]);

  const addGoal = () => {
    if (newGoal.trim()) {
      updateUserData({
        goals: [...goals, { id: Date.now(), title: newGoal, progress: 0, time: newTime || '', category: newCategory, notified: false }]
      });
      setNewGoal('');
      setNewTime('');
    } else {
      alert(t('goals.no_goal_error'));
    }
  };

  const completeGoal = (id) => {
    updateUserData({
      goals: goals.map(g => g.id === id ? { ...g, progress: 100 } : g)
    });
  }
  
  const deleteGoal = (id) => {
    updateUserData({
      goals: goals.filter(g => g.id !== id)
    });
  };
  
  const filteredGoals = goals.filter(g => g.category === activeTab);

  return (
    <div className="goals-view animate-fade-up">
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <Target size={64} style={{ marginBottom: '1rem', opacity: 0.8, color: 'var(--text-primary)' }} />
        <h1 className="text-gradient">{t('goals.title')}</h1>
        <div className="quote-text" style={{ fontSize: '1.4rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>{t('goals.quote')}</div>
      </div>
      
      <div className="glass-panel delay-1 animate-fade-up" style={{ padding: '3rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          <Flag size={32} />
          <h3 style={{ fontSize: '1.8rem', margin: 0 }}>{t('goals.goal_creation')}</h3>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button className={`btn-premium ${newCategory === 'daily' ? 'active-filter' : ''}`} style={{ flex: 1, padding: '0.8rem', background: newCategory === 'daily' ? 'var(--text-primary)' : 'var(--surface-color)', color: newCategory === 'daily' ? 'var(--bg-color)' : 'var(--text-primary)' }} onClick={() => setNewCategory('daily')}><Calendar size={18} style={{display: 'inline', marginRight: '0.5rem'}}/> {t('goals.goal_daily')}</button>
          <button className={`btn-premium ${newCategory === 'weekly' ? 'active-filter' : ''}`} style={{ flex: 1, padding: '0.8rem', background: newCategory === 'weekly' ? 'var(--text-primary)' : 'var(--surface-color)', color: newCategory === 'weekly' ? 'var(--bg-color)' : 'var(--text-primary)' }} onClick={() => setNewCategory('weekly')}><CalendarDays size={18} style={{display: 'inline', marginRight: '0.5rem'}}/> {t('goals.goal_weekly')}</button>
          <button className={`btn-premium ${newCategory === 'monthly' ? 'active-filter' : ''}`} style={{ flex: 1, padding: '0.8rem', background: newCategory === 'monthly' ? 'var(--text-primary)' : 'var(--surface-color)', color: newCategory === 'monthly' ? 'var(--bg-color)' : 'var(--text-primary)' }} onClick={() => setNewCategory('monthly')}><CalendarCheck size={18} style={{display: 'inline', marginRight: '0.5rem'}}/> {t('goals.goal_monthly')}</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{t('goals.vision')}</label>
            <input type="text" className="input-premium" placeholder={t('goals.vision_placeholder')} style={{ width: '100%' }} value={newGoal} onChange={(e) => setNewGoal(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{t('goals.work_time')}</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="time" className="input-premium" style={{ flex: 1 }} value={newTime} onChange={(e) => setNewTime(e.target.value)} />
              <button className="btn-premium" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1.2rem 2rem' }} onClick={addGoal}>
                <Plus size={24} /> {t('goals.confirm_btn')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="goals-list delay-2 animate-fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)' }}><Hourglass size={24} /> {t('goals.achievements_board')}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.4rem', borderRadius: '12px' }}>
            <button style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'daily' ? 'var(--text-primary)' : 'transparent', color: activeTab === 'daily' ? 'var(--bg-color)' : 'var(--text-secondary)', fontWeight: 'bold' }} onClick={() => setActiveTab('daily')}>{t('goals.cat_daily')}</button>
            <button style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'weekly' ? 'var(--text-primary)' : 'transparent', color: activeTab === 'weekly' ? 'var(--bg-color)' : 'var(--text-secondary)', fontWeight: 'bold' }} onClick={() => setActiveTab('weekly')}>{t('goals.cat_weekly')}</button>
            <button style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'monthly' ? 'var(--text-primary)' : 'transparent', color: activeTab === 'monthly' ? 'var(--bg-color)' : 'var(--text-secondary)', fontWeight: 'bold' }} onClick={() => setActiveTab('monthly')}>{t('goals.cat_monthly')}</button>
          </div>
        </div>

        {filteredGoals.map(goal => (
          <div key={goal.id} className="goal-item glass-panel">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.6rem', color: goal.progress === 100 ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: goal.progress === 100 ? 'line-through' : 'none' }}>{goal.title}</h3>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  {goal.time && <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Info size={16} /> {t('goals.deadline_prefix')} {goal.time}</span>}
                  <button onClick={() => deleteGoal(goal.id)} className="btn-premium" style={{ padding: '0.6rem', background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="حذف الهدف">
                    <Trash2 size={20} />
                  </button>
                  {goal.progress < 100 ? (
                    <button onClick={() => completeGoal(goal.id)} className="btn-premium" style={{ padding: '0.6rem 2rem', fontSize: '1.1rem', background: 'var(--text-primary)', color: 'var(--bg-color)', border: 'none' }}>{t('goals.declare_achievement')}</button>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.2rem', textShadow: '0 0 10px var(--surface-color)' }}><CheckCircle size={28} /> {t('goals.hero_achieved')}</span>
                  )}
                </div>
              </div>
              <div className="goal-progress" style={{ height: '12px', background: 'var(--surface-color)', marginTop: '2rem', border: '1px solid var(--surface-border)' }}>
                <div className="goal-progress-bar" style={{ width: `${goal.progress}%`, background: goal.progress === 100 ? 'var(--text-primary)' : 'linear-gradient(90deg, #555, var(--text-primary))' }}></div>
              </div>
            </div>
          </div>
        ))}
        {filteredGoals.length === 0 && <p style={{ textAlign: 'center', marginTop: '3rem', fontSize: '1.3rem', color: 'var(--text-secondary)' }}>{t('goals.empty_board')}</p>}
      </div>
    </div>
  );
}
