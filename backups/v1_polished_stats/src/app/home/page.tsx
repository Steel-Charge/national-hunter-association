'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHunterStore } from '@/lib/store';
import Navbar from '@/components/Navbar';
import ProfileView from '@/components/ProfileView';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './page.module.css';

export default function HomePage() {
    const { profile, loading, getOverallRank, getTheme } = useHunterStore();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !profile) {
            router.push('/');
        }
    }, [loading, profile, router]);

    if (loading || !profile) return <LoadingScreen loading={loading} rank={getTheme()} />;

    const overallRank = getOverallRank();
    const themeRank = getTheme();

    return (
        <div className={styles.container}>
            {/* Background Image */}
            {/* Background handled globally by BackgroundWrapper */}

            <ProfileView
                profile={profile}
                overallRank={overallRank}
                themeRank={themeRank}
            />

            <Navbar />
        </div>
    );
}
