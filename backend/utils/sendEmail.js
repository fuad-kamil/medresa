import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async ({ to, subject, text, html }) => {
    // Method 1: Resend HTTP API (Highly Recommended for Render free tier)
    if (process.env.RESEND_API_KEY) {
        try {
            console.log('📬 Sending email via Resend HTTP API...');
            
            // With a free Resend account, you can send to your registered email using 'onboarding@resend.dev'
            const fromEmail = 'onboarding@resend.dev';
            
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: `Ali Medresa <${fromEmail}>`,
                    to: to.toLowerCase(),
                    subject,
                    text,
                    html,
                }),
            });

            if (response.ok) {
                console.log('✅ Email sent via Resend HTTP API');
                return { success: true };
            } else {
                const errData = await response.json();
                console.error('❌ Resend API error:', errData);
                return { success: false, error: errData };
            }
        } catch (error) {
            console.error('❌ Resend HTTP request failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Method 2: Generic HTTP API (e.g. Google Apps Script Web App)
    if (process.env.EMAIL_API_URL) {
        try {
            console.log('📬 Attempting to send email via Generic HTTP API...');
            
            const response = await fetch(process.env.EMAIL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ to, subject, text, html }),
            });

            if (response.ok) {
                console.log('✅ Email sent successfully via Generic HTTP API');
                return { success: true };
            } else {
                const errText = await response.text();
                console.error('❌ Email API response error:', response.status, errText);
                return { success: false, error: `Status ${response.status}: ${errText}` };
            }
        } catch (error) {
            console.error('❌ HTTP Email API failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Method 3: Standard SMTP (Gmail Nodemailer)
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
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ SMTP Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
};

export default sendEmail;