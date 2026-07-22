import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import QuizSubmission from '../models/QuizSubmission.js';

const MAIN_MEDRESA_URL = process.env.MAIN_MEDRESA_URL || 'https://medresa.onrender.com/api';
const SYNC_SECRET_KEY = process.env.SYNC_SECRET_KEY || 'medresa_sync_secret_key_2026';

const checkIsSystemLocked = async () => {
  try {
    const urls = [
      process.env.MAIN_MEDRESA_URL,
      'http://localhost:5000',
      'https://medresa.onrender.com'
    ].filter(Boolean);

    for (const url of urls) {
      try {
        const baseUrl = url.replace(/\/api\/?$/, '');
        const res = await fetch(`${baseUrl}/api/exams/system-status`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          return Boolean(data.isLocked);
        }
      } catch (e) {
        // try next URL
      }
    }
  } catch (err) {
    console.warn('System lock check error:', err);
  }
  return false;
};

// ── 1. Ustaz: Create Quiz ───────────────────────────────────────────────────
export const createQuiz = async (req, res) => {
  try {
    const { title, ustazId, ustazName, examColumnId, examColumnName, durationMinutes, hasTimer, maxScore, questions } = req.body || {};

    const finalUstazId = ustazId || 'ustaz_default';
    const finalExamColumnId = examColumnId || 'exam_default';
    const finalExamColumnName = examColumnName || 'General Exam';

    // Prevent duplicate exams on the same column for an Ustaz
    const existingQuiz = await Quiz.findOne({
      ustazId: finalUstazId,
      $or: [
        { examColumnId: finalExamColumnId },
        { examColumnName: finalExamColumnName }
      ]
    });

    if (existingQuiz) {
      return res.status(400).json({
        message: `An exam paper is already created for the "${finalExamColumnName}" column. Each exam column can only have 1 exam paper at a time.`
      });
    }

    const cleanedQuestions = questions.map(q => ({
      questionText: String(q.questionText || '').trim(),
      options: (q.options || []).map(opt => String(opt || '').trim()).filter(Boolean),
      correctOptionIndex: Number(q.correctOptionIndex) || 0
    })).filter(q => q.questionText && q.options.length >= 2);

    if (cleanedQuestions.length === 0) {
      return res.status(400).json({ message: 'Questions must have at least 2 non-empty options.' });
    }

    const timerEnabled = hasTimer !== false && hasTimer !== 'false';

    const quiz = new Quiz({
      title: title.trim(),
      ustazId: finalUstazId,
      ustazName: ustazName || 'Ustaz',
      examColumnId: finalExamColumnId,
      examColumnName: finalExamColumnName,
      hasTimer: timerEnabled,
      durationMinutes: timerEnabled ? (durationMinutes ? Number(durationMinutes) : 30) : 0,
      maxScore: maxScore ? Number(maxScore) : 100,
      questions: cleanedQuestions
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 2. Ustaz: Get My Quizzes ────────────────────────────────────────────────
export const getQuizzesByUstaz = async (req, res) => {
  try {
    const { ustazId } = req.params;
    let query = { ustazId };
    if (!ustazId || ustazId === 'ustaz_default' || ustazId === 'undefined') {
      query = {};
    }
    const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 3. Student: Get Single Quiz (Sanitized - Answer keys hidden) ───────────
export const getQuizForStudent = async (req, res) => {
  try {
    // Check Global Admin System Lock Status on Main Backend
    const isLockedByAdmin = await checkIsSystemLocked();
    if (isLockedByAdmin) {
      return res.status(403).json({
        message: 'The Online Exam System is currently locked by Admin. No exams can be accessed at this time.',
        isSystemLocked: true
      });
    }

    const { id } = req.params;
    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({ message: 'Exam not found or link has expired.' });
    }

    if (quiz.status === 'ended') {
      return res.status(400).json({ message: 'This exam has already ended by the Ustaz.' });
    }

    if (quiz.isLocked) {
      return res.status(403).json({ message: 'This exam is currently locked by Admin.', isSystemLocked: true });
    }

    // Sanitize: strip correctOptionIndex so students cannot see answers in network tab
    const sanitizedQuestions = quiz.questions.map((q, idx) => ({
      _id: q._id,
      index: idx,
      questionText: q.questionText,
      options: q.options
    }));

    const timerEnabled = quiz.hasTimer !== false;

    res.json({
      _id: quiz._id,
      title: quiz.title,
      ustazId: quiz.ustazId,
      ustazName: quiz.ustazName,
      examColumnName: quiz.examColumnName,
      hasTimer: timerEnabled,
      durationMinutes: timerEnabled ? (quiz.durationMinutes + quiz.addedTimeMinutes) : 0,
      maxScore: quiz.maxScore || 100,
      questionsCount: quiz.questions.length,
      questions: sanitizedQuestions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 4. Student: Submit Answers & Auto-Grade ────────────────────────────────
export const submitQuiz = async (req, res) => {
  try {
    const isLockedByAdmin = await checkIsSystemLocked();
    if (isLockedByAdmin) {
      return res.status(403).json({
        message: 'The Online Exam System is currently locked by Admin. Answer submissions are closed.',
        isSystemLocked: true
      });
    }

    const { quizId, studentId, studentName, answers } = req.body;

    if (!quizId || !studentId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Missing submission payload details.' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    // Check if student already submitted
    const existing = await QuizSubmission.findOne({ quizId, studentId });
    if (existing) {
      const breakdown = quiz.questions.map((q, idx) => {
        const studentChoiceIdx = existing.answers?.[idx];
        const isCorrect = studentChoiceIdx !== undefined && studentChoiceIdx === q.correctOptionIndex;
        return {
          questionNumber: idx + 1,
          questionText: q.questionText,
          options: q.options,
          studentChoiceIndex: studentChoiceIdx,
          studentChoiceText: (studentChoiceIdx !== undefined && studentChoiceIdx >= 0) ? q.options[studentChoiceIdx] : 'Not Answered',
          correctChoiceIndex: q.correctOptionIndex,
          correctChoiceText: q.options[q.correctOptionIndex],
          isCorrect
        };
      });

      return res.status(400).json({
        message: 'You have already submitted this exam.',
        score: existing.score,
        maxScore: quiz.maxScore || 100,
        correctAnswers: existing.correctAnswers,
        totalQuestions: existing.totalQuestions,
        questionBreakdown: breakdown
      });
    }

    // Grade student answers & build detailed question breakdown
    let correctCount = 0;
    const breakdown = quiz.questions.map((q, idx) => {
      const studentChoiceIdx = answers[idx];
      const isCorrect = studentChoiceIdx !== undefined && studentChoiceIdx === q.correctOptionIndex;
      if (isCorrect) correctCount++;

      return {
        questionNumber: idx + 1,
        questionText: q.questionText,
        options: q.options,
        studentChoiceIndex: studentChoiceIdx,
        studentChoiceText: (studentChoiceIdx !== undefined && studentChoiceIdx >= 0) ? q.options[studentChoiceIdx] : 'Not Answered',
        correctChoiceIndex: q.correctOptionIndex,
        correctChoiceText: q.options[q.correctOptionIndex],
        isCorrect
      };
    });

    const totalQuestions = quiz.questions.length;
    const finalScore = totalQuestions > 0 
      ? Math.round((correctCount / totalQuestions) * quiz.maxScore) 
      : 0;

    // Save submission to MongoDB BEFORE responding!
    const submission = new QuizSubmission({
      quizId,
      studentId: String(studentId),
      studentName: studentName || 'Student',
      score: finalScore,
      totalQuestions,
      correctAnswers: correctCount,
      answers
    });
    await submission.save();

    // Sync score to Main Ali Medresa Database BEFORE responding
    let synced = false;
    const candidateUrls = [
      MAIN_MEDRESA_URL,
      'http://localhost:5000/api',
      'https://medresa.onrender.com/api'
    ].filter(Boolean);

    for (const rawUrl of candidateUrls) {
      try {
        const cleanBase = rawUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
        const syncRes = await fetch(`${cleanBase}/api/exams/sync-score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sync-secret': SYNC_SECRET_KEY
          },
          body: JSON.stringify({
            studentId: String(studentId),
            examId: quiz.examColumnId,
            score: finalScore
          })
        });
        const syncData = await syncRes.json();
        if (syncRes.ok && syncData.success) {
          synced = true;
          submission.syncedToMain = true;
          await submission.save();
          break;
        }
      } catch (syncErr) {
        console.warn('Score sync attempt warning:', syncErr.message);
      }
    }

    // Now respond to student with score result & detailed answer breakdown
    res.json({
      success: true,
      score: finalScore,
      maxScore: quiz.maxScore || 100,
      correctAnswers: correctCount,
      totalQuestions,
      synced,
      questionBreakdown: breakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 5. Student: Check if already submitted ────────────────────────────────
export const checkStudentSubmission = async (req, res) => {
  try {
    const { quizId, studentId } = req.query;
    if (!quizId || !studentId) {
      return res.status(400).json({ message: 'quizId and studentId required' });
    }
    const submission = await QuizSubmission.findOne({ quizId, studentId: String(studentId) });
    if (submission) {
      return res.json({
        hasSubmitted: true,
        score: submission.score,
        correctAnswers: submission.correctAnswers,
        totalQuestions: submission.totalQuestions
      });
    }
    res.json({ hasSubmitted: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 5b. Ustaz: Allow Student Retake (delete submission & unlock cell) ─────
export const allowRetake = async (req, res) => {
  try {
    const { quizId, studentId } = req.body;
    if (!quizId || !studentId) {
      return res.status(400).json({ message: 'quizId and studentId required' });
    }

    const quiz = await Quiz.findById(quizId);
    await QuizSubmission.deleteOne({ quizId, studentId: String(studentId) });

    // Notify Main Backend to clear student score and unlock autoSyncedExams cell
    if (quiz) {
      try {
        const baseUrl = MAIN_MEDRESA_URL.replace(/\/api\/?$/, '');
        await fetch(`${baseUrl}/api/exams/clear-score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sync-secret': SYNC_SECRET_KEY
          },
          body: JSON.stringify({
            studentId: String(studentId),
            examId: quiz.examColumnId,
            examColumnName: quiz.examColumnName
          })
        });
      } catch (clearErr) {
        console.warn('Score unlock sync notice:', clearErr.message);
      }
    }

    res.json({ success: true, message: 'Student submission deleted. They can now retake the exam.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 5. Ustaz: Add Time to Active Exam ───────────────────────────────────────
export const addQuizTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { quizId, minutes, addedMinutes } = req.body || {};
    const targetId = id || quizId;
    const finalAdded = addedMinutes || minutes || 5;

    const quiz = await Quiz.findById(targetId);
    if (!quiz) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    quiz.addedTimeMinutes += Number(finalAdded);
    await quiz.save();

    res.json({
      success: true,
      addedTimeMinutes: quiz.addedTimeMinutes,
      totalDurationMinutes: quiz.durationMinutes + quiz.addedTimeMinutes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 6. Ustaz: End / Close Exam ──────────────────────────────────────────────
export const endQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { quizId } = req.body || {};
    const targetId = id || quizId;

    const quiz = await Quiz.findById(targetId);
    if (!quiz) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    quiz.status = 'ended';
    await quiz.save();

    res.json({ success: true, message: 'Exam ended successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 7. Ustaz: Delete Exam ───────────────────────────────────────────────────
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { quizId } = req.body || {};
    const targetId = id || quizId;

    await Quiz.findByIdAndDelete(targetId);
    await QuizSubmission.deleteMany({ quizId: targetId });

    res.json({ success: true, message: 'Exam and submissions deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 8. Ustaz: Get Submissions / Results for Exam ────────────────────────────
export const getQuizSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { quizId } = req.query || {};
    const targetId = id || quizId;

    let filter = { quizId: targetId };
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      filter = { $or: [{ quizId: targetId }, { quizId: new mongoose.Types.ObjectId(targetId) }] };
    }
    const submissions = await QuizSubmission.find(filter).sort({ completedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
