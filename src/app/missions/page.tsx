'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useHunterStore, canSelfManage } from '@/lib/store';
import { MISSION_PATHS, MissionPath, Quest } from '@/lib/missions';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './page.module.css';

import { supabase } from '@/lib/supabase';
import { calculateOverallRank } from '@/lib/game-logic';

export default function MissionsPage() {
    const { profile, claimQuest, requestTitle, getPendingRequests, getTheme, toggleTrackQuest, getAgencyMembers, claimAgencyTitle } = useHunterStore();
    const [selectedPath, setSelectedPath] = useState<MissionPath>(MISSION_PATHS[0]);
    const [pendingRequests, setPendingRequests] = useState<string[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isFilterMode, setIsFilterMode] = useState(false);

    // START: Event Data
    const [activeQuest, setActiveQuest] = useState<Quest | null>(null);

    const [agencyMembers, setAgencyMembers] = useState<any[]>([]);
    const [agencyTitles, setAgencyTitles] = useState<any[]>([]);

    useEffect(() => {
        const fetchAgencyData = async () => {
            if (profile?.agencyId) {
                const members = await getAgencyMembers(profile.agencyId);
                setAgencyMembers(members);

                const { data: agencyData } = await supabase
                    .from('agencies')
                    .select('unlocked_titles')
                    .eq('id', profile.agencyId)
                    .single();

                if (agencyData) {
                    setAgencyTitles(agencyData.unlocked_titles || []);
                }
            }
        };

        if (profile) {
            fetchAgencyData();
        }
    }, [profile, getAgencyMembers]);

    const CHALLENGE_QUESTS: Quest[] = [
        {
            id: 'challenge_immovable',
            name: 'Immovable',
            description: 'Hold a Plank for 15 minutes or more',
            reward: { name: 'Immovable', rarity: 'Challenge' }
        }
    ];

    const AGENCY_QUESTS: Quest[] = [
        {
            id: 'agency_established',
            name: 'Established',
            description: 'Have 3 or more Agency Members D-rank or higher',
            reward: { name: 'Established', rarity: 'Rare' }
        },
        {
            id: 'agency_professional',
            name: 'Professional',
            description: 'Have 3 or more Agency Members C-rank or higher',
            reward: { name: 'Professional', rarity: 'Epic' }
        }
    ];

    // Filter State
    type FilterType = 'all' | 'active' | 'event' | 'challenges' | 'agency' | 'completed';
    const [filter, setFilter] = useState<FilterType>('all');

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

    const isQuestCompleted = (questId: string) => profile.completedQuests.includes(questId);
    const isQuestTracked = (questId: string) => profile.trackedQuests?.includes(questId);

    const canClaimMythic = (path: MissionPath) => {
        const regularQuests = path.quests.slice(0, 3);
        return regularQuests.every(q => isQuestCompleted(q.id));
    };

    const isQuestLocked = (questId: string, path: MissionPath) => {
        const questIndex = path.quests.findIndex(q => q.id === questId);
        if (questIndex <= 0) return false;
        for (let i = 0; i < questIndex; i++) {
            if (!isQuestCompleted(path.quests[i].id)) return true;
        }
        return false;
    };

    const handleClaimQuest = async (quest: Quest) => {
        // Find path for path quests
        const path = MISSION_PATHS.find(p => p.quests.some(q => q.id === quest.id));
        if (path && isQuestLocked(quest.id, path)) {
            alert('Complete previous missions in this path first!');
            return;
        }

        if (quest.reward.rarity === 'Mythic' && path) {
            if (!canClaimMythic(path)) {
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

    const handleToggleTrack = async (questId: string) => {
        await toggleTrackQuest(questId);
    };

    const getTrackedQuest = (index: number) => {
        const id = profile.trackedQuests?.[index];
        if (!id) return null;

        for (const path of MISSION_PATHS) {
            const quest = path.quests.find(q => q.id === id);
            if (quest) return { ...quest, pathName: path.name.replace('Path of the ', ''), pathId: path.id };
        }
        return null;
    };

    const getPathProgress = (path: MissionPath) => {
        const completed = path.quests.filter(q => isQuestCompleted(q.id)).length;
        return `${completed}/${path.quests.length}`;
    };

    const getRarityColor = (rarity: string) => `var(--rarity-${rarity.toLowerCase()})`;

    const themeRank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;
    const rankColorVar = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    const completedQuests = profile.completedQuests.map(id => {
        for (const path of MISSION_PATHS) {
            const q = path.quests.find(quest => quest.id === id);
            if (q) return q;
        }
        if (id === 'event_debut') return { id: 'event_debut', name: 'Debut', reward: { name: 'Rising star', rarity: 'Event' }, description: 'Update your Profile Image dressed up as your Hunter' } as Quest;
        const challenge = CHALLENGE_QUESTS.find(q => q.id === id);
        if (challenge) return challenge;
        return null;
    }).filter((q): q is Quest => q !== null);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const QuestDetail = ({ quest, onClaim, onTrack, isCompleted, isTracked, isAgency = false, agencyCanClaim = false, rarityColor }: any) => {
        const isPending = pendingRequests.includes(quest.id);

        return (
            <div className={styles.detailCard} style={{ '--rank-color': rarityColor || rankColorVar } as React.CSSProperties}>
                <div className={styles.questHeader}>
                    <div className={styles.questTitle}>
                        {isAgency ? 'Agency Mission: ' : 'Mission: '}{quest.name}
                    </div>
                    <div className={styles.questRarity} style={{ color: rarityColor || rankColorVar }}>
                        {isAgency ? 'AGENCY' : quest.reward.rarity.toUpperCase()}
                    </div>
                </div>

                <p className={styles.questDescription}>{quest.description}</p>

                <div className={styles.questReward}>
                    <span className={styles.rewardLabel}>Rewards:</span>
                    <span className={styles.rewardTitle} style={{ color: rarityColor || rankColorVar }}>
                        {isAgency ? 'Agency Title: ' : 'Title: '}{quest.reward.name}
                    </span>
                </div>

                {isCompleted ? (
                    <div style={{ color: rarityColor || rankColorVar, textAlign: 'center', fontWeight: '900', fontSize: '0.8rem' }}>✓ CLAIMED</div>
                ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {onTrack && (
                            <button
                                className={styles.claimButton}
                                style={{ flex: 1, background: isTracked ? 'transparent' : '#fff', color: isTracked ? '#fff' : '#000', border: isTracked ? '1px solid #fff' : 'none' }}
                                onClick={() => onTrack(quest.id)}
                            >
                                {isTracked ? 'UNTRACK' : 'TRACK'}
                            </button>
                        )}
                        <button
                            className={styles.claimButton}
                            style={{ flex: 2, background: (isAgency ? agencyCanClaim : true) ? (rarityColor || rankColorVar) : '#222', color: '#fff' }}
                            onClick={() => onClaim(quest)}
                            disabled={isPending || (isAgency && !agencyCanClaim)}
                        >
                            {isPending ? 'PENDING' : (isAgency ? (agencyCanClaim ? 'CLAIM FOR AGENCY' : 'LOCKED') : (canSelfManage(profile) ? 'CLAIM' : 'REQUEST'))}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.container} style={{ '--rank-color': rankColorVar } as React.CSSProperties}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>MISSIONS</h1>
                    <p className={styles.subtitle}>Complete quests to unlock Titles</p>

                    <div className={styles.filterBar}>
                        {(['all', 'active', 'event', 'challenges', 'agency', 'completed'] as FilterType[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TRACKED Header SECTION */}
                <div style={{ marginBottom: '40px' }}>
                    <div className={styles.trackedSlots}>
                        {[0, 1, 2].map(i => {
                            const tracked = getTrackedQuest(i);
                            return (
                                <div key={i} className={`${styles.slot} ${tracked ? styles.selected : ''}`} onClick={() => {
                                    if (tracked) {
                                        const path = MISSION_PATHS.find(p => p.id === (tracked as any).pathId);
                                        if (path) {
                                            setSelectedPath(path);
                                            setActiveQuest(tracked);
                                            scrollToSection('active-section');
                                        }
                                    } else {
                                        scrollToSection('active-section');
                                    }
                                }}>
                                    {tracked ? (
                                        <>
                                            <div className={styles.slotName}>{tracked.name}</div>
                                            <div className={styles.slotProgress} style={{ color: rankColorVar }}>{tracked.pathName}</div>
                                        </>
                                    ) : (
                                        <div className={styles.slotPlus}>+</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ACTIVE SECTION */}
                {(filter === 'all' || filter === 'active') && (
                    <div id="active-section">
                        <h2 className={styles.sectionHeader}>ACTIVE</h2>
                        <div className={styles.missionRow}>
                            {MISSION_PATHS.map(path => (
                                <div
                                    key={path.id}
                                    className={`${styles.slot} ${selectedPath.id === path.id ? styles.selected : ''}`}
                                    onClick={() => {
                                        setSelectedPath(path);
                                        setActiveQuest(null);
                                    }}
                                >
                                    <div className={styles.slotName}>{path.name.replace('Path of the ', '')}</div>
                                    <div className={styles.slotProgress} style={{ color: rankColorVar }}>{getPathProgress(path)}</div>
                                </div>
                            ))}
                        </div>

                        {/* Quests in selected path */}
                        <div className={styles.missionRow} style={{ marginTop: '10px', gap: '8px' }}>
                            {selectedPath.quests.map(quest => (
                                <div
                                    key={quest.id}
                                    className={`${styles.slot} ${activeQuest?.id === quest.id ? styles.selected : ''} ${isQuestTracked(quest.id) ? styles.tracked : ''}`}
                                    style={{ height: '45px', minWidth: '120px', opacity: isQuestLocked(quest.id, selectedPath) ? 0.5 : 1 }}
                                    onClick={() => !isQuestLocked(quest.id, selectedPath) && setActiveQuest(quest)}
                                >
                                    <div className={styles.slotName} style={{ fontSize: '0.65rem' }}>{quest.name}</div>
                                    {isQuestTracked(quest.id) && <div style={{ fontSize: '0.5rem', color: rankColorVar, fontWeight: '900' }}>TRACKED</div>}
                                </div>
                            ))}
                        </div>

                        {/* Detail card for path quests */}
                        {activeQuest && selectedPath.quests.some(q => q.id === activeQuest.id) && (
                            <QuestDetail
                                quest={activeQuest}
                                onClaim={handleClaimQuest}
                                onTrack={handleToggleTrack}
                                isCompleted={isQuestCompleted(activeQuest.id)}
                                isTracked={isQuestTracked(activeQuest.id)}
                            />
                        )}
                    </div>
                )}

                {/* EVENT SECTION */}
                {(filter === 'all' || filter === 'event') && (
                    <div>
                        <h2 className={styles.sectionHeader}>EVENT</h2>
                        <div className={styles.missionRow}>
                            <div
                                className={`${styles.slot} ${activeQuest?.id === 'event_debut' ? styles.selected : ''}`}
                                onClick={() => setActiveQuest({
                                    id: 'event_debut',
                                    name: 'Debut',
                                    description: 'Update your Profile Image dressed up as your Hunter',
                                    reward: { name: 'Rising star', rarity: 'Event' }
                                })}
                            >
                                <div className={styles.slotName}>Debut</div>
                                <div className={styles.slotProgress} style={{ color: 'var(--rarity-event)' }}>{isQuestCompleted('event_debut') ? '1/1' : '0/1'}</div>
                            </div>
                        </div>

                        {activeQuest?.id === 'event_debut' && (
                            <QuestDetail
                                quest={activeQuest}
                                onClaim={handleClaimQuest}
                                isCompleted={isQuestCompleted(activeQuest.id)}
                                rarityColor="var(--rarity-event)"
                            />
                        )}
                    </div>
                )}

                {/* CHALLENGES SECTION */}
                {(filter === 'all' || filter === 'challenges') && (
                    <div>
                        <h2 className={styles.sectionHeader}>CHALLENGES</h2>
                        <div className={styles.missionRow}>
                            {CHALLENGE_QUESTS.map(quest => (
                                <div
                                    key={quest.id}
                                    className={`${styles.slot} ${activeQuest?.id === quest.id ? styles.selected : ''}`}
                                    onClick={() => setActiveQuest(quest)}
                                >
                                    <div className={styles.slotName}>{quest.name}</div>
                                    <div className={styles.slotProgress} style={{ color: 'var(--rarity-challenge)' }}>{isQuestCompleted(quest.id) ? '1/1' : '0/1'}</div>
                                </div>
                            ))}
                        </div>

                        {activeQuest && CHALLENGE_QUESTS.some(q => q.id === activeQuest.id) && (
                            <QuestDetail
                                quest={activeQuest}
                                onClaim={handleClaimQuest}
                                isCompleted={isQuestCompleted(activeQuest.id)}
                                rarityColor="var(--rarity-challenge)"
                            />
                        )}
                    </div>
                )}

                {/* AGENCY SECTION */}
                {profile.agencyId && (filter === 'all' || filter === 'agency') && (
                    <div>
                        <h2 className={styles.sectionHeader}>AGENCY</h2>
                        <div className={styles.missionRow}>
                            {AGENCY_QUESTS.map(quest => {
                                const isClaimed = agencyTitles.some(t => t.name === quest.reward.name);
                                let progressText = '0/3';
                                const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];

                                if (quest.id === 'agency_established') {
                                    const count = agencyMembers.filter(m => ranks.indexOf(calculateOverallRank(m.testScores || {}, m.profileType || 'male_20_25')) >= 1).length;
                                    progressText = `${count}/3`;
                                } else if (quest.id === 'agency_professional') {
                                    const count = agencyMembers.filter(m => ranks.indexOf(calculateOverallRank(m.testScores || {}, m.profileType || 'male_20_25')) >= 2).length;
                                    progressText = `${count}/3`;
                                }

                                return (
                                    <div
                                        key={quest.id}
                                        className={`${styles.slot} ${activeQuest?.id === quest.id ? styles.selected : ''}`}
                                        onClick={() => setActiveQuest(quest)}
                                    >
                                        <div className={styles.slotName}>{quest.name}</div>
                                        <div className={styles.slotProgress} style={{ color: getRarityColor(quest.reward.rarity) }}>
                                            {isClaimed ? 'CLAIMED' : progressText}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {activeQuest && AGENCY_QUESTS.some(q => q.id === activeQuest.id) && (() => {
                            const isClaimed = agencyTitles.some(t => t.name === activeQuest.reward.name);
                            const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];
                            let canClaim = false;
                            if (activeQuest.id === 'agency_established') {
                                canClaim = agencyMembers.filter(m => ranks.indexOf(calculateOverallRank(m.testScores || {}, m.profileType || 'male_20_25')) >= 1).length >= 3;
                            } else if (activeQuest.id === 'agency_professional') {
                                canClaim = agencyMembers.filter(m => ranks.indexOf(calculateOverallRank(m.testScores || {}, m.profileType || 'male_20_25')) >= 2).length >= 3;
                            }

                            return (
                                <QuestDetail
                                    quest={activeQuest}
                                    onClaim={async () => {
                                        if (profile.role !== 'Captain' && !profile.isAdmin) {
                                            alert('Only Captains can claim Agency Missions.');
                                            return;
                                        }
                                        await claimAgencyTitle(activeQuest.reward);
                                        setAgencyTitles(prev => [...prev, activeQuest.reward]);
                                    }
                                    }
                                    isCompleted={isClaimed}
                                    isAgency={true}
                                    agencyCanClaim={canClaim}
                                    rarityColor={getRarityColor(activeQuest.reward.rarity)}
                                />
                            );
                        })()}
                    </div>
                )}

                {/* COMPLETED SECTION */}
                {(filter === 'all' || filter === 'completed') && (
                    <div>
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
                            <p className={styles.emptyMessage}>Completed missions will appear here</p>
                        )}
                    </div>
                )}
            </div>
            <Navbar />
        </div >
    );
}
