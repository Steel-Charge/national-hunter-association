'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHunterStore } from '@/lib/store';
import { PROFILE_LABELS, PROFILE_TYPES } from '@/lib/game-logic';
import Link from 'next/link';
import styles from '../page.module.css';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [contactInfo, setContactInfo] = useState(''); // email or phone
    const [profileType, setProfileType] = useState<string>(PROFILE_TYPES.MALE_20_25);
    const router = useRouter();
    const { createProfile, loading } = useHunterStore();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim() || !password.trim() || !contactInfo.trim()) {
            alert('Please fill in all fields (Username, Password, and Email/Phone)');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            // Determine if it's email or phone (simple check)
            const isEmail = contactInfo.includes('@');
            const info = isEmail ? { email: contactInfo } : { phone: contactInfo };

            await createProfile(username, password, profileType, info);
            alert('Account created successfully! Please login.');
            router.push('/');
        } catch (error) {
            alert('Failed to create account. Username may already exist.');
        }
    };

    return (
        <main className={styles.main}>
            <div className={styles.loginContainer}>
                {/* NHA Logo */}
                <div className={styles.logoContainer}>
                    <img src="/logo.png" alt="NHA Logo" className={styles.logoImage} />
                    <h1 className={styles.logoText}>NHA</h1>
                    <p className={styles.logoSub}>NATIONAL HUNTER ASSOCIATION</p>
                </div>

                <form onSubmit={handleRegister} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="profileType">Hunter Profile:</label>
                        <select
                            id="profileType"
                            value={profileType}
                            onChange={(e) => setProfileType(e.target.value)}
                            className={styles.input}
                            style={{ appearance: 'none', cursor: 'pointer' }}
                            required
                        >
                            {Object.entries(PROFILE_LABELS).map(([value, label]) => (
                                <option key={value} value={value} style={{ background: '#000', color: '#fff' }}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="contactInfo">Email or Phone:</label>
                        <input
                            type="text"
                            id="contactInfo"
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            placeholder="Email or Phone (for recovery)"
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Choose a password"
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
                            placeholder="Confirm password"
                            className={styles.input}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.loginButton} disabled={loading}>
                        {loading ? 'Creating Account...' : 'REGISTER'}
                    </button>

                    <div style={{
                        textAlign: 'center',
                        marginTop: '20px',
                        color: 'var(--cyan)',
                        fontSize: '0.9rem'
                    }}>
                        Already have an account?{' '}
                        <Link href="/" style={{
                            color: 'var(--cyan)',
                            textDecoration: 'underline',
                            fontWeight: 'bold'
                        }}>
                            Login here
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
}
