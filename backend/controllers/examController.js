import Exam from '../models/Exam.js';
import Student from '../models/Student.js';

// Get all exams. Seeds defaults and triggers score migration if database is empty.
export const getExams = async (req, res) => {
    try {
        let exams = await Exam.find().sort({ createdAt: 1 });
        
        if (exams.length === 0) {
            // Seed default exams
            const defaults = [
                { name: 'First Exam', maxScore: 100 },
                { name: 'Second Exam', maxScore: 100 },
                { name: 'Final Exam', maxScore: 100 }
            ];
            exams = await Exam.insertMany(defaults);
            
            // Run background migration to map existing student scores
            runBackgroundMigration(exams).catch(err => {
                console.error("Migration error:", err);
            });
        }
        
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Background migration function
const runBackgroundMigration = async (seededExams) => {
    const firstExam = seededExams.find(e => e.name === 'First Exam');
    const secondExam = seededExams.find(e => e.name === 'Second Exam');
    const finalExam = seededExams.find(e => e.name === 'Final Exam');

    if (firstExam && secondExam && finalExam) {
        const students = await Student.find({
            $or: [
                { firstExam: { $gt: 0 } },
                { secondExam: { $gt: 0 } },
                { finalExam: { $gt: 0 } }
            ]
        });

        for (const student of students) {
            let modified = false;
            
            if (student.firstExam && !student.examScores.has(firstExam._id.toString())) {
                student.examScores.set(firstExam._id.toString(), student.firstExam);
                modified = true;
            }
            if (student.secondExam && !student.examScores.has(secondExam._id.toString())) {
                student.examScores.set(secondExam._id.toString(), student.secondExam);
                modified = true;
            }
            if (student.finalExam && !student.examScores.has(finalExam._id.toString())) {
                student.examScores.set(finalExam._id.toString(), student.finalExam);
                modified = true;
            }
            
            if (modified) {
                await student.save();
            }
        }
        console.log(`Successfully migrated ${students.length} students to dynamic exam scores.`);
    }
};

// Create a new exam column
export const createExam = async (req, res) => {
    try {
        const { name, maxScore } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Exam name is required' });
        }

        const existing = await Exam.findOne({ name: name.trim() });
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

// Update / Rename an exam column
export const updateExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, maxScore } = req.body;

        const exam = await Exam.findById(id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam column not found' });
        }

        if (name && name.trim() !== exam.name) {
            const existing = await Exam.findOne({ name: name.trim() });
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

// Delete an exam column
export const deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findById(id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam column not found' });
        }

        await Exam.deleteOne({ _id: id });

        // Clean up student exam scores
        await Student.updateMany({}, { $unset: { [`examScores.${id}`]: "" } });

        res.json({ message: 'Exam column deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
