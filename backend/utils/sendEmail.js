import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async ({ to, subject, text, html }) => {
    // If an HTTP API URL is configured (e.g. Google Apps Script Web App, webhook, etc.),
    // send the email via HTTP POST to bypass Render's SMTP port blocks.
    if (process.env.EMAIL_API_URL) {
        try {
            console.log('📬 Attempting to send email via HTTP API...');
            
            const response = await fetch(process.env.EMAIL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ to, subject, text, html }),
            });

            if (response.ok) {
                console.log('✅ Email sent successfully via HTTP API');
                return true;
            } else {
                const errText = await response.text();
                console.error('❌ Email API response error:', response.status, errText);
            }
        } catch (error) {
            console.error('❌ HTTP Email API failed:', error.message);
        }
        console.log('🔄 Falling back to SMTP...');
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Ali Medresa" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent via SMTP:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ SMTP Email sending failed:', error.message);
        return false;
    }
};

export default sendEmail;