import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './models/Notification.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    try {
        // Drop the old 30-day TTL index
        await Notification.collection.dropIndex('createdAt_1');
        console.log("Dropped old 30-day TTL index");
        
        // Let Mongoose recreate the indexes based on the current schema (14 days)
        await Notification.syncIndexes();
        console.log("Recreated indexes based on current schema (14 days)");
        
        const indexes = await Notification.collection.indexes();
        console.log("New Indexes:", JSON.stringify(indexes, null, 2));
    } catch (err) {
        console.error("Error updating index:", err);
    }
    
    process.exit(0);
}

run();
