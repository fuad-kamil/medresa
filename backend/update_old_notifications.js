import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './models/Notification.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const notifications = await Notification.find();
    
    for (const notif of notifications) {
        if (notif.message && notif.message.includes("missed 3 consecutive classes under Ustaz")) {
            // It's the old English format
            const newMsg = `ተማሪ ${notif.studentName} ከኡስታዝ ${notif.ustazName} ትምህርት 3 ተከታታይ ቀናት ቀርቷል።`;
            notif.message = newMsg;
            await notif.save();
            console.log(`Updated notification for ${notif.studentName}`);
        }
    }
    
    console.log("All old notifications updated to Amharic.");
    process.exit(0);
}

run();
