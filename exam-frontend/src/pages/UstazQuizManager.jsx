import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';
import { Globe, Sun, Moon, LogOut, FileUp, PlusCircle, FileQuestion } from 'lucide-react';
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

// ─── Complete English & Authentic Amharic Translation Dictionary ───────────
const translations = {
  en: {
    portalTitle: 'Ali Medresa Exam Portal',
    title: 'Ustaz Exam & Quiz Manager',
    subtitle: 'Create online exams, bulk import Word files, and monitor student submissions.',
    createQuizBtn: '+ Create New Quiz',
    bulkImportBtn: 'Bulk Import (.docx)',
    totalQuizzes: 'Total Quizzes',
    activeExams: 'Active Exams',
    linkedColumns: 'Linked Roster Columns',
    activePastTitle: 'Your Active & Past Quizzes',
    noQuizzesYet: 'No quizzes created yet.',
    noQuizzesSub: 'Click "+ Create New Quiz" to start building an exam paper.',
    column: 'Column',
    duration: 'Duration',
    untimed: 'Untimed / Unlimited Time',
    mins: 'mins',
    questions: 'Questions',
    copyLink: '🔗 Copy Link',
    wordDoc: '📄 Word Doc',
    add5min: '+5 Min',
    add10min: '+10 Min',
    scores: '📊 Scores',
    endExam: 'End Exam',
    delete: '🗑️ Delete',
    linkExamColumn: 'Link to Medresa Exam Column',
    examTimer: 'Exam Duration Timer',
    enableTimer: 'Enable Timer',
    untimedNotice: '∞ Untimed Exam (Students have unlimited time)',
    enterDuration: 'Enter duration in minutes (e.g. 30)',
    quizTitleLabel: 'Quiz Title',
    quizTitlePlaceholder: 'e.g. Surah Al-Baqarah Verses 1-50 Midterm Exam',
    questionsHeader: 'Questions & Options (2 to 4 Choices)',
    addQuestionBtn: '+ Add Question',
    questionLabel: 'Question',
    enterQuestionPlaceholder: 'Enter question text...',
    correctAnswerLabel: 'Correct Answer Choice:',
    optionLabel: 'Option',
    addOptionBtn: '+ Add Option',
    cancelBtn: 'Cancel',
    publishBtn: 'Publish & Create Exam Paper',
    publishing: 'Publishing Exam...',
    bulkImportTitle: 'Bulk Question Import (Word .docx or Copy-Paste)',
    uploadWordFile: 'Upload Word File (.docx)',
    clickToUploadWord: 'Click to upload a .docx file',
    wordUploaded: 'Word Document Uploaded',
    pasteRawText: 'Or Paste Raw Question Text Below:',
    formatInstructions: 'Instructions & Format Examples:',
    formatGuideText: `1. 📌 Section Titles & Marks: Write "=== Section Title (Marks) ===" to create sections (e.g. === Section 1: Multiple Choice (2 marks) ===).
2. 🔵 Multiple Choice: Start questions with numbers (1., 2.) and choices with A), B) or 1), 2). Put an asterisk (*) at the end of the correct choice.
3. ✏️ Short Answer: Place questions under a section header containing "Short Answer" or "አጭር መልስ".
4. 🔲 Fill in the Blank: Put "___" inside your question text or place under a "Fill in the Blank" header.
5. 🎯 Default Marks: All imported questions get 1 mark by default (unless specified in the section title header).`,
    bulkPlaceholder: `=== Section 1: Multiple Choice ===\n1. What is the first Surah in the Holy Qur'an?\nA) Al-Baqarah\nB) Al-Fatiha*\nC) Al-Ikhlas\nD) An-Nas\n\n=== Section 2: Short Answer ===\n2. Briefly explain what Tawheed Al-Uloohiyyah means.\n\n=== Section 3: Fill in the Blank ===\n3. The Holy Qur'an was revealed to Prophet ___ (PBUH).`,
    parseImportBtn: 'Parse & Import Questions',
    processing: 'Processing...',
    results: 'Results',
    studentSubmissionScores: 'Student Submission Scores',
    noSubmissionsYet: 'No submissions received yet.',
    studentName: 'Student Name',
    score: 'Score',
    correct: 'Correct',
    action: 'Action',
    history: 'History',
    allowRetake: 'Allow Retake',
    examHistoryOf: "'s Exam History",
    correctBadge: 'Correct ✅',
    incorrectBadge: 'Incorrect / Missed ❌',
    correctAnswerTag: 'Correct Answer ✅',
    studentChoiceWrong: 'Student Choice ❌',
    studentChoiceCorrect: 'Student Choice (Correct) ✅',
    linkCopiedToast: 'Exam Link Copied to clipboard!',
    timeAdded5: '5 minutes added to exam.',
    timeAdded10: '10 minutes added to exam.',
    endExamTitle: 'End Exam Prompt',
    endExamDesc: 'Ending this exam will prevent students from submitting any more answers.',
    yesEndExam: 'Yes, End Exam',
    deleteExamTitle: 'Delete Exam Paper?',
    deleteExamDesc: 'This will permanently delete the exam paper and all student submission records.',
    yesDelete: 'Yes, Delete Quiz',
    allowRetakeTitle: 'Allow Student Retake?',
    allowRetakeDesc: 'This will permanently clear this student\'s score and question history from the database, allowing them to re-take the exam.',
    yesAllowRetake: 'Yes, Allow Retake',
    retakeGrantedToast: 'Retake granted! Student submission and history deleted from database.',
    examAlreadyExists: '— 🚫 Exam Already Exists',
    missingTitleError: 'Please enter a title for your exam paper.',
    missingColumnError: 'Please select an exam column from your Medresa exam list.',
    alreadyCreatedError: 'An exam paper is already created for this column. Delete the existing exam paper first to create a new one.'
  },
  am: {
    portalTitle: 'የዓሊ መድረሳ የፈተና ፖርታል',
    title: 'የፈተና ወረቀቶች ማስተዳደሪያ',
    subtitle: 'የመስመር ላይ ፈተናዎችን ይፍጠሩ፣ የWord ሰነዶችን ያስገቡ እና የተማሪዎችን ውጤት ይከታተሉ።',
    createQuizBtn: '+ አዲስ ፈተና ፍጠር',
    bulkImportBtn: 'በጅምላ አስገባ (.docx)',
    totalQuizzes: 'ጠቅላላ ፈተናዎች',
    activeExams: 'ንቁ ፈተናዎች',
    linkedColumns: 'የተያያዙ የውጤት ዓምዶች',
    activePastTitle: 'ንቁ እና ያለፉ ፈተናዎችዎ',
    noQuizzesYet: 'እስካሁን የተፈጠረ ፈተና የለም።',
    noQuizzesSub: 'አዲስ ፈተና ለመፍጠር "+ አዲስ ፈተና ፍጠር" የሚለውን ይጫኑ።',
    column: 'ዓምድ',
    duration: 'የፈተና ጊዜ',
    untimed: 'ያልተገደበ ጊዜ',
    mins: 'ደቂቃዎች',
    questions: 'ጥያቄዎች',
    copyLink: '🔗 ሊንክ ቅዳ',
    wordDoc: '📄 የWord ሰነድ',
    add5min: '+5 ደቂቃ',
    add10min: '+10 ደቂቃ',
    scores: '📊 ውጤቶች',
    endExam: 'ፈተና ጨርስ',
    delete: '🗑️ ሰርዝ',
    linkExamColumn: 'ከመድረሳው የውጤት ዓምድ ጋር አያይዝ',
    examTimer: 'የፈተና ሰዓት ቆጣሪ',
    enableTimer: 'ሰዓት ቆጣሪ አንቃ',
    untimedNotice: '∞ ያልተገደበ ጊዜ (ተማሪዎች ያልተገደበ ጊዜ አላቸው)',
    enterDuration: 'የፈተና ጊዜ በደቂቃ ያስገቡ (ምሳሌ 30)',
    quizTitleLabel: 'የፈተናው ርዕስ',
    quizTitlePlaceholder: 'ምሳሌ፡ የሱረቱል በቀራህ አያት 1-50 የሙከራ ፈተና',
    questionsHeader: 'ጥያቄዎች እና አማራጮች (ከ2 እስከ 4 አማራጮች)',
    addQuestionBtn: '+ ጥያቄ ጨምር',
    questionLabel: 'ጥያቄ',
    enterQuestionPlaceholder: 'የጥያቄውን ጽሑፍ ያስገቡ...',
    correctAnswerLabel: 'ትክክለኛ መልስ ምረጥ፡',
    optionLabel: 'አማራጭ',
    addOptionBtn: '+ አማራጭ ጨምር',
    cancelBtn: 'ሰርዝ',
    publishBtn: 'ፈተናውን አሳትም እና ፍጠር',
    publishing: 'ፈተናው በመፍጠር ላይ ነው...',
    bulkImportTitle: 'ጥያቄዎችን በጅምላ ማስገባት (Word .docx ወይም ጽሑፍ ኮፒ-ፔስት)',
    uploadWordFile: 'የWord ፋይል ጫን (.docx)',
    clickToUploadWord: 'የ.docx ፋይል ለመጫን እዚህ ይጫኑ',
    wordUploaded: 'Word ሰነድ ተጭኗል',
    pasteRawText: 'ወይም ጥያቄዎችን እዚህ ይለጥፉ፡',
    formatInstructions: 'መመሪያ እና የአጻጻፍ ምሳሌዎች፡',
    formatGuideText: `1. 📌 የክፍል ርዕስ እና ነጥብ፡ ጥያቄዎችን በክፍል ለመደደብ መስመሩን በ "=== ክፍል ርዕስ (ነጥብ) ===" ይጀምሩ (ምሳሌ፡ === ክፍል 1: ምርጫ (2 ነጥብ) ===)።
2. 🔵 የሕብረ-ምርጫ ጥያቄዎች፡ ጥያቄዎችን በቁጥር (1.፣ 2.)፣ አማራጮችን በ A)፣ B) ይጀምሩ። በትክክለኛው መልስ መጨረሻ ኮከብ (*) ያድርጉ።
3. ✏️ አጭር መልስ፡ ጥያቄዎችን "አጭር መልስ" በሚል ክፍል ርዕስ ስር ይጻፉ።
4. 🔲 ክፍተት መሙያ፡ በጥያቄው ውስጥ "___" ያስገቡ ወይም "ክፍተት" በሚል ርዕስ ስር ይጻፉ።
5. 🎯 ነጥብ፡ እያንዳንዱ ጥያቄ በነባሪ 1 ነጥብ ይሰጠዋል (በክፍሉ ርዕስ ላይ ካልተገለጸ በስተቀር)።`,
    bulkPlaceholder: `=== ክፍል አንድ፡ ምርጫ ===\n1. ተውሒድ ማለት አላህን በሚገባው ነገር መነጠል ነው።\nA) እውነት*\nB) ሐሰት\n\n=== ክፍል ሁለት፡ አጭር መልስ ===\n2. በአቂዳ ውስጥ «ኢሕሳን» ማለት ምን ማለት ነው? በአጭሩ አብራሩ።\n\n=== ክፍል ሦስት፡ ክፍተት መሙያ ===\n3. የመጀመሪያው የቁርኣን ሱራ ___ ይባላል።`,
    parseImportBtn: 'ጥያቄዎችን መርምር እና አስገባ',
    processing: 'በማስኬድ ላይ...',
    results: 'ውጤቶች',
    studentSubmissionScores: 'የተማሪዎች የፈተና ውጤት',
    noSubmissionsYet: 'እስካሁን የተላከ ውጤት የለም።',
    studentName: 'የተማሪው ስም',
    score: 'ውጤት',
    correct: 'ትክክለኛ',
    action: 'ተግባር',
    history: 'ታሪክ',
    allowRetake: 'ድጋሚ እንዲፈተን ፈቅድ',
    examHistoryOf: ' የፈተና ታሪክ',
    correctBadge: 'ትክክል ✅',
    incorrectBadge: 'ስህተት / ያለፈ ❌',
    correctAnswerTag: 'ትክክለኛ መልስ ✅',
    studentChoiceWrong: 'የተማሪው መልስ ❌',
    studentChoiceCorrect: 'የተማሪው መልስ (ትክክል) ✅',
    linkCopiedToast: 'የፈተናው ሊንክ ተቀድቷል!',
    timeAdded5: '5 ደቂቃ በፈተናው ላይ ተጨምሯል።',
    timeAdded10: '10 ደቂቃ በፈተናው ላይ ተጨምሯል።',
    endExamTitle: 'ፈተናውን ለማጠናቀቅ እርግጠኛ ነዎት?',
    endExamDesc: 'ይህንን ፈተና ማጠናቀቅ ተማሪዎች ተጨማሪ መልስ እንዳይልኩ ይከለክላል።',
    yesEndExam: 'አዎ፣ ፈተናውን ጨርስ',
    deleteExamTitle: 'ይህንን የፈተና ወረቀት ይሰረዝ?',
    deleteExamDesc: 'ይህ እርምጃ ፈተናውን እና ሁሉንም የተማሪዎች ማስረከቢያዎችን በዘላቂነት ይሰርዛል።',
    yesDelete: 'አዎ፣ ፈተናውን ሰርዝ',
    allowRetakeTitle: 'ድጋሚ ፈተና እንዲወሰድ ይፈቀድ?',
    allowRetakeDesc: 'ይህ እርምጃ የተማሪውን ነባር ውጤት እና መልሶች በዘላቂነት ያጸዳል።',
    yesAllowRetake: 'አዎ፣ ድጋሚ እንዲፈተን ፈቅድ',
    retakeGrantedToast: 'ድጋሚ ፈተና ተፈቅዷል! የተማሪው ውጤት እና ታሪክ ከዳታቤዝ ተሰርዟል።',
    examAlreadyExists: '— 🚫 ፈተና ተፈጥሯል',
    missingTitleError: 'እባክዎን የፈተናውን ርዕስ ያስገቡ።',
    missingColumnError: 'እባክዎን ከዝርዝሩ ውስጥ የውጤት ዓምድ ይምረጡ።',
    alreadyCreatedError: 'ለዚህ ዓምድ ፈተና ተፈጥሯል። አዲስ ለመፍጠር ነባሩን ፈተና ሰርዝ።'
  }
};

