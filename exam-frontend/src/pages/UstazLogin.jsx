import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const MAIN_API_URL = import.meta.env.VITE_MAIN_API_URL || 'https://medresa.onrender.com/api';

// ─── English & Authentic Amharic Translation Dictionary ────────────────────
const translations = {
  en: {
    portalTitle: 'Ustaz Exam Portal',
    subtitle: 'Log in with your Medresa credentials',
    emailLabel: 'Ustaz Email',
    emailPlaceholder: 'e.g. ustaz@medresa.com',
    passwordLabel: 'Password',
    loginBtn: 'Log In to Exam Manager',
    loggingIn: 'Logging in...',
    emptyFieldsError: 'Please enter your email and password.',
    invalidCredentialsError: 'Invalid email or password.',
    accessDeniedError: 'Access denied. Only Ustazs and Admins can log in here.',
    langToastAm: 'ቋንቋ ወደ አማርኛ ተቀይሯል',
    langToastEn: 'Language switched to English'
  },
  am: {
    portalTitle: 'የኡስታዝ የፈተና ፖርታል',
    subtitle: 'በመድረሳው መለያዎ ይግቡ',
    emailLabel: 'የኡስታዝ ኢሜይል',
    emailPlaceholder: 'ምሳሌ፡ ustaz@medresa.com',
    passwordLabel: 'የይለፍ ቃል',
    loginBtn: 'ወደ ፈተና ማስተዳደሪያው ግባ',
    loggingIn: 'በመግባት ላይ...',
    emptyFieldsError: 'እባክዎን ኢሜይል እና የይለፍ ቃል ያስገቡ።',
    invalidCredentialsError: 'የተሳሳተ ኢሜይል ወይም የይለፍ ቃል ነው።',
    accessDeniedError: 'መግባት አልተፈቀደም። ኡስታዞች እና አስተዳዳሪዎች ብቻ መግባት ይችላሉ።',
    langToastAm: 'ቋንቋ ወደ አማርኛ ተቀይሯል',
    langToastEn: 'Language switched to English'
  }
};

export default function UstazLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Language state (en | am)
  const [lang, setLang] = useState(() => localStorage.getItem('student_exam_lang') || 'en');

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'am' : 'en';
    setLang(nextLang);
    localStorage.setItem('student_exam_lang', nextLang);
    toast.success(nextLang === 'am' ? translations.am.langToastAm : translations.en.langToastEn);
  };

  const t = (key) => {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(t('emptyFieldsError'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${MAIN_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.message || t('invalidCredentialsError'));
      }

      if (data.user?.role !== 'ustaz' && data.user?.role !== 'admin') {
        throw new Error(t('accessDeniedError'));
      }

      sessionStorage.setItem('ustazToken', data.token);
      sessionStorage.setItem('ustazUser', JSON.stringify(data.user));

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-emerald-100 relative">
        {/* Standalone Language Switcher pill in the top-right of the card */}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={toggleLanguage}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3.5 py-1.5 rounded-full border border-emerald-200/60 shadow-xs transition flex items-center gap-1.5 text-xs cursor-pointer min-h-[36px] min-w-[64px] justify-center"
            title={lang === 'en' ? 'Switch to Amharic' : 'Switch to English'}
          >
            <Globe size={14} className="text-emerald-600 animate-pulse" />
            <span>{lang === 'en' ? 'EN' : 'አማ'}</span>
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-3xl font-extrabold mx-auto mb-3">
            📚
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('portalTitle')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('emailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('passwordLabel')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 text-gray-900"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? <span>{t('loggingIn')}</span> : <span>{t('loginBtn')}</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
