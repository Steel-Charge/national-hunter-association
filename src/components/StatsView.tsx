import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, useHunterStore, Title, canSelfManage, getDisplayTitle, isDefaultTitle } from '@/lib/store';
import { getAttributes, RANK_COLORS, Rank, calculateAttributeRank, calculateOverallRank, calculateOverallPercentage } from '@/lib/game-logic';

import RadarChart from '@/components/RadarChart';
import ProfileFrame from '@/components/ProfileFrame';
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
        const attributes = getAttributes(p.profileType);

        // If this is the special profile, force S rank + 100% for every attribute
        if (p.name === SPECIAL_NAME) {
            return Object.values(attributes).map(attr => ({
                name: attr.name,
                percentage: 100,
                rank: 'S' as Rank,
                tests: attr.tests.map(test => ({ ...test, score: p.testScores[test.name] || 0, percentage: 100 }))
            }));
        }

        const stats = Object.keys(attributes).map(attrName => {
            const attr = attributes[attrName];
            const { percentage, rank } = calculateAttributeRank(attrName, p.testScores, p.profileType);

            const tests = attr.tests.map(test => {
                const score = p.testScores[test.name] || 0;
                let testPercentage = 0;
                if (score > 0) {
                    testPercentage = test.inverse
                        ? Math.min(100, (test.maxScore / score) * 100)
                        : Math.min(100, (score / test.maxScore) * 100);
                }
                return { ...test, score, percentage: testPercentage };
            });

            return {
                name: attrName,
                percentage,
                rank,
                tests
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
    const getProfileOverallRank = (p: UserProfile) => {
        return calculateOverallRank(p.testScores, p.profileType);
    };

    const overallRank = getProfileOverallRank(profile);
    // Theme logic: Use settings theme if available, otherwise calculated rank
    // For the special binary profile, force the theme/rank to 'S'
    const themeRank = isSpecialProfile ? 'S' : (profile.settings.theme || overallRank);
    // If a rarity-based special theme is selected, prefer that for UI variables
    const specialTheme = (profile.settings && (profile.settings as any).specialTheme) || null;

    const rankColor = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    // Viewer Theme Logic for Comparison
    const viewerOverallRank = viewerProfile ? getProfileOverallRank(viewerProfile) : 'E';
    const viewerThemeRank = viewerProfile?.settings.theme || viewerOverallRank;
    // Use the hex color for the viewer (logged-in hunter) so canvas paints correctly
    let viewerRankColor = RANK_COLORS[viewerThemeRank as Rank] || '#ffffff';

    // Exception Theme: If ranks match, use special cyan color used elsewhere
    if (themeRank === viewerThemeRank) {
        viewerRankColor = '#3abbbd';
    }

    // Determine if editing is allowed
    // Users who can self-manage (admin/solo/captain) can edit any profile they're viewing
    // Regular hunters can only edit their own profile BUT need approval (request system)
    const isOwnProfile = viewerProfile?.id === profile.id;
    const canManageStats = isOwnProfile ? canSelfManage(viewerProfile) : (isReadOnly && canSelfManage(viewerProfile));
    const canEdit = isOwnProfile || (isReadOnly && canSelfManage(viewerProfile));

    const [pendingChanges, setPendingChanges] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statRequests, setStatRequests] = useState<any[]>([]);

    const { getPendingStatRequests, approveStatRequest, denyStatRequest, requestStatUpdate } = useHunterStore();

    useEffect(() => {
        const fetchRequests = async () => {
            // Fetch requests if viewer is admin/captain OR if viewing own profile
            if (canManageStats) {
                const requests = await getPendingStatRequests(profile.name);
                setStatRequests(requests || []);
            }
        };
        fetchRequests();
    }, [canManageStats, profile.name, getPendingStatRequests]);

    const handleScoreChange = (testName: string, value: string) => {
        if (!canEdit) return;
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            // For own profile, use local pending state
            if (isOwnProfile) {
                setPendingChanges(prev => ({ ...prev, [testName]: numValue }));
            }
        }
    };

    const handleAdminSave = async () => {
        setIsSubmitting(true);
        const { updateScore } = useHunterStore.getState();
        try {
            for (const [statName, newValue] of Object.entries(pendingChanges)) {
                await updateScore(statName, newValue);
            }
            setPendingChanges({});
            alert('Stats saved successfully.');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Save failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitRequest = async () => {
        setIsSubmitting(true);
        const { requestStatUpdate } = useHunterStore.getState();

        try {
            for (const [statName, newValue] of Object.entries(pendingChanges)) {
                const oldValue = profile.testScores[statName] || 0;
                await requestStatUpdate(statName, newValue, oldValue);
            }

            // Refresh requests immediately
            const requests = await getPendingStatRequests(profile.name);
            setStatRequests(requests || []);

            setPendingChanges({});
            alert('Stat update requests sent for approval.');
        } catch (error) {
            console.error('Request failed:', error);
            alert('Request failed. Please try again.');
        } finally {
            setIsSubmitting(false);
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

    // Map rarity names to hex values (matches CSS vars in globals.css)
    const RARITY_COLORS: Record<string, string> = {
        rare: '#cd7f32',
        epic: '#c0c0c0',
        legendary: '#ffd700',
        mythic: '#ff2a57',
        common: '#00e5ff'
    };

    // Determine hex to pass to chart and CSS var fallback
    const rankHexForChart = specialTheme ? (RARITY_COLORS[specialTheme] || RANK_COLORS[themeRank as Rank]) : (RANK_COLORS[themeRank as Rank] || '#ffffff');

    return (
        <div className={`${styles.container} ${isSpecialProfile ? styles.glitchTheme : ''}`} style={{ '--rank-color': rankColor, '--rank-hex': rankHexForChart } as React.CSSProperties}>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
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
                            <p className={styles.pageSubtitle} style={{ color: titleColor, fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {displayTitle.toUpperCase()}
                            </p>
                        );
                    })()}
                </div>
                {viewerProfile && !isOwnProfile && (
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

                        const formatValue = (val: number, name: string) => {
                            if (name === 'Plank Hold' && val < 1 && val > 0) {
                                return `${Math.round(val * 100)}sec`;
                            }
                            return val.toString();
                        };

                        const formattedScore = formatValue(currentScore, test.name);
                        const formattedViewerScore = formatValue(viewerScore, test.name);

                        const displayText = `${formattedScore} / ${test.maxScore}`;

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
                                                ({formattedViewerScore})
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

                                {isOwnProfile && (
                                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input
                                            type="number"
                                            value={pendingChanges[test.name] ?? currentScore}
                                            onChange={(e) => handleScoreChange(test.name, e.target.value)}
                                            style={{
                                                backgroundColor: 'rgba(0,0,0,0.5)',
                                                border: `1px solid ${rankColor}40`,
                                                color: '#fff',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                width: '100px',
                                                fontSize: '1rem',
                                                fontFamily: 'inherit'
                                            }}
                                            min="0"
                                            step={test.name === 'Plank Hold' ? '0.01' : '1'}
                                        />
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            {statRequests.some(r => r.stat_name === test.name) && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    color: '#facc15',
                                                    border: `1px solid #facc15`,
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    PENDING
                                                </span>
                                            )}
                                            {pendingChanges[test.name] !== undefined && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    color: rankColor,
                                                    border: `1px solid ${rankColor}`,
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    MODIFIED
                                                </span>
                                            )}
                                            {pendingChanges[test.name] === undefined && !statRequests.some(r => r.stat_name === test.name) && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    color: rankColor + '80',
                                                    border: `1px solid ${rankColor}40`,
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    REQUEST CHANGE
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {pendingChanges[test.name] !== undefined && (
                                    <div style={{ fontSize: '0.8rem', color: rankColor, marginTop: '5px', textAlign: 'left', opacity: 0.8 }}>
                                        Current: {currentScore} → Proposed: {pendingChanges[test.name]}
                                    </div>
                                )}
                                {pendingChanges[test.name] === undefined && statRequests.find(r => r.stat_name === test.name) && (
                                    <div style={{ fontSize: '0.8rem', color: '#facc15', marginTop: '5px', textAlign: 'left', opacity: 0.8 }}>
                                        Sent: {currentScore} → Awaiting: {statRequests.find(r => r.stat_name === test.name).new_value}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {Object.keys(pendingChanges).length > 0 && isOwnProfile && (
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <button
                            onClick={canManageStats ? handleAdminSave : submitRequest}
                            disabled={isSubmitting}
                            className={styles.submitBtn}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: rankColor,
                                color: '#000',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                boxShadow: `0 0 15px ${rankColor}`
                            }}
                        >
                            {isSubmitting
                                ? (canManageStats ? 'SAVING...' : 'SENDING REQUEST...')
                                : (canManageStats ? 'SAVE CHANGES' : 'REQUEST STAT UPDATE')
                            }
                        </button>
                    </div>
                )}

                {canManageStats && statRequests.length > 0 && (
                    <div style={{ marginTop: '20px', borderTop: `1px solid ${rankColor}40`, paddingTop: '20px' }}>
                        <h3 style={{ color: rankColor, marginBottom: '15px', fontSize: '1rem' }}>PENDING STAT REQUESTS</h3>
                        {statRequests.map((req) => (
                            <div key={req.id} style={{
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                padding: '15px',
                                borderRadius: '8px',
                                marginBottom: '10px',
                                border: `1px solid ${rankColor}20`
                            }}>
                                <div className="flex-between" style={{ marginBottom: '10px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{req.stat_name}</span>
                                    <span>{req.old_value} → {req.new_value}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={async () => {
                                            await approveStatRequest(req.id);
                                            setStatRequests(prev => prev.filter(r => r.id !== req.id));
                                            if (onScoreUpdate) onScoreUpdate(req.stat_name, req.new_value);
                                        }}
                                        style={{ flex: 1, padding: '8px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        APPROVE
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await denyStatRequest(req.id);
                                            setStatRequests(prev => prev.filter(r => r.id !== req.id));
                                        }}
                                        style={{ flex: 1, padding: '8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        DENY
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
