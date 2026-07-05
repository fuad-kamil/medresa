import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './models/Notification.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    // Remove nulls from readBy arrays
    await Notification.updateMany({}, { $pull: { readBy: null } });
    console.log("Cleaned up nulls in readBy");
    process.exit(0);
}

run();
