'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHunterStore } from '@/lib/store';
import { ATTRIBUTES } from '@/lib/game-logic';
import Navbar from '@/components/Navbar';
import StatsView from '@/components/StatsView';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './page.module.css';

export default function StatsPage() {
    const { profile, loading, getTheme } = useHunterStore();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !profile) {
            router.push('/');
        }
    }, [loading, profile, router]);

    if (loading || !profile) return <LoadingScreen loading={loading} rank={getTheme()} />;

    return (
        <div className={styles.container}>
            <StatsView profile={profile} />
            <Navbar />
        </div>
    );
}
