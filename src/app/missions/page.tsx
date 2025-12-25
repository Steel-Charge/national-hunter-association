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
    const [selectedEventQuest, setSelectedEventQuest] = useState<Quest | null>({
        id: 'event_debut',
        name: 'Debut',
        description: 'Update your Profile Image dressed up as your Hunter',
        reward: { name: 'Rising star', rarity: 'Event' }
    });

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

    const handleClaimQuest = async (quest: Quest) => {
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
            if (quest) return { ...quest, pathName: path.name.replace('Path of the ', '') };
        }
        return null;
    };

    const themeRank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;
    const rankColorVar = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    return (
        <div className={styles.container} style={{ '--rank-color': rankColorVar } as React.CSSProperties}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>MISSIONS</h1>
                    <p className={styles.subtitle}>Complete quests to unlock Titles</p>
                </div>

                {/* ACTIVE Section */}
                <h2 className={styles.sectionHeader} style={{ textAlign: 'center' }}>ACTIVE</h2>
                <div className={styles.activeSlots}>
                    {[0, 1, 2].map(i => {
                        const tracked = getTrackedQuest(i);
                        return (
                            <div key={i} className={styles.slot} onClick={() => tracked && toggleTrackQuest(tracked.id)}>
                                {tracked ? (
                                    <div className={styles.slotContent}>
                                        <span className={styles.slotName}>{tracked.name}</span>
                                        <span className={styles.slotPath}>{tracked.pathName}</span>
                                    </div>
                                ) : (
                                    <span className={styles.slotPlus}>+</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* EVENT Section */}
                <h2 className={styles.sectionHeader} style={{ textAlign: 'center' }}>EVENT</h2>
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
                            <h3 className={styles.eventMissionTitle}>Mission: {selectedEventQuest.name}</h3>
                            <p className={styles.eventMissionDesc}>{selectedEventQuest.description}</p>
                            <p className={styles.eventMissionDesc}>
                                Rewards: <span className={styles.rewardText}>Title: {selectedEventQuest.reward.name}</span>
                            </p>

                            {!isQuestCompleted(selectedEventQuest.id) ? (
                                <button
                                    className={styles.claimButtonEvent}
                                    onClick={() => handleClaimQuest(selectedEventQuest)}
                                    disabled={pendingRequests.includes(selectedEventQuest.id)}
                                >
                                    {pendingRequests.includes(selectedEventQuest.id) ? 'PENDING' : 'CLAIM'}
                                </button>
                            ) : (
                                <div style={{ color: 'var(--rarity-event)', textAlign: 'center', fontWeight: 'bold' }}>✓ CLAIMED</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Two-panel layout - Path selection */}
                <div className={styles.panels} style={{ marginTop: '60px' }}>
                    {/* Left Panel - Mission List */}
                    <div className={styles.missionList}>
                        {MISSION_PATHS.map((path) => (
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

                    {/* Right Panel - Quest Details */}
                    <div className={styles.questDetails}>
                        <div className={styles.pathHeader}>
                            <h2 className={styles.pathTitle}>{selectedPath.name.toUpperCase()}</h2>
                            <p className={styles.pathTheme}>Focus Stats: <span>{selectedPath.focusStats.join(', ')}</span></p>
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
                                        className={`${styles.questCard} ${completed ? styles.completed : ''} ${isMythic ? styles.mythic : ''} ${tracked ? styles.tracked : ''}`}
                                        onClick={() => !completed && toggleTrackQuest(quest.id)}
                                        style={{ cursor: completed ? 'default' : 'pointer' }}
                                    >
                                        <div className={styles.questHeader}>
                                            <div className={styles.questTitle}>
                                                {isMythic && <span className={styles.mythicBadge}>MYTHIC</span>}
                                                Mission: {quest.name}
                                                {tracked && <span style={{ color: 'var(--rank-color)', marginLeft: '10px', fontSize: '0.7rem' }}>[TRACKING]</span>}
                                            </div>
                                            <div
                                                className={styles.questRarity}
                                                style={{ color: getRarityColor(quest.reward.rarity) }}
                                            >
                                                {quest.reward.rarity}
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

                                        {!completed && canClaim && (
                                            <button
                                                className={styles.claimButton}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClaimQuest(quest);
                                                }}
                                                style={pendingRequests.includes(quest.id) ? {
                                                    backgroundColor: '#f59e0b',
                                                    cursor: 'not-allowed',
                                                    opacity: 0.7
                                                } : {}}
                                                disabled={pendingRequests.includes(quest.id)}
                                            >
                                                {pendingRequests.includes(quest.id)
                                                    ? 'PENDING'
                                                    : (canSelfManage(profile) ? 'CLAIM' : 'REQUEST')}
                                            </button>
                                        )}

                                        {!completed && !canClaim && isMythic && (
                                            <div className={styles.lockedMessage}>
                                                Complete all quests to unlock
                                            </div>
                                        )}

                                        {completed && (
                                            <div className={styles.claimedBadge}>✓ CLAIMED</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <Navbar />
        </div>
    );
}
