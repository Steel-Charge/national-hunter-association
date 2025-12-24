'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHunterStore } from '@/lib/store';
import styles from './page.module.css';

export default function RoleSelectionPage() {
    const [step, setStep] = useState<'options' | 'join' | 'create'>('options');
    const [inviteCode, setInviteCode] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [agencyLogo, setAgencyLogo] = useState('');
    const { createAgency, joinAgency, profile } = useHunterStore();
    const router = useRouter();

    const handleJoin = async () => {
        if (!inviteCode) return;
        const res = await joinAgency(inviteCode);
        if (res.success) {
            router.push('/batch3');
        } else {
            alert(res.error || 'Invalid code');
        }
    };

    const handleCreate = async () => {
        if (!agencyName) return;
        try {
            await createAgency(agencyName, agencyLogo || '/placeholder.png');
            router.push('/batch3');
        } catch (error: any) {
            alert(error.message || 'Failed to create agency');
        }
    };

    const handleSolo = async () => {
        // Nameless users join 'Batch 3' by default as Solo
        // We use the known invite code from our migration
        const res = await joinAgency('BATCH3-DEFAULT');
        if (res.success) {
            router.push('/batch3');
        } else {
            console.error('Failed to join default agency:', res.error);
            // Fallback: still push them, but they might get redirected back if logic isn't perfect.
            // But since joinAgency failed, they lack agency_id.
            // We should probably show an error.
            alert('Failed to initialize Nameless path. Please try again.');
        }
    };

    if (step === 'join') {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <img src="/logo.png" alt="NHA Logo" className={styles.logo} />
                    <h2 className={styles.title}>ENTER YOUR FACTION CODE</h2>
                    <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className={styles.input}
                    />
                    <button onClick={handleJoin} className={styles.enterButton}>ENTER</button>
                    <button onClick={() => setStep('options')} className={styles.backButton}>BACK</button>
                </div>
            </main>
        );
    }

    if (step === 'create') {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <h2 className={styles.title}>CREATE FACTION</h2>
                    <div className={styles.logoUpload}>
                        <p>FACTION LOGO</p>
                        <div className={styles.logoPreview}>
                            <img src={agencyLogo || '/logo.png'} alt="Preview" />
                        </div>
                    </div>
                    <div className={styles.field}>
                        <p>FACTION NAME</p>
                        <input
                            type="text"
                            value={agencyName}
                            onChange={(e) => setAgencyName(e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    <button onClick={handleCreate} className={styles.enterButton}>CREATE</button>
                    <button onClick={() => setStep('options')} className={styles.backButton}>BACK</button>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <img src="/logo.png" alt="NHA Logo" className={styles.logo} />
                <h1 className={styles.welcome}>WELCOME TO THE NHA</h1>
                <p className={styles.subtitle}>PLEASE SELECT YOUR ROLE</p>

                <div className={styles.options}>
                    <button className={styles.optionButton} onClick={() => setStep('join')}>
                        <span className={styles.optionTitle}>FREELANCER</span>
                        <span className={styles.optionSub}>ALREADY PART OF A FACTION</span>
                    </button>

                    <button className={styles.optionButton} onClick={() => setStep('create')}>
                        <span className={styles.optionTitle}>CAPTAIN</span>
                        <span className={styles.optionSub}>CREATE YOUR FACTION</span>
                    </button>

                    <button className={styles.optionButton} onClick={handleSolo}>
                        <span className={styles.optionTitle}>NAMELESS</span>
                        <span className={styles.optionSub}>I PREFER TO WORK ALONE</span>
                    </button>
                </div>
            </div>
        </main>
    );
}
