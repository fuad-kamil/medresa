import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './models/Notification.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Get indexes
    const indexes = await Notification.collection.indexes();
    console.log("Indexes on Notification collection:", JSON.stringify(indexes, null, 2));
    
    process.exit(0);
}

run();
