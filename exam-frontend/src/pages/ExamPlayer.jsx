import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Globe, Sun, Moon } from 'lucide-react';

const getCleanApiUrl = (url, defaultUrl) => {
  let clean = (url || defaultUrl).trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api')) clean += '/api';
  return clean;
};

const EXAM_API_URL = getCleanApiUrl(import.meta.env.VITE_EXAM_API_URL, 'https://medresa-exam.onrender.com/api');

// ─── Complete English & Authentic Amharic Translation Dictionary ───────────
const translations = {
  en: {
    portalTitle: 'Ali Medresa Online Exam',
    nameLabel: 'Name',
    student: 'Student',
    column: 'Column',
    timeRemaining: 'Time Remaining:',
    untimedBadge: '⏳ Untimed Exam',
    unlimitedTime: 'Unlimited Time',
    loadingExam: 'Loading exam paper...',
    systemLockedTitle: '🔒 Online Exam System Locked',
    systemLockedDesc: 'The Administrator has currently locked the online exam system. No exams can be accessed or taken right now.',
    systemLockedNotice: 'Please contact your Ustaz or Administrator to unlock the exam portal.',
    examUnavailableTitle: 'Exam Unavailable',
    examEndedTitle: '⚠️ Exam Has Ended',
    examEndedDesc: 'This exam paper is no longer accepting submissions because it has been closed by the Ustaz.',
    examSubmittedSuccessTitle: '🎉 Exam Submitted Successfully!',
    jazakallah: 'Jazakallah Khair,',
    yourFinalGrade: 'YOUR FINAL GRADE',
    correctAnswersCount: 'Correct Answers:',
    gradeRecordedNotice: "Your grade has been automatically recorded in your Ustaz's roster table.",
    questionLabel: 'Question',
    of: 'of',
    submitExamBtn: 'Submit Final Answers',
    submittingBtn: 'Submitting Exam...',
    unansweredTitle: 'Unanswered Questions Remaining!',
    unansweredDescPrefix: 'You must select an answer for all questions before submitting your exam paper. You have',
    unansweredDescSuffix: 'unanswered question(s) remaining.',
    clickQuestionToAnswer: 'Click a question to answer it:',
    backToAnswerBtn: 'Back to Answer Questions',
    confirmSubmitTitle: 'Submit Exam Answers?',
    confirmSubmitAll: 'You have answered all questions. Are you ready to submit your exam?',
    confirmSubmitPartial: 'You have answered some questions. Unanswered questions will be marked as incorrect.',
    reviewAnswersBtn: 'Review Answers',
    yesSubmitNowBtn: 'Yes, Submit Now',
    timeUpToast: '⏰ Time is up! Submitting exam automatically...',
    submissionSuccessToast: '🎉 Exam submitted successfully!',
    submissionFailedToast: 'Submission failed.',
    cheatingWarningTitle: '⚠️ Suspicious Activity Warning',
    tabSwitchWarning: 'You left the exam screen / switched browser tabs! Your Ustaz has been notified via Telegram Bot.',
    autoSubmittedCheating: '⚠️ Exam automatically submitted due to repeated tab switching.',
    langToastAm: 'ቋንቋ ወደ አማርኛ ተቀይሯል',
    langToastEn: 'Language switched to English',
    themeToastDark: 'የጨለማ ገጽታ (Dark Mode) ተቀይሯል',
    themeToastLight: 'Switched to Light Mode'
  },
  am: {
    portalTitle: 'የዓሊ መድረሳ የመስመር ላይ ፈተና',
    nameLabel: 'ስም',
    student: 'ተማሪ',
    column: 'ዓምድ',
    timeRemaining: 'ቀሪ የፈተና ጊዜ፡',
    untimedBadge: '⏳ ያልተገደበ የፈተና ጊዜ',
    unlimitedTime: 'ያልተገደበ ጊዜ',
    loadingExam: 'የፈተና ወረቀቱ በመጫን ላይ ነው...',
    systemLockedTitle: '🔒 የመስመር ላይ ፈተና ሥርዓት ተቆልፏል',
    systemLockedDesc: 'የመስመር ላይ ፈተና ሥርዓቱ በአስተዳዳሪው ተቆልፏል። በአሁኑ ጊዜ ምንም ፈተና መውሰድ አይቻልም።',
    systemLockedNotice: 'እባክዎን የፈተና ፖርታሉን ለማስከፈት አስተማሪዎን ወይም አስተዳዳሪዎን ያነጋግሩ።',
    examUnavailableTitle: 'ፈተናው አይገኝም',
    examEndedTitle: '⚠️ ፈተናው ተጠናቋል',
    examEndedDesc: 'ይህ ፈተና በአስተማሪው ስለተጠናቀቀ ተጨማሪ መልስ አይቀበልም።',
    examSubmittedSuccessTitle: '🎉 ፈተናው በተሳካ ሁኔታ ተልኳል!',
    jazakallah: 'ጃዛኩሙላሁ ኸይረን፣',
    yourFinalGrade: 'የእርስዎ የመጨረሻ ውጤት',
    correctAnswersCount: 'ትክክለኛ መልሶች፡',
    gradeRecordedNotice: 'ውጤትዎ በአስተማሪዎ የውጤት ሠንጠረዥ ውስጥ በራስ-ሰር ተመዝግቧል።',
    questionLabel: 'ጥያቄ',
    of: 'ከ',
    submitExamBtn: 'መልሶችን በሙሉ አስገባ',
    submittingBtn: 'ፈተናው በመላክ ላይ ነው...',
    unansweredTitle: 'ያልተመለሱ ጥያቄዎች ቀርተዋል!',
    unansweredDescPrefix: 'ፈተናዎን ከመላክዎ በፊት የሁሉም ጥያቄዎች መልስ መምረጥ አለብዎት።',
    unansweredDescSuffix: 'ያልተመለሱ ጥያቄዎች ቀርተዋል።',
    clickQuestionToAnswer: 'ለመመለስ ጥያቄውን ይጫኑ፡',
    backToAnswerBtn: 'ተመልሰው መልስ ይምረጡ',
    confirmSubmitTitle: 'ፈተናውን ለመላክ እርግጠኛ ነዎት?',
    confirmSubmitAll: 'የሁሉም ጥያቄዎች መልስ መርጠዋል። ፈተናውን ለመላክ ዝግጁ ነዎት?',
    confirmSubmitPartial: 'የአንዳንድ ጥያቄዎች መልስ አልተመረጠም። ያልተመለሱ ጥያቄዎች እንደ ስህተት ይቆጠራሉ።',
    reviewAnswersBtn: 'መልሶችን እንደገና መርምር',
    yesSubmitNowBtn: 'አዎ፣ አሁን አስገባ',
    timeUpToast: '⏰ የፈተና ጊዜ አልቋል! ፈተናው በራሱ እየተላከ ነው...',
    submissionSuccessToast: '🎉 ፈተናው በተሳካ ሁኔታ ተልኳል!',
    submissionFailedToast: 'ፈተናውን መላክ አልተቻለም።',
    cheatingWarningTitle: '⚠️ የማታለል ማስጠንቀቂያ',
    tabSwitchWarning: 'ከፈተናው ገጽ ወጥተዋል ወይም ታብ ቀይረዋል! ለኡስታዝዎ በቴሌግራም ቦት ማስጠንቀቂያ ተልኳል።',
    autoSubmittedCheating: '⚠️ ደጋግመው ታብ በመቀየርዎ ምክንያት ፈተናው በራስ-ሰር ተጠናቋል።',
    langToastAm: 'ቋንቋ ወደ አማርኛ ተቀይሯል',
    langToastEn: 'Language switched to English',
    themeToastDark: 'የጨለማ ገጽታ (Dark Mode) ተቀይሯል',
    themeToastLight: 'Switched to Light Mode'
  }
};

