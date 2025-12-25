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

    const handleToggleTrack = async (questId: string) => {
        const wasTracked = isQuestTracked(questId);
        await toggleTrackQuest(questId);
        // If we were selecting and just turned it ON, close the picker
        if (isSelecting && !wasTracked) {
            setIsSelecting(false);
        }
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
                            <div key={i} className={styles.slot} onClick={() => tracked ? handleToggleTrack(tracked.id) : setIsSelecting(true)}>
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
                {!isSelecting && (
                    <div style={{ marginTop: '40px' }}>
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
                                    <h3 className={styles.eventMissionTitle}>MISSION: {selectedEventQuest.name.toUpperCase()}</h3>
                                    <p className={styles.eventMissionDesc}>{selectedEventQuest.description}</p>
                                    <p className={styles.eventMissionDesc}>
                                        Rewards: <span className={styles.rewardText} style={{ color: 'var(--rarity-event)' }}>Title: {selectedEventQuest.reward.name}</span>
                                    </p>

                                    {!isQuestCompleted(selectedEventQuest.id) ? (
                                        <button
                                            className={styles.claimButtonEvent}
                                            onClick={() => handleClaimQuest(selectedEventQuest)}
                                            disabled={pendingRequests.includes(selectedEventQuest.id)}
                                            style={{ backgroundColor: 'var(--rarity-event)', color: '#fff', borderRadius: '999px', padding: '12px 0', border: 'none', width: '100%', fontWeight: '900', marginTop: '20px', cursor: 'pointer' }}
                                        >
                                            {pendingRequests.includes(selectedEventQuest.id) ? 'PENDING' : 'CLAIM'}
                                        </button>
                                    ) : (
                                        <div style={{ color: 'var(--rarity-event)', textAlign: 'center', fontWeight: 'bold', marginTop: '20px' }}>✓ CLAIMED</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Selection Panel (Mission Picker) */}
                {isSelecting && (
                    <div style={{ marginTop: '40px' }}>
                        <h2 className={styles.sectionHeader} style={{ textAlign: 'center' }}>SELECT A MISSION</h2>
                        <button className={styles.cancelSelection} onClick={() => setIsSelecting(false)}>CANCEL</button>

                        <div className={styles.panels}>
                            {/* Mission Paths (Horizontal Scroll) */}
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

                            {/* Quest Details (Vertical) */}
                            <div className={styles.questDetails}>
                                <div className={styles.pathHeader}>
                                    <h2 className={styles.pathTitle}>{selectedPath.name.toUpperCase()}</h2>
                                    <p className={styles.pathTheme}>Focus Stats: <span>{selectedPath.focusStats.join(', ')}</span></p>
                                </div>

                                <div className={styles.questList}>
                                    {selectedPath.quests.map((quest) => {
                                        const completed = isQuestCompleted(quest.id);
                                        const tracked = isQuestTracked(quest.id);

                                        if (completed) return null;

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
                                                    <button
                                                        className={styles.trackButton}
                                                        onClick={() => handleToggleTrack(quest.id)}
                                                        style={tracked ? { backgroundColor: 'transparent', border: '1px solid var(--rank-color)', color: 'var(--rank-color)' } : {}}
                                                    >
                                                        {tracked ? 'UNTRACK' : 'TRACK'}
                                                    </button>
                                                )}

                                                {!canClaim && isMythic && (
                                                    <div className={styles.lockedMessage}>
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
        </div>
    );
}
