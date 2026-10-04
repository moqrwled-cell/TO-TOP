import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, UserPlus, LogIn, Globe } from 'lucide-react';

export default function LoginView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, loginWithGoogle, resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || (!isLogin && !confirmPassword)) {
      return setError('يرجى تعبئة جميع الحقول');
    }

    if (password.length < 6) {
      return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    if (!isLogin && password !== confirmPassword) {
      return setError('كلمة المرور غير متطابقة');
    }

    try {
      setLoading(true);
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      let msg = "حدث خطأ غير متوقع";
      if (err.code === 'auth/email-already-in-use') msg = "هذا البريد الإلكتروني مسجل مسبقاً";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      return setError('يرجى كتابة بريدك الإلكتروني أولاً في حقل البريد لتغيير كلمة المرور');
    }
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await resetPassword(email);
      setMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
    } catch (err) {
      let msg = "فشل في إرسال الرابط. تأكد من صحة البريد الإلكتروني.";
      if (err.code === 'auth/user-not-found') msg = "لا يوجد حساب مسجل بهذا البريد";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
    } catch (err) {
      setError('فشل تسجيل الدخول بواسطة جوجل');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      zIndex: 10
    }}>
      <div className="glass-panel animate-fade-up" style={{
        maxWidth: '450px',
        width: '100%',
        padding: '3rem',
        textAlign: 'center',
        background: 'var(--surface-color)',
        border: '1px solid var(--surface-border)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)'
      }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>نحو الأفضل</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            {isLogin ? 'سجل دخولك لاستكمال مسيرتك نحو القمة' : 'ابدأ رحلتك نحو الأفضل الآن'}
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(233, 30, 99, 0.1)', 
            border: '1px solid #e91e63', 
            color: '#ffb3c6', 
            padding: '1rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ 
            background: 'rgba(76, 175, 80, 0.1)', 
            border: '1px solid #4caf50', 
            color: '#a5d6a7', 
            padding: '1rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={20} style={{ position: 'absolute', right: '15px', top: '15px', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              className="input-premium" 
              placeholder="البريد الإلكتروني" 
              style={{ width: '100%', paddingRight: '45px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', right: '15px', top: '15px', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              className="input-premium" 
              placeholder="كلمة المرور" 
              style={{ width: '100%', paddingRight: '45px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{ position: 'absolute', right: '15px', top: '15px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="input-premium" 
                placeholder="تأكيد كلمة المرور" 
                style={{ width: '100%', paddingRight: '45px' }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {isLogin && (
            <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
              <span 
                onClick={handleResetPassword}
                style={{ color: '#03a9f4', fontSize: '0.9rem', cursor: 'pointer', transition: 'color 0.3s' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#29b6f6'}
                onMouseOut={(e) => e.currentTarget.style.color = '#03a9f4'}
              >
                نسيت كلمة المرور؟
              </span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-premium" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '1.2rem' }}
            disabled={loading}
          >
            {isLogin ? <><LogIn size={20} /> تسجيل الدخول</> : <><UserPlus size={20} /> إنشاء حساب جديد</>}
          </button>
        </form>

        {/* Google button removed for mobile compatibility */}

        <div style={{ marginTop: '2rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
          <span 
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#ffd700', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLogin ? "سجل الآن" : "سجل دخولك"}
          </span>
        </div>

      </div>
    </div>
  );
}