export default function ExamPlayer({ quizId, student }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(student?.alreadySubmittedResult || null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [unansweredList, setUnansweredList] = useState([]);
  const [showUnansweredModal, setShowUnansweredModal] = useState(false);

  // Language state (en | am)
  const [lang, setLang] = useState(() => localStorage.getItem('student_exam_lang') || 'en');

  // Theme state (light | dark) - Default to light
  const [theme, setTheme] = useState(() => localStorage.getItem('student_exam_theme') || 'light');

  const isDark = theme === 'dark';

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'am' : 'en';
    setLang(nextLang);
    localStorage.setItem('student_exam_lang', nextLang);
    toast.success(nextLang === 'am' ? translations.am.langToastAm : translations.en.langToastEn);
  };

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('student_exam_theme', nextTheme);
    toast.success(nextTheme === 'dark' ? translations[lang].themeToastDark : translations[lang].themeToastLight);
  };

  const t = (key) => {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  // Load quiz details
  useEffect(() => {
    if (student?.alreadySubmittedResult) {
      setResult(student.alreadySubmittedResult);
    }
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${EXAM_API_URL}/quizzes/student/${quizId}`);
      const data = await res.json();

      if (res.status === 403 || data.isSystemLocked) {
        setIsSystemLocked(true);
        setError(data.message || 'The examination system is currently locked by Admin.');
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load exam paper.');
      }

      setQuiz(data);

      // Restore saved answers from localStorage if available
      const savedKey = `exam_draft_${quizId}_${student._id}`;
      const savedAnswers = localStorage.getItem(savedKey);
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      }

      // Timer calculation (only if hasTimer is enabled)
      if (data.hasTimer !== false && data.durationMinutes > 0) {
        const totalSeconds = (data.durationMinutes + (data.addedTimeMinutes || 0)) * 60;
        const startTimeKey = `exam_start_${quizId}_${student._id}`;
        let startTime = localStorage.getItem(startTimeKey);
        if (!startTime) {
          startTime = Date.now().toString();
          localStorage.setItem(startTimeKey, startTime);
        }

        const elapsedSeconds = Math.floor((Date.now() - Number(startTime)) / 1000);
        const remaining = Math.max(0, totalSeconds - elapsedSeconds);
        setTimeLeftSeconds(remaining);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer interval (only if hasTimer is enabled)
  useEffect(() => {
    if (!quiz || quiz.hasTimer === false || quiz.durationMinutes <= 0 || timeLeftSeconds <= 0 || result || submitting) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.error(t('timeUpToast'));
          executeSubmit(true); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz, timeLeftSeconds, result, submitting, lang]);

  const handleOptionSelect = (questionIndex, optionIndex) => {
    const updated = { ...answers, [questionIndex]: optionIndex };
    setAnswers(updated);
    // Save draft to localStorage
    const savedKey = `exam_draft_${quizId}_${student._id}`;
    localStorage.setItem(savedKey, JSON.stringify(updated));
  };

  const triggerSubmitPrompt = () => {
    const missing = [];
    quiz.questions.forEach((_, idx) => {
      if (answers[idx] === undefined || answers[idx] === null || answers[idx] < 0) {
        missing.push(idx + 1);
      }
    });

    if (missing.length > 0) {
      setUnansweredList(missing);
      setShowUnansweredModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const scrollToQuestion = (qNum) => {
    setShowUnansweredModal(false);
    const element = document.getElementById(`question-card-${qNum - 1}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const executeSubmit = async (isAutoSubmit = false) => {
    setShowConfirmModal(false);
    if (submitting || result) return;

    if (!isAutoSubmit) {
      const missing = [];
      quiz.questions.forEach((_, idx) => {
        if (answers[idx] === undefined || answers[idx] === null || answers[idx] < 0) {
          missing.push(idx + 1);
        }
      });

      if (missing.length > 0) {
        setUnansweredList(missing);
        setShowUnansweredModal(true);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    // Format answers array
    const formattedAnswers = quiz.questions.map((_, idx) => answers[idx] ?? -1);

    try {
      const res = await fetch(`${EXAM_API_URL}/quizzes/student/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          studentId: student._id,
          studentName: student.fullName,
          answers: formattedAnswers
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t('submissionFailedToast'));
      }

      // Clear local draft and start time
      localStorage.removeItem(`exam_draft_${quizId}_${student._id}`);
      localStorage.removeItem(`exam_start_${quizId}_${student._id}`);

      setResult(data);
      toast.success(t('submissionSuccessToast'));
    } catch (err) {
      setError(err.message);
      toast.error(err.message || t('submissionFailedToast'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        isDark ? 'bg-gray-950 text-gray-300' : 'bg-gray-50 text-gray-600'
      }`}>
        <div className="text-center">
          <div className="animate-spin text-emerald-600 text-4xl mb-2">⏳</div>
          <p className="font-medium text-sm">{t('loadingExam')}</p>
        </div>
      </div>
    );
  }

  if (isSystemLocked) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        isDark ? 'bg-gray-950 text-white' : 'bg-gray-900 text-white'
      }`}>
        <div className={`rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-4 border ${
          isDark ? 'bg-gray-900 border-red-900/50' : 'bg-white border-red-200'
        }`}>
          <div className="w-20 h-20 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
            🔒
          </div>
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('systemLockedTitle')}</h1>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('systemLockedDesc')}
          </p>
          <div className={`p-3 rounded-xl text-xs font-bold border ${
            isDark ? 'bg-red-950/60 text-red-300 border-red-900/60' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {t('systemLockedNotice')}
          </div>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-800'
      }`}>
        <div className={`p-8 rounded-3xl shadow-xl max-w-md w-full text-center border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}>
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold">{t('examUnavailableTitle')}</h2>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
        </div>
      </div>
    );
  }

  // Result screen after submission (Score summary only)
  if (result) {
    return (
      <div className={`min-h-screen transition-colors duration-200 flex flex-col ${
        isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        {/* Top Header */}
        <header className={`sticky top-0 z-40 border-b px-4 sm:px-8 py-3.5 transition-colors ${
          isDark ? 'bg-gray-900/90 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900 shadow-sm'
        }`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/medresa_icon.jpg" 
                alt="Ali Medresa Logo" 
                className="w-10 h-10 rounded-xl object-cover shadow-sm border border-emerald-100/60" 
              />
              <div>
                <h1 className={`font-extrabold text-base sm:text-lg leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('portalTitle')}
                </h1>
                <p className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('nameLabel')}: <span className="font-bold">{student.fullName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl transition flex items-center gap-2 text-xs font-bold cursor-pointer border ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                }`}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-emerald-600" />}
                <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
              </button>

              {/* Globe Language Toggle Button */}
              <button
                onClick={toggleLanguage}
                className={`p-2.5 rounded-xl border transition flex items-center gap-2 text-xs font-bold cursor-pointer ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
                }`}
                title={lang === 'en' ? 'Switch to Amharic' : 'Switch to English'}
              >
                <Globe size={18} className="text-blue-500" />
                <span>{lang === 'en' ? 'English (EN)' : 'አማርኛ (AM)'}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className={`p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border space-y-4 ${
            isDark ? 'bg-gray-900 border-emerald-900/50 text-white' : 'bg-white border-emerald-100 text-gray-900'
          }`}>
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-3 shadow-inner">
              🎉
            </div>
            <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('examSubmittedSuccessTitle')}</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('jazakallah')} {student.fullName}.</p>

            <div className={`my-6 p-5 rounded-2xl border shadow-sm ${
              isDark ? 'bg-emerald-950/40 border-emerald-900/60' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
            }`}>
              <span className={`text-xs uppercase tracking-wider font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                {t('yourFinalGrade')}
              </span>
              <div className={`text-4xl font-black mt-1 ${isDark ? 'text-emerald-300' : 'text-emerald-950'}`}>
                {result.score} <span className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>/ {result.maxScore || quiz?.maxScore || 100}</span>
              </div>
              <p className={`text-xs mt-2 font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                {t('correctAnswersCount')} {result.correctAnswers} {t('of')} {result.totalQuestions}
              </p>
            </div>

            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('gradeRecordedNotice')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div 
      onContextMenu={(e) => { e.preventDefault(); toast.error(lang === 'am' ? 'ኮፒ ማድረግ ወይም ማየት ተከልክሏል!' : 'Copying or right click is disabled during exam!'); }}
      onCopy={(e) => { e.preventDefault(); toast.error(lang === 'am' ? 'የፈተና ጽሑፍ ኮፒ ማድረግ አይቻልም!' : 'Copying exam text is disabled!'); }}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'u', 's', 'p'].includes(e.key.toLowerCase())) { e.preventDefault(); toast.error(lang === 'am' ? 'የቁልፍ ትዕዛዝ ተከልክሏል!' : 'Keyboard shortcuts disabled!'); } }}
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
      className={`min-h-screen transition-colors duration-200 pb-12 select-none ${
        isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* ─── DEDICATED TOP NAVIGATION BAR ───────────────────────────────────── */}
      <header className={`sticky top-0 z-40 border-b px-4 sm:px-8 py-3.5 transition-colors ${
        isDark ? 'bg-gray-900/90 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900 shadow-sm'
      }`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/medresa_icon.jpg" 
              alt="Ali Medresa Logo" 
              className="w-10 h-10 rounded-xl object-cover shadow-sm border border-emerald-100/60" 
            />
            <div>
              <h1 className={`font-extrabold text-base sm:text-lg leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('portalTitle')}
              </h1>
              <p className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('nameLabel')}: <span className="font-bold">{student.fullName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition flex items-center gap-2 text-xs font-bold cursor-pointer border ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-emerald-600" />}
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            {/* Globe Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className={`p-2.5 rounded-xl border transition flex items-center gap-2 text-xs font-bold cursor-pointer ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
              }`}
              title={lang === 'en' ? 'Switch to Amharic' : 'Switch to English'}
            >
              <Globe size={18} className="text-blue-500" />
              <span>{lang === 'en' ? 'English (EN)' : 'አማርኛ (AM)'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Questions List */}
      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Exam Information Header Card */}
        <div className={`p-4 sm:p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900 shadow-sm'
        }`}>
          <div>
            <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border mb-1 ${
              isDark ? 'bg-emerald-950 text-emerald-400 border-emerald-800/40' : 'bg-emerald-100 text-emerald-800 border-emerald-200/50'
            }`}>
              {t('column')}: {quiz.examColumnName}
            </span>
            <h2 className="text-xl font-black">{quiz.title}</h2>
          </div>

          {quiz.hasTimer !== false && quiz.durationMinutes > 0 ? (
            <div className={`px-4 py-2 rounded-xl font-mono text-lg font-bold flex items-center space-x-2 shadow-inner border ${
              timeLeftSeconds < 300 
                ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800 animate-pulse' 
                : (isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200')
            }`}>
              <span>⏱️</span>
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>
          ) : (
            <div className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-inner border ${
              isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>
              <span>⏳</span>
              <span>{t('untimedBadge')}</span>
            </div>
          )}
        </div>

        {error && (
          <div className={`p-4 rounded-2xl text-sm font-medium border ${
            isDark ? 'bg-red-950/60 border-red-900/60 text-red-300' : 'bg-red-100 border-red-200 text-red-800'
          }`}>
            ⚠️ {error}
          </div>
        )}

        {quiz.questions.map((q, qIdx) => (
          <div
            id={`question-card-${qIdx}`}
            key={q._id || qIdx}
            className={`rounded-3xl p-6 border transition-all ${
              answers[qIdx] !== undefined && answers[qIdx] !== null && answers[qIdx] >= 0
                ? (isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-xs')
                : (isDark ? 'bg-gray-900 border-amber-500/60 ring-2 ring-amber-500/20' : 'bg-white border-amber-300 ring-2 ring-amber-100')
            }`}
          >
            <div className="flex items-start space-x-3 mb-4">
              <span className={`font-bold px-3 py-1 rounded-xl text-sm border ${
                isDark ? 'bg-emerald-950 text-emerald-400 border-emerald-800/40' : 'bg-emerald-100 text-emerald-800 border-emerald-200/50'
              }`}>
                {t('questionLabel')} {qIdx + 1}
              </span>
              <h3 className={`text-base font-semibold pt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {q.questionText}
              </h3>
            </div>

            <div className="space-y-3 pl-2">
              {q.options.map((opt, optIdx) => {
                const isSelected = answers[qIdx] === optIdx;
                return (
                  <label
                    key={optIdx}
                    onClick={() => handleOptionSelect(qIdx, optIdx)}
                    className={`flex items-center p-4 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? (isDark 
                            ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-medium shadow-sm' 
                            : 'border-emerald-600 bg-emerald-50 text-emerald-900 font-medium shadow-xs')
                        : (isDark 
                            ? 'border-gray-800 hover:bg-gray-800/50 text-gray-300' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700')
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question_${qIdx}`}
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={triggerSubmitPrompt}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transition text-base flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span>{t('submittingBtn')}</span>
            ) : (
              <span>{t('submitExamBtn')}</span>
            )}
          </button>
        </div>
      </main>

      {/* Unanswered Questions Warning Modal */}
      {showUnansweredModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl shadow-2xl max-w-md w-full p-6 text-center border animate-fadeIn space-y-4 ${
            isDark ? 'bg-gray-900 border-amber-900/50 text-white' : 'bg-white border-amber-200 text-gray-900'
          }`}>
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">
              ⚠️
            </div>

            <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('unansweredTitle')}</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('unansweredDescPrefix')} <strong className="text-amber-600 dark:text-amber-400 font-black">{unansweredList.length}</strong> {t('unansweredDescSuffix')}
            </p>

            {/* List of unanswered question badges */}
            <div className={`p-4 rounded-2xl border text-left space-y-2 ${
              isDark ? 'bg-amber-950/30 border-amber-900/50' : 'bg-amber-50 border-amber-200'
            }`}>
              <span className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                {t('clickQuestionToAnswer')}
              </span>
              <div className="flex flex-wrap gap-2">
                {unansweredList.map((qNum) => (
                  <button
                    key={qNum}
                    onClick={() => scrollToQuestion(qNum)}
                    className={`font-extrabold text-xs px-3.5 py-2 rounded-xl border shadow-xs transition flex items-center gap-1.5 cursor-pointer hover:scale-105 ${
                      isDark ? 'bg-gray-800 text-amber-300 border-amber-800 hover:bg-gray-700' : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    <span>{t('questionLabel')} {qNum}</span>
                    <span className="text-[10px]">↗</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowUnansweredModal(false)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-sm"
              >
                {t('backToAnswerBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Student Submission Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl shadow-2xl max-w-md w-full p-6 text-center border animate-fadeIn ${
            isDark ? 'bg-gray-900 border-emerald-900/50 text-white' : 'bg-white border-emerald-100 text-gray-900'
          }`}>
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
              📝
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('confirmSubmitTitle')}</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('confirmSubmitAll')}
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className={`flex-1 py-3 border rounded-xl font-semibold cursor-pointer transition ${
                  isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('reviewAnswersBtn')}
              </button>
              <button
                onClick={() => executeSubmit(false)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
              >
                {t('yesSubmitNowBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
