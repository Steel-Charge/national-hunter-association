'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHunterStore } from '@/lib/store';
import { getLeaderboard, LeaderboardEntry } from '@/lib/leaderboard';
import Navbar from '@/components/Navbar';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './page.module.css';

const ATTRIBUTES = ['Strength', 'Endurance', 'Stamina', 'Speed', 'Agility'];

export default function RankingsPage() {
    const { profile, loading, getOverallRank, getTheme } = useHunterStore();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && !profile) {
            router.push('/');
        }
    }, [loading, profile, router]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setFetching(true);
            const data = await getLeaderboard(activeFilter || undefined);
            setLeaderboard(data);
            setFetching(false);
        };

        fetchLeaderboard();
    }, [activeFilter]);

    if (loading || !profile) return <LoadingScreen loading={loading} rank={getTheme()} />;

    const themeRank = getTheme();
    const rankColor = `var(--rank-${themeRank.toLowerCase()})`;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                    {profile.name.toUpperCase()}
                </h1>
                <p className={styles.pageSubtitle} style={{ color: `var(--rarity-${profile.activeTitle?.rarity?.toLowerCase() || 'common'})`, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {profile.activeTitle?.name || 'HUNTER'}
                </p>
            </div>

            <h2 className={styles.sectionTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                {activeFilter ? `${activeFilter.toUpperCase()} RANKINGS` : 'BATCH 3 RANKINGS'}
            </h2>

            <div className={styles.filters}>
                {ATTRIBUTES.map((attr) => (
                    <button
                        key={attr}
                        className={`${styles.filterBtn} ${activeFilter === attr ? styles.activeFilter : ''}`}
                        onClick={() => setActiveFilter(activeFilter === attr ? null : attr)}
                        style={activeFilter === attr ? {
                            backgroundColor: rankColor,
                            borderColor: rankColor,
                            boxShadow: `0 0 15px ${rankColor}`
                        } : {
                            borderColor: rankColor,
                            color: rankColor
                        }}
                    >
                        {attr.substring(0, 3).toUpperCase()}
                    </button>
                ))}
            </div>

            <div className={styles.tableHeader} style={{ color: rankColor, textShadow: `0 0 5px ${rankColor}` }}>
                <span className={styles.colLeft}>Players</span>
                <span>Rank</span>
                <span>Score</span>
            </div>

            <div className={styles.rankList}>
                {fetching ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
                ) : (
                    leaderboard.map((entry, index) => (
                        <div
                            key={entry.name}
                            className={`${styles.rankItem} ${index === 0 ? styles.top1 : ''} ${index === 1 ? styles.top2 : ''} ${index === 2 ? styles.top3 : ''}`}
                            style={{ borderColor: index < 3 ? 'transparent' : `${rankColor}33` }}
                        >
                            <div className={styles.playerName}>
                                <span className={styles.rankNumber}>{index + 1}.</span>
                                {entry.name}
                            </div>
                            <div className={`${styles.playerRank} ${styles[`rank${entry.rank}`]}`}>
                                {entry.rank}
                            </div>
                            <div className={styles.playerScore} style={{ color: index < 3 ? '#fff' : rankColor }}>
                                {entry.score}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Navbar />
        </div>
    );
}
