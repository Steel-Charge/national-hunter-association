'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useHunterStore } from '@/lib/store';
import styles from '../page.module.css';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1); // 1: Username, 2: OTP, 3: New Password
    const [username, setUsername] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingLocal, setLoadingLocal] = useState(false);

    const router = useRouter();
    const { requestOTP, verifyOTP, resetPassword } = useHunterStore();

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingLocal(true);
        const result = await requestOTP(username);
        setLoadingLocal(false);
        if (result.success) {
            alert('OTP sent! Check the logs (console) to simulate receiving it.');
            setStep(2);
        } else {
            alert(result.error || 'Failed to request OTP');
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingLocal(true);
        const result = await verifyOTP(username, otp);
        setLoadingLocal(false);
        if (result.success) {
            setStep(3);
        } else {
            alert(result.error || 'Invalid OTP');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        setLoadingLocal(true);
        const result = await resetPassword(username, newPassword);
        setLoadingLocal(false);
        if (result.success) {
            alert('Password updated successfully! Redirecting to login.');
            router.push('/');
        } else {
            alert(result.error || 'Failed to reset password');
        }
    };

    return (
        <main className={styles.main}>
            <div className={styles.loginContainer}>
                <div className={styles.logoContainer}>
                    <img src="/logo.png" alt="NHA Logo" className={styles.logoImage} />
                    <h1 className={styles.logoText}>NHA</h1>
                    <p className={styles.logoSub}>PASSWORD RECOVERY</p>
                </div>

                {step === 1 && (
                    <form onSubmit={handleRequestOTP} className={styles.form}>
                        <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem' }}>
                            Enter your username to receive a 6-digit OTP via your linked contact info.
                        </p>
                        <div className={styles.inputGroup}>
                            <label htmlFor="username">Username:</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Your username"
                                className={styles.input}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.loginButton} disabled={loadingLocal}>
                            {loadingLocal ? 'Requesting...' : 'SEND OTP'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className={styles.form}>
                        <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem' }}>
                            We've "sent" an OTP for <strong>{username}</strong>. Check your console logs to find it.
                        </p>
                        <div className={styles.inputGroup}>
                            <label htmlFor="otp">Enter OTP:</label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="6-digit code"
                                className={styles.input}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.loginButton} disabled={loadingLocal}>
                            {loadingLocal ? 'Verifying...' : 'VERIFY OTP'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="newPassword">New Password:</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className={styles.input}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmPassword">Confirm Password:</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className={styles.input}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.loginButton} disabled={loadingLocal}>
                            {loadingLocal ? 'Updating...' : 'UPDATE PASSWORD'}
                        </button>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Link href="/" style={{ color: 'var(--cyan)', textDecoration: 'underline', fontSize: '0.9rem' }}>
                        Back to Login
                    </Link>
                </div>
            </div>
        </main>
    );
}
