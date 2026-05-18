// scratch_test_email.js
import dotenv from 'dotenv';
import sendEmail from './utils/sendEmail.js';

dotenv.config();

const runTest = async () => {
    console.log("Testing email sending using environment variables:");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length);
    
    const result = await sendEmail({
        to: process.env.EMAIL_USER,
        subject: "Test Email from Ali Medresa System",
        text: "If you receive this, email sending works perfectly!",
        html: "<h1>Test Email</h1><p>Nodemailer configuration is working successfully.</p>"
    });
    
    console.log("Result:", result ? "SUCCESS" : "FAILURE");
    process.exit(0);
};

runTest();
