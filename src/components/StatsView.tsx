import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, useHunterStore } from '@/lib/store';
import { getAttributes, RANK_COLORS, Rank } from '@/lib/game-logic';

import RadarChart from '@/components/RadarChart';
import styles from '@/app/stats/page.module.css';

interface StatsViewProps {
    profile: UserProfile;
    isReadOnly?: boolean;
    viewerProfile?: UserProfile | null; // For comparison
    onScoreUpdate?: (testName: string, value: number) => void; // Callback for local state updates
}

export default function StatsView({ profile, isReadOnly = false, viewerProfile = null, onScoreUpdate }: StatsViewProps) {
    const { updateScore, getTheme, getStats, logout } = useHunterStore();
    const [activeTab, setActiveTab] = useState<string>('Strength');
    const [isComparing, setIsComparing] = useState(false);
    const router = useRouter();

    // Special binary identity handling (local-only effects)
    const SPECIAL_NAME = "01010100 01101000 01100101 00100000 01100101 01101110 01100100 00100000 01101001 01100110 00100000 01110111 01100101 00100000 01100110 01100001 01101001 01101100 00101110 00101110 00101110";
    const REPLACEMENT_NAME = "00101110 00101110 00101110 01100010 01100101 00100000 01110100 01101000 01100101 00100000 01101111 01101110 01100101 00100000 01110100 01101111 00100000 01100011 01101000 01100001 01101110 01100111 01100101 00100000 01101001 01110100 00001010 00101101 01111010 01100101 01110010 01101111";
    const isSpecialProfile = profile.name === SPECIAL_NAME;

    const [glitchActive, setGlitchActive] = useState(false);
    const [glitchedName, setGlitchedName] = useState('');

    // Helper to get stats for any profile
    const getProfileStats = (p: UserProfile) => {
        // We need to use the store's getStats logic but applied to a specific profile
        // Since getStats in store uses get().profile, we can't use it directly for 'p' if p != store.profile
        // So we replicate the logic here or assume p has correct structure.
        // Actually, getStats in store derives stats from p.testScores.
        // Let's replicate the logic briefly or export a helper from store/game-logic.
        // For now, let's just use the store's getStats if p is the current profile, 
        // OR replicate the calculation.
        // Replicating is safer for "viewing other profiles".

        const attributes = getAttributes(p.profileType);
        // If this is the special profile, force S rank + 100% for every attribute
        if (p.name === SPECIAL_NAME) {
            return Object.values(attributes).map(attr => ({
                name: attr.name,
                percentage: 100,
                rank: 'S',
                tests: attr.tests.map(test => ({ ...test, score: p.testScores[test.name] || 0, percentage: 100 }))
            }));
        }

        const stats = Object.values(attributes).map(attr => {
            const attrScores = attr.tests.map(test => {
                const score = p.testScores[test.name] || 0;
                let percentage = 0;
                if (score > 0) {
                    percentage = test.inverse
                        ? Math.min(100, (test.maxScore / score) * 100)
                        : Math.min(100, (score / test.maxScore) * 100);
                }
                return { ...test, score, percentage };
            });

            const totalPercentage = attrScores.reduce((acc, curr) => acc + curr.percentage, 0);
            const averagePercentage = totalPercentage / attr.tests.length;

            // Calculate Rank
            let rank = 'E';
            if (averagePercentage >= 90) rank = 'S';
            else if (averagePercentage >= 80) rank = 'A';
            else if (averagePercentage >= 60) rank = 'B';
            else if (averagePercentage >= 40) rank = 'C';
            else if (averagePercentage >= 20) rank = 'D';

            return {
                name: attr.name,
                percentage: averagePercentage,
                rank,
                tests: attrScores
            };
        });
        return stats;
    };

    const stats = getProfileStats(profile);
    const viewerStats = viewerProfile ? getProfileStats(viewerProfile) : null;

    const radarData = stats.map(s => s.percentage);
    const radarLabels = stats.map(s => s.name.substring(0, 3).toUpperCase());

    // Comparison Data
    const comparisonData = isComparing && viewerStats ? viewerStats.map(s => s.percentage) : undefined;

    const currentStat = stats.find(s => s.name === activeTab) || stats[0];
    const attributes = getAttributes(profile.profileType);
    const currentAttr = attributes[currentStat.name];

    // Viewer stat for comparison in the details view
    const currentViewerStat = viewerStats?.find(s => s.name === activeTab);

    // Theme is based on the profile being VIEWED, not the viewer (usually)
    // But store.getTheme() uses the logged-in user. 
    // We should probably compute theme for the viewed profile.
    // Let's assume we want to show the theme of the person we are looking at.
    const getProfileOverallRank = (s: any[]) => {
        const total = s.reduce((acc, curr) => acc + curr.percentage, 0);
        const avg = total / s.length;
        if (avg >= 90) return 'S';
        if (avg >= 80) return 'A';
        if (avg >= 60) return 'B';
        if (avg >= 40) return 'C';
        if (avg >= 20) return 'D';
        return 'E';
    };

    const overallRank = getProfileOverallRank(stats);
    // Theme logic: Use settings theme if available, otherwise calculated rank
    // For the special binary profile, force the theme/rank to 'S'
    const themeRank = isSpecialProfile ? 'S' : (profile.settings.theme || overallRank);
    const rankColor = `var(--rank-${themeRank.toLowerCase()})`;

    // Viewer Theme Logic for Comparison
    const viewerOverallRank = viewerStats ? getProfileOverallRank(viewerStats) : 'E';
    const viewerThemeRank = viewerProfile?.settings.theme || viewerOverallRank;
    // Use the hex color for the viewer (logged-in hunter) so canvas paints correctly
    let viewerRankColor = RANK_COLORS[viewerThemeRank as Rank] || '#ffffff';

    // Exception Theme: If ranks match, use special cyan color used elsewhere
    if (themeRank === viewerThemeRank) {
        viewerRankColor = '#3abbbd';
    }

    // Determine if editing is allowed
    // Can edit if:
    // 1. Viewing own profile AND statsCalculator is enabled
    // 2. Admin viewing someone else's profile
    const canEdit = (!isReadOnly && profile.settings.statsCalculator) || (isReadOnly && viewerProfile?.isAdmin);

    const handleScoreChange = (testName: string, value: string) => {
        if (!canEdit) return;
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            // If admin is editing someone else's profile, pass the target name
            const targetName = isReadOnly ? profile.name : undefined;
            updateScore(testName, numValue, targetName);

            // Call callback to update local state (for admin editing)
            if (onScoreUpdate) {
                onScoreUpdate(testName, numValue);
            }
        }
    };

    const handleCompareClick = () => {
        // If viewing the special profile and a viewer is logged in, trigger the local-only glitch effect
        if (isSpecialProfile && viewerProfile) {
            // Log out the viewer and show a transient overlay with the replacement binary name
            logout();
            setGlitchedName(REPLACEMENT_NAME);
            setGlitchActive(true);
            setTimeout(() => {
                setGlitchActive(false);
                router.push('/');
            }, 3500);
            return;
        }

        setIsComparing(!isComparing);
    };

    return (
        <div className={`${styles.container} ${isSpecialProfile ? styles.glitchTheme : ''}`} style={{ '--rank-color': rankColor, '--rank-hex': RANK_COLORS[themeRank as Rank] } as React.CSSProperties}>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className={styles.pageTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                        {profile.name.toUpperCase()}
                    </h1>
                    <p className={styles.pageSubtitle} style={{ color: `var(--rarity-${profile.activeTitle?.rarity?.toLowerCase() || 'common'})`, fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {profile.activeTitle?.name || 'HUNTER'}
                    </p>
                </div>
                {viewerProfile && (
                    <div style={{ marginRight: isReadOnly ? '60px' : '0', marginTop: '5px' }}>
                        <button
                            onClick={handleCompareClick}
                            style={{
                                background: 'transparent',
                                border: `2px solid ${rankColor}`,
                                color: rankColor,
                                padding: '5px 15px',
                                borderRadius: '20px',
                                fontFamily: 'scribble, sans-serif',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transform: 'rotate(-2deg)',
                                fontWeight: 'bold',
                                boxShadow: `0 0 5px ${rankColor}40`
                            }}
                        >
                            {isComparing ? 'STOP' : 'COMPARE'}
                        </button>
                    </div>
                )}
            </div>

            {/* Radar Chart Section */}
            <div className={styles.chartContainer} style={{ position: 'relative' }}>
                <RadarChart
                    labels={radarLabels}
                    data={radarData}
                    rankColor={RANK_COLORS[themeRank as Rank]}
                    comparisonData={comparisonData}
                    comparisonColor={viewerRankColor}
                />


            </div>

            {/* Attribute Tabs */}
            <div className={styles.tabs} style={{ borderColor: rankColor }}>
                {stats.map((stat) => (
                    <button
                        key={stat.name}
                        className={`${styles.tab} ${activeTab === stat.name ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(stat.name)}
                        style={activeTab === stat.name ? {
                            backgroundColor: rankColor,
                            color: '#000',
                            boxShadow: `0 0 10px ${rankColor}`
                        } : {}}
                    >
                        {stat.name.substring(0, 3).toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Active Attribute Details */}
            <div className={styles.detailsContainer}>
                <div className={styles.attrHeader}>
                    <h2 className={styles.attrTitle} style={{ color: rankColor }}>{currentStat.name}</h2>
                    <div className={styles.rankDisplay}>
                        <span className={styles.rankLabel} style={{ color: rankColor }}>Current Rank:</span>
                        <span className={`rank-${currentStat.rank} rank-text ${styles.rankValue}`}>
                            {currentStat.rank}
                        </span>
                    </div>
                </div>

                <div className={styles.testList}>
                    {currentAttr.tests.map((test, index) => {
                        // Current profile score (the one being viewed)
                        const currentTest = currentStat.tests.find(t => t.name === test.name);
                        const currentScore = currentTest?.score || 0;
                        const progress = currentTest?.percentage || 0;

                        // Viewer score (the logged in user)
                        const viewerTest = currentViewerStat?.tests.find(t => t.name === test.name);
                        const viewerScore = viewerTest?.score || 0;

                        const displayText = test.inverse
                            ? `${test.maxScore} / ${currentScore}`
                            : `${currentScore} / ${test.maxScore}`;

                        return (
                            <div key={test.name} className={styles.testItem}>
                                <div className="flex-between">
                                    <label className={styles.testLabel}>{test.name} [{test.unit}]</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className={styles.testValue} style={{ color: rankColor }}>
                                            {isSpecialProfile && currentScore === 0 ? '???' : displayText}
                                        </span>
                                        {/* Comparison Score in Brackets */}
                                        {isComparing && viewerProfile && (
                                            <span style={{ color: viewerRankColor, fontFamily: 'scribble, sans-serif', fontSize: '1.1rem', transform: 'rotate(-5deg)' }}>
                                                ({viewerScore})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.progressBarBg}>
                                    <div
                                        className={styles.progressBarFill}
                                        style={{
                                            width: `${isSpecialProfile ? 100 : progress}%`,
                                            backgroundColor: rankColor,
                                            boxShadow: `0 0 10px ${rankColor}`
                                        }}
                                    />
                                </div>

                                <input
                                    type="number"
                                    value={currentScore || ''}
                                    onChange={(e) => handleScoreChange(test.name, e.target.value)}
                                    className={styles.hiddenInput}
                                    placeholder={canEdit ? "Update..." : "Locked"}
                                    disabled={!canEdit}
                                    style={!canEdit ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            {glitchActive && (
                <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, pointerEvents: 'none' }}>
                    <div style={{ padding: '36px', borderRadius: '8px', background: 'rgba(0,0,0,0.9)', color: '#0ff', fontWeight: 900, fontSize: '1.1rem', textAlign: 'center', boxShadow: '0 0 30px #0ff' }}>
                        <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{glitchedName}</div>
                        <div style={{ marginTop: '8px', color: '#fff', fontSize: '0.9rem' }}>You have been disconnected.</div>
                    </div>
                </div>
            )}
        </div>
    );
}
