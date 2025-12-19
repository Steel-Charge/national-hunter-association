import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, useHunterStore } from '@/lib/store';
import { getAttributes, RANK_COLORS, Rank } from '@/lib/game-logic';

import RadarChart from '@/components/RadarChart';
import styles from '@/app/stats/page.module.css';

interface StatsViewProps {
    profile: UserProfile;
    isReadOnly?: boolean;
    viewerProfile?: UserProfile | null;
    onScoreUpdate?: (testName: string, value: number) => void;
}

export default function StatsView({
    profile,
    isReadOnly = false,
    viewerProfile = null,
    onScoreUpdate
}: StatsViewProps) {
    const { updateScore, logout } = useHunterStore();
    const [activeTab, setActiveTab] = useState<string>('Strength');
    const [isComparing, setIsComparing] = useState(false);
    const router = useRouter();

    // Special binary identity handling
    const SPECIAL_NAME =
        "01010100 01101000 01100101 00100000 01100101 01101110 01100100 00100000 01101001 01100110 00100000 01110111 01100101 00100000 01100110 01100001 01101001 01101100 00101110 00101110 00101110";
    const REPLACEMENT_NAME =
        "00101110 00101110 00101110 01100010 01100101 00100000 01110100 01101000 01100101 00100000 01101111 01101110 01100101 00100000 01110100 01101111 00100000 01100011 01101000 01100001 01101110 01100111 01100101 00100000 01101001 01110100 00001010 00101101 01111010 01100101 01110010 01101111";

    const isSpecialProfile = profile.name === SPECIAL_NAME;
    const [glitchActive, setGlitchActive] = useState(false);
    const [glitchedName, setGlitchedName] = useState('');

    // Helper: compute stats for any profile
    const getProfileStats = (p: UserProfile) => {
        const attributes = getAttributes(p.profileType);

        if (p.name === SPECIAL_NAME) {
            return Object.values(attributes).map(attr => ({
                name: attr.name,
                percentage: 100,
                rank: 'S',
                tests: attr.tests.map(test => ({
                    ...test,
                    score: p.testScores[test.name] || 0,
                    percentage: 100
                }))
            }));
        }

        return Object.values(attributes).map(attr => {
            const tests = attr.tests.map(test => {
                const score = p.testScores[test.name] || 0;
                const percentage =
                    score > 0
                        ? test.inverse
                            ? Math.min(100, (test.maxScore / score) * 100)
                            : Math.min(100, (score / test.maxScore) * 100)
                        : 0;

                return { ...test, score, percentage };
            });

            const avg =
                tests.reduce((a, b) => a + b.percentage, 0) / tests.length;

            let rank: Rank = 'E';
            if (avg >= 90) rank = 'S';
            else if (avg >= 80) rank = 'A';
            else if (avg >= 60) rank = 'B';
            else if (avg >= 40) rank = 'C';
            else if (avg >= 20) rank = 'D';

            return { name: attr.name, percentage: avg, rank, tests };
        });
    };

    const stats = getProfileStats(profile);
    const viewerStats = viewerProfile ? getProfileStats(viewerProfile) : null;

    const radarData = stats.map(s => s.percentage);
    const radarLabels = stats.map(s => s.name.substring(0, 3).toUpperCase());
    const comparisonData =
        isComparing && viewerStats
            ? viewerStats.map(s => s.percentage)
            : undefined;

    const currentStat =
        stats.find(s => s.name === activeTab) || stats[0];
    const attributes = getAttributes(profile.profileType);
    const currentAttr = attributes[currentStat.name];
    const currentViewerStat =
        viewerStats?.find(s => s.name === activeTab);

    const getOverallRank = (s: any[]) => {
        const avg = s.reduce((a, b) => a + b.percentage, 0) / s.length;
        if (avg >= 90) return 'S';
        if (avg >= 80) return 'A';
        if (avg >= 60) return 'B';
        if (avg >= 40) return 'C';
        if (avg >= 20) return 'D';
        return 'E';
    };

    const overallRank = getOverallRank(stats);
    const themeRank = isSpecialProfile
        ? 'S'
        : profile.settings.theme || overallRank;

    const specialTheme =
        (profile.settings && (profile.settings as any).specialTheme) || null;

    const rankColor = specialTheme
        ? `var(--rarity-${specialTheme})`
        : `var(--rank-${themeRank.toLowerCase()})`;

    const RARITY_COLORS: Record<string, string> = {
        rare: '#cd7f32',
        epic: '#c0c0c0',
        legendary: '#ffd700',
        mythic: '#ff2a57',
        common: '#00e5ff'
    };

    const rankHexForChart =
        specialTheme
            ? RARITY_COLORS[specialTheme] || RANK_COLORS[themeRank as Rank]
            : RANK_COLORS[themeRank as Rank] || '#ffffff';

    let viewerRankColor =
        RANK_COLORS[
            (viewerProfile?.settings.theme ||
                (viewerStats ? getOverallRank(viewerStats) : 'E')) as Rank
        ] || '#ffffff';

    if (themeRank === viewerProfile?.settings.theme) {
        viewerRankColor = '#3abbbd';
    }

    const canEdit =
        (!isReadOnly && profile.settings.statsCalculator) ||
        (isReadOnly && viewerProfile?.isAdmin);

    const handleScoreChange = (test: string, value: string) => {
        if (!canEdit) return;
        const num = parseFloat(value);
        if (!isNaN(num)) {
            updateScore(test, num, isReadOnly ? profile.name : undefined);
            onScoreUpdate?.(test, num);
        }
    };

    const handleCompareClick = () => {
        if (isSpecialProfile && viewerProfile) {
            logout();
            setGlitchedName(REPLACEMENT_NAME);
            setGlitchActive(true);
            setTimeout(() => {
                setGlitchActive(false);
                router.push('/');
            }, 3500);
            return;
        }
        setIsComparing(v => !v);
    };

    return (
        <div
            className={`${styles.container} ${isSpecialProfile ? styles.glitchTheme : ''}`}
            style={{ '--rank-color': rankColor, '--rank-hex': rankHexForChart } as React.CSSProperties}
        >
            {/* HEADER */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>{profile.name.toUpperCase()}</h1>
                    <p className={styles.pageSubtitle}>
                        {profile.activeTitle?.name || 'HUNTER'}
                    </p>
                </div>
                {viewerProfile && (
                    <button onClick={handleCompareClick}>
                        {isComparing ? 'STOP' : 'COMPARE'}
                    </button>
                )}
            </div>

            {/* RADAR */}
            <RadarChart
                labels={radarLabels}
                data={radarData}
                rankColor={rankHexForChart}
                comparisonData={comparisonData}
                comparisonColor={viewerRankColor}
            />

            {/* DETAILS */}
            <div className={styles.detailsContainer}>
                {currentAttr.tests.map(test => {
                    const currentTest =
                        currentStat.tests.find(t => t.name === test.name);
                    const score = currentTest?.score || 0;
                    const pct = currentTest?.percentage || 0;

                    return (
                        <div key={test.name}>
                            <label>{test.name}</label>
                            <input
                                type="number"
                                value={score || ''}
                                disabled={!canEdit}
                                onChange={e =>
                                    handleScoreChange(test.name, e.target.value)
                                }
                            />
                            <div style={{ width: `${pct}%` }} />
                        </div>
                    );
                })}
            </div>

            {glitchActive && (
                <div className={styles.glitchOverlay}>
                    <pre>{glitchedName}</pre>
                    <p>You have been disconnected.</p>
                </div>
            )}
        </div>
    );
}
