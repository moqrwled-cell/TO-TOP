import { useEffect } from 'react';
import { 
  TreePine, 
  BookOpen, 
  BookMarked, 
  MessageSquare, 
  Settings, 
  LogOut, 
  X,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MoreModal({ isOpen, onClose, activeTab, onSelectTab, onLogout }) {
  const { t } = useTranslation();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const moreItems = [
    {
      id: 'pomodoro',
      label: t('nav.pomodoro', 'مؤقت بومودورو'),
      desc: 'جلسات تركيز واستراحة مع غابة الإنجاز',
      icon: TreePine,
      color: '#10b981'
    },
    {
      id: 'thoughts',
      label: t('nav.thoughts', 'خواطر وتأملات'),
      desc: 'سجل أفكارك وتأملاتك اليومية بهدوء',
      icon: BookOpen,
      color: '#3b82f6'
    },
    {
      id: 'wisdom',
      label: t('nav.wisdom', 'مكتبة الحكمة'),
      desc: 'مقتطفات وكتب مختارة لتغذية الفكر',
      icon: BookMarked,
      color: '#8b5cf6'
    },
    {
      id: 'support',
      label: t('nav.support', 'الدعم والملاحظات'),
      desc: 'شاركنا اقتراحاتك لتطوير المنصة',
      icon: MessageSquare,
      color: '#06b6d4'
    },
    {
      id: 'settings',
      label: t('nav.settings', 'الإعدادات'),
      desc: 'الموقع، الإشعارات، وتخصيص المظهر',
      icon: Settings,
      color: '#f59e0b'
    }
  ];

  return (
    <div
      className="more-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 0 max(1rem, env(safe-area-inset-bottom)) 0'
      }}
    >
      <div
        className="glass-panel animate-fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          overflowY: 'auto',
          borderRadius: '24px 24px 16px 16px',
          padding: '1.5rem',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--card-border)',
          background: 'var(--card-bg)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="var(--accent-color)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)' }}>{t('nav.more', 'المزيد')}</h3>
              <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-secondary)' }}>الأقسام والخدمات الإضافية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Secondary Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
          {moreItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  border: isActive ? '1px solid var(--accent-color)' : '1px solid var(--card-border)',
                  background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'var(--surface-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'right',
                  width: '100%',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={20} color={item.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Logout Item */}
        <button
          onClick={() => {
            onClose();
            if (onLogout) onLogout();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.85rem 1rem',
            borderRadius: '14px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#ef4444',
            cursor: 'pointer',
            textAlign: 'right',
            width: '100%',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <LogOut size={20} color="#ef4444" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ef4444' }}>
              {t('nav.logout', 'تسجيل الخروج')}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              الخروج الآمن من الحساب
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
