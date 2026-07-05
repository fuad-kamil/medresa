import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './models/Notification.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const notifications = await Notification.find().lean();
    console.log("All Notifications:");
    console.log(JSON.stringify(notifications, null, 2));
    process.exit(0);
}

run();
