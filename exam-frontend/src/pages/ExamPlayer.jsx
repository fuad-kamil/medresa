import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Globe, Sun, Moon } from 'lucide-react';
import { createPortal } from 'react-dom';

const ModalPortal = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

const getCleanApiUrl = (url, defaultUrl) => {
  let clean = (url || defaultUrl).trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api')) clean += '/api';
  return clean;
};

const MAIN_API_URL = getCleanApiUrl(import.meta.env.VITE_MAIN_API_URL, 'https://medresa.onrender.com/api');
const EXAM_API_URL = getCleanApiUrl(import.meta.env.VITE_EXAM_API_URL, 'https://medresa-exam.onrender.com/api');

// ─── Deterministic Seeded PRNG for Section-Aware Question Randomization ────
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 8), t | 7);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function seededShuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleQuizBySections(quizData, studentId) {
  if (!quizData || !quizData.questions || quizData.questions.length <= 1) {
    return quizData;
  }

  const seedStr = `${studentId || 'default'}_${quizData._id || 'quiz'}`;
  const rng = mulberry32(stringToSeed(seedStr));

  // Attach originalIdx to every question
  const rawQuestions = quizData.questions.map((q, idx) => ({
    ...q,
    originalIdx: idx
  }));

  // Group contiguous questions into section blocks
  const sectionBlocks = [];
  let currentBlock = [];

  rawQuestions.forEach((q, idx) => {
    if (idx > 0 && q.sectionTitle && q.sectionTitle.trim()) {
      if (currentBlock.length > 0) {
        sectionBlocks.push(currentBlock);
      }
      currentBlock = [q];
    } else {
      currentBlock.push(q);
    }
  });
  if (currentBlock.length > 0) {
    sectionBlocks.push(currentBlock);
  }

  // Shuffle questions WITHIN each section block, maintaining sectionTitle on top question
  const shuffledQuestions = [];

  sectionBlocks.forEach((block) => {
    const blockSectionTitle = block.find(q => q.sectionTitle && q.sectionTitle.trim())?.sectionTitle || '';

    const cleanedBlock = block.map(q => {
      const copy = { ...q };
      delete copy.sectionTitle;
      return copy;
    });

    const shuffledBlock = seededShuffle(cleanedBlock, rng);

    if (blockSectionTitle && shuffledBlock.length > 0) {
      shuffledBlock[0].sectionTitle = blockSectionTitle;
    }

    shuffledQuestions.push(...shuffledBlock);
  });

  return {
    ...quizData,
    _rawQuestions: quizData.questions,
    questions: shuffledQuestions
  };
}

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
    jazakallah: 'JazakAllah Khair,',
    submittedNotice: 'Thank you! Your exam paper has been submitted successfully.',
    resultPublishedByUstazNotice: 'Your results will be reviewed and published by your Ustaz.',
    gradeRecordedNotice: 'Your submission has been recorded safely in your Ustaz gradebook.',
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
    themeToastLight: 'Switched to Light Mode',
    shortAnswerLabel: '✏️ Short Answer',
    fillBlankLabel: '🔲 Fill in the Blank',
    shortAnswerPlaceholder: 'Write your answer here...',
    fillBlankPlaceholder: 'Fill in the blank here...',
    openAnswerHint: 'Your Ustaz will review and grade this answer manually.',
    openAnswerPendingNotice: '⏳ This question will be graded by your Ustaz.',
    timeUpModalTitle: '⏰ Time is Up!',
    timeUpModalDesc: 'Your exam time has ended. Input fields are locked and you can no longer answer questions. Any unanswered questions will be marked as incorrect.',
    timeUpModalSubmitBtn: 'Submit Exam Result',
    timeExtendedToast: '⏱️ Ustaz added extra time! You can now continue your exam.'
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
    jazakallah: 'ጃዛካላሁ ኸይረን፣',
    submittedNotice: 'እናመሰግናለን! የፈተና ወረቀትዎ በተሳካ ሁኔታ ተልኳል።',
    resultPublishedByUstazNotice: 'ውጤትዎ በኡስታዝዎ ታይቶ የሚገለጽ ይሆናል።',
    gradeRecordedNotice: 'የሰጡት መልስ በኡስታዝዎ የውጤት ሠንጠረዥ ውስጥ ተመዝግቧል።',
    questionLabel: 'ጥያቄ',
    of: 'ከ',
    submitExamBtn: 'መልሶችን በሙሉ አስገባ',
    submittingBtn: 'ፈተናው በመላክ ላይ ነው...',
    unansweredTitle: 'ያልተመለሱ ጥያቄዎች ቀርተዋል!',
    unansweredDescPrefix: '',
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
    themeToastLight: 'Switched to Light Mode',
    shortAnswerLabel: '✏️ ጭብጥ መልስ',
    fillBlankLabel: '🔲 ክፍተት መሙያ',
    shortAnswerPlaceholder: 'መልስዎን እዚህ ይፃፉ...',
    fillBlankPlaceholder: 'ክፍተቱን እዚህ ይሙሉ...',
    openAnswerHint: 'ይህ ጥያቄ በኡስታዝዎ ይታያል እና ውጤቱ ይሰጣል።',
    openAnswerPendingNotice: '⏳ ይህ ጥያቄ በኡስታዝዎ ይገመገማል።',
    timeUpModalTitle: '⏰ የፈተና ጊዜ አልቋል!',
    timeUpModalDesc: 'የፈተና ጊዜዎ አብቅቷል። ተጨማሪ መልስ መመለስ አይችሉም። ያልተመለሱ ጥያቄዎች እንደ ስህተት ይቆጠራሉ።',
    timeUpModalSubmitBtn: 'የፈተና ውጤት አስገባ',
    timeExtendedToast: '⏱️ አስተማሪው ተጨማሪ ጊዜ አክሏል! ፈተናዎን መቀጠል ይችላሉ።'
  }
};

