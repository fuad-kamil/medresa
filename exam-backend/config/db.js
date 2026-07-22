import mongoose from 'mongoose';

const connectExamDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.EXAM_MONGO_URI;
    if (!mongoURI) {
      console.warn("MONGO_URI not defined for Exam DB! Using memory fallback or check .env");
    }
    const conn = await mongoose.connect(mongoURI);
    console.log(`Exam Database Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to Exam Database: ${error.message}`);
  }
};

export default connectExamDB;
