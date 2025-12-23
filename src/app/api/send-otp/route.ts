import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );

    try {
        const { username, otp, email, phone } = await request.json();

        if (!username || !otp) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let sentVia = '';

        // 1. Send Email if available
        if (email) {
            try {
                await resend.emails.send({
                    from: 'NHA Recovery <onboarding@resend.dev>', // Replace with your verified domain in production
                    to: email,
                    subject: 'NHA Account Recovery OTP',
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2>NHA Account Recovery</h2>
                            <p>You requested a password reset for your account: <strong>${username}</strong></p>
                            <p>Your 6-digit One-Time Password (OTP) is:</p>
                            <div style="font-size: 2rem; font-weight: bold; padding: 10px; background: #f4f4f4; display: inline-block;">
                                ${otp}
                            </div>
                            <p>This code will expire in 10 minutes.</p>
                            <hr />
                            <p style="font-size: 0.8rem; color: #666;">If you didn't request this, please ignore this email.</p>
                        </div>
                    `,
                });
                sentVia = 'email';
            } catch (emailError) {
                console.error('Error sending email via Resend:', emailError);
                // Fallback to SMS if phone exists
            }
        }

        // 2. Send SMS if phone available and email didn't send or wasn't provided
        if (phone && !sentVia) {
            try {
                await twilioClient.messages.create({
                    body: `NHA Recovery Code for ${username}: ${otp}. Valid for 10 mins.`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: phone,
                });
                sentVia = 'sms';
            } catch (smsError) {
                console.error('Error sending SMS via Twilio:', smsError);
            }
        }

        if (!sentVia) {
            return NextResponse.json({ error: 'Failed to send OTP to any contact method' }, { status: 500 });
        }

        return NextResponse.json({ success: true, sentVia });
    } catch (error: any) {
        console.error('API route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
