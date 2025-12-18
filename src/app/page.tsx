'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useHunterStore } from '@/lib/store';
import styles from './page.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login, loading } = useHunterStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      const success = await login(username, password);
      if (success) {
        router.push('/home');
      } else {
        alert('Invalid username or password');
      }
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

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
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
              placeholder="Password"
              className={styles.input}
              required
            />
          </div>

          <button type="submit" className={styles.loginButton} disabled={loading}>
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>

          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            color: 'var(--cyan)',
            fontSize: '0.9rem'
          }}>
            Don't have an account?{' '}
            <Link href="/register" style={{
              color: 'var(--cyan)',
              textDecoration: 'underline',
              fontWeight: 'bold'
            }}>
              Register here
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
