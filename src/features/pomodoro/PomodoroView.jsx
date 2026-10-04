import { useState, useEffect } from 'react';
import { Timer, TreePine, TreeDeciduous, Palmtree, Sprout, Clover, Flower2, Play, Square, Coins, Store } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TREES_DB = [
  { id: 'sprout', name: 'نبتة البداية', icon: Sprout, cost: 0, color: '#4caf50' },
  { id: 'pine', name: 'شجرة الصنوبر', icon: TreePine, cost: 50, color: '#2e7d32' },
  { id: 'deciduous', name: 'شجرة البلوط', icon: TreeDeciduous, cost: 100, color: '#81c784' },
  { id: 'palm', name: 'النخلة', icon: Palmtree, cost: 200, color: '#fbc02d' },
  { id: 'clover', name: 'نبتة الحظ', icon: Clover, cost: 300, color: '#69f0ae' },
  { id: 'flower', name: 'زهرة الجمال', icon: Flower2, cost: 500, color: '#e91e63' },
];

export default function PomodoroView() {
  const { userData, updateUserData } = useAuth();
  
  const points = userData.points || 0;
  const unlockedTrees = userData.unlockedTrees || ['sprout'];
  const selectedTreeId = userData.selectedTree || 'sprout';

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [customTime, setCustomTime] = useState('');
  


  const [endTime, setEndTime] = useState(null);

  useEffect(() => {
    let interval = null;
    if (isActive && endTime) {
      interval = setInterval(() => {
        const now = Date.now();
        if (now >= endTime) {
          clearInterval(interval);
          setIsActive(false);
          setEndTime(null);
          setTimeLeft(0);
          
          // Session Complete! Give points based on total time (1 point per minute)
          const earnedPoints = Math.floor(totalTime / 60);
          updateUserData({ points: points + earnedPoints });
          
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("انتهى وقت التركيز! 🌳", {
              body: `عظيم! لقد أنهيت الجلسة وكسبت ${earnedPoints} نقطة. نمت شجرتك بنجاح.`,
            });
          }
          alert(`مبروك! لقد أكملت جلسة التركيز وكسبت ${earnedPoints} نقطة.`);
        } else {
          setTimeLeft(Math.ceil((endTime - now) / 1000));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, endTime, totalTime, points, updateUserData]);

  const setTimer = (minutes) => {
    if (isActive) return;
    const seconds = minutes * 60;
    setTimeLeft(seconds);
    setTotalTime(seconds);
  };

  const handleCustomTime = () => {
    const mins = parseInt(customTime, 10);
    if (!isNaN(mins) && mins > 0) {
      setTimer(mins);
      setCustomTime('');
    }
  };

  const toggleTimer = () => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    if (!isActive) {
      setEndTime(Date.now() + (timeLeft * 1000));
    } else {
      setEndTime(null);
    }
    setIsActive(!isActive);
  };
  
  const stopTimer = () => {
    setIsActive(false);
    setEndTime(null);
    setTimeLeft(totalTime);
  };

  const buyTree = (tree) => {
    if (unlockedTrees.includes(tree.id)) {
      updateUserData({ selectedTree: tree.id });
    } else {
      if (points >= tree.cost) {
        updateUserData({ 
          points: points - tree.cost,
          unlockedTrees: [...unlockedTrees, tree.id],
          selectedTree: tree.id
        });
      } else {
        alert("لا تملك نقاطاً كافية لشراء هذه الشجرة.");
      }
    }
  };

  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const ActiveTreeIcon = TREES_DB.find(t => t.id === selectedTreeId)?.icon || Sprout;
  const activeTreeColor = TREES_DB.find(t => t.id === selectedTreeId)?.color || '#4caf50';

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="pomodoro-view animate-fade-up">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Timer size={64} style={{ marginBottom: '1rem', opacity: 0.8 }} />
        <h1 className="text-gradient">غابة الإنجاز</h1>
        <div className="quote-text" style={{ fontSize: '1.4rem', marginTop: '1rem' }}>"ازرع شجرة تركيزك، وستحصد ثمار نجاحك."</div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Coins size={24} color="#ffd700" />
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{points}</span>
        </div>
      </div>

      <div className="cards-grid delay-1 animate-fade-up" style={{ alignItems: 'start' }}>
        
        {/* Timer Section */}
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', boxShadow: `0 0 ${progress/2}px ${activeTreeColor}40` }}>
            <div style={{ position: 'absolute', bottom: '20px', transition: 'all 1s ease', transform: `scale(${0.3 + (progress * 0.007)})`, opacity: 0.2 + (progress * 0.008) }}>
              <ActiveTreeIcon size={100} color={activeTreeColor} />
            </div>
          </div>
          
          <div className="time-large" style={{ fontSize: '5rem', marginBottom: '2rem', direction: 'ltr' }}>
            {formatTime(timeLeft)}
          </div>
          
          <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', marginBottom: '2rem', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: activeTreeColor, transition: 'width 1s linear' }}></div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
            {!isActive && <button className="btn-premium" style={{ padding: '0.8rem 1.5rem', flex: 1 }} onClick={() => setTimer(25)}>25 د</button>}
            {!isActive && <button className="btn-premium" style={{ padding: '0.8rem 1.5rem', flex: 1 }} onClick={() => setTimer(40)}>40 د</button>}
            {!isActive && <button className="btn-premium" style={{ padding: '0.8rem 1.5rem', flex: 1 }} onClick={() => setTimer(60)}>60 د</button>}
          </div>

          {!isActive && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <input type="number" className="input-premium" placeholder="دقائق مخصصة" style={{ flex: 1 }} value={customTime} onChange={e => setCustomTime(e.target.value)} />
              <button className="btn-premium" style={{ padding: '0 1.5rem' }} onClick={handleCustomTime}>تعيين</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-premium" style={{ background: isActive ? '#f44336' : '#4caf50', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 2 }} onClick={toggleTimer}>
              {isActive ? <Square size={24} /> : <Play size={24} />}
              {isActive ? 'إيقاف مؤقت' : 'ابدأ التركيز!'}
            </button>
            <button className="btn-premium" style={{ background: 'transparent', color: '#fff', border: '1px solid var(--surface-border)', flex: 1 }} onClick={stopTimer}>إنهاء</button>
          </div>
        </div>

        {/* Store Section */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}><Store size={24} /> متجر الغابة</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>استخدم نقاط التركيز لفتح أشجار ونباتات جديدة لتزين بها غابتك.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            {TREES_DB.map(tree => {
              const isUnlocked = unlockedTrees.includes(tree.id);
              const isSelected = selectedTreeId === tree.id;
              
              return (
                <div key={tree.id} 
                  onClick={() => buyTree(tree)}
                  style={{ 
                    background: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)', 
                    border: isSelected ? `2px solid ${tree.color}` : '1px solid var(--surface-border)', 
                    borderRadius: '16px', 
                    padding: '1.5rem 1rem', 
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    opacity: isUnlocked || points >= tree.cost ? 1 : 0.5
                  }}
                >
                  <tree.icon size={48} color={isUnlocked ? tree.color : 'var(--text-muted)'} style={{ margin: '0 auto 1rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{tree.name}</h4>
                  
                  {isUnlocked ? (
                    <span style={{ color: isSelected ? tree.color : 'var(--text-secondary)', fontWeight: 'bold' }}>
                      {isSelected ? 'مختارة' : 'مملوكة'}
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: '#ffd700', fontWeight: 'bold' }}>
                      <Coins size={16} /> {tree.cost}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
      </div>
    </div>
  );
}
