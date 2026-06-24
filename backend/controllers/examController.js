import Exam from '../models/Exam.js';
import Student from '../models/Student.js';

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