export default function UstazQuizManager({ ustazToken, ustazUser, onLogout }) {
  const [examColumns, setExamColumns] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSubmissionQuiz, setSelectedSubmissionQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState(null);

  // Language state (en | am)
  const [lang, setLang] = useState(() => localStorage.getItem('ustaz_quiz_lang') || 'en');

  // Theme state (light | dark) - Default to light
  const [theme, setTheme] = useState(() => localStorage.getItem('ustaz_quiz_theme') || 'light');

  const isDark = theme === 'dark';

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'am' : 'en';
    setLang(nextLang);
    localStorage.setItem('ustaz_quiz_lang', nextLang);
    toast.success(nextLang === 'am' ? 'ቋንቋ ወደ አማርኛ ተቀይሯል' : 'Language switched to English');
  };

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('ustaz_quiz_theme', nextTheme);
    toast.success(nextTheme === 'dark' ? 'የጨለማ ገጽታ (Dark Mode) ተቀይሯል' : 'Switched to Light Mode');
  };

  const t = (key) => {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  // Bulk Import State
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: null,
    danger: false,
    confirmLabel: 'Confirm'
  });

  // Form State
  const [selectedExamColumnId, setSelectedExamColumnId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [hasTimer, setHasTimer] = useState(true);
  const [questions, setQuestions] = useState([
    { questionType: 'multiple_choice', questionText: '', options: ['', ''], correctOptionIndex: 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Action Dropdown State
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Grading State for Short Answer / Fill in Blank
  const [gradingScores, setGradingScores] = useState({});
  const [submittingGrading, setSubmittingGrading] = useState(false);

  const isAnyModalOpen = Boolean(
    showCreateModal ||
    selectedSubmissionQuiz ||
    showBulkImportModal ||
    selectedStudentHistory ||
    confirmModal?.open
  );

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAnyModalOpen]);

  const computeTotalCorrectCount = (sub, quiz) => {
    if (!quiz || !quiz.questions) return sub.correctAnswers || 0;
    if (sub.manualGradeStatus === 'pending') return 0;

    let mcqCorrect = 0;
    let openCorrect = 0;
    let openIdx = 0;

    quiz.questions.forEach((q, idx) => {
      const qType = q.questionType || 'multiple_choice';
      if (qType === 'multiple_choice') {
        const choice = sub.answers?.[idx];
        if (typeof choice === 'number' && choice === q.correctOptionIndex) {
          mcqCorrect++;
        }
      } else {
        const openScore = sub.openAnswerScores?.[openIdx];
        if (typeof openScore === 'number' && openScore > 0) {
          openCorrect++;
        }
        openIdx++;
      }
    });

    return mcqCorrect + openCorrect;
  };

  const parseRawTextToQuestions = (text) => {
    if (!text || !text.trim()) return [];
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed = [];
    let currentQ = null;
    let currentSectionTitle = '';
    let currentSectionMarks = 1;
    let currentSectionType = 'multiple_choice';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const isSectionHeader = line.match(/^(ክፍል|Section|Part|===)\s*.*$/i);
      const isQuestionStart = line.match(/^(\d+)[\.\)]\s+(.+)$/) || line.match(/^(Q\d+|Question\s*\d+)[\:\.]\s*(.+)$/i);
      const optionMatch = line.match(/^([A-D])[\)\.\:-]\s*(.+)$/i) || line.match(/^([1-4])\)\s*(.+)$/);

      if (isSectionHeader && !isQuestionStart && !optionMatch) {
        if (currentQ && currentQ.questionText) {
          parsed.push(currentQ);
          currentQ = null;
        }
        currentSectionTitle = line.replace(/^=+\s*/, '').replace(/\s*=+\s*$/, '').trim();

        // Extract marks from section header e.g. "(2 ነጥብ)" or "(5 marks)"
        const marksMatch = line.match(/\((\d+)\s*(ነጥብ|mark|marks|pt|pts)\)/i) || line.match(/(\d+)\s*(ነጥብ|mark|marks|pt|pts)/i);
        if (marksMatch) {
          currentSectionMarks = Number(marksMatch[1]) || 1;
        }

        // Extract type from section header
        if (line.match(/(አጭር|short)/i)) {
          currentSectionType = 'short_answer';
        } else if (line.match(/(ክፍተት|fill|blank)/i)) {
          currentSectionType = 'fill_blank';
        } else {
          currentSectionType = 'multiple_choice';
        }
        continue;
      }

      if (isQuestionStart) {
        if (currentQ && currentQ.questionText) {
          parsed.push(currentQ);
        }

        let qText = isQuestionStart[2].trim();
        let qType = currentSectionType;
        let qMarks = currentSectionMarks || 1;

        // Check for inline question mark override e.g. "11. Question text (1 ነጥብ)" or "(1 mark)"
        const inlineMarksMatch = qText.match(/[\(\[](\d+)\s*(ነጥብ|mark|marks|pt|pts)[\)\]]/i);
        if (inlineMarksMatch) {
          qMarks = Number(inlineMarksMatch[1]) || qMarks;
          qText = qText.replace(/[\(\[](\d+)\s*(ነጥብ|mark|marks|pt|pts)[\)\]]/i, '').trim();
        }

        if (qText.includes('___')) {
          qType = 'fill_blank';
        }

        currentQ = {
          sectionTitle: currentSectionTitle,
          marks: qMarks,
          questionType: qType,
          questionText: qText,
          options: [],
          correctOptionIndex: 0
        };
        currentSectionTitle = '';
      } else if (currentQ) {
        let optText = line;
        let isCorrect = false;

        if (optText.endsWith('*')) {
          isCorrect = true;
          optText = optText.slice(0, -1).trim();
        } else if (optText.toLowerCase().includes('(correct)')) {
          isCorrect = true;
          optText = optText.replace(/\(correct\)/i, '').trim();
        }

        if (optionMatch) {
          optText = optionMatch[2].trim();
          if (optText.endsWith('*')) {
            isCorrect = true;
            optText = optText.slice(0, -1).trim();
          }
        }

        if (optText) {
          currentQ.options.push(optText);
          if (isCorrect) {
            currentQ.correctOptionIndex = currentQ.options.length - 1;
          }
        }
      }
    }

    if (currentQ && currentQ.questionText) {
      parsed.push(currentQ);
    }

    // Final clean-up: if question has no options and type was multiple_choice, switch to short_answer
    parsed.forEach(q => {
      if (q.questionType === 'multiple_choice' && q.options.length < 2) {
        q.questionType = 'short_answer';
        q.options = [];
        q.correctOptionIndex = null;
      }
    });

    return parsed;
  };

  const handleWordFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setBulkLoading(true);
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const rawText = result.value || '';
      setBulkText(rawText);
      toast.success(lang === 'am' ? 'Word ሰነድ በተሳካ ሁኔታ ተተነተነ!' : 'Word document extracted successfully!');
    } catch (err) {
      console.error(err);
      toast.error(lang === 'am' ? 'የWord ሰነድ ማንበብ አልተቻለም።' : 'Failed to read Word document.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExecuteBulkImport = () => {
    const parsed = parseRawTextToQuestions(bulkText);
    if (parsed.length === 0) {
      toast.error(lang === 'am' ? 'ምንም ጥያቄዎች አልተገኙም። እባክዎን የአጻጻፍ ፎርማቱን ያረጋግጡ።' : 'No valid questions found. Please check format guidelines.');
      return;
    }

    setQuestions(parsed);
    setShowBulkImportModal(false);
    setBulkText('');
    toast.success(lang === 'am' ? `${parsed.length} ጥያቄዎች በጅምላ ገብተዋል!` : `Successfully imported ${parsed.length} questions!`);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const columnsRes = await fetch(`${MAIN_API_URL}/exams/my-exams`, {
        headers: {
          'Authorization': `Bearer ${ustazToken}`
        }
      });
      const columnsData = await columnsRes.json();
      if (Array.isArray(columnsData)) {
        setExamColumns(columnsData);
        if (columnsData.length > 0) {
          const firstAvailable = columnsData.find(c => !quizzes.some(q => String(q.examColumnId) === String(c._id)));
          setSelectedExamColumnId(firstAvailable ? firstAvailable._id : columnsData[0]._id);
        }
      }

      const uId = ustazUser?._id || ustazUser?.id || 'ustaz_default';
      const quizzesRes = await fetch(`${EXAM_API_URL}/quizzes/ustaz/${uId}`);
      const quizzesData = await quizzesRes.json();
      if (Array.isArray(quizzesData)) {
        setQuizzes(quizzesData);
      }
    } catch (err) {
      console.error('Error loading quiz manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    const lastQ = questions[questions.length - 1];
    setQuestions([
      ...questions,
      {
        sectionTitle: '',
        marks: lastQ ? (lastQ.marks || 1) : 1,
        questionType: lastQ ? (lastQ.questionType || 'multiple_choice') : 'multiple_choice',
        questionText: '',
        options: ['', ''],
        correctOptionIndex: 0
      }
    ]);
  };

  const handleSectionTitleChange = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].sectionTitle = value;
    setQuestions(updated);
  };

  const handleMarksChange = (qIndex, value) => {
    const updated = [...questions];
    const val = Number(value) > 0 ? Number(value) : 1;
    updated[qIndex].marks = val;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (qIndex) => {
    if (questions.length <= 1) return;
    const updated = [...questions];
    updated.splice(qIndex, 1);
    setQuestions(updated);
  };

  const handleQuestionTextChange = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].questionText = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qIndex, oIndex) => {
    const updated = [...questions];
    updated[qIndex].correctOptionIndex = oIndex;
    setQuestions(updated);
  };

  const handleAddOption = (qIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length >= 10) return;
    updated[qIndex].options.push('');
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) return;
    updated[qIndex].options.splice(oIndex, 1);
    if (updated[qIndex].correctOptionIndex >= updated[qIndex].options.length) {
      updated[qIndex].correctOptionIndex = 0;
    }
    setQuestions(updated);
  };

  const handleQuestionTypeChange = (qIndex, newType) => {
    const updated = [...questions];
    updated[qIndex].questionType = newType;
    if (newType === 'short_answer' || newType === 'fill_blank') {
      updated[qIndex].options = [];
      updated[qIndex].correctOptionIndex = null;
    } else {
      if (!updated[qIndex].options.length) {
        updated[qIndex].options = ['', ''];
      }
      updated[qIndex].correctOptionIndex = 0;
    }
    setQuestions(updated);
  };

  const handleCreateQuizSubmit = async (e) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      alertModal(t('missingTitleError'), t('missingTitleError'));
      return;
    }

    const selectedColumn = examColumns.find(col => String(col._id) === String(selectedExamColumnId)) || examColumns[0];
    if (!selectedColumn) {
      alertModal(t('missingColumnError'), t('missingColumnError'));
      return;
    }

    // Check if an exam already exists for this column
    const existing = quizzes.find(
      q => String(q.examColumnId) === String(selectedColumn._id) || q.examColumnName === selectedColumn.name
    );

    if (existing) {
      toast.error(t('alreadyCreatedError'));
      return;
    }

    const uId = ustazUser?._id || ustazUser?.id || 'ustaz_default';
    const uName = ustazUser?.name || ustazUser?.fullName || 'Ustaz';

    setSubmitting(true);
    try {
      const payload = {
        title: quizTitle.trim(),
        ustazId: uId,
        ustazName: uName,
        examColumnId: selectedColumn._id,
        examColumnName: selectedColumn.name,
        maxScore: selectedColumn.maxScore || 100,
        hasTimer: Boolean(hasTimer),
        durationMinutes: hasTimer ? Number(durationMinutes) : 0,
        questions: questions.map(q => ({
          sectionTitle: q.sectionTitle ? q.sectionTitle.trim() : '',
          marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
          questionType: q.questionType || 'multiple_choice',
          questionText: q.questionText.trim(),
          options: (q.questionType === 'short_answer' || q.questionType === 'fill_blank')
            ? []
            : q.options.map(opt => String(opt || '').trim()).filter(Boolean),
          correctOptionIndex: (q.questionType === 'short_answer' || q.questionType === 'fill_blank')
            ? null
            : q.correctOptionIndex
        }))
      };

      const res = await fetch(`${EXAM_API_URL}/quizzes/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create quiz.');

      setShowCreateModal(false);
      setQuizzes(prev => [data, ...prev]);
      toast.success(t('publishBtn'));
      setQuizTitle('');
      setQuestions([{ questionType: 'multiple_choice', questionText: '', options: ['', ''], correctOptionIndex: 0 }]);
    } catch (err) {
      toast.error(err.message || 'Failed to create exam.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyExamLink = (quizId) => {
    const origin = window.location.origin;
    const link = `${origin}/?quizId=${quizId}`;
    navigator.clipboard.writeText(link);
    toast.success(t('linkCopiedToast'));
  };

  const handleEndQuizPrompt = (quizId) => {
    setConfirmModal({
      open: true,
      title: t('endExamTitle'),
      description: t('endExamDesc'),
      confirmLabel: t('yesEndExam'),
      danger: true,
      onConfirm: async () => {
        setConfirmModal({ open: false });
        try {
          let res = await fetch(`${EXAM_API_URL}/quizzes/end/${quizId}`, { method: 'PUT' });
          if (!res.ok) {
            res = await fetch(`${EXAM_API_URL}/quizzes/${quizId}/end`, { method: 'POST' });
          }

          if (res.ok) {
            setQuizzes(prev => prev.map(q => q._id === quizId ? { ...q, status: 'ended' } : q));
            toast.success(lang === 'am' ? 'ፈተናው ተጠናቋል!' : 'Exam ended successfully!');
          } else {
            const data = await res.json();
            toast.error(data.message || 'Failed to end exam.');
          }
        } catch (e) {
          toast.error('Failed to end exam.');
        }
      }
    });
  };

  const handleDeleteQuizPrompt = (quizId) => {
    setConfirmModal({
      open: true,
      title: t('deleteExamTitle'),
      description: t('deleteExamDesc'),
      confirmLabel: t('yesDelete'),
      danger: true,
      onConfirm: async () => {
        setConfirmModal({ open: false });
        try {
          const res = await fetch(`${EXAM_API_URL}/quizzes/delete/${quizId}`, { method: 'DELETE' });
          if (res.ok) {
            setQuizzes(prev => prev.filter(q => q._id !== quizId));
            toast.success(t('delete'));
          }
        } catch (e) {
          toast.error('Failed to delete quiz.');
        }
      }
    });
  };

  const handleAllowRetake = (quizId, studentId, studentName) => {
    setConfirmModal({
      open: true,
      title: t('allowRetakeTitle'),
      description: `${studentName}: ${t('allowRetakeDesc')}`,
      confirmLabel: t('yesAllowRetake'),
      danger: true,
      onConfirm: async () => {
        setConfirmModal({ open: false });
        try {
          const res = await fetch(`${EXAM_API_URL}/quizzes/allow-retake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizId, studentId })
          });

          if (res.ok) {
            setSubmissions(prev => prev.filter(s => String(s.studentId) !== String(studentId)));
            toast.success(t('retakeGrantedToast'));
          } else {
            const data = await res.json();
            toast.error(data.message || 'Failed to allow retake.');
          }
        } catch (e) {
          toast.error('Failed to clear student score.');
        }
      }
    });
  };

  const handleOpenStudentHistory = (s, quiz, targetMaxScore, displayScore) => {
    const initialScores = {};
    if (quiz && quiz.questions) {
      let openCounter = 0;
      quiz.questions.forEach((q, idx) => {
        const qType = q.questionType || 'multiple_choice';
        if (qType === 'short_answer' || qType === 'fill_blank') {
          const existing = s.openAnswerScores?.[openCounter];
          initialScores[idx] = existing !== undefined ? existing : (q.marks || 1);
          openCounter++;
        }
      });
    }
    setGradingScores(initialScores);
    setSelectedStudentHistory({ ...s, displayScore, targetMaxScore });
  };

  const handleSaveGrading = async () => {
    if (!selectedStudentHistory || !selectedSubmissionQuiz) return;

    const openQIndices = selectedSubmissionQuiz.questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => (q.questionType || 'multiple_choice') !== 'multiple_choice');

    const openScoresArray = openQIndices.map(({ idx }) => Number(gradingScores[idx] ?? 0));

    const toastId = toast.loading(
      lang === 'am' ? 'ውጤት በመመዝገብ ላይ ነው...' : 'Saving grade & updating total score...'
    );

    try {
      setSubmittingGrading(true);
      const res = await fetch(`${EXAM_API_URL}/quizzes/${selectedSubmissionQuiz._id}/grade-open`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedStudentHistory._id,
          openAnswerScores: openScoresArray
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || (lang === 'am' ? 'ውጤት መመዝገብ አልተቻለም።' : 'Failed to save grade.'));

      toast.success(
        lang === 'am' ? '🎉 ውጤቱ በስኬት ተመዝግቧል!' : '🎉 Grade saved & total score updated successfully!',
        { id: toastId }
      );

      setSubmissions(prev => prev.map(sub => sub._id === selectedStudentHistory._id ? {
        ...sub,
        score: data.newScore,
        correctAnswers: data.correctAnswers !== undefined ? data.correctAnswers : sub.correctAnswers,
        manualGradeStatus: 'graded',
        openAnswerScores: openScoresArray
      } : sub));

      setSelectedStudentHistory(prev => ({
        ...prev,
        score: data.newScore,
        displayScore: data.newScore,
        correctAnswers: data.correctAnswers !== undefined ? data.correctAnswers : prev.correctAnswers,
        manualGradeStatus: 'graded',
        openAnswerScores: openScoresArray
      }));
    } catch (err) {
      toast.error(err.message || (lang === 'am' ? 'ውጤት መመዝገብ አልተቻለም።' : 'Failed to save grade.'), { id: toastId });
    } finally {
      setSubmittingGrading(false);
    }
  };

  const handleAddTime = async (quizId, minutes) => {
    try {
      const res = await fetch(`${EXAM_API_URL}/quizzes/add-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, addedMinutes: minutes })
      });
      const data = await res.json();
      if (res.ok) {
        setQuizzes(prev => prev.map(q => q._id === quizId ? { ...q, addedTimeMinutes: data.addedTimeMinutes } : q));
        toast.success(minutes === 5 ? t('timeAdded5') : t('timeAdded10'));
      }
    } catch (e) {
      toast.error('Failed to add time.');
    }
  };

  const handleViewSubmissions = async (quiz) => {
    setSelectedSubmissionQuiz(quiz);
    try {
      const res = await fetch(`${EXAM_API_URL}/quizzes/submissions/${quiz._id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSubmissions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const downloadStudentHistoryPdf = (submission, quiz) => {
    if (!submission || !quiz) return;

    const studentName = submission.studentName || 'ተማሪ';
    const quizTitle = quiz.title || 'የፈተና ወረቀት';
    const displayScore = submission.displayScore !== undefined ? submission.displayScore : submission.score;
    const targetMaxScore = submission.targetMaxScore || quiz.maxScore || 100;
    const correctCount = submission.correctAnswers !== undefined ? submission.correctAnswers : 0;
    const totalCount = submission.totalQuestions || quiz.questions.length || 0;

    let openCounter = 0;
    let questionsHtml = '';

    quiz.questions.forEach((q, idx) => {
      const qType = q.questionType || 'multiple_choice';
      const isOpen = qType === 'short_answer' || qType === 'fill_blank';
      const maxQMarks = q.marks || 1;
      const studentAnswer = submission.answers?.[idx];

      let earnedScore = 0;
      let statusBadgeHtml = '';

      if (isOpen) {
        const openIdx = openCounter++;
        if (submission.openAnswerScores && submission.openAnswerScores[openIdx] !== undefined) {
          earnedScore = Number(submission.openAnswerScores[openIdx]);
        } else if (gradingScores[idx] !== undefined) {
          earnedScore = Number(gradingScores[idx]);
        } else {
          earnedScore = 0;
        }

        if (earnedScore > 0) {
          statusBadgeHtml = `<span style="background-color:#059669;color:#ffffff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:9999px;display:inline-block;">&#9989; ትክክል (${earnedScore}/${maxQMarks})</span>`;
        } else {
          statusBadgeHtml = `<span style="background-color:#dc2626;color:#ffffff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:9999px;display:inline-block;">&#10060; ስህተት (0/${maxQMarks})</span>`;
        }
      } else {
        const studentChoiceIdx = studentAnswer;
        const isCorrect = studentChoiceIdx !== undefined && studentChoiceIdx === q.correctOptionIndex;
        earnedScore = isCorrect ? maxQMarks : 0;

        if (isCorrect) {
          statusBadgeHtml = `<span style="background-color:#059669;color:#ffffff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:9999px;display:inline-block;">&#9989; ትክክል (${earnedScore}/${maxQMarks})</span>`;
        } else {
          statusBadgeHtml = `<span style="background-color:#dc2626;color:#ffffff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:9999px;display:inline-block;">&#10060; ስህተት (0/${maxQMarks})</span>`;
        }
      }

      // Section Header if present
      let sectionHeaderHtml = '';
      if (q.sectionTitle) {
        sectionHeaderHtml = `
          <div style="background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;font-weight:800;font-size:13px;padding:8px 14px;border-radius:12px;margin-top:18px;margin-bottom:12px;">
            📌 ${q.sectionTitle}
          </div>`;
      }

      let contentHtml = '';
      if (isOpen) {
        const typeLabel = qType === 'fill_blank' ? 'ክፍተት' : 'ጭብጥ';
        const textAns = (typeof studentAnswer === 'string' && studentAnswer.trim())
          ? studentAnswer
          : `<em style="color:#9ca3af;">ምላሽ አልተሰጠም</em>`;

        contentHtml = `
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px;margin-top:8px;">
            <div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:4px;">
              [${typeLabel}] የተማሪው መልስ፡
            </div>
            <div style="font-size:13.5px;font-weight:600;color:#1f2937;white-space:pre-wrap;line-height:1.6;">${textAns}</div>
          </div>`;
      } else {
        const studentChoiceIdx = studentAnswer;
        let optionsHtml = '';
        (q.options || []).forEach((opt, optIdx) => {
          const isChosen = studentChoiceIdx === optIdx;
          const isCorrectOpt = q.correctOptionIndex === optIdx;
          let bgColor = '#f9fafb';
          let border = '1px solid #e5e7eb';
          let color = '#374151';
          let fw = '500';
          let noteLine = '';

          if (isCorrectOpt && isChosen) {
            bgColor = '#d1fae5'; border = '2px solid #10b981'; color = '#065f46'; fw = '700';
            noteLine = `<div style="font-size:11px;color:#065f46;margin-top:3px;font-weight:800;">&#9989; ትክክለኛ መልስ (የተማሪው ምርጫ)</div>`;
          } else if (isCorrectOpt) {
            bgColor = '#ecfdf5'; border = '1px solid #34d399'; color = '#047857'; fw = '700';
            noteLine = `<div style="font-size:11px;color:#047857;margin-top:3px;font-weight:700;">&#9989; ትክክለኛ መልስ</div>`;
          } else if (isChosen) {
            bgColor = '#fee2e2'; border = '2px solid #ef4444'; color = '#991b1b'; fw = '700';
            noteLine = `<div style="font-size:11px;color:#991b1b;margin-top:3px;font-weight:800;">&#10060; የተማሪው ምርጫ (ስህተት)</div>`;
          }

          const label = String.fromCharCode(65 + optIdx);
          optionsHtml += `<div style="padding:10px 14px;margin:6px 0;border-radius:12px;background:${bgColor};border:${border};color:${color};font-weight:${fw};font-size:13px;line-height:1.4;">${label}) ${opt}${noteLine}</div>`;
        });
        contentHtml = `<div style="margin-top:8px;">${optionsHtml}</div>`;
      }

      const cardClass = isOpen
        ? 'background:rgba(239, 246, 255, 0.5);border:1px solid #bfdbfe;'
        : earnedScore > 0
          ? 'background:rgba(236, 253, 245, 0.4);border:1px solid #a7f3d0;'
          : 'background:rgba(254, 242, 242, 0.4);border:1px solid #fecaca;';

      questionsHtml += `
        ${sectionHeaderHtml}
        <div style="${cardClass}border-radius:16px;padding:16px 20px;margin-bottom:16px;page-break-inside:avoid;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:6px;">
            <tr>
              <td style="font-weight:700;font-size:12px;color:#374151;">
                ጥያቄ ${idx + 1}
              </td>
              <td width="140" style="text-align:right;vertical-align:top;white-space:nowrap;">
                ${statusBadgeHtml}
              </td>
            </tr>
          </table>
          <div style="font-weight:700;font-size:14.5px;color:#111827;margin-bottom:10px;">${q.questionText}</div>
          ${contentHtml}
        </div>`;
    });

    const fullHtml = `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <title>${studentName}_Exam_Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans Ethiopic', 'Nyala', 'Ethiopic', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      background: #ffffff;
      color: #111827;
      padding: 28px;
      font-size: 13.5px;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body { padding: 12px; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>
  <!-- Header matching History Modal Header -->
  <div style="border:1px solid #e5e7eb;border-radius:16px;padding:20px 24px;margin-bottom:20px;background:#ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td>
          <h2 style="font-size:20px;font-weight:800;color:#111827;margin-bottom:4px;">
            ${studentName} — የፈተና ውጤት እና የመልስ ወረቀት
          </h2>
          <p style="font-size:13px;font-weight:600;color:#4b5563;">
            ${quizTitle} • ውጤት: <strong style="color:#059669;font-size:15px;font-weight:800;">${displayScore} / ${targetMaxScore}</strong> (ከ ${totalCount} ጥያቄዎች ${correctCount}ቱ ትክክል)
          </p>
        </td>
        <td width="100" style="text-align:right;vertical-align:middle;">
          <span style="background-color:#d1fae5;color:#065f46;font-size:11px;font-weight:800;padding:5px 12px;border-radius:9999px;display:inline-block;">
            ✅ ተገምግሟል
          </span>
        </td>
      </tr>
    </table>
  </div>

  <!-- Questions List -->
  ${questionsHtml}

  <!-- Footer -->
  <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af;font-weight:600;">
    የዓሊ መድረሳ ኦንላይን ፈተና ሲስተም
  </div>
</body>
</html>`;

    const printWin = window.open('', '_blank', 'width=950,height=1000');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 400);
    } else {
      const safeStudentName = studentName.replace(/[^a-zA-Z0-9_\u1200-\u137F]/g, '_');
      const safeQuizTitle = quizTitle.replace(/[^a-zA-Z0-9_\u1200-\u137F]/g, '_');
      const filename = `${safeStudentName}_${safeQuizTitle}_Result.pdf`;

      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      toast.loading(lang === 'am' ? 'PDF እየወረደ ነው...' : 'Downloading PDF...', { id: 'pdf-toast' });

      html2pdf().set(opt).from(fullHtml, 'string').save().then(() => {
        toast.success(lang === 'am' ? 'PDF ፋይሉ በስኬት ወርዷል!' : 'PDF downloaded!', { id: 'pdf-toast' });
      }).catch(err => {
        console.error('PDF error:', err);
        toast.error('PDF download failed.', { id: 'pdf-toast' });
      });
    }
  };

  const downloadAsWord = (quiz) => {
    let docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${quiz.title}</title>
      <style>
        body { font-family: 'Nyala', 'Ethiopic', 'Calibri', 'Arial', sans-serif; line-height: 1.5; padding: 20px; }
        h1 { text-align: center; color: #111827; }
        .sub { text-align: center; color: #4B5563; font-size: 14px; margin-bottom: 30px; }
        .q-box { margin-bottom: 20px; page-break-inside: avoid; }
        .q-text { font-weight: bold; font-size: 16px; margin-bottom: 8px; }
        .opt { margin-left: 20px; font-size: 14px; }
        .correct { font-weight: bold; color: #059669; }
      </style>
      </head>
      <body>
        <h1>${quiz.title}</h1>
        <div class="sub">
          የውጤት ዓምድ: ${quiz.examColumnName} | የፈተና ጊዜ: ${quiz.hasTimer !== false && quiz.durationMinutes > 0 ? `${quiz.durationMinutes + quiz.addedTimeMinutes} ደቂቃዎች` : 'ያልተገደበ'} | ከፍተኛ ውጤት: ${quiz.maxScore || 100}
        </div>
        <hr/>
        <br/>
    `;

    quiz.questions.forEach((q, idx) => {
      docContent += `
        <div class="q-box">
          <div class="q-text">ጥያቄ ${idx + 1}. ${q.questionText}</div>
      `;
      q.options.forEach((opt, optIdx) => {
        const isCorrect = optIdx === q.correctOptionIndex;
        docContent += `
          <div class="opt ${isCorrect ? 'correct' : ''}">
            ${String.fromCharCode(65 + optIdx)}) ${opt} ${isCorrect ? ' (ትክክለኛ መልስ)' : ''}
          </div>
        `;
      });
      docContent += `</div><br/>`;
    });

    docContent += `</body></html>`;

    const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quiz.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Exam_Paper.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const alertModal = (title, description) => {
    if (title.toLowerCase().includes('error') || title.toLowerCase().includes('missing') || title.toLowerCase().includes('failed')) {
      toast.error(`${title}: ${description}`);
    } else {
      toast.success(`${title}: ${description}`);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-8 text-center font-medium ${isDark ? 'bg-gray-950 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
        Loading quiz manager...
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* ─── DEDICATED TOP NAVIGATION BAR ───────────────────────────────────── */}
      <header className={`sticky top-0 transition-colors border-b px-4 sm:px-8 py-3 ${isAnyModalOpen ? 'z-20 pointer-events-none select-none' : 'z-40 backdrop-blur-md'
        } ${isDark
          ? (isAnyModalOpen ? 'bg-gray-900 border-gray-800 text-white' : 'bg-gray-900/95 border-gray-800 text-white')
          : (isAnyModalOpen ? 'bg-white border-gray-100 text-gray-900' : 'bg-white/95 border-gray-100 text-gray-900 shadow-xs')
        }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/medresa_icon.jpg"
              alt="Ali Medresa"
              className="w-10 h-10 rounded-xl object-cover shadow-sm border border-emerald-100/60"
            />
            <div>
              <h1 className={`font-black text-base sm:text-lg leading-tight tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('portalTitle')}
              </h1>
              <p className={`text-[11px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {ustazUser?.name || ustazUser?.fullName || 'Ustaz'} Dashboard
              </p>
            </div>
          </div>

          {/* Unified Header Controls Cluster */}
          <div className={`flex items-center gap-1 p-1 rounded-2xl border ${isDark ? 'bg-gray-800/80 border-gray-700/80' : 'bg-gray-50 border-gray-200/70 shadow-2xs'
            }`}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`h-9 px-3 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-amber-300 shadow-2xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200/50 shadow-2xs'
                }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-emerald-600" />}
              <span className="hidden md:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            {/* Globe Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className={`h-9 px-3 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200/50 shadow-2xs'
                }`}
              title={lang === 'en' ? 'Switch to Amharic' : 'Switch to English'}
            >
              <Globe size={15} className="text-blue-500" />
              <span>{lang === 'en' ? 'English (EN)' : 'አማርኛ (AM)'}</span>
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="h-9 px-3 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer text-red-600 hover:bg-red-100/70 hover:scale-[1.02] active:scale-[0.98] dark:text-red-400 dark:hover:bg-red-950/60"
                title={lang === 'en' ? 'Log out' : 'ውጣ (Logout)'}
              >
                <LogOut size={15} className="text-red-500" />
                <span className="hidden sm:inline">{lang === 'en' ? 'Logout' : 'ውጣ'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        {/* Main Action Header Card */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-7 rounded-3xl border transition-all ${isDark
            ? 'bg-gray-900 border-gray-800 text-white shadow-lg'
            : 'bg-white border-gray-100 text-gray-900 shadow-sm hover:shadow-md'
          }`}>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('title')}</h1>
            <p className={`text-sm font-medium mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('subtitle')}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Secondary Action: Bulk Import (Outline style) */}
            <button
              onClick={() => setShowBulkImportModal(true)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-purple-300 border-purple-500/30'
                  : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200/80 shadow-2xs'
                }`}
            >
              <FileUp size={16} className="text-purple-600" />
              <span>{t('bulkImportBtn')}</span>
            </button>

            {/* Primary Action: Create New Quiz (Solid Brand Color) */}
            <button
              onClick={() => {
                fetchInitialData();
                setShowCreateModal(true);
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle size={17} />
              <span>{t('createQuizBtn')}</span>
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium border ${isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}>
            {message}
          </div>
        )}

        {/* Quizzes List Card */}
        <div className={`rounded-3xl border p-6 sm:p-8 transition-all ${isDark ? 'bg-gray-900 border-gray-800 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-900 shadow-sm hover:shadow-md'
          }`}>
          <h2 className={`text-xl font-black tracking-tight mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('activePastTitle')}</h2>

          {quizzes.length === 0 ? (
            <div className={`text-center py-12 px-6 border-2 border-dashed rounded-3xl transition-all ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-emerald-200/60 bg-emerald-50/20'
              }`}>
              <div className="w-14 h-14 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <FileQuestion size={28} />
              </div>
              <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('noQuizzesYet')}</h3>
              <p className={`text-xs font-medium mt-1 max-w-sm mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('noQuizzesSub')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((q) => (
                <div key={q._id} className={`border rounded-2xl p-5 hover:shadow-md transition ${isDark ? 'bg-gray-800/40 border-gray-800' : 'bg-gray-50/50 border-gray-200'
                  }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border mb-2 ${isDark ? 'bg-emerald-950 text-emerald-400 border-emerald-800/40' : 'bg-emerald-100 text-emerald-800 border-emerald-200/50'
                        }`}>
                        {t('column')}: {q.examColumnName}
                      </span>
                      <h3 className={`text-lg font-bold leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>{q.title}</h3>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('duration')}: {q.hasTimer !== false && q.durationMinutes > 0 ? `${q.durationMinutes + q.addedTimeMinutes} ${t('mins')}` : t('untimed')} ({q.questions.length} {t('questions')})
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${q.status === 'active'
                        ? (isDark ? 'bg-green-950 text-green-300' : 'bg-green-100 text-green-800')
                        : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700')
                      }`}>
                      {q.status}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className={`mt-4 pt-3 border-t flex flex-wrap gap-2 text-xs ${isDark ? 'border-gray-800' : 'border-gray-200'
                    }`}>
                    <button
                      onClick={() => copyExamLink(q._id)}
                      className="bg-gray-800 hover:bg-gray-900 text-white font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {t('copyLink')}
                    </button>

                    <button
                      onClick={() => downloadAsWord(q)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {t('wordDoc')}
                    </button>

                    {q.hasTimer !== false && (
                      <>
                        <button
                          onClick={() => handleAddTime(q._id, 5)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          {t('add5min')}
                        </button>

                        <button
                          onClick={() => handleAddTime(q._id, 10)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          {t('add10min')}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleViewSubmissions(q)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {t('scores')}
                    </button>

                    {q.status === 'active' && (
                      <button
                        onClick={() => handleEndQuizPrompt(q._id)}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        {t('endExam')}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteQuizPrompt(q._id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation Modal (z-[10000]) */}
        {confirmModal.open && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-fadeIn">
            <div className={`rounded-3xl shadow-2xl max-w-md w-full p-6 border text-center animate-fadeIn ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'
              }`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${confirmModal.danger
                  ? (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600')
                  : (isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600')
                }`}>
                <span className="text-2xl">{confirmModal.danger ? '⚠️' : '❓'}</span>
              </div>

              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{confirmModal.title}</h3>
              <p className={`text-sm mb-6 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{confirmModal.description}</p>

              <div className="flex space-x-3">
                {confirmModal.onConfirm && (
                  <button
                    onClick={() => setConfirmModal({ open: false })}
                    className={`flex-1 py-3 border rounded-xl font-semibold cursor-pointer transition ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {t('cancelBtn')}
                  </button>
                )}
                <button
                  onClick={confirmModal.onConfirm || (() => setConfirmModal({ open: false }))}
                  className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition cursor-pointer ${confirmModal.danger
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                >
                  {confirmModal.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submissions Modal (z-[9999]) */}
        {selectedSubmissionQuiz && (
          <ModalPortal>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn">
              <div className={`rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto border ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'
                }`}>
                <div className={`flex justify-between items-center mb-4 border-b pb-3 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubmissionQuiz.title} - {t('results')}</h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('studentSubmissionScores')}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSubmissionQuiz(null)}
                    className={`text-2xl font-bold cursor-pointer ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    &times;
                  </button>
                </div>

                {submissions.length === 0 ? (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('noSubmissionsYet')}</p>
                ) : (
                  <>
                    {/* Desktop View: Table (Visible on sm+ screens) */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className={`border-b ${isDark ? 'bg-gray-800/80 border-gray-800 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                            <th className="p-3 font-semibold">{t('studentName')}</th>
                            <th className="p-3 font-semibold text-center">{t('score')}</th>
                            <th className="p-3 font-semibold text-center">{t('correct')}</th>
                            <th className="p-3 font-semibold text-center">{t('action')}</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                          {submissions.map((s, sIdx) => {
                            const matchingCol = examColumns.find(c => String(c._id) === String(selectedSubmissionQuiz?.examColumnId) || c.name === selectedSubmissionQuiz?.examColumnName);
                            const targetMaxScore = matchingCol?.maxScore || selectedSubmissionQuiz?.maxScore || 100;
                            const isPending = s.manualGradeStatus === 'pending';
                            const displayScore = s.score !== undefined ? s.score : 0;
                            const openUpward = sIdx >= submissions.length - 2 && submissions.length > 2;

                            return (
                              <tr key={s._id} className={`hover:bg-opacity-50 ${isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'}`}>
                                <td className={`p-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.studentName}</td>
                                <td className="p-3 text-center">
                                  {isPending ? (
                                    <span className={`px-2.5 py-1 font-bold rounded-full text-xs border inline-block ${isDark ? 'bg-amber-950/80 border-amber-800 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-800'
                                      }`}>
                                      ⏳ {lang === 'am' ? 'ግምገማ በጠበቅ ላይ' : 'Pending Grade'}
                                    </span>
                                  ) : (
                                    <span className={`px-2.5 py-1 font-bold rounded-full text-xs inline-block ${isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                      {displayScore} / {targetMaxScore}
                                    </span>
                                  )}
                                </td>
                                <td className={`p-3 text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {isPending ? (
                                    <span className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                      ⏳ {lang === 'am' ? 'በግምገማ ላይ' : 'Pending'}
                                    </span>
                                  ) : (
                                    `${computeTotalCorrectCount(s, selectedSubmissionQuiz)} / ${s.totalQuestions}`
                                  )}
                                </td>
                                <td className="p-3 text-center relative">
                                  <div className="relative inline-block text-left">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveActionMenuId(activeActionMenuId === s._id ? null : s._id);
                                      }}
                                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition cursor-pointer ${isPending
                                          ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                                          : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300')
                                        }`}
                                    >
                                      <span>{isPending ? (lang === 'am' ? '✏️ ገምግም' : '✏️ Grade') : (lang === 'am' ? '⚡ እርምጃዎች' : '⚡ Action')}</span>
                                      <span className="text-[10px]">▼</span>
                                    </button>

                                    {activeActionMenuId === s._id && (
                                      <div
                                        className={`absolute right-0 ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'} w-48 rounded-2xl shadow-2xl border z-50 py-1.5 text-xs animate-fadeIn ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'
                                          }`}
                                      >
                                        {selectedSubmissionQuiz?.questions.some(q => (q.questionType || 'multiple_choice') !== 'multiple_choice') && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveActionMenuId(null);
                                              handleOpenStudentHistory(s, selectedSubmissionQuiz, targetMaxScore, displayScore);
                                            }}
                                            className={`w-full text-left px-3.5 py-2 font-bold flex items-center gap-2 transition ${s.manualGradeStatus === 'graded'
                                                ? (isDark ? 'text-emerald-400 hover:bg-emerald-950/40' : 'text-emerald-700 hover:bg-emerald-50')
                                                : (isDark ? 'text-amber-400 hover:bg-amber-950/50' : 'text-amber-700 hover:bg-amber-50')
                                              }`}
                                          >
                                            <span>{s.manualGradeStatus === 'graded' ? '✅' : '✏️'}</span>
                                            <span>{s.manualGradeStatus === 'graded' ? (lang === 'am' ? 'ተገምግሟል' : 'Graded') : (lang === 'am' ? 'መልስ ገምግም' : 'Grade Answers')}</span>
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            handleOpenStudentHistory(s, selectedSubmissionQuiz, targetMaxScore, displayScore);
                                          }}
                                          className={`w-full text-left px-3.5 py-2 font-medium flex items-center gap-2 transition ${isDark ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                          <span>👁️</span>
                                          <span>{lang === 'am' ? 'ታሪክ ተመልከት' : 'View History'}</span>
                                        </button>

                                        <button
                                          type="button"
                                          disabled={isPending}
                                          onClick={() => {
                                            if (!isPending) {
                                              setActiveActionMenuId(null);
                                              downloadStudentHistoryPdf({ ...s, displayScore, targetMaxScore }, selectedSubmissionQuiz);
                                            }
                                          }}
                                          className={`w-full text-left px-3.5 py-2 font-medium flex items-center gap-2 transition ${isPending
                                              ? 'opacity-40 cursor-not-allowed text-gray-500'
                                              : (isDark ? 'hover:bg-gray-800 text-red-400' : 'hover:bg-gray-100 text-red-600')
                                            }`}
                                          title={isPending ? (lang === 'am' ? 'ኡስታዝ እስኪገመግም ድረስ PDF ማውረድ አይቻልም' : 'PDF disabled until Ustaz finishes grading') : ''}
                                        >
                                          <span>📄</span>
                                          <span>{lang === 'am' ? 'PDF አውርድ' : 'Download PDF'}</span>
                                        </button>

                                        <div className={`my-1 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`} />

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            handleAllowRetake(selectedSubmissionQuiz._id, s.studentId, s.studentName);
                                          }}
                                          className="w-full text-left px-3.5 py-2 font-medium text-orange-500 hover:bg-orange-500/10 flex items-center gap-2 transition"
                                        >
                                          <span>🔄</span>
                                          <span>{t('allowRetake')}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View: Modern Cards (Visible on mobile/small screens) */}
                    <div className="block sm:hidden space-y-3">
                      {submissions.map((s) => {
                        const matchingCol = examColumns.find(c => String(c._id) === String(selectedSubmissionQuiz?.examColumnId) || c.name === selectedSubmissionQuiz?.examColumnName);
                        const targetMaxScore = matchingCol?.maxScore || selectedSubmissionQuiz?.maxScore || 100;
                        const isPending = s.manualGradeStatus === 'pending';
                        const displayScore = s.score !== undefined ? s.score : 0;

                        return (
                          <div
                            key={s._id}
                            className={`p-4 rounded-2xl border shadow-sm transition-all ${isDark ? 'bg-gray-800/80 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                              }`}
                          >
                            {/* Student Header & Score Badge */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/20">
                                  👤
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-extrabold text-sm truncate">{s.studentName}</h4>
                                </div>
                              </div>

                              {isPending ? (
                                <span className="px-2.5 py-1 font-extrabold rounded-full text-[11px] border bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse">
                                  ⏳ {lang === 'am' ? 'ግምገማ በጠበቅ ላይ' : 'Pending Grade'}
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 font-extrabold rounded-full text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                                  {displayScore} / {targetMaxScore}
                                </span>
                              )}
                            </div>

                            {/* Summary Pills Grid */}
                            <div className={`grid grid-cols-2 gap-2 text-xs mb-3.5 p-2.5 rounded-xl border ${isDark ? 'bg-gray-900/60 border-gray-700/60' : 'bg-white border-gray-200/60'
                              }`}>
                              <div>
                                <span className="text-[10px] opacity-60 font-semibold block uppercase tracking-wider">{t('correct')}</span>
                                <span className="font-bold">
                                  {isPending ? (
                                    <span className="text-amber-500">⏳ {lang === 'am' ? 'በግምገማ ላይ' : 'Pending'}</span>
                                  ) : (
                                    `${computeTotalCorrectCount(s, selectedSubmissionQuiz)} / ${s.totalQuestions}`
                                  )}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] opacity-60 font-semibold block uppercase tracking-wider">{t('status')}</span>
                                <span className="font-bold">
                                  {isPending ? (
                                    <span className="text-amber-500">✏️ {lang === 'am' ? 'ያልተገመገመ' : 'Ungraded'}</span>
                                  ) : (
                                    <span className="text-emerald-500">✅ {lang === 'am' ? 'ተጠናቋል' : 'Completed'}</span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Touch-Friendly Action Toolbar */}
                            <div className="flex items-center gap-2 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                              <button
                                type="button"
                                onClick={() => handleOpenStudentHistory(s, selectedSubmissionQuiz, targetMaxScore, displayScore)}
                                className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer ${isPending
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                              >
                                <span>{isPending ? '✏️' : '👁️'}</span>
                                <span>{isPending ? (lang === 'am' ? 'መልስ ገምግም' : 'Grade Answers') : (lang === 'am' ? 'ታሪክ ተመልከት' : 'View History')}</span>
                              </button>

                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                  if (!isPending) downloadStudentHistoryPdf({ ...s, displayScore, targetMaxScore }, selectedSubmissionQuiz);
                                }}
                                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition border cursor-pointer ${isPending
                                    ? 'opacity-40 cursor-not-allowed border-gray-300 dark:border-gray-700 text-gray-400'
                                    : 'border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10'
                                  }`}
                                title={isPending ? (lang === 'am' ? 'ኡስታዝ እስኪገመግም ድረስ PDF ማውረድ አይቻልም' : 'PDF disabled until Ustaz finishes grading') : (lang === 'am' ? 'PDF አውርድ' : 'Download PDF')}
                              >
                                <span>📄</span>
                                <span>PDF</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAllowRetake(selectedSubmissionQuiz._id, s.studentId, s.studentName)}
                                className="py-2 px-3 rounded-xl font-bold text-xs border border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition flex items-center gap-1 cursor-pointer"
                                title={t('allowRetake')}
                              >
                                <span>🔄</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Student Detailed Exam History Modal (z-[10000]) */}
        {selectedStudentHistory && (
          <ModalPortal>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-fadeIn">
              <div className={`rounded-3xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto animate-fadeIn border ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'
                }`}>
                <div className={`flex justify-between items-center mb-4 border-b pb-3 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div>
                    <h3 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedStudentHistory.studentName}{t('examHistoryOf')}</h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedSubmissionQuiz?.title} • {t('score')}: {selectedStudentHistory.displayScore} / {selectedStudentHistory.targetMaxScore} ({selectedStudentHistory.correctAnswers} of {selectedStudentHistory.totalQuestions} {t('correct')})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => downloadStudentHistoryPdf(selectedStudentHistory, selectedSubmissionQuiz)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
                      title="Download PDF Exam Report"
                    >
                      <span>📄</span>
                      <span className="hidden sm:inline">{lang === 'am' ? 'PDF አውርድ' : 'Download PDF'}</span>
                      <span className="sm:hidden">PDF</span>
                    </button>
                    <button
                      onClick={() => setSelectedStudentHistory(null)}
                      className={`text-2xl font-bold cursor-pointer px-2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      &times;
                    </button>
                  </div>
                </div>

                {selectedSubmissionQuiz?.questions.some(q => (q.questionType || 'multiple_choice') !== 'multiple_choice') && (
                  <div className={`mb-4 p-3 rounded-2xl border text-xs font-medium flex items-center gap-2 ${isDark ? 'bg-amber-950/40 border-amber-900/60 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                    <span className="text-base shrink-0">✏️</span>
                    <span>
                      {lang === 'am'
                        ? 'የኡስታዝ መገምገሚያ፡ የተማሪውን የጽሑፍ መልስ ከታች ይመልከቱ እና ነጥብ ይስጡ። ከጨረሱ በኋላ በስተታች ያለው "ውጤት መዝግብ" የሚለውን ይጫኑ።'
                        : 'Ustaz Grading: Review the student\'s typed response below and assign score (0 to max marks). Click "Save Grade & Update Score" below.'}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {selectedSubmissionQuiz?.questions.map((q, qIdx) => {
                    const qType = q.questionType || 'multiple_choice';
                    const studentAnswer = selectedStudentHistory.answers?.[qIdx];
                    const isOpen = qType === 'short_answer' || qType === 'fill_blank';
                    const studentChoiceIdx = !isOpen ? studentAnswer : undefined;
                    const isCorrect = !isOpen && studentChoiceIdx !== undefined && studentChoiceIdx === q.correctOptionIndex;

                    return (
                      <div
                        key={qIdx}
                        className={`p-3.5 sm:p-4 rounded-2xl border ${isOpen
                            ? (isDark ? 'bg-blue-950/20 border-blue-900/50' : 'bg-blue-50/60 border-blue-200')
                            : isCorrect
                              ? (isDark ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50/40 border-emerald-200')
                              : (isDark ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50/40 border-red-200')
                          }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('questionLabel')} {qIdx + 1}
                            {isOpen && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${qType === 'fill_blank'
                                  ? (isDark ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800')
                                  : (isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800')
                                }`}>
                                {qType === 'fill_blank' ? (lang === 'am' ? 'ክፍተት' : 'Fill Blank') : (lang === 'am' ? 'ጭብጥ' : 'Short Ans.')}
                              </span>
                            )}
                          </span>
                          {isOpen ? (
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${selectedStudentHistory.manualGradeStatus === 'graded'
                                ? (isDark ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-800')
                                : (isDark ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-800')
                              }`}>
                              {selectedStudentHistory.manualGradeStatus === 'graded'
                                ? (lang === 'am' ? '✅ ተገምግሟል' : '✅ Graded')
                                : (lang === 'am' ? '⏳ ግምገማ በጠበቅ ላይ' : '⏳ Pending Grade')}
                            </span>
                          ) : isCorrect ? (
                            <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
                              {t('correctBadge')}
                            </span>
                          ) : (
                            <span className="bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
                              {t('incorrectBadge')}
                            </span>
                          )}
                        </div>

                        <p className={`font-bold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{q.questionText}</p>

                        {/* Open question: show typed answer + grading controls */}
                        {isOpen ? (
                          <div className="space-y-3">
                            <div className={`p-3 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'
                              }`}>
                              <span className={`block text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {lang === 'am' ? 'የተማሪው መልስ:' : "Student's Answer:"}
                              </span>
                              <p className="leading-relaxed font-medium break-words">
                                {(typeof studentAnswer === 'string' && studentAnswer.trim())
                                  ? studentAnswer
                                  : <em className={isDark ? 'text-gray-500' : 'text-gray-400'}>{lang === 'am' ? 'ምላሽ አልተሰጠም' : 'No answer provided'}</em>
                                }
                              </p>
                            </div>

                            {/* Ustaz Manual Score Input */}
                            {(() => {
                              const maxQMarks = q.marks || 1;
                              const currentScore = gradingScores[qIdx] !== undefined ? gradingScores[qIdx] : maxQMarks;

                              return (
                                <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-200'
                                  }`}>
                                  <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {lang === 'am' ? `ለዚህ ጥያቄ የተሰጠ ነጥብ (ከ 0 እስከ ${maxQMarks}):` : `Score for this question (0 to ${maxQMarks}):`}
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                                    <button
                                      type="button"
                                      onClick={() => setGradingScores(prev => ({ ...prev, [qIdx]: 0 }))}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer flex-1 sm:flex-none text-center ${Number(currentScore) === 0
                                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                          : (isDark ? 'bg-gray-900 text-red-400 border-red-900/50 hover:bg-red-950' : 'bg-white text-red-700 border-red-200 hover:bg-red-50')
                                        }`}
                                    >
                                      ❌ 0
                                    </button>
                                    {maxQMarks >= 2 && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => setGradingScores(prev => ({ ...prev, [qIdx]: 0.5 }))}
                                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer flex-1 sm:flex-none text-center ${Number(currentScore) === 0.5
                                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                              : (isDark ? 'bg-gray-900 text-amber-400 border-amber-900/50 hover:bg-amber-950' : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50')
                                            }`}
                                        >
                                          🟡 0.5
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setGradingScores(prev => ({ ...prev, [qIdx]: 1 }))}
                                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer flex-1 sm:flex-none text-center ${Number(currentScore) === 1
                                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                              : (isDark ? 'bg-gray-900 text-amber-400 border-amber-900/50 hover:bg-amber-950' : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50')
                                            }`}
                                        >
                                          🟡 1
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setGradingScores(prev => ({ ...prev, [qIdx]: 1.5 }))}
                                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer flex-1 sm:flex-none text-center ${Number(currentScore) === 1.5
                                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                              : (isDark ? 'bg-gray-900 text-amber-400 border-amber-900/50 hover:bg-amber-950' : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50')
                                            }`}
                                        >
                                          🟡 1.5
                                        </button>
                                      </>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setGradingScores(prev => ({ ...prev, [qIdx]: maxQMarks }))}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer flex-1 sm:flex-none text-center ${Number(currentScore) === maxQMarks
                                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                          : (isDark ? 'bg-gray-900 text-emerald-400 border-emerald-900/50 hover:bg-emerald-950' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50')
                                        }`}
                                    >
                                      ✅ {maxQMarks}
                                    </button>
                                    <input
                                      type="number"
                                      step="any"
                                      min="0"
                                      max={maxQMarks}
                                      value={currentScore !== undefined ? currentScore : ''}
                                      placeholder="0.0"
                                      onChange={(e) => {
                                        const rawVal = e.target.value;
                                        if (rawVal === '' || rawVal === undefined) {
                                          setGradingScores(prev => ({ ...prev, [qIdx]: '' }));
                                          return;
                                        }
                                        const parsed = parseFloat(rawVal);
                                        if (!isNaN(parsed)) {
                                          const clamped = Math.min(maxQMarks, Math.max(0, parsed));
                                          setGradingScores(prev => ({ ...prev, [qIdx]: clamped }));
                                        }
                                      }}
                                      className={`w-20 p-1.5 text-center font-bold text-xs rounded-xl border focus:ring-1 focus:ring-emerald-500 ${isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                                        }`}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="space-y-1.5 text-xs">
                            {q.options.map((opt, optIdx) => {
                              const isChosen = studentChoiceIdx === optIdx;
                              const isCorrectOpt = q.correctOptionIndex === optIdx;

                              let style = isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700';
                              let tag = null;

                              if (isCorrectOpt) {
                                style = isDark ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 font-extrabold' : 'bg-emerald-100 border-emerald-400 text-emerald-900 font-extrabold';
                                tag = t('correctAnswerTag');
                              }
                              if (isChosen && !isCorrectOpt) {
                                style = isDark ? 'bg-red-950/80 border-red-700 text-red-300 font-extrabold' : 'bg-red-100 border-red-400 text-red-900 font-extrabold';
                                tag = t('studentChoiceWrong');
                              }
                              if (isChosen && isCorrectOpt) {
                                tag = t('studentChoiceCorrect');
                              }

                              return (
                                <div key={optIdx} className={`p-2.5 rounded-xl border flex items-center justify-between ${style}`}>
                                  <span className="flex items-center gap-2">
                                    <span className="font-bold text-[11px] opacity-60">{String.fromCharCode(65 + optIdx)})</span>
                                    <span>{opt}</span>
                                  </span>
                                  {tag && <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${isDark ? 'bg-gray-900/80 border-current' : 'bg-white/80 border-current'
                                    }`}>{tag}</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Save Grade Button (Normal End-of-List Footer) */}
                {selectedSubmissionQuiz?.questions.some(q => (q.questionType || 'multiple_choice') !== 'multiple_choice') && (
                  <div className={`pt-4 mt-5 border-t space-y-3 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    {/* Helper Tip Pill */}
                    <div className={`p-3 rounded-2xl border text-xs font-medium flex items-center gap-2.5 ${isDark ? 'bg-amber-950/40 border-amber-900/50 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}>
                      <span className="text-base shrink-0">💡</span>
                      <span className="leading-relaxed">
                        {lang === 'am' ? 'የክፍት ጥያቄዎችን ውጤት ከሰጡ በኋላ በስተታች ያለውን "ውጤት መዝግብ" የሚለውን ይጫኑ።' : 'Select scores for open questions above, then click Save Grade.'}
                      </span>
                    </div>

                    {/* Primary Action Button */}
                    <button
                      type="button"
                      onClick={handleSaveGrading}
                      disabled={submittingGrading}
                      className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2.5 disabled:opacity-50"
                    >
                      <span className="text-lg">💾</span>
                      <span>{submittingGrading ? (lang === 'am' ? 'እየተመዘገበ ነው...' : 'Saving Grade...') : (lang === 'am' ? 'ውጤት መዝግብ እና አዘምን' : 'Save Grade & Update Score')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Create Quiz Modal (z-[9999]) */}
        {showCreateModal && (
          <ModalPortal>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn">
              <div className={`rounded-3xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto border ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'
                }`}>
                <div className={`flex justify-between items-center mb-4 border-b pb-3 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('createQuizBtn')}</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={`text-2xl font-bold cursor-pointer ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleCreateQuizSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('linkExamColumn')}
                      </label>
                      <select
                        value={selectedExamColumnId}
                        onChange={(e) => setSelectedExamColumnId(e.target.value)}
                        className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 text-sm font-medium ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'
                          }`}
                        required
                      >
                        {examColumns.map((col) => {
                          const alreadyCreated = quizzes.some(
                            q => String(q.examColumnId) === String(col._id) || q.examColumnName === col.name
                          );
                          return (
                            <option key={col._id} value={col._id} disabled={alreadyCreated}>
                              {col.name} (Max: {col.maxScore}){alreadyCreated ? ` ${t('examAlreadyExists')}` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t('examTimer')}
                        </label>
                        <label className={`inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer ${isDark ? 'text-emerald-400' : 'text-emerald-700'
                          }`}>
                          <input
                            type="checkbox"
                            checked={hasTimer}
                            onChange={(e) => setHasTimer(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          <span>{t('enableTimer')}</span>
                        </label>
                      </div>

                      {hasTimer ? (
                        <input
                          type="number"
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(e.target.value)}
                          placeholder={t('enterDuration')}
                          className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 text-sm ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'
                            }`}
                          min="1"
                          max="300"
                          required
                        />
                      ) : (
                        <div className={`p-3 border rounded-xl text-xs font-bold text-center ${isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}>
                          {t('untimedNotice')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('quizTitleLabel')}</label>
                    <input
                      type="text"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder={t('quizTitlePlaceholder')}
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 text-sm ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      required
                    />
                  </div>

                  {/* Questions Section */}
                  <div className={`pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('questionsHeader')}</h4>
                      <button
                        type="button"
                        onClick={() => setShowBulkImportModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>📥</span>
                        <span>{t('bulkImportBtn')}</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {questions.map((q, qIdx) => (
                        <div key={qIdx} className={`p-4 border rounded-2xl relative space-y-3 ${isDark ? 'bg-gray-800/60 border-gray-700/80' : 'bg-gray-50 border-gray-200'
                          }`}>
                          <div className="flex justify-between items-center">
                            <span className={`font-bold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                              {t('questionLabel')} {qIdx + 1}
                            </span>
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qIdx)}
                                className={`text-xs font-bold px-2 py-1 rounded-lg cursor-pointer ${isDark ? 'text-red-400 bg-red-950/50' : 'text-red-500 bg-red-50'
                                  }`}
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {/* Section Header & Marks Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-2 space-y-1">
                              <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {lang === 'am' ? '📌 የክፍል ርዕስ (አማራጭ)' : '📌 Section Title / Header (Optional)'}
                              </label>
                              <input
                                type="text"
                                value={q.sectionTitle || ''}
                                onChange={(e) => handleSectionTitleChange(qIdx, e.target.value)}
                                placeholder={lang === 'am' ? 'ምሳሌ፡ ክፍል ሦስት፡ አጭር መልስ ይጻፉ' : 'e.g. Section 2: Write short answers'}
                                className={`w-full p-2 rounded-xl border text-xs ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                  }`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {lang === 'am' ? '🎯 ነጥብ (Marks)' : '🎯 Question Marks'}
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={q.marks || 1}
                                onChange={(e) => handleMarksChange(qIdx, e.target.value)}
                                className={`w-full p-2 rounded-xl border text-xs font-bold text-center ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                              />
                            </div>
                          </div>

                          {/* Question Type Selector */}
                          <div className="flex gap-2 flex-wrap pt-1">
                            {[
                              { value: 'multiple_choice', label: lang === 'am' ? '🔵 ምርጫ' : '🔵 Multiple Choice' },
                              { value: 'short_answer', label: lang === 'am' ? '✏️ ጭብጥ መልስ' : '✏️ Short Answer' },
                              { value: 'fill_blank', label: lang === 'am' ? '🔲 ክፍተት መሙያ' : '🔲 Fill in the Blank' }
                            ].map(({ value, label }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleQuestionTypeChange(qIdx, value)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${(q.questionType || 'multiple_choice') === value
                                    ? (isDark ? 'bg-emerald-700 border-emerald-500 text-white' : 'bg-emerald-600 border-emerald-600 text-white')
                                    : (isDark ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100')
                                  }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            value={q.questionText}
                            onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                            placeholder={
                              (q.questionType === 'fill_blank')
                                ? (lang === 'am' ? 'ምሳሌ: ___ ቁርዓን ውስጥ ምን ሱራ ነው?' : 'e.g. The first Surah in the Quran is ___')
                                : t('enterQuestionPlaceholder')
                            }
                            className={`w-full p-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            required
                          />

                          {/* Fill in the blank hint */}
                          {q.questionType === 'fill_blank' && (
                            <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                              💡 {lang === 'am' ? 'ባዶ ቦታ ለማመልከት ___ ይጠቀሙ' : 'Use ___ in the question text to mark the blank'}
                            </p>
                          )}

                          {/* Open question notice */}
                          {(q.questionType === 'short_answer' || q.questionType === 'fill_blank') && (
                            <div className={`p-3 rounded-xl text-xs border ${isDark ? 'bg-blue-950/40 border-blue-900/60 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
                              }`}>
                              ⏳ {lang === 'am'
                                ? 'ተማሪው ጽሑፍ ይጽፋል። ኡስታዝ ከፈተናው ማብቂያ በኋላ ውጤት ይሰጣሉ።'
                                : 'Student will write a text answer. Ustaz grades this manually after the exam.'}
                            </div>
                          )}

                          {/* MCQ Options */}
                          {(!q.questionType || q.questionType === 'multiple_choice') && (
                            <div className="space-y-2">
                              <label className={`block text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('correctAnswerLabel')}
                              </label>
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct_${qIdx}`}
                                    checked={q.correctOptionIndex === oIdx}
                                    onChange={() => handleCorrectOptionChange(qIdx, oIdx)}
                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                    placeholder={`${t('optionLabel')} ${String.fromCharCode(65 + oIdx)}`}
                                    className={`flex-1 p-2 rounded-xl border text-sm ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                                      } ${q.correctOptionIndex === oIdx
                                        ? 'border-emerald-500 ring-1 ring-emerald-400 font-medium'
                                        : (isDark ? 'border-gray-700' : 'border-gray-300')
                                      }`}
                                    required
                                  />
                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(qIdx, oIdx)}
                                      className="text-gray-400 hover:text-red-500 font-bold px-1"
                                    >
                                      &times;
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {(!q.questionType || q.questionType === 'multiple_choice') && q.options.length < 10 && (
                            <button
                              type="button"
                              onClick={() => handleAddOption(qIdx)}
                              className={`text-xs font-semibold hover:underline pt-1 cursor-pointer ${isDark ? 'text-emerald-400' : 'text-emerald-600'
                                }`}
                            >
                              {t('addOptionBtn')}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className={`mt-4 w-full py-2.5 border-2 border-dashed font-bold rounded-2xl transition text-xs cursor-pointer ${isDark
                          ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-950/40'
                          : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                        }`}
                    >
                      {t('addQuestionBtn')}
                    </button>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className={`px-4 py-2.5 border rounded-xl font-semibold text-sm cursor-pointer ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {t('cancelBtn')}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition text-sm disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? t('publishing') : t('publishBtn')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Bulk Import Modal (z-[10000]) */}
        {showBulkImportModal && (
          <ModalPortal>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-fadeIn">
              <div className={`rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'
                }`}>
                <div className={`flex justify-between items-center mb-4 border-b pb-3 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('bulkImportTitle')}</h3>
                  <button
                    onClick={() => setShowBulkImportModal(false)}
                    className={`text-2xl font-bold cursor-pointer ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Word Upload Box */}
                  <div className={`p-4 border rounded-2xl ${isDark ? 'bg-purple-950/40 border-purple-800/60' : 'bg-purple-50 border-purple-200'
                    }`}>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
                      📄 {t('uploadWordFile')}
                    </label>
                    <input
                      type="file"
                      accept=".docx"
                      onChange={handleWordFileUpload}
                      className={`w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer ${isDark ? 'text-purple-300' : 'text-purple-700'
                        }`}
                    />
                    {bulkLoading && <p className={`text-xs mt-1 font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{t('processing')}</p>}
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('pasteRawText')}
                    </label>
                    <textarea
                      rows={10}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder={t('bulkPlaceholder')}
                      className={`w-full p-3 rounded-2xl border font-mono text-xs focus:ring-2 focus:ring-emerald-500 whitespace-pre-wrap ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'
                        }`}
                    />
                  </div>

                  <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${isDark ? 'bg-gray-800/60 border-gray-700/80' : 'bg-gray-50 border-gray-200'
                    }`}>
                    <span className={`font-bold text-sm block mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      💡 {t('formatInstructions')}
                    </span>
                    <div className={`leading-relaxed whitespace-pre-line font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('formatGuideText')}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkImportModal(false)}
                      className={`px-4 py-2 border rounded-xl font-semibold text-xs cursor-pointer ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {t('cancelBtn')}
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteBulkImport}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow text-xs transition cursor-pointer"
                    >
                      {t('parseImportBtn')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </div>
  );
}
