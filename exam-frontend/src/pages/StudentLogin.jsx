import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const getCleanApiUrl = (url, defaultUrl) => {
  let clean = (url || defaultUrl).trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api')) clean += '/api';
  return clean;
};

const MAIN_API_URL = getCleanApiUrl(import.meta.env.VITE_MAIN_API_URL, 'https://medresa.onrender.com/api');
const EXAM_API_URL = getCleanApiUrl(import.meta.env.VITE_EXAM_API_URL, 'https://medresa-exam.onrender.com/api');

// ─── English & Authentic Amharic Translation Dictionary ────────────────────
const translations = {
  en: {
    portalTitle: 'Ali Medresa Exam Portal',
    subtitle: 'Identify yourself to begin the exam',
    inputLabel: 'Exam Login Code',
    inputPlaceholder: 'e.g. 011  (Ustaz No. 01 + Your No. 1)',
    helperText: 'Enter your combined code: Ustaz number + your student number. Example: Ustaz 01, Student 1 → type 011.',
    submitBtn: 'Start Exam ➔',
    verifyingBtn: 'Verifying Identity...',
    systemLockedTitle: '🔒 Online Exam System Locked',
    systemLockedDesc: 'The Administrator has currently locked the online exam system. No exams can be accessed or taken right now.',
    systemLockedNotice: 'Please contact your Ustaz or Administrator to unlock the exam portal.',
    emptyIdentifierError: 'Please enter your combined exam login code (e.g. 011).',
    verificationFailedError: 'Student verification failed.',
    studentNotFoundError: 'Invalid exam code. Please enter your combined code (e.g. 011).',
    langToastAm: 'ቋንቋ ወደ አማርኛ ተቀይሯል',
    langToastEn: 'Language switched to English'
  },
  am: {
    portalTitle: 'የዓሊ መድረሳ የፈተና ፖርታል',
    subtitle: 'ፈተናውን ለመጀመር ማንነትዎን ያረጋግጡ',
    inputLabel: 'የፈተና መግቢያ ኮድ',
    inputPlaceholder: 'ምሳሌ፡ 011  (የአስተማሪ ቁጥር 01 + የተማሪ ቁጥር 1)',
    helperText: 'ጥምር ኮድዎን ያስገቡ፡ የአስተማሪዎ ቁጥር + የተማሪ ቁጥርዎ። ምሳሌ፡ አስተማሪ 01፣ ተማሪ 1 → 011 ይጻፉ።',
    submitBtn: 'ፈተናውን ጀምር ➔',
    verifyingBtn: 'ማንነትዎ በመረጋገጥ ላይ ነው...',
    systemLockedTitle: '🔒 የመስመር ላይ ፈተና ሥርዓት ተቆልፏል',
    systemLockedDesc: 'የመስመር ላይ ፈተና ሥርዓቱ በአስተዳዳሪው ተቆልፏል። በአሁኑ ጊዜ ምንም ፈተና መውሰድ አይቻልም።',
    systemLockedNotice: 'እባክዎን የፈተና ፖርታሉን ለማስከፈት አስተማሪዎን ወይም አስተዳዳሪዎን ያነጋግሩ።',
    emptyIdentifierError: 'እባክዎን ጥምር የፈተና መግቢያ ኮድዎን ያስገቡ (ምሳሌ 011)።',
    verificationFailedError: 'የተማሪ ማንነት ማረጋገጥ አልተሳካም።',
    studentNotFoundError: 'ትክክለኛ ያልሆነ የፈተና ኮድ። እባክዎን ጥምር የፈተና ኮድዎን ያስገቡ (ምሳሌ 011)።',
    langToastAm: 'ቋንቋ ወደ አማርኛ ተቀይሯል',
    langToastEn: 'Language switched to English'
  }
};

export default function StudentLogin({ quizId, onVerified }) {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [quizInfo, setQuizInfo] = useState(null);

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

  React.useEffect(() => {
    if (quizId) {
      fetch(`${EXAM_API_URL}/quizzes/student/${quizId}`)
        .then(async res => {
          const data = await res.json();
          if (res.status === 403 || data.isSystemLocked) {
            setIsSystemLocked(true);
            setError(data.message || t('systemLockedDesc'));
          } else if (data.ustazId) {
            setQuizInfo(data);
          }
        })
        .catch(e => console.warn('Quiz info fetch warning:', e));
    }
  }, [quizId]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError(t('emptyIdentifierError'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      let deviceToken = localStorage.getItem('medresa_device_id');
      if (!deviceToken) {
        deviceToken = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem('medresa_device_id', deviceToken);
      }

      const payload = { 
        identifier: identifier.trim(),
        ustazId: quizInfo?.ustazId,
        deviceToken
      };

      const res = await fetch(`${MAIN_API_URL}/exams/verify-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        let errStr = data.message || t('verificationFailedError');
        if (data.message && (data.message.includes('Invalid exam code') || data.message.includes('Student not found'))) {
          errStr = t('studentNotFoundError');
        }
        throw new Error(errStr);
      }

      // Check if student has already submitted this quiz
      if (quizId && data.student?._id) {
        try {
          const checkRes = await fetch(`${EXAM_API_URL}/quizzes/student/check-submission?quizId=${quizId}&studentId=${data.student._id}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.hasSubmitted) {
              onVerified({
                ...data.student,
                identifier: identifier.trim(),
                alreadySubmittedResult: checkData
              });
              return;
            }
          }
        } catch (e) {
          console.warn('Check submission warning:', e);
        }
      }

      onVerified({ ...data.student, identifier: identifier.trim() });
    } catch (err) {
      setError(err.message || t('verificationFailedError'));
    } finally {
      setLoading(false);
    }
  };

  if (isSystemLocked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-4 border border-red-200">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
            🔒
          </div>
          <h1 className="text-2xl font-black text-gray-900">{t('systemLockedTitle')}</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            {t('systemLockedDesc')}
          </p>
          <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs font-bold border border-red-200">
            {t('systemLockedNotice')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-emerald-900 to-gray-900 flex items-center justify-center p-4">
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
          {/* Medresa Icon Logo */}
          <img 
            src="/medresa_icon.jpg" 
            alt="Ali Medresa Logo" 
            className="w-16 h-16 rounded-2xl object-cover shadow-md mx-auto mb-3 border-2 border-emerald-100" 
          />
          <h1 className="text-2xl font-bold text-gray-900">{t('portalTitle')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inputLabel')}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t('inputPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-gray-900 placeholder-gray-400"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              {t('helperText')}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>{t('verifyingBtn')}</span>
            ) : (
              <span>{t('submitBtn')}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
