import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectExamDB from './config/db.js';
import quizRoutes from './routes/quizRoutes.js';

dotenv.config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/quizzes', quizRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Ali Medresa Exam Microservice', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('<h1>Ali Medresa Exam Microservice</h1><p>Server running!</p>');
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectExamDB();
  app.listen(PORT, () => {
    console.log(`Exam Microservice running on http://localhost:${PORT}`);
  });
};

startServer();
