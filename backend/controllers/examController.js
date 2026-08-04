import Exam from '../models/Exam.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import mongoose from 'mongoose';

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
            return res.status(400).json({ message: 'Exam login code is required' });
        }

        const cleanInput = identifier.toString().trim();
        let student = null;
        let targetUstazId = (ustazId && ustazId !== 'ustaz_default') ? ustazId : null;

        if (/^\d+$/.test(cleanInput)) {
            // Fetch all ustazs sorted by createdAt to determine position-based prefixes if needed
            const allUstazs = await User.find({ role: 'ustaz' }).sort({ createdAt: 1 }).select('_id examNumber name');

            // Helper to find a student under an ustaz by roster index
            const findStudentByRoster = async (uId, rIndex) => {
                const ustazStudents = await Student.find({
                    assignedUstaz: uId,
                    status: { $ne: 'inactive' }
                }).sort({ createdAt: 1 }).populate('assignedUstaz', 'name');

                if (rIndex > 0 && rIndex <= ustazStudents.length) {
                    return ustazStudents[rIndex - 1];
                }
                return null;
            };

            // 1. If targetUstazId (quiz's Ustaz) is provided, check candidate prefixes for this Ustaz
            if (targetUstazId) {
                const uIdx = allUstazs.findIndex(u => u._id.toString() === targetUstazId.toString());
                const targetUstaz = uIdx !== -1 ? allUstazs[uIdx] : await User.findById(targetUstazId);

                if (targetUstaz) {
                    const prefixes = new Set();
                    if (targetUstaz.examNumber) {
                        prefixes.add(targetUstaz.examNumber);
                        prefixes.add(String(parseInt(targetUstaz.examNumber, 10)));
                    }
                    if (uIdx !== -1) {
                        const seqNum = uIdx + 1;
                        prefixes.add(String(seqNum).padStart(2, '0'));
                        prefixes.add(String(seqNum));
                    }

                    // Sort prefixes by length descending (e.g. "08" before "8")
                    const sortedPrefixes = Array.from(prefixes).filter(Boolean).sort((a, b) => b.length - a.length);

                    for (const prefix of sortedPrefixes) {
                        if (cleanInput.startsWith(prefix) && cleanInput.length > prefix.length) {
                            const rosterStr = cleanInput.slice(prefix.length);
                            const rosterIndex = parseInt(rosterStr, 10);
                            if (!isNaN(rosterIndex) && rosterIndex > 0) {
                                const found = await findStudentByRoster(targetUstaz._id, rosterIndex);
                                if (found) {
                                    student = found;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            // 2. If student not found yet (or targetUstazId was not provided), check ALL ustazs
            if (!student) {
                for (let i = 0; i < allUstazs.length; i++) {
                    const uz = allUstazs[i];
                    const seqNum = i + 1;
                    const prefixes = new Set();
                    if (uz.examNumber) {
                        prefixes.add(uz.examNumber);
                        prefixes.add(String(parseInt(uz.examNumber, 10)));
                    }
                    prefixes.add(String(seqNum).padStart(2, '0'));
                    prefixes.add(String(seqNum));

                    const sortedPrefixes = Array.from(prefixes).filter(Boolean).sort((a, b) => b.length - a.length);

                    for (const prefix of sortedPrefixes) {
                        if (cleanInput.startsWith(prefix) && cleanInput.length > prefix.length) {
                            const rosterStr = cleanInput.slice(prefix.length);
                            const rosterIndex = parseInt(rosterStr, 10);
                            if (!isNaN(rosterIndex) && rosterIndex > 0) {
                                const found = await findStudentByRoster(uz._id, rosterIndex);
                                if (found) {
                                    student = found;
                                    break;
                                }
                            }
                        }
                    }
                    if (student) break;
                }
            }
        }

        if (!student) {
            return res.status(404).json({ message: 'Invalid exam code. Please enter your combined Exam Code (e.g. 011).' });
        }

        // ── Single Active Session & Device Lock Enforcement ───────────────────
        const { deviceToken } = req.body;
        if (deviceToken) {
            const sidStr = student._id.toString();
            const TWO_HOURS = 2 * 60 * 60 * 1000;

            // 1. Check if another device is currently using this student code
            const existingSidSession = activeStudentSessions.get(sidStr);
            if (existingSidSession && (Date.now() - existingSidSession.startedAt < TWO_HOURS)) {
                if (existingSidSession.deviceToken !== deviceToken) {
                    return res.status(403).json({
                        code: 'MULTI_DEVICE_LOCKED',
                        examCode: cleanInput,
                        message: `🔒 Exam code (${cleanInput}) is currently active on another device. Multi-device access is locked.`
                    });
                }
            }

            // 2. Check if this device is already bound to another active student code
            const existingDeviceStudentId = activeDeviceStudents.get(deviceToken);
            if (existingDeviceStudentId && existingDeviceStudentId !== sidStr) {
                const activeDeviceSession = activeStudentSessions.get(existingDeviceStudentId);
                if (activeDeviceSession && (Date.now() - activeDeviceSession.startedAt < TWO_HOURS)) {
                    return res.status(403).json({
                        code: 'DEVICE_ALREADY_ACTIVE',
                        studentName: activeDeviceSession.studentName,
                        message: `🔒 You are currently taking an exam as "${activeDeviceSession.studentName}" on this device. Logging into another student account is locked.`
                    });
                }
            }

            // Bind session to this deviceToken
            activeStudentSessions.set(sidStr, {
                deviceToken,
                studentName: student.fullName,
                startedAt: Date.now()
            });
            activeDeviceStudents.set(deviceToken, sidStr);
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

// Map to track active student exam sessions in memory
const activeStudentSessions = new Map();
const activeDeviceStudents = new Map();

// Clear active student session (used when retake is granted or exam ends)
export const clearActiveStudentSession = (studentId) => {
    if (!studentId) return;
    const sidStr = studentId.toString();
    const session = activeStudentSessions.get(sidStr);
    if (session) {
        activeDeviceStudents.delete(session.deviceToken);
        activeStudentSessions.delete(sidStr);
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

        // Helper: wipes all score keys + autoSyncedExams entries for this exam column on one student
        const clearStudentScore = async (student) => {
            // Collect all the exam column IDs/names that syncExamScore may have written
            const keysToDelete = new Set();
            if (examId) keysToDelete.add(examId.toString());
            if (examColumnName) keysToDelete.add(examColumnName);

            // Also find every exam column belonging to this student's Ustaz
            // (syncExamScore spreads across ALL columns where name === 'Quiz' or 'Test')
            const uId = student.assignedUstaz;
            if (uId) {
                const ustazExams = await Exam.find({ ustaz: uId });
                ustazExams.forEach(ex => {
                    // Match the same condition syncExamScore used when writing
                    if (
                        !examId ||
                        examId === 'exam_default' ||
                        ex._id.toString() === String(examId) ||
                        ex.name === examColumnName ||
                        ex.name === 'Quiz' ||
                        ex.name === 'Test'
                    ) {
                        keysToDelete.add(ex._id.toString());
                        if (ex.name) keysToDelete.add(ex.name);
                    }
                });
            }

            // Remove all matching keys from examScores Map
            if (student.examScores) {
                keysToDelete.forEach(k => student.examScores.delete(k));
            }

            // Remove ALL matching entries from autoSyncedExams array
            if (student.autoSyncedExams) {
                student.autoSyncedExams = student.autoSyncedExams.filter(
                    id => !keysToDelete.has(id)
                );
            }

            student.markModified('examScores');
            student.markModified('autoSyncedExams');
            await student.save();
        };

        // ── BULK MODE: clearAll=true or ustazId provided without a specific studentId ──
        if (clearAll || (!studentId && ustazId)) {
            let studentFilter = {};

            if (ustazId && ustazId !== 'ustaz_default') {
                // assignedUstaz is an ObjectId ref — cast it properly
                try {
                    studentFilter.assignedUstaz = new mongoose.Types.ObjectId(ustazId);
                } catch {
                    // If ustazId isn't a valid ObjectId, fall back to string compare
                    studentFilter.assignedUstaz = ustazId;
                }
            }

            const studentsList = await Student.find(studentFilter);
            console.log(`[clearExamScore] clearAll for ${studentsList.length} students, examId=${examId}, examColumnName=${examColumnName}`);

            for (const student of studentsList) {
                await clearStudentScore(student);
            }

            return res.json({ success: true, message: `Cleared scores for ${studentsList.length} students.` });
        }

        // ── SINGLE STUDENT MODE ──
        if (!studentId) {
            return res.status(400).json({ message: 'studentId is required' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        await clearStudentScore(student);
        console.log(`[clearExamScore] Cleared score for student ${student.fullName} (${studentId})`);
        res.json({ success: true, message: 'Score cleared and cell unlocked for retake.' });
    } catch (error) {
        console.error('[clearExamScore] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

