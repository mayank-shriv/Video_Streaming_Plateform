/**
 * Email Service
 * Sends OTP emails via Gmail SMTP using nodemailer
 */

const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter = null;

function getTransporter() {
    if (!transporter) {
        const host = process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = parseInt(process.env.SMTP_PORT) || 587;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;

        if (!user || !pass) {
            console.warn('⚠️  SMTP credentials not configured. Email sending will fail.');
            console.warn('   Set SMTP_USER and SMTP_PASS in your .env file.');
        }

        transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // true for 465, false for others
            auth: { user, pass },
        });
    }
    return transporter;
}

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP email
 * @param {string} toEmail - Recipient email
 * @param {string} otp - 6-digit OTP code
 */
async function sendOTP(toEmail, otp) {
    const transport = getTransporter();
    const from = process.env.SMTP_USER || 'noreply@mayanktube.com';

    const mailOptions = {
        from: `"MayankTube" <${from}>`,
        to: toEmail,
        subject: 'Password Reset OTP - MayankTube',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #f1f1f1; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #e50914, #b30710); padding: 32px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; letter-spacing: -0.5px; color: white;">MayankTube</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">Password Reset</p>
                </div>
                <div style="padding: 32px;">
                    <p style="font-size: 15px; color: #a0a0a0; margin-bottom: 24px;">
                        You requested a password reset for your MayankTube account. Use the OTP below to verify your identity:
                    </p>
                    <div style="background: #1a1a2e; border: 1px solid rgba(229,9,20,0.3); border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <p style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #e50914; margin: 0;">${otp}</p>
                    </div>
                    <p style="font-size: 13px; color: #555; margin-bottom: 8px;">⏰ This code expires in <strong style="color: #a0a0a0;">10 minutes</strong>.</p>
                    <p style="font-size: 13px; color: #555;">If you didn't request this, please ignore this email.</p>
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding: 16px 32px; text-align: center;">
                    <p style="font-size: 11px; color: #555; margin: 0;">© 2026 MayankTube. All rights reserved.</p>
                </div>
            </div>
        `,
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`📧 OTP email sent to ${toEmail}: ${info.messageId}`);
    return info;
}

module.exports = {
    generateOTP,
    sendOTP,
};
