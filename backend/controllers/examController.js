import Exam from '../models/Exam.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';

// ─── Ustaz: Get their own exam columns ────────────────────────────────────────
export const getMyExams = async (req, res) => {
    try {
        const exams = await Exam.find({ ustaz: req.user.id }).sort({ createdAt: 1 });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Ustaz: Create a new exam column (scoped to themselves) ───────────────────
export const createMyExam = async (req, res) => {
    try {
        const ustaz = await User.findById(req.user.id);
        if (ustaz && ustaz.semesterStatus === 'ended') {
            return res.status(400).json({ message: 'Your semester is currently ended. Please wait for the admin to reset it before creating exams.' });
        }

        const { name, maxScore } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Exam name is required' });
        }

        const existing = await Exam.findOne({ name: name.trim(), ustaz: req.user.id });
        if (existing) {
            return res.status(400).json({ message: 'You already have an exam with this name' });
        }

        const exam = new Exam({
            name: name.trim(),
            maxScore: maxScore ? Number(maxScore) : 100,
            ustaz: req.user.id
        });
        await exam.save();
        res.status(201).json(exam);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Ustaz: Update / Rename their own exam column ─────────────────────────────
export const updateMyExam = async (req, res) => {
    try {
        const ustaz = await User.findById(req.user.id);
        if (ustaz && ustaz.semesterStatus === 'ended') {
            return res.status(400).json({ message: 'Your semester is currently ended. Please wait for the admin to reset it before updating exams.' });
        }

        const { id } = req.params;
        const { name, maxScore } = req.body;

        const exam = await Exam.findOne({ _id: id, ustaz: req.user.id });
        if (!exam) {
            return res.status(404).json({ message: 'Exam column not found or not yours' });
        }

        if (name && name.trim() !== exam.name) {
            const existing = await Exam.findOne({ name: name.trim(), ustaz: req.user.id });
            if (existing && existing._id.toString() !== id) {
                return res.status(400).json({ message: 'You already have an exam with this name' });
            }
            exam.name = name.trim();
        }
        if (maxScore !== undefined) {
            exam.maxScore = Number(maxScore);
        }

        await exam.save();
        res.json(exam);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Ustaz: Delete their own exam column ──────────────────────────────────────
export const deleteMyExam = async (req, res) => {
    try {
        const ustaz = await User.findById(req.user.id);
        if (ustaz && ustaz.semesterStatus === 'ended') {
            return res.status(400).json({ message: 'Your semester is currently ended. Please wait for the admin to reset it before deleting exams.' });
        }

        const { id } = req.params;
        const exam = await Exam.findOne({ _id: id, ustaz: req.user.id });
        if (!exam) {
            return res.status(404).json({ message: 'Exam column not found or not yours' });
        }

        await Exam.deleteOne({ _id: id });
        // Clean up student exam scores for this column
        await Student.updateMany({}, { $unset: { [`examScores.${id}`]: '' } });

        res.json({ message: 'Exam column deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Admin: Get exams for a specific Kitab Ustaz ──────────────────────────────
export const getExamsByUstaz = async (req, res) => {
    try {
        const { ustazId } = req.params;
        const exams = await Exam.find({ ustaz: ustazId }).sort({ createdAt: 1 });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Legacy / Admin: Get all exams (kept for backward compat) ─────────────────
export const getExams = async (req, res) => {
    try {
        let exams = await Exam.find().sort({ createdAt: 1 });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Admin: Create a global exam column (legacy) ──────────────────────────────
export const createExam = async (req, res) => {
    try {
        const { name, maxScore } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Exam name is required' });
        }

        const existing = await Exam.findOne({ name: name.trim(), ustaz: null });
        if (existing) {
            return res.status(400).json({ message: 'An exam with this name already exists' });
        }

        const exam = new Exam({
            name: name.trim(),
            maxScore: maxScore ? Number(maxScore) : 100
        });
        await exam.save();

        res.status(201).json(exam);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Admin: Update / Rename an exam column ────────────────────────────────────
export const updateExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, maxScore } = req.body;

        const exam = await Exam.findById(id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam column not found' });
        }

        if (name && name.trim() !== exam.name) {
            const existing = await Exam.findOne({ name: name.trim(), ustaz: exam.ustaz });
            if (existing && existing._id.toString() !== id) {
                return res.status(400).json({ message: 'An exam with this name already exists' });
            }
            exam.name = name.trim();
        }

        if (maxScore !== undefined) {
            exam.maxScore = Number(maxScore);
        }

        await exam.save();
        res.json(exam);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Admin: Delete an exam column ─────────────────────────────────────────────
export const deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findById(id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam column not found' });
        }

        await Exam.deleteOne({ _id: id });
        await Student.updateMany({}, { $unset: { [`examScores.${id}`]: '' } });

        res.json({ message: 'Exam column deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Student Verification (For Exam Login) ──────────────────────────────────
export const verifyStudent = async (req, res) => {
    try {
        const { identifier, ustazId } = req.body;
        if (!identifier) {
            return res.status(400).json({ message: 'Phone number or Roster Index ID is required' });
        }

        const cleanInput = identifier.toString().trim();
        let student = null;

        // 1. If cleanInput is purely numeric (e.g. 1, 2, 3...), lookup by roster index matching Ustaz Dashboard order
        const numericIndex = parseInt(cleanInput, 10);
        if (!isNaN(numericIndex) && numericIndex > 0 && numericIndex < 500) {
            let query = { status: 'active' };
            if (ustazId && ustazId !== 'ustaz_default') query.assignedUstaz = ustazId;
            const studentsList = await Student.find(query).sort({ createdAt: 1 }).populate('assignedUstaz', 'name');
            if (numericIndex <= studentsList.length) {
                student = studentsList[numericIndex - 1];
            }
        }

        // 2. Search by phone number (fatherPhone, motherPhone) or full name
        if (!student) {
            const searchConditions = [
                { fatherPhone: cleanInput },
                { motherPhone: cleanInput },
                { fullName: { $regex: cleanInput, $options: 'i' } }
            ];
            const query = (ustazId && ustazId !== 'ustaz_default') 
                ? { assignedUstaz: ustazId, status: 'active', $or: searchConditions }
                : { status: 'active', $or: searchConditions };

            student = await Student.findOne(query).populate('assignedUstaz', 'name');
        }

        if (!student) {
            return res.status(404).json({ message: 'Student not found with provided phone number, name, or roster ID' });
        }

        res.json({
            success: true,
            student: {
                _id: student._id,
                fullName: student.fullName,
                assignedUstaz: student.assignedUstaz ? student.assignedUstaz.name : 'Unassigned'
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Score Sync (From Exam Microservice) ────────────────────────────────────
export const syncExamScore = async (req, res) => {
    try {
        const secret = req.headers['x-sync-secret'] || req.body.syncSecret;
        const expectedSecret = process.env.SYNC_SECRET_KEY || 'medresa_sync_secret_key_2026';
        if (secret !== expectedSecret) {
            return res.status(401).json({ message: 'Unauthorized sync request' });
        }

        const { studentId, examId, score } = req.body;
        if (!studentId || score === undefined) {
            return res.status(400).json({ message: 'studentId and score are required' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (!student.examScores) student.examScores = new Map();
        const numScore = Number(score);

        if (!student.autoSyncedExams) student.autoSyncedExams = [];

        if (examId) {
            student.examScores.set(examId.toString(), numScore);
            if (!student.autoSyncedExams.includes(examId.toString())) {
                student.autoSyncedExams.push(examId.toString());
            }
        }

        // Also update across all exam columns assigned to this student's Ustaz
        const ustazId = student.assignedUstaz;
        if (ustazId) {
            const ustazExams = await Exam.find({ ustaz: ustazId });
            ustazExams.forEach(ex => {
                if (!examId || examId === 'exam_default' || ex._id.toString() === examId.toString() || ex.name === 'Quiz' || ex.name === 'Test') {
                    student.examScores.set(ex._id.toString(), numScore);
                    if (!student.autoSyncedExams.includes(ex._id.toString())) {
                        student.autoSyncedExams.push(ex._id.toString());
                    }
                    if (ex.name) {
                        student.examScores.set(ex.name, numScore);
                        if (!student.autoSyncedExams.includes(ex.name)) {
                            student.autoSyncedExams.push(ex.name);
                        }
                    }
                }
            });
        }

        student.markModified('examScores');
        await student.save();
        console.log(`Synced score ${numScore} for student ${student.fullName} (${studentId})`);
        res.json({ success: true, message: 'Score synced successfully to main database' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Admin Lock / Unlock Status ─────────────────────────────────────────────
export const getExamSystemStatus = async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: 'isExamSystemLocked' });
        const isLocked = setting ? setting.value === 'true' : false;
        res.json({ isLocked });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleExamSystemLock = async (req, res) => {
    try {
        const { isLocked } = req.body;
        let setting = await Settings.findOne({ key: 'isExamSystemLocked' });
        if (!setting) {
            setting = new Settings({ key: 'isExamSystemLocked', value: String(isLocked) });
        } else {
            setting.value = String(isLocked);
        }
        await setting.save();

        res.json({ success: true, isLocked: setting.value === 'true' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Clear Exam Score / Unlock (For Retake) ──────────────────────────────
export const clearExamScore = async (req, res) => {
    try {
        const secret = req.headers['x-sync-secret'] || req.body.syncSecret;
        const expectedSecret = process.env.SYNC_SECRET_KEY || 'medresa_sync_secret_key_2026';
        if (secret !== expectedSecret) {
            return res.status(401).json({ message: 'Unauthorized sync request' });
        }

        const { studentId, ustazId, examId, examColumnName, clearAll } = req.body;

        // If clearAll is true or ustazId is provided without a single studentId, clear across all students
        if (clearAll || (!studentId && ustazId)) {
            let filter = {};
            if (ustazId && ustazId !== 'ustaz_default') filter.assignedUstaz = ustazId;

            const studentsList = await Student.find(filter);
            for (const student of studentsList) {
                if (student.examScores) {
                    if (examId) student.examScores.delete(examId.toString());
                    if (examColumnName) student.examScores.delete(examColumnName);
                    
                    const uId = student.assignedUstaz;
                    if (uId) {
                        const ustazExams = await Exam.find({ ustaz: uId });
                        ustazExams.forEach(ex => {
                            if (!examId || examId === 'exam_default' || ex._id.toString() === String(examId) || ex.name === examColumnName || ex.name === 'Quiz' || ex.name === 'Test') {
                                student.examScores.delete(ex._id.toString());
                                if (ex.name) student.examScores.delete(ex.name);
                            }
                        });
                    }
                }
                if (student.autoSyncedExams) {
                    student.autoSyncedExams = student.autoSyncedExams.filter(
                        id => id !== String(examId) && id !== examColumnName
                    );
                }
                student.markModified('examScores');
                student.markModified('autoSyncedExams');
                await student.save();
            }
            return res.json({ success: true, message: 'Cleared all student scores for exam.' });
        }

        if (!studentId) {
            return res.status(400).json({ message: 'studentId is required' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (student.examScores) {
            if (examId) student.examScores.delete(examId.toString());
            if (examColumnName) student.examScores.delete(examColumnName);

            // Also clear across all exam columns assigned to this student's Ustaz
            const uId = student.assignedUstaz;
            if (uId) {
                const ustazExams = await Exam.find({ ustaz: uId });
                ustazExams.forEach(ex => {
                    if (!examId || examId === 'exam_default' || ex._id.toString() === String(examId) || ex.name === examColumnName || ex.name === 'Quiz' || ex.name === 'Test') {
                        student.examScores.delete(ex._id.toString());
                        if (ex.name) student.examScores.delete(ex.name);
                    }
                });
            }
        }

        if (student.autoSyncedExams) {
            student.autoSyncedExams = student.autoSyncedExams.filter(
                id => id !== String(examId) && id !== examColumnName
            );
        }

        student.markModified('examScores');
        student.markModified('autoSyncedExams');
        await student.save();

        console.log(`Cleared and unlocked score for student ${student.fullName} (${studentId})`);
        res.json({ success: true, message: 'Score unlocked and cleared for retake' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
