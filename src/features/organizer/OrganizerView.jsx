import { useState, useEffect } from 'react';
import { Clock, Star, LayoutList, Zap, CheckCircle, Circle, Trash2, Calendar, CalendarDays, CalendarCheck, Sunrise, BellRing } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function OrganizerView() {
  const { t } = useTranslation();
  const { userData, updateUserData } = useAuth();
  const tasks = userData.tasks || [];
  const routine = userData.routines || [];

  const [activeTab, setActiveTab] = useState('daily');
  
  const [newTask, setNewTask] = useState('');
  const [newTime, setNewTime] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [newCategory, setNewCategory] = useState('daily');
  
  const [newRoutine, setNewRoutine] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState('');

  // Notification logic for routine
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      let routineUpdated = false;
      const updatedRoutine = routine.map(r => {
        if (r.time !== currentTime) {
          if (r.notified) {
            routineUpdated = true;
            return { ...r, notified: false };
          }
          return r;
        }

        if (r.time === currentTime && !r.notified) {
          if (Notification.permission === "granted") {
            new Notification(t('organizer.routine_alert'), {
              body: `${t('organizer.time_for')}: ${r.title}\n${t('organizer.dont_delay')}`,
            });
          }
          routineUpdated = true;
          return { ...r, notified: true };
        }
        return r;
      });
      
      if (routineUpdated) updateUserData({ routines: updatedRoutine });
    }, 60000);
    
    return () => clearInterval(interval);
  }, [routine, t]);

  const addTask = () => {
    if (newTask.trim() && newTime) {
      updateUserData({
        tasks: [...tasks, { id: Date.now(), text: newTask, time: newTime, isImportant, isCompleted: false, category: newCategory }].sort((a, b) => a.time.localeCompare(b.time))
      });
      setNewTask('');
      setNewTime('');
      setIsImportant(false);
    }
  };
  
  const addRoutine = () => {
    if (newRoutine.trim() && newRoutineTime) {
      updateUserData({
        routines: [...routine, { id: Date.now(), title: newRoutine, time: newRoutineTime, notified: false }].sort((a, b) => a.time.localeCompare(b.time))
      });
      setNewRoutine('');
      setNewRoutineTime('');
    }
  }

  const removeTask = (id) => updateUserData({ tasks: tasks.filter(t => t.id !== id) });
  const removeRoutine = (id) => updateUserData({ routines: routine.filter(r => r.id !== id) });

  const toggleTaskCompletion = (id) => {
    updateUserData({
      tasks: tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)
    });
  };

  const filteredTasks = tasks.filter(t => t.category === activeTab);
  const importantTask = filteredTasks.find(t => t.isImportant && !t.isCompleted) || filteredTasks.find(t => t.isImportant) || filteredTasks[0];

  return (
    <div className="organizer-view animate-fade-up">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <Clock size={64} style={{ marginBottom: '1rem', opacity: 0.8, color: 'var(--text-primary)' }} />
        <h1 className="text-gradient">{t('organizer.title')}</h1>
        <div className="quote-text" style={{ fontSize: '1.4rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>{t('organizer.quote')}</div>
      </div>
      
      <div className="cards-grid delay-1 animate-fade-up" style={{ alignItems: 'start' }}>
        
        {/* Left Column: Routine & Task Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Routine Section */}
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4caf50' }}><Sunrise size={24} /> {t('organizer.routine')}</h3>
            <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              {t('organizer.routine_desc')}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <input type="text" className="input-premium" placeholder={t('organizer.routine_placeholder')} value={newRoutine} onChange={(e) => setNewRoutine(e.target.value)} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input type="time" className="input-premium" style={{ flex: 1 }} value={newRoutineTime} onChange={(e) => setNewRoutineTime(e.target.value)} />
                <button className="btn-premium" style={{ padding: '0 1.5rem', background: '#4caf50', color: 'white', border: 'none' }} onClick={addRoutine}>{t('organizer.add_button')}</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {routine.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', padding: '1rem 1.5rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <BellRing size={20} color="#4caf50" />
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{r.time}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{r.title}</span>
                  </div>
                  <button onClick={() => removeRoutine(r.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>
              ))}
              {routine.length === 0 && <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>{t('organizer.no_routine')}</p>}
            </div>
          </div>

          {/* Task Input Section */}
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}><Zap size={24} /> {t('organizer.time_blocking')}</h3>
            
            <div style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0', background: 'var(--surface-color)', padding: '0.4rem', borderRadius: '12px' }}>
              <button style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer', background: newCategory === 'daily' ? 'var(--text-primary)' : 'transparent', color: newCategory === 'daily' ? 'var(--bg-color)' : 'var(--text-secondary)', fontWeight: 'bold' }} onClick={() => setNewCategory('daily')}>{t('organizer.cat_daily')}</button>
              <button style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer', background: newCategory === 'weekly' ? 'var(--text-primary)' : 'transparent', color: newCategory === 'weekly' ? 'var(--bg-color)' : 'var(--text-secondary)', fontWeight: 'bold' }} onClick={() => setNewCategory('weekly')}>{t('organizer.cat_weekly')}</button>
              <button style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer', background: newCategory === 'monthly' ? 'var(--text-primary)' : 'transparent', color: newCategory === 'monthly' ? 'var(--bg-color)' : 'var(--text-secondary)', fontWeight: 'bold' }} onClick={() => setNewCategory('monthly')}>{t('organizer.cat_monthly')}</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" className="input-premium" placeholder={t('organizer.add_task_placeholder')} value={newTask} onChange={(e) => setNewTask(e.target.value)} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input type="time" className="input-premium" style={{ flex: 1 }} value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                <button 
                  className={`btn-premium`} 
                  style={{ padding: '0 1.5rem', background: isImportant ? '#ffd700' : 'transparent', color: isImportant ? '#000' : 'var(--text-primary)', border: isImportant ? '1px solid #ffd700' : '1px solid var(--surface-border)' }}
                  onClick={() => setIsImportant(!isImportant)}
                  title={t('organizer.mark_important')}
                >
                  <Star size={24} />
                </button>
              </div>
              <button className="btn-premium" style={{ width: '100%', marginTop: '0.5rem' }} onClick={addTask}>{t('organizer.confirm_task')}</button>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Important Task */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {importantTask && (
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffd700' }}><Star size={24} /> {t('organizer.frog_task')}</h3>
              <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                {t('organizer.frog_desc')}
              </p>
              <div style={{ 
                background: importantTask.isCompleted ? 'var(--surface-color)' : 'rgba(255,215,0,0.05)', 
                padding: '1.5rem', 
                border: importantTask.isCompleted ? '1px solid var(--surface-border)' : '1px solid rgba(255,215,0,0.3)', 
                borderRadius: '12px', 
                boxShadow: importantTask.isCompleted ? 'none' : '0 0 20px rgba(255,215,0,0.05)',
                opacity: importantTask.isCompleted ? 0.6 : 1
              }}>
                <h2 style={{ color: importantTask.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize: '1.5rem', margin: 0, textDecoration: importantTask.isCompleted ? 'line-through' : 'none' }}>
                  {importantTask.text}
                </h2>
                <div style={{ color: importantTask.isCompleted ? 'var(--text-muted)' : '#ffd700', marginTop: '0.5rem', fontWeight: 'bold' }}>
                  {t('organizer.scheduled_for')} {importantTask.time} {importantTask.isCompleted && t('organizer.completed_mark')}
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)' }}><LayoutList size={24} /> {t('organizer.tasks_list')}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.4rem', borderRadius: '12px' }}>
                <button style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'daily' ? 'var(--text-primary)' : 'transparent', color: activeTab === 'daily' ? 'var(--bg-color)' : 'var(--text-secondary)', fontWeight: 'bold' }} onClick={() => setActiveTab('daily')}>{t('organizer.cat_daily')}</button>
                <button style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'weekly' ? 'var(--text-primary)' : 'transparent', color: activeTab === 'weekly' ? 'var(--bg-color)' : 'var(--text-secondary)', fontWeight: 'bold' }} onClick={() => setActiveTab('weekly')}>{t('organizer.cat_weekly')}</button>
                <button style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'monthly' ? 'var(--text-primary)' : 'transparent', color: activeTab === 'monthly' ? 'var(--bg-color)' : 'var(--text-secondary)', fontWeight: 'bold' }} onClick={() => setActiveTab('monthly')}>{t('organizer.cat_monthly')}</button>
              </div>
            </div>
            
            <div className="timeline">
              {filteredTasks.length > 0 ? filteredTasks.map(task => (
                <div key={task.id} className="timeline-item" style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', position: 'relative', opacity: task.isCompleted ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                  <div style={{ fontWeight: '800', fontSize: '1.4rem', color: task.isImportant && !task.isCompleted ? '#ffd700' : (task.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)'), minWidth: '70px', paddingTop: '1rem' }}>{task.time}</div>
                  <div style={{ 
                    flex: 1, 
                    background: task.isImportant && !task.isCompleted ? 'rgba(255,215,0,0.05)' : 'var(--surface-color)', 
                    border: task.isImportant && !task.isCompleted ? '1px solid rgba(255,215,0,0.4)' : '1px solid var(--surface-border)',
                    padding: '1.5rem 2rem', 
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: task.isImportant && !task.isCompleted ? '0 0 15px rgba(255,215,0,0.1)' : 'none',
                    transition: 'all 0.3s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button onClick={() => toggleTaskCompletion(task.id)} style={{ background: 'transparent', border: 'none', color: task.isCompleted ? '#4caf50' : 'var(--text-secondary)', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}>
                        {task.isCompleted ? <CheckCircle size={28} /> : <Circle size={28} />}
                      </button>
                      <h4 style={{ fontSize: '1.3rem', margin: 0, color: task.isImportant && !task.isCompleted ? '#ffd700' : (task.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)'), textDecoration: task.isCompleted ? 'line-through' : 'none', transition: 'all 0.3s' }}>
                        {task.isImportant && <Star size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />}
                        {task.text}
                      </h4>
                    </div>
                    <button onClick={() => removeTask(task.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '4rem', fontSize: '1.2rem' }}>{t('organizer.no_tasks')}</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
