'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHunterStore, getDisplayTitle, isDefaultTitle } from '@/lib/store';
import { getLeaderboard, LeaderboardEntry } from '@/lib/leaderboard';
import Navbar from '@/components/Navbar';
import LoadingScreen from '@/components/LoadingScreen';
import { Lock, X } from 'lucide-react';
import styles from './page.module.css';

const ATTRIBUTES = ['Strength', 'Endurance', 'Stamina', 'Speed', 'Agility'];

export default function RankingsPage() {
    const { profile, loading, getOverallRank, getTheme, joinAgency, createAgency } = useHunterStore();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [fetching, setFetching] = useState(true);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [agencyName, setAgencyName] = useState('');

    useEffect(() => {
        if (!loading && !profile) {
            router.push('/');
        }
    }, [loading, profile, router]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setFetching(true);
            const data = await getLeaderboard(activeFilter || undefined, profile?.agencyId);
            setLeaderboard(data);
            setFetching(false);
        };

        if (profile?.agencyId) {
            fetchLeaderboard();
        } else if (profile && !loading) {
            // If no agency (e.g. Solo/Nameless default or error), maybe show global or empty?
            // For now, let's fetch global if no agency or handle gracefully.
            // If Nameless is in 'Batch 3', they have an agencyId.
            fetchLeaderboard();
        }

    }, [activeFilter, profile?.agencyId]);

    const handleJoinAgency = async () => {
        if (!inviteCode) return;
        const res = await joinAgency(inviteCode);
        if (res.success) {
            setShowJoinModal(false);
            router.refresh();
        } else {
            alert(res.error || 'Invalid invite code');
        }
    };

    const handleCreateAgency = async () => {
        if (!agencyName) return;
        try {
            await createAgency(agencyName, '/placeholder.png');
            setShowCreateModal(false);
            router.push('/agency');
        } catch (error: any) {
            alert(error.message || 'Failed to create agency');
        }
    };

    if (loading || !profile) return <LoadingScreen loading={loading} rank={getTheme()} />;

    const isSolo = profile?.role === 'Solo';

    const themeRank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;
    const rankColor = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    return (
        <div className={styles.container} style={{ '--rank-color': rankColor } as React.CSSProperties}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                    {profile.name.toUpperCase()}
                </h1>
                {(() => {
                    const titleName = profile.activeTitle?.name || 'Hunter';
                    const rarity = profile.activeTitle?.rarity || 'Common';
                    const displayTitle = getDisplayTitle(titleName, profile.role);
                    const isDefault = isDefaultTitle(titleName);
                    // If default, use rank color. Else uses rarity color.
                    const titleColor = isDefault ? rankColor : `var(--rarity-${rarity.toLowerCase()})`;

                    return (
                        <p className={styles.pageSubtitle} style={{ color: titleColor, fontWeight: 'bold', fontSize: '1.2rem' }}>
                            {displayTitle.toUpperCase()}
                        </p>
                    );
                })()}
            </div>

            <h2 className={styles.sectionTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                {activeFilter ? `${activeFilter.toUpperCase()} RANKINGS` : 'BATCH 3 RANKINGS'}
            </h2>

            {isSolo ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <Lock size={64} style={{ color: rankColor, marginBottom: '1.5rem' }} />
                    <h3 style={{ color: rankColor, fontSize: '1.5rem', marginBottom: '1rem' }}>RANKINGS RESTRICTED</h3>
                    <p style={{ color: '#aaa', marginBottom: '2rem', maxWidth: '500px' }}>
                        Join or create an agency to access rankings and team features.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={() => setShowJoinModal(true)}
                            style={{
                                padding: '1rem 2.5rem',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                background: `linear-gradient(135deg, ${rankColor}22, ${rankColor}44)`,
                                border: `2px solid ${rankColor}`,
                                color: rankColor,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: `0 0 20px ${rankColor}33`,
                                minWidth: '200px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = rankColor;
                                e.currentTarget.style.color = '#000';
                                e.currentTarget.style.boxShadow = `0 0 30px ${rankColor}`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${rankColor}22, ${rankColor}44)`;
                                e.currentTarget.style.color = rankColor;
                                e.currentTarget.style.boxShadow = `0 0 20px ${rankColor}33`;
                            }}
                        >
                            JOIN AGENCY
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                padding: '1rem 2.5rem',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                background: `linear-gradient(135deg, ${rankColor}22, ${rankColor}44)`,
                                border: `2px solid ${rankColor}`,
                                color: rankColor,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: `0 0 20px ${rankColor}33`,
                                minWidth: '200px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = rankColor;
                                e.currentTarget.style.color = '#000';
                                e.currentTarget.style.boxShadow = `0 0 30px ${rankColor}`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${rankColor}22, ${rankColor}44)`;
                                e.currentTarget.style.color = rankColor;
                                e.currentTarget.style.boxShadow = `0 0 20px ${rankColor}33`;
                            }}
                        >
                            CREATE AGENCY
                        </button>
                    </div>
                </div>
            ) : (
                <>
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
                </>
            )}

            {/* Join Agency Modal */}
            {showJoinModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        padding: '2rem',
                        borderRadius: '8px',
                        border: `2px solid ${rankColor}`,
                        minWidth: '400px',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowJoinModal(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={24} />
                        </button>
                        <h2 style={{ color: rankColor, marginBottom: '1rem' }}>JOIN AGENCY</h2>
                        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Enter your agency invite code</p>
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            placeholder="INVITE CODE"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#0a0a0a',
                                border: `1px solid ${rankColor}`,
                                color: '#fff',
                                borderRadius: '4px',
                                marginBottom: '1rem',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            onClick={handleJoinAgency}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: rankColor,
                                border: 'none',
                                color: '#000',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            JOIN
                        </button>
                    </div>
                </div>
            )}

            {/* Create Agency Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        padding: '2rem',
                        borderRadius: '8px',
                        border: `2px solid ${rankColor}`,
                        minWidth: '400px',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={24} />
                        </button>
                        <h2 style={{ color: rankColor, marginBottom: '1rem' }}>CREATE AGENCY</h2>
                        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Choose a name for your agency</p>
                        <input
                            type="text"
                            value={agencyName}
                            onChange={(e) => setAgencyName(e.target.value)}
                            placeholder="AGENCY NAME"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#0a0a0a',
                                border: `1px solid ${rankColor}`,
                                color: '#fff',
                                borderRadius: '4px',
                                marginBottom: '1rem',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            onClick={handleCreateAgency}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: rankColor,
                                border: 'none',
                                color: '#000',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            CREATE
                        </button>
                    </div>
                </div>
            )}

            <Navbar />
        </div>
    );
}
