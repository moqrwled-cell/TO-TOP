import { useState } from 'react';
import { MessageSquare, Send, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const TELEGRAM_BOT_TOKEN = '8880866393:AAEFdiKq5qobrrumkIRDdtufQ-RiMXWj-os';
const TELEGRAM_CHAT_ID = '1034497360';

export default function SupportView() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, sending, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('sending');

    const text = `📬 رسالة جديدة من تطبيق نحو الأفضل\n\n👤 المستخدم: ${currentUser?.email || 'زائر'}\n\n📝 الرسالة:\n${message}`;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(text)}`;

    try {
      const response = await fetch(url, {
        method: 'GET'
      });

      if (response.ok) {
        setStatus('success');
        setMessage('');
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className="support-view animate-fade-up">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <MessageSquare size={64} style={{ marginBottom: '1rem', opacity: 0.8, color: 'var(--text-primary)' }} />
        <h1 className="text-gradient">{t('support.title')}</h1>
        <div className="quote-text" style={{ fontSize: '1.2rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>{t('support.desc')}</div>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <textarea 
              className="input-premium" 
              placeholder={t('support.placeholder')} 
              style={{ width: '100%', minHeight: '150px', resize: 'vertical' }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={status === 'sending'}
            />
          </div>

          {status === 'success' && (
            <div style={{ color: 'var(--success-color, #4caf50)', textAlign: 'center', padding: '1rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px' }}>
              {t('support.success')}
            </div>
          )}

          {status === 'error' && (
            <div style={{ color: 'var(--error-color, #f44336)', textAlign: 'center', padding: '1rem', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '8px' }}>
              {t('support.error')}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-premium" 
            disabled={status === 'sending'}
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              marginTop: '1rem', 
              padding: '1rem', 
              fontSize: '1.1rem',
              opacity: status === 'sending' ? 0.7 : 1,
              background: 'var(--text-primary)',
              color: 'var(--bg-color)',
              border: 'none'
            }}
          >
            {status === 'sending' ? t('support.sending') : <><Send size={20} /> {t('support.send')}</>}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Bot size={16} /> 
          <span>الرسالة ستصلنا مباشرة عبر بوت التلجرام</span>
        </div>
      </div>
    </div>
  );
}