export default function ExamPlayer({ quizId, student, onLogout }) {
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
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [isContentBlurred, setIsContentBlurred] = useState(false);
  const [exitCount, setExitCount] = useState(0);
  const exitCountRef = useRef(0);
  const lastExitTimeRef = useRef(0);
  const hasTriggeredTimeUpRef = useRef(false);

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

      const randomizedQuiz = shuffleQuizBySections(data, student?._id);
      setQuiz(randomizedQuiz);

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

  // Real-time Heartbeat & Active Session Release
  useEffect(() => {
    if (!student || !student._id) return;
    const deviceToken = localStorage.getItem('medresa_device_id');

    const sendHeartbeatPing = () => {
      fetch(`${MAIN_API_URL}/exams/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student._id, deviceToken })
      }).catch(() => {});
    };

    sendHeartbeatPing();
    const interval = setInterval(sendHeartbeatPing, 6000);

    const handleRelease = () => {
      if (student && student._id) {
        const payload = JSON.stringify({ studentId: student._id, deviceToken });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(`${MAIN_API_URL}/exams/release-session`, payload);
        } else {
          fetch(`${MAIN_API_URL}/exams/release-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleRelease);
    window.addEventListener('unload', handleRelease);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleRelease);
      window.removeEventListener('unload', handleRelease);
      handleRelease();
    };
  }, [student]);

  // Ensure Time-Up modal has total priority over unanswered & confirm modals
  useEffect(() => {
    if (isTimeUp) {
      setShowUnansweredModal(false);
      setShowConfirmModal(false);
      setShowTimeUpModal(true);
    }
  }, [isTimeUp]);

  // Periodic poll for quiz info (detects if Ustaz added time in real-time)
  useEffect(() => {
    if (!quiz || result) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${EXAM_API_URL}/quizzes/student/${quizId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.hasTimer !== false && data.durationMinutes > 0) {
            const newTotal = (data.durationMinutes + (data.addedTimeMinutes || 0)) * 60;
            const startTimeKey = `exam_start_${quizId}_${student._id}`;
            const startTime = localStorage.getItem(startTimeKey) || Date.now().toString();
            const elapsed = Math.floor((Date.now() - Number(startTime)) / 1000);
            const newRemaining = Math.max(0, newTotal - elapsed);

            if (isTimeUp && newRemaining > 0) {
              setIsTimeUp(false);
              setShowTimeUpModal(false);
              hasTriggeredTimeUpRef.current = false;
              setTimeLeftSeconds(newRemaining);
              toast.success(t('timeExtendedToast'));
            }
          }
        }
      } catch (e) {}
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [quiz, result, isTimeUp, quizId, student, lang]);

  // Separate timer interval effect
  useEffect(() => {
    if (!quiz || result || isTimeUp) return;
    if (quiz.hasTimer === false || quiz.durationMinutes <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, result, isTimeUp]);

  // Time-Up Detection Effect
  useEffect(() => {
    if (!quiz || result || isTimeUp) return;
    if (quiz.hasTimer === false || quiz.durationMinutes <= 0) return;

    if (
      timeLeftSeconds === 0 &&
      !hasTriggeredTimeUpRef.current
    ) {
      hasTriggeredTimeUpRef.current = true;
      setIsTimeUp(true);
      setShowUnansweredModal(false);
      setShowConfirmModal(false);
      setShowTimeUpModal(true);
      toast.error(t('timeUpToast'));
    }
  }, [timeLeftSeconds, quiz, isTimeUp, result, lang]);

  // Instant Blur / Security Shield & 3-Exit Disqualification System
  useEffect(() => {
    if (!quiz || result || isTimeUp) return;

    const handleExitViolation = () => {
      const now = Date.now();
      // Deduplicate rapid consecutive events (e.g. blur + visibilitychange within 2.5 seconds)
      if (now - lastExitTimeRef.current < 2500) {
        return;
      }
      lastExitTimeRef.current = now;

      exitCountRef.current += 1;
      const currentExits = exitCountRef.current;
      setExitCount(currentExits);

      if (currentExits >= 3) {
        // Violation 3: Force Logout & Redirect to Login Page
        toast.error(
          lang === 'am'
            ? '🔒 3 ጊዜ ደጋግመው ከፈተናው ማያ ገጽ በመውጣትዎ ምክንያት መለያዎ ተቆልፎ ወጥተዋል (Logout)!'
            : '🔒 You were automatically logged out due to exiting the exam page 3 times!',
          { duration: Infinity }
        );

        // Release session in backend
        const deviceToken = localStorage.getItem('medresa_device_id');
        if (student && student._id) {
          fetch(`${MAIN_API_URL}/exams/release-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: student._id, deviceToken })
          }).catch(() => {});
        }

        // Clean draft storage and redirect to login page
        setTimeout(() => {
          if (onLogout) {
            onLogout();
          } else {
            window.location.reload();
          }
        }, 1200);
        return;
      }

      // Violation 1: Blur content & show Warning 1/2 modal
      setIsContentBlurred(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState !== 'visible') {
        handleExitViolation();
      }
    };

    const handleBlur = () => {
      handleExitViolation();
    };

    const handleKeyDown = (e) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.key.toLowerCase() === 'p') ||
        (e.metaKey && e.shiftKey && (e.key.toLowerCase() === 's' || e.key === '4'))
      ) {
        handleExitViolation();
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quiz, result, isTimeUp, lang, student, onLogout]);

  const handleOptionSelect = (questionIndex, optionIndex) => {
    if (isTimeUp || submitting || result) return;
    const updated = { ...answers, [questionIndex]: optionIndex };
    setAnswers(updated);
    const savedKey = `exam_draft_${quizId}_${student._id}`;
    localStorage.setItem(savedKey, JSON.stringify(updated));
  };

  const handleTextAnswer = (questionIndex, text) => {
    if (isTimeUp || submitting || result) return;
    const updated = { ...answers, [questionIndex]: text };
    setAnswers(updated);
    const savedKey = `exam_draft_${quizId}_${student._id}`;
    localStorage.setItem(savedKey, JSON.stringify(updated));
  };

  const isQuestionAnswered = (q, renderedIdx) => {
    const origIdx = q.originalIdx !== undefined ? q.originalIdx : renderedIdx;
    const qType = q.questionType || 'multiple_choice';
    if (qType === 'short_answer' || qType === 'fill_blank') {
      return typeof answers[origIdx] === 'string' && answers[origIdx].trim().length > 0;
    }
    return answers[origIdx] !== undefined && answers[origIdx] !== null && answers[origIdx] >= 0;
  };

  const triggerSubmitPrompt = () => {
    if (isTimeUp || timeLeftSeconds <= 0) {
      setShowUnansweredModal(false);
      setShowConfirmModal(false);
      setShowTimeUpModal(true);
      return;
    }
    const missing = [];
    quiz.questions.forEach((q, idx) => {
      if (!isQuestionAnswered(q, idx)) missing.push(idx + 1);
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
    setShowUnansweredModal(false);
    if (submitting || result) return;

    if (!isAutoSubmit && !isTimeUp) {
      const missing = [];
      quiz.questions.forEach((q, idx) => {
        if (!isQuestionAnswered(q, idx)) missing.push(idx + 1);
      });
      if (missing.length > 0) {
        setUnansweredList(missing);
        setShowUnansweredModal(true);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    // Format answers: numbers for MCQ, strings for open, -1/'' for unanswered
    // Strictly map answers back to original un-shuffled question indices (0 to N-1)
    const rawQuestions = quiz._rawQuestions || quiz.questions;
    const formattedAnswers = rawQuestions.map((q, origIdx) => {
      const qType = q.questionType || 'multiple_choice';
      if (qType === 'short_answer' || qType === 'fill_blank') {
        return typeof answers[origIdx] === 'string' ? answers[origIdx] : '';
      }
      return answers[origIdx] ?? -1;
    });

    const startTimeKey = `exam_start_${quizId}_${student._id}`;
    const startTimeStr = localStorage.getItem(startTimeKey);
    const startedAt = startTimeStr ? new Date(Number(startTimeStr)).toISOString() : new Date().toISOString();
    const isTimeout = Boolean(isAutoSubmit || isTimeUp || timeLeftSeconds <= 0);

    try {
      const res = await fetch(`${EXAM_API_URL}/quizzes/student/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          studentId: student._id,
          studentName: student.fullName,
          answers: formattedAnswers,
          isTimeoutSubmit: isTimeout,
          startedAt
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t('submissionFailedToast'));
      }

      // If manual submit (not timeout submit), clear local draft and start time
      if (!isTimeout) {
        localStorage.removeItem(`exam_draft_${quizId}_${student._id}`);
        localStorage.removeItem(`exam_start_${quizId}_${student._id}`);
      }

      setShowTimeUpModal(false);
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

            <div className={`my-6 p-6 rounded-2xl border shadow-sm space-y-3 ${
              isDark ? 'bg-emerald-950/40 border-emerald-900/60' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
            }`}>
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-2xl mx-auto">
                ✅
              </div>
              <p className={`text-sm font-bold ${isDark ? 'text-emerald-200' : 'text-emerald-900'}`}>
                {t('submittedNotice')}
              </p>
              <div className={`text-xs p-3 rounded-xl border font-medium ${
                isDark ? 'bg-gray-900/80 border-emerald-900/40 text-gray-300' : 'bg-white/80 border-emerald-200 text-gray-700'
              }`}>
                📋 {t('resultPublishedByUstazNotice')}
              </div>
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
      className={`min-h-screen transition-colors duration-200 pb-12 select-none relative ${
        isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Dynamic Security Watermark Overlay (Solution B: Anti-Cheating Watermark) */}
      {quiz && !result && (
        <div className="fixed inset-0 pointer-events-none select-none z-[30] overflow-hidden opacity-25 dark:opacity-20 flex flex-wrap justify-around items-center gap-10 p-4">
          {Array.from({ length: 28 }).map((_, idx) => (
            <div
              key={idx}
              className="transform -rotate-25 text-slate-900 dark:text-white font-black text-xs sm:text-sm tracking-widest whitespace-nowrap"
            >
              {student?.fullName || student?.name || 'Student'} {student?.identifier ? `(${student.identifier})` : ''} • {quiz.title}
            </div>
          ))}
        </div>
      )}

      {/* ─── DEDICATED TOP NAVIGATION BAR ───────────────────────────────────── */}
      <header className={`sticky top-0 transition-colors border-b px-4 sm:px-8 py-3.5 ${
        (showUnansweredModal || showConfirmModal) ? 'z-20 pointer-events-none select-none' : 'z-40'
      } ${
        isDark
          ? ((showUnansweredModal || showConfirmModal) ? 'bg-gray-900 border-gray-800 text-white' : 'bg-gray-900/90 border-gray-800 text-white')
          : ((showUnansweredModal || showConfirmModal) ? 'bg-white border-gray-100 text-gray-900' : 'bg-white border-gray-100 text-gray-900 shadow-sm')
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

      <style>{`
        @media print {
          body { display: none !important; }
        }
      `}</style>

      {/* Main Questions List */}
      <main className={`max-w-4xl mx-auto px-4 mt-6 space-y-6 transition-all duration-300 ${
        isContentBlurred ? 'filter blur-3xl select-none pointer-events-none opacity-20' : ''
      }`}>
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

        {quiz.questions.map((q, qIdx) => {
          const qType = q.questionType || 'multiple_choice';
          const origIdx = q.originalIdx !== undefined ? q.originalIdx : qIdx;
          const isAnswered = isQuestionAnswered(q, qIdx);
          return (
            <React.Fragment key={q._id || qIdx}>
              {q.sectionTitle && (
                <div className={`p-4 rounded-2xl border font-bold text-sm sm:text-base flex items-center justify-between gap-2 shadow-xs mt-4 mb-2 ${
                  isDark
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">📌</span>
                    <span>{q.sectionTitle}</span>
                  </div>
                  {qType === 'multiple_choice' && (
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-xl border shrink-0 ${
                      isDark ? 'bg-emerald-900/80 border-emerald-700 text-emerald-200' : 'bg-white border-emerald-300 text-emerald-800 shadow-2xs'
                    }`}>
                      {(q.marks || 1)} {lang === 'am' ? 'ነጥብ' : ((q.marks || 1) > 1 ? 'marks each' : 'mark each')}
                    </span>
                  )}
                </div>
              )}

              <div
                id={`question-card-${qIdx}`}
                className={`rounded-3xl p-5 sm:p-6 border transition-all space-y-4 ${
                  isAnswered
                    ? (isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-xs')
                    : (isDark ? 'bg-gray-900 border-amber-500/60 ring-2 ring-amber-500/20' : 'bg-white border-amber-300 ring-2 ring-amber-100')
                }`}
              >
                {/* Header: Badges on top row, Question text full width below */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold px-3 py-1 rounded-xl text-xs sm:text-sm border ${
                      isDark ? 'bg-emerald-950 text-emerald-400 border-emerald-800/40' : 'bg-emerald-100 text-emerald-800 border-emerald-200/50'
                    }`}>
                      {t('questionLabel')} {qIdx + 1}
                    </span>
                    {(qType === 'short_answer' || qType === 'fill_blank') && (
                      <>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          qType === 'fill_blank'
                            ? (isDark ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-purple-100 text-purple-800 border-purple-200')
                            : (isDark ? 'bg-blue-950 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-800 border-blue-200')
                        }`}>
                          {qType === 'fill_blank' ? t('fillBlankLabel') : t('shortAnswerLabel')}
                        </span>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg border flex items-center gap-1 shrink-0 ${
                          isDark ? 'bg-amber-950/80 border-amber-800 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-900'
                        }`}>
                          <span>🎯</span>
                          <span>{(q.marks || 1)} {lang === 'am' ? 'ነጥብ' : ((q.marks || 1) > 1 ? 'Marks' : 'Mark')}</span>
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className={`text-base sm:text-lg font-bold leading-relaxed w-full block ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {q.questionText}
                  </h3>
                </div>

              {/* Multiple Choice */}
              {qType === 'multiple_choice' && (
                <div className="space-y-3 pl-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = answers[origIdx] === optIdx;
                    return (
                      <label
                        key={optIdx}
                        onClick={() => handleOptionSelect(origIdx, optIdx)}
                        className={`flex items-center p-4 rounded-2xl border transition ${
                          (isTimeUp || submitting) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        } ${
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
                          name={`question_${origIdx}`}
                          checked={isSelected}
                          disabled={isTimeUp || submitting}
                          onChange={() => {}}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 disabled:opacity-50"
                        />
                        <span className="ml-3 text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Short Answer / Fill in the Blank */}
              {(qType === 'short_answer' || qType === 'fill_blank') && (
                <div className="pl-2 space-y-2">
                  <textarea
                    rows={qType === 'short_answer' ? 4 : 2}
                    value={typeof answers[origIdx] === 'string' ? answers[origIdx] : ''}
                    disabled={isTimeUp || submitting}
                    onChange={(e) => handleTextAnswer(origIdx, e.target.value)}
                    placeholder={qType === 'fill_blank' ? t('fillBlankPlaceholder') : t('shortAnswerPlaceholder')}
                    className={`w-full rounded-2xl border p-4 text-sm resize-none transition focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}

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

      {/* Time Expired Modal Popup */}
      {showTimeUpModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className={`rounded-3xl shadow-2xl max-w-md w-full p-6 text-center border animate-fadeIn space-y-4 ${
              isDark ? 'bg-gray-900 border-red-900/60 text-white' : 'bg-white border-red-200 text-gray-900'
            }`}>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner animate-bounce">
                ⏰
              </div>
              <h3 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('timeUpModalTitle')}</h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('timeUpModalDesc')}
              </p>

              <div className="pt-2">
                <button
                  onClick={() => executeSubmit(true)}
                  disabled={submitting}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl shadow-lg transition cursor-pointer text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <span>{t('submittingBtn')}</span> : <span>{t('timeUpModalSubmitBtn')}</span>}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Unanswered Questions Warning Modal */}
      {showUnansweredModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn">
            <div className={`rounded-3xl shadow-2xl max-w-md sm:max-w-lg w-full p-5 sm:p-6 text-center border max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn space-y-4 ${
              isDark ? 'bg-gray-900 border-amber-900/50 text-white' : 'bg-white border-amber-200 text-gray-900'
            }`}>
              <div className="shrink-0 space-y-2">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-inner">
                  ⚠️
                </div>
                <h3 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('unansweredTitle')}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('unansweredDescPrefix')} <strong className="text-amber-600 dark:text-amber-400 font-black">{unansweredList.length}</strong> {t('unansweredDescSuffix')}
                </p>
              </div>

              {/* List of unanswered question badges (Scrollable & Responsive Grid) */}
              <div className={`p-3 rounded-2xl border text-left flex-1 min-h-0 flex flex-col ${
                isDark ? 'bg-amber-950/30 border-amber-900/50' : 'bg-amber-50 border-amber-200'
              }`}>
                <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider block mb-2 shrink-0">
                  {t('clickQuestionToAnswer')}
                </span>
                <div className="overflow-y-auto max-h-[35vh] pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {unansweredList.map((qNum) => (
                    <button
                      key={qNum}
                      onClick={() => scrollToQuestion(qNum)}
                      className={`font-extrabold text-xs px-2.5 py-2 rounded-xl border shadow-2xs transition flex items-center justify-between cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                        isDark ? 'bg-gray-800 text-amber-300 border-amber-800/80 hover:bg-gray-700' : 'bg-white text-amber-900 border-amber-300/80 hover:bg-amber-100'
                      }`}
                    >
                      <span className="truncate">{t('questionLabel')} {qNum}</span>
                      <span className="text-[10px] text-amber-500 shrink-0">↗</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 shrink-0">
                <button
                  onClick={() => setShowUnansweredModal(false)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-sm"
                >
                  {t('backToAnswerBtn')}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Styled Student Submission Confirmation Modal */}
      {showConfirmModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
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
      </ModalPortal>
      )}
      {/* Security Shield Blur Overlay (Violation 1 or 2 Warning) */}
      {isContentBlurred && !result && exitCount <= 2 && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn select-none">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-4xl mb-3 border border-amber-500/40 shadow-xl animate-pulse">
              🛡️
            </div>

            <span className="px-3.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-black mb-3">
              {lang === 'am' ? `ማስጠንቀቂያ ${exitCount} / 3` : `Warning ${exitCount} of 3`}
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
              {lang === 'am' ? 'የደህንነት ጥበቃ፡ ማያ ገጽ ተጋርዷል' : 'Security Shield Active'}
            </h3>

            <p className="text-sm text-gray-300 max-w-sm leading-relaxed font-medium mb-6">
              {lang === 'am'
                ? `ከፈተናው ማያ ገጽ ወጥተዋል! (${exitCount}/3)። ለ3ኛ ጊዜ ከወጡ በራስ-ሰር ይወጣሉ (Logout) እና ፈተናው ይቋረጣል።`
                : `You exited the exam screen! (${exitCount}/3). If you exit 3 times, you will be automatically logged out.`}
            </p>

            <button
              type="button"
              onClick={() => setIsContentBlurred(false)}
              className="py-3.5 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl shadow-xl active:scale-[0.98] transition cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <span>{lang === 'am' ? 'ወደ ፈተናው ተመለስ ➔' : 'Return to Exam ➔'}</span>
            </button>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
