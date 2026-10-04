import { useState, useEffect } from 'react';
import { BookOpen, Lightbulb, Tag, Trash2, PenTool, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ThoughtsView() {
  const { t, i18n } = useTranslation();
  const [thoughts, setThoughts] = useState(() => {
    const saved = localStorage.getItem('totop_thoughts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('totop_thoughts', JSON.stringify(thoughts));
  }, [thoughts]);
  
  const categories = [t('thoughts.cat_reflections'), t('thoughts.cat_project'), t('thoughts.cat_inspiration'), t('thoughts.cat_future')];
  
  const [newThought, setNewThought] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [filterCategory, setFilterCategory] = useState(t('thoughts.cat_all'));

  const addThought = () => {
    if (newThought.trim()) {
      const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
      setThoughts([{ id: Date.now(), text: newThought, category: selectedCategory, date }, ...thoughts]);
      setNewThought('');
    }
  };

  const removeThought = (id) => {
    setThoughts(thoughts.filter(t => t.id !== id));
  };

  const filteredThoughts = filterCategory === t('thoughts.cat_all') ? thoughts : thoughts.filter(t => t.category === filterCategory);

  return (
    <div className="thoughts-view animate-fade-up">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <BookOpen size={64} style={{ marginBottom: '1rem', opacity: 0.8, color: 'var(--text-primary)' }} />
        <h1 className="text-gradient">{t('thoughts.title')}</h1>
        <div className="quote-text" style={{ fontSize: '1.4rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>{t('thoughts.quote')}</div>
      </div>
      
      {/* Capture Section */}
      <div className="glass-panel delay-1 animate-fade-up" style={{ padding: '3rem', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          <PenTool size={32} />
          <h3 style={{ fontSize: '1.8rem', margin: 0 }}>{t('thoughts.capture_title')}</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <textarea 
            className="input-premium" 
            placeholder={t('thoughts.capture_placeholder')}
            style={{ width: '100%', minHeight: '150px', resize: 'vertical', fontSize: '1.2rem', lineHeight: '1.8' }}
            value={newThought}
            onChange={(e) => setNewThought(e.target.value)}
          ></textarea>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Tag size={20} color="var(--text-secondary)" />
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: selectedCategory === cat ? 'var(--text-primary)' : 'transparent',
                      color: selectedCategory === cat ? 'var(--bg-color)' : 'var(--text-secondary)',
                      border: selectedCategory === cat ? '1px solid var(--text-primary)' : '1px solid var(--surface-border)',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      fontWeight: selectedCategory === cat ? 'bold' : 'normal'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <button className="btn-premium" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem' }} onClick={addThought}>
              <Lightbulb size={24} /> {t('thoughts.add_button')}
            </button>
          </div>
        </div>
      </div>

      {/* Thoughts Archive & Filter */}
      <div className="delay-2 animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)' }}>
          <BookOpen size={28} /> {t('thoughts.archive_title')}
        </h3>
        
        {/* Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.5rem', borderRadius: '30px', border: '1px solid var(--surface-border)' }}>
          <Filter size={18} color="var(--text-secondary)" style={{ margin: '0 0.5rem' }} />
          {[t('thoughts.cat_all'), ...categories].map(cat => (
            <button
              key={`filter-${cat}`}
              onClick={() => setFilterCategory(cat)}
              style={{
                background: filterCategory === cat ? 'var(--text-primary)' : 'transparent',
                color: filterCategory === cat ? 'var(--bg-color)' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: filterCategory === cat ? 'bold' : 'normal',
                transition: 'all 0.3s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      <div className="cards-grid delay-2 animate-fade-up" style={{ alignItems: 'start' }}>
        {filteredThoughts.map(thought => (
          <div key={thought.id} className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ 
                background: 'var(--surface-color)', 
                border: '1px solid var(--surface-border)', 
                padding: '0.4rem 1rem', 
                borderRadius: '15px',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                fontWeight: '600'
              }}>
                {thought.category}
              </span>
              <button 
                onClick={() => removeThought(thought.id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.3s' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ff6b6b'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                title={t('thoughts.delete_tooltip')}
              >
                <Trash2 size={24} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-primary)', fontSize: '1.3rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
              {thought.text}
            </p>
            
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'left', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
              {thought.date}
            </div>
          </div>
        ))}
        {thoughts.length > 0 && filteredThoughts.length === 0 && (
          <p style={{ textAlign: 'center', width: '100%', color: 'var(--text-secondary)', fontSize: '1.3rem', marginTop: '3rem' }}>{t('thoughts.empty_filter')}</p>
        )}
        {thoughts.length === 0 && (
          <p style={{ textAlign: 'center', width: '100%', color: 'var(--text-secondary)', fontSize: '1.3rem', marginTop: '3rem' }}>{t('thoughts.empty_all')}</p>
        )}
      </div>
    </div>
  );
}
