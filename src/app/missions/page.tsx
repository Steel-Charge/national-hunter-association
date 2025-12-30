'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useHunterStore, canSelfManage } from '@/lib/store';
import { MISSION_PATHS, MissionPath, Quest } from '@/lib/missions';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './page.module.css';

export default function MissionsPage() {
    const { profile, claimQuest, requestTitle, getPendingRequests, getTheme, toggleTrackQuest } = useHunterStore();
    const [selectedPath, setSelectedPath] = useState<MissionPath>(MISSION_PATHS[0]);
    const [pendingRequests, setPendingRequests] = useState<string[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isFilterMode, setIsFilterMode] = useState(false);
    const [selectedEventQuest, setSelectedEventQuest] = useState<Quest | null>({
        id: 'event_debut',
        name: 'Debut',
        description: 'Update your Profile Image dressed up as your Hunter',
        reward: { name: 'Rising star', rarity: 'Event' }
    });

    // START: Challenge Data
    const CHALLENGE_QUESTS: Quest[] = [
        {
            id: 'challenge_immovable',
            name: 'Immovable',
            description: 'Hold a Plank for 15 minutes or more',
            reward: { name: 'Immovable', rarity: 'Challenge' }
        }
    ];
    const [selectedChallengeQuest, setSelectedChallengeQuest] = useState<Quest | null>(CHALLENGE_QUESTS[0]);

    // Filter State
    type FilterType = 'all' | 'active' | 'event' | 'challenges' | 'completed';
    const [filter, setFilter] = useState<FilterType>('all');
    // END: Challenge Data

    useEffect(() => {
        const fetchPendingRequests = async () => {
            const requests = await getPendingRequests();
            setPendingRequests(requests);
        };
        if (profile) {
            fetchPendingRequests();
        }
    }, [profile, getPendingRequests]);

    if (!profile) {
        return <LoadingScreen loading={true} rank={getTheme()} />;
    }

    const isQuestCompleted = (questId: string) => {
        return profile.completedQuests.includes(questId);
    };

    const isQuestTracked = (questId: string) => {
        return profile.trackedQuests?.includes(questId);
    };

    const canClaimMythic = (path: MissionPath) => {
        const regularQuests = path.quests.slice(0, 3);
        return regularQuests.every(q => isQuestCompleted(q.id));
    };

    const isQuestLocked = (questId: string, path: MissionPath) => {
        const questIndex = path.quests.findIndex(q => q.id === questId);
        if (questIndex <= 0) return false; // First quest or not found is never locked by path

        // Check all previous quests in the path
        for (let i = 0; i < questIndex; i++) {
            if (!isQuestCompleted(path.quests[i].id)) return true;
        }
        return false;
    };

    const handleClaimQuest = async (quest: Quest) => {
        if (isQuestLocked(quest.id, selectedPath)) {
            alert('Complete previous missions in this path first!');
            return;
        }

        if (quest.reward.rarity === 'Mythic') {
            if (!canClaimMythic(selectedPath)) {
                alert('Complete all previous quests first!');
                return;
            }
        }

        if (canSelfManage(profile)) {
            await claimQuest(quest.id, quest.reward);
        } else {
            await requestTitle(quest.id, quest.reward);
            const requests = await getPendingRequests();
            setPendingRequests(requests);
        }
    };

    const getPathProgress = (path: MissionPath) => {
        const completed = path.quests.filter(q => isQuestCompleted(q.id)).length;
        return `${completed}/${path.quests.length}`;
    };

    const getRarityColor = (rarity: string) => {
        return `var(--rarity-${rarity.toLowerCase()})`;
    };

    const getTrackedQuest = (index: number) => {
        const id = profile.trackedQuests?.[index];
        if (!id) return null;

        // Find quest in all paths
        for (const path of MISSION_PATHS) {
            const quest = path.quests.find(q => q.id === id);
            if (quest) return { ...quest, pathName: path.name.replace('Path of the ', ''), pathObject: path };
        }
        return null;
    };

    const handleToggleTrack = async (questId: string) => {
        if (!isQuestTracked(questId) && isQuestLocked(questId, selectedPath)) {
            alert('Complete previous missions in this path first!');
            return;
        }

        const wasTracked = isQuestTracked(questId);
        await toggleTrackQuest(questId);
        // Only auto-close if we just ADDED a new mission
        if (isSelecting && !wasTracked) {
            setIsSelecting(false);
        }
    };

    const handleSlotClick = (i: number) => {
        const tracked = getTrackedQuest(i);
        if (tracked) {
            // Find path and open it in FILTER mode
            setSelectedPath(tracked.pathObject as MissionPath);
            setIsFilterMode(true);
            setIsSelecting(true);
        } else {
            // Open full picker
            setIsFilterMode(false);
            setIsSelecting(true);
        }
    };

    const currentPathTrackedQuestId = selectedPath.quests.find(q => isQuestTracked(q.id))?.id;

    const themeRank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;
    const rankColorVar = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    const completedQuests = profile.completedQuests.map(id => {
        for (const path of MISSION_PATHS) {
            const q = path.quests.find(quest => quest.id === id);
            if (q) return q;
        }
        if (id === 'event_debut') return { id: 'event_debut', name: 'Debut', reward: { name: 'Rising star', rarity: 'Event' } } as Quest;
        // Check challenges
        const challenge = CHALLENGE_QUESTS.find(q => q.id === id);
        if (challenge) return challenge;

        return null;
    }).filter((q): q is Quest => q !== null);

    return (
        <div className={styles.container} style={{ '--rank-color': rankColorVar } as React.CSSProperties}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.pageTitle}>MISSIONS</h1>
                        <p className={styles.subtitle}>Complete quests to unlock Titles</p>
                    </div>

                    {/* Filter Controls */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {(['all', 'active', 'event', 'challenges', 'completed'] as FilterType[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => {
                                    setFilter(f);
                                    if (f !== 'all') setIsSelecting(false); // Close selection if filtering
                                }}
                                style={{
                                    background: filter === f ? rankColorVar : 'rgba(255, 255, 255, 0.1)',
                                    color: filter === f ? '#000' : '#fff',
                                    border: `1px solid ${filter === f ? rankColorVar : 'rgba(255, 255, 255, 0.2)'}`,
                                    padding: '5px 15px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ACTIVE Section */}
                {(filter === 'all' || filter === 'active') && (
                    <>
                        <h2 className={styles.sectionHeader}>ACTIVE</h2>
                        <div className={styles.activeSlots}>
                            {[0, 1, 2].map(i => {
                                const tracked = getTrackedQuest(i);
                                return (
                                    <div key={i} className={styles.slot} onClick={() => handleSlotClick(i)}>
                                        {tracked ? (
                                            <div className={styles.slotContent} style={{ textAlign: 'center' }}>
                                                <div className={styles.slotName} style={{ fontSize: '0.8rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>{tracked.name}</div>
                                                <div className={styles.slotPath} style={{ fontSize: '0.6rem', color: 'var(--rank-color)', fontWeight: '800' }}>{tracked.pathName}</div>
                                            </div>
                                        ) : (
                                            <span className={styles.slotPlus}>+</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* EVENT Section */}
                {!isSelecting && (filter === 'all' || filter === 'event') && (
                    <div style={{ marginTop: '40px' }}>
                        <h2 className={styles.sectionHeader}>EVENT</h2>
                        <div className={styles.eventSection}>
                            <div className={styles.eventGrid}>
                                <div
                                    className={`${styles.eventCard} ${selectedEventQuest?.id === 'event_debut' ? styles.active : ''}`}
                                    onClick={() => setSelectedEventQuest({
                                        id: 'event_debut',
                                        name: 'Debut',
                                        description: 'Update your Profile Image dressed up as your Hunter',
                                        reward: { name: 'Rising star', rarity: 'Event' }
                                    })}
                                >
                                    <span className={styles.eventCardTitle}>Debut</span>
                                    <span className={styles.eventCardProgress}>{isQuestCompleted('event_debut') ? '1/1' : '0/1'}</span>
                                </div>
                            </div>

                            {selectedEventQuest && (
                                <div className={styles.eventDetailCard}>
                                    <div className={styles.questHeader}>
                                        <div className={styles.questTitle}>
                                            Mission: {selectedEventQuest.name}
                                        </div>
                                        <div className={styles.questRarity} style={{ color: 'var(--rarity-event)' }}>
                                            EVENT
                                        </div>
                                    </div>

                                    <p className={styles.questDescription}>{selectedEventQuest.description}</p>

                                    <div className={styles.questReward}>
                                        <span className={styles.rewardLabel}>Rewards:</span>
                                        <span className={styles.rewardTitle} style={{ color: 'var(--rarity-event)' }}>
                                            Title: {selectedEventQuest.reward.name}
                                        </span>
                                    </div>

                                    {!isQuestCompleted(selectedEventQuest.id) ? (
                                        <button
                                            className={styles.claimButton}
                                            onClick={() => handleClaimQuest(selectedEventQuest)}
                                            disabled={pendingRequests.includes(selectedEventQuest.id)}
                                            style={{ backgroundColor: 'var(--rarity-event)', color: '#fff', marginTop: '20px' }}
                                        >
                                            {pendingRequests.includes(selectedEventQuest.id) ? 'PENDING' : (canSelfManage(profile) ? 'CLAIM' : 'REQUEST')}
                                        </button>
                                    ) : (
                                        <div style={{ color: 'var(--rarity-event)', textAlign: 'center', fontWeight: 'bold', marginTop: '20px', fontSize: '0.8rem' }}>✓ CLAIMED</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* CHALLENGES Section */}
                {!isSelecting && (filter === 'all' || filter === 'challenges') && (
                    <div style={{ marginTop: '40px' }}>
                        <h2 className={styles.sectionHeader}>CHALLENGES</h2>
                        <div className={styles.eventSection} style={{ borderColor: 'var(--rarity-challenge)' }}>
                            <div className={styles.eventGrid}>
                                {CHALLENGE_QUESTS.map((quest) => (
                                    <div
                                        key={quest.id}
                                        className={`${styles.eventCard} ${selectedChallengeQuest?.id === quest.id ? styles.active : ''}`}
                                        onClick={() => setSelectedChallengeQuest(quest)}
                                        style={{ borderColor: selectedChallengeQuest?.id === quest.id ? 'var(--rarity-challenge)' : 'rgba(255, 255, 255, 0.1)' }}
                                    >
                                        <span className={styles.eventCardTitle}>{quest.name}</span>
                                        <span className={styles.eventCardProgress}>{isQuestCompleted(quest.id) ? '1/1' : '0/1'}</span>
                                    </div>
                                ))}
                            </div>

                            {selectedChallengeQuest && (
                                <div className={styles.eventDetailCard} style={{ borderColor: 'var(--rarity-challenge)' }}>
                                    <div className={styles.questHeader}>
                                        <div className={styles.questTitle}>
                                            Mission: {selectedChallengeQuest.name}
                                        </div>
                                        <div className={styles.questRarity} style={{ color: 'var(--rarity-challenge)' }}>
                                            CHALLENGE
                                        </div>
                                    </div>

                                    <p className={styles.questDescription}>{selectedChallengeQuest.description}</p>

                                    <div className={styles.questReward}>
                                        <span className={styles.rewardLabel}>Rewards:</span>
                                        <span className={styles.rewardTitle} style={{ color: 'var(--rarity-challenge)' }}>
                                            Title: {selectedChallengeQuest.reward.name}
                                        </span>
                                    </div>

                                    {!isQuestCompleted(selectedChallengeQuest.id) ? (
                                        <button
                                            className={styles.claimButton}
                                            onClick={() => handleClaimQuest(selectedChallengeQuest)}
                                            disabled={pendingRequests.includes(selectedChallengeQuest.id)}
                                            style={{ backgroundColor: 'var(--rarity-challenge)', color: '#fff', marginTop: '20px' }}
                                        >
                                            {pendingRequests.includes(selectedChallengeQuest.id) ? 'PENDING' : (canSelfManage(profile) ? 'CLAIM' : 'REQUEST')}
                                        </button>
                                    ) : (
                                        <div style={{ color: 'var(--rarity-challenge)', textAlign: 'center', fontWeight: 'bold', marginTop: '20px', fontSize: '0.8rem' }}>✓ CLAIMED</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* COMPLETED Section */}
                {!isSelecting && (filter === 'all' || filter === 'completed') && (
                    <div className={styles.completedMissionsSection}>
                        <h2 className={styles.sectionHeader}>COMPLETED</h2>
                        {completedQuests.length > 0 ? (
                            <div className={styles.completedGrid}>
                                {completedQuests.map(quest => (
                                    <div key={quest.id} className={styles.completedItem}>
                                        <span className={styles.completedName}>{quest.name}</span>
                                        <span className={styles.completedReward} style={{ color: getRarityColor(quest.reward.rarity) }}>
                                            {quest.reward.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.emptyMessage}>Completed missions will be displayed here</p>
                        )}
                    </div>
                )}

                {/* Selection Panel (Mission Picker) */}
                {isSelecting && (
                    <div style={{ marginTop: '40px' }}>
                        <h2 className={styles.sectionHeader}>SELECT A MISSION</h2>
                        <button className={styles.cancelSelection} onClick={() => setIsSelecting(false)} style={{ marginBottom: '30px' }}>CANCEL</button>

                        <div className={styles.panels}>
                            {/* Mission Paths (Horizontal Scroll) */}
                            <div className={styles.missionList}>
                                {MISSION_PATHS.filter(p => !isFilterMode || p.id === selectedPath.id).map((path) => (
                                    <button
                                        key={path.id}
                                        className={`${styles.missionCard} ${selectedPath.id === path.id ? styles.active : ''}`}
                                        onClick={() => setSelectedPath(path)}
                                    >
                                        <div className={styles.missionName}>{path.name.replace('Path of the ', '').toUpperCase()}</div>
                                        <div className={styles.missionProgress}>{getPathProgress(path)}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Quest Details (Vertical) */}
                            <div className={styles.questDetails}>
                                <div className={styles.pathHeader}>
                                    <div>
                                        <h2 className={styles.pathTitle}>{selectedPath.name.toUpperCase()}</h2>
                                        <p className={styles.pathTheme} style={{ margin: '5px 0 0 0', opacity: 0.7 }}>Focus Stats: <span>{selectedPath.focusStats.join(', ')}</span></p>
                                    </div>
                                    {currentPathTrackedQuestId && (
                                        <button
                                            className={styles.untrackHeaderButton}
                                            onClick={() => handleToggleTrack(currentPathTrackedQuestId)}
                                        >
                                            UNTRACK
                                        </button>
                                    )}
                                </div>

                                <div className={styles.questList}>
                                    {selectedPath.quests.map((quest) => {
                                        const completed = isQuestCompleted(quest.id);
                                        const tracked = isQuestTracked(quest.id);

                                        const isMythic = quest.reward.rarity === 'Mythic';
                                        const canClaim = isMythic ? canClaimMythic(selectedPath) : true;

                                        return (
                                            <div
                                                key={quest.id}
                                                className={`${styles.questCard} ${isMythic ? styles.mythic : ''} ${tracked ? styles.tracked : ''}`}
                                            >
                                                <div className={styles.questHeader}>
                                                    <div className={styles.questTitle}>
                                                        {isMythic && <span className={styles.mythicBadge}>MYTHIC</span>}
                                                        Mission: {quest.name}
                                                    </div>
                                                    <div
                                                        className={styles.questRarity}
                                                        style={{ color: getRarityColor(quest.reward.rarity) }}
                                                    >
                                                        {quest.reward.rarity.toUpperCase()}
                                                    </div>
                                                </div>

                                                <p className={styles.questDescription}>{quest.description}</p>

                                                <div className={styles.questReward}>
                                                    <span className={styles.rewardLabel}>Rewards:</span>
                                                    <span
                                                        className={styles.rewardTitle}
                                                        style={{ color: getRarityColor(quest.reward.rarity) }}
                                                    >
                                                        Title: {quest.reward.name}
                                                    </span>
                                                </div>

                                                {!completed && (
                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                        {!isQuestLocked(quest.id, selectedPath) ? (
                                                            <>
                                                                <button
                                                                    className={`${styles.trackButton} ${tracked ? styles.active : ''}`}
                                                                    onClick={() => handleToggleTrack(quest.id)}
                                                                >
                                                                    {tracked ? 'TRACKED' : 'TRACK'}
                                                                </button>

                                                                {canClaim && (
                                                                    <button
                                                                        className={styles.claimButton}
                                                                        onClick={() => handleClaimQuest(quest)}
                                                                        disabled={pendingRequests.includes(quest.id)}
                                                                        style={{ padding: '2px 12px', fontSize: '0.7rem', fontWeight: '900', borderRadius: '4px' }}
                                                                    >
                                                                        {pendingRequests.includes(quest.id) ? 'PENDING' : (canSelfManage(profile) ? 'CLAIM' : 'REQUEST')}
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className={styles.lockedMessage} style={{ opacity: 0.6, fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                                LOCKED: COMPLETE PREVIOUS MISSIONS
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {completed && (
                                                    <div style={{ color: 'var(--rank-color)', fontWeight: '900', fontSize: '0.8rem', marginTop: '10px' }}>✓ COMPLETED</div>
                                                )}

                                                {!completed && !canClaim && isMythic && !isQuestLocked(quest.id, selectedPath) && (
                                                    <div className={styles.lockedMessage} style={{ marginTop: '10px' }}>
                                                        Complete all quests to unlock
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Navbar />
        </div >
    );
}
