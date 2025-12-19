'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useHunterStore } from '@/lib/store';
import { MISSION_PATHS, MissionPath, Quest } from '@/lib/missions';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './page.module.css';

export default function MissionsPage() {
    const { profile, claimQuest, requestTitle, getPendingRequests, getOverallRank, getTheme } = useHunterStore();
    const [selectedPath, setSelectedPath] = useState<MissionPath>(MISSION_PATHS[0]);
    const [pendingRequests, setPendingRequests] = useState<string[]>([]);

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

    const canClaimMythic = (path: MissionPath) => {
        // Can claim mythic if all 3 regular quests are complete
        const regularQuests = path.quests.slice(0, 3);
        return regularQuests.every(q => isQuestCompleted(q.id));
    };

    const handleClaimQuest = async (quest: Quest) => {
        // For mythic quests, check if all previous quests are complete
        if (quest.reward.rarity === 'Mythic') {
            if (!canClaimMythic(selectedPath)) {
                alert('Complete all previous quests first!');
                return;
            }
        }

        // Admins can claim directly, non-admins must request
        if (profile.isAdmin) {
            await claimQuest(quest.id, quest.reward);
        } else {
            await requestTitle(quest.id, quest.reward);
            // Refresh pending requests
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

    const themeRank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;
    const rankColorVar = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    return (
        <div className={styles.container} style={{ '--rank-color': rankColorVar } as React.CSSProperties}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>MISSIONS</h1>
                    <p className={styles.subtitle}>Complete quests to unlock titles</p>
                </div>

                {/* Two-panel layout */}
                <div className={styles.panels}>
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
                            {selectedPath.quests.map((quest, index) => {
                                const completed = isQuestCompleted(quest.id);
                                const isMythic = quest.reward.rarity === 'Mythic';
                                const canClaim = isMythic ? canClaimMythic(selectedPath) : true;

                                return (
                                    <div
                                        key={quest.id}
                                        className={`${styles.questCard} ${completed ? styles.completed : ''} ${isMythic ? styles.mythic : ''}`}
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
                                                onClick={() => handleClaimQuest(quest)}
                                                style={pendingRequests.includes(quest.id) ? {
                                                    backgroundColor: '#f59e0b',
                                                    cursor: 'not-allowed',
                                                    opacity: 0.7
                                                } : {}}
                                                disabled={pendingRequests.includes(quest.id)}
                                            >
                                                {pendingRequests.includes(quest.id)
                                                    ? 'PENDING'
                                                    : (profile.isAdmin ? 'CLAIM' : 'REQUEST')}
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
