'use client';

import React, { useMemo } from 'react';
import { useHunterStore } from '@/lib/store';
import { Rank } from '@/lib/game-logic';
import { supabase } from '@/lib/supabase';
import { EVENT_MISSIONS, HYENA_NPCS, PHOENIX_GAMES_END_DATE, NPC } from '@/lib/events-data';
import styles from './EventsView.module.css';
import { Trophy, Target, Star, Shield, Zap, Info, Clock, Crown } from 'lucide-react';

export default function EventsView() {
    const { profile, unlockEventTitle } = useHunterStore();

    const timeLeft = useMemo(() => {
        const end = new Date(PHOENIX_GAMES_END_DATE).getTime();
        const now = new Date().getTime();
        const diff = end - now;
        if (diff <= 0) return 'EVENT ENDED';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${days}D ${hours}H REMAINING`;
    }, []);

    const [agencyMembers, setAgencyMembers] = React.useState<NPC[]>([]);

    React.useEffect(() => {
        const fetchAgencyMembers = async () => {
            if (!profile?.agencyId) return;
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, active_title, avatar_url, event_points')
                .eq('agency_id', profile.agencyId);

            if (data && !error) {
                const members = data.filter(m => m.id !== profile.id).map(m => ({
                    id: m.id,
                    name: m.name,
                    title: (m.active_title as any)?.name || 'Hunter',
                    avatarUrl: m.avatar_url || '/placeholder.png',
                    points: m.event_points || 0,
                    rank: 'AGENCY',
                    isNPC: false
                }));
                setAgencyMembers(members);
            }
        };
        fetchAgencyMembers();
    }, [profile?.agencyId]);

    const leaderboard = useMemo(() => {
        if (!profile) return HYENA_NPCS;
        const userEntry: NPC = {
            id: profile.id,
            name: profile.name,
            title: profile.activeTitle?.name || 'Hunter',
            avatarUrl: profile.avatarUrl || '/placeholder.png',
            points: profile.eventPoints || 0,
            rank: 'USER', // Custom flag for styling
            isNPC: false
        };
        return [...HYENA_NPCS, userEntry, ...agencyMembers].sort((a, b) => b.points - a.points);
    }, [profile, agencyMembers]);

    const userRankIndex = leaderboard.findIndex(entry => entry.id === profile?.id);

    const handleManualClaim = (missionId: string, titleName: string) => {
        if (missionId === 'evolving') {
            const description = prompt("Describe the competition or activity you entered that you've never done before:");
            if (description && description.length > 5) {
                unlockEventTitle(titleName);
                alert(`${titleName} Title Claimed!`);
            }
        }
    };

    const isMissionUnlocked = (titleName: string) => {
        return profile?.eventTitles?.includes(titleName);
    };

    return (
        <div className={styles.container}>
            {/* ── Event Header ────────────────────────────────────────────── */}
            <div className={styles.eventHeader}>
                <div className={styles.headerGlow} />
                <div className={styles.headerContent}>
                    <h1 className={styles.eventMainTitle}>PHOENIX GAMES</h1>
                    <div className={styles.timerBox}>
                        <Clock size={14} className={styles.timerIcon} />
                        <span>{timeLeft}</span>
                    </div>
                </div>
                <p className={styles.eventSubtitle}>JOINT TRAINING OPERATION: IKARUS X HYENA</p>
            </div>

            {/* ── Lore Section ────────────────────────────────────────────── */}
            <div className={styles.loreBox}>
                <div className={styles.loreIcon}>
                    <Info size={20} />
                </div>
                <p className={styles.loreText}>
                    "Our Agency Manager <strong>Hunter Bones</strong> has initiated a joint training programme with the manager of the <strong>Hyena Agency</strong>. This tactical exercise, the <strong>Phoenix Games</strong>, is designed to push our agents beyond their limits. Compete against the Hyena elites and prove that Ikarus hunters are truly superior."
                </p>
            </div>

            <div className={styles.contentGrid}>
                {/* ── Leaderboard ───────────────────────────────────────────── */}
                <div className={styles.leaderboardSection}>
                    <div className={styles.sectionHeader}>
                        <Trophy size={18} className={styles.sectionIcon} />
                        <h2>LEADERBOARD</h2>
                    </div>
                    <div className={styles.leaderboardList}>
                        {leaderboard.map((entry, index) => {
                            const isUser = entry.id === profile?.id;
                            return (
                                <div 
                                    key={entry.id} 
                                    className={`${styles.leaderboardItem} ${isUser ? styles.userRow : ''}`}
                                >
                                    <div className={styles.rankNum}>#{index + 1}</div>
                                    <img src={entry.avatarUrl} alt={entry.name} className={styles.entryAvatar} />
                                    <div className={styles.entryInfo}>
                                        <div className={styles.entryName}>
                                            <span className={styles.nameText}>{entry.name}</span>
                                            {entry.isNPC && <span className={styles.npcBadge}>[NPC]</span>}
                                            {index === 0 && <Crown size={14} className={styles.topCrown} />}
                                        </div>
                                        <div className={styles.entryTitle}>
                                            {entry.rank === 'AGENCY' && <Crown size={10} style={{ marginRight: '4px', opacity: 0.6 }} />}
                                            {entry.title.toUpperCase()}
                                        </div>
                                    </div>
                                    <div className={styles.entryPoints}>
                                        <span className={styles.pointsVal}>{entry.points}</span>
                                        <span className={styles.pointsLabel}>PTS</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Missions/Titles ────────────────────────────────────────── */}
                <div className={styles.missionsSection}>
                    <div className={styles.sectionHeader}>
                        <Target size={18} className={styles.sectionIcon} />
                        <h2>EVENT TITLES</h2>
                    </div>
                    <div className={styles.missionsList}>
                        {EVENT_MISSIONS.map((mission) => {
                            const unlocked = isMissionUnlocked(mission.title);
                            return (
                                <div 
                                    key={mission.id} 
                                    className={`${styles.missionCard} ${unlocked ? styles.missionUnlocked : ''}`}
                                    onClick={() => !unlocked && mission.requirement === 'manual_claim' && handleManualClaim(mission.id, mission.title)}
                                >
                                    <div className={styles.missionHeader}>
                                        <span className={styles.missionRarity} data-rarity={mission.rarity.toLowerCase()}>
                                            {mission.rarity}
                                        </span>
                                        <span className={styles.missionPoints}>+{mission.points} PTS</span>
                                    </div>
                                    <h3 className={styles.missionTitle}>{mission.title}</h3>
                                    <p className={styles.missionDesc}>{mission.description}</p>
                                    
                                    <div className={styles.missionFooter}>
                                        {unlocked ? (
                                            <span className={styles.unlockedBadge}>UNLOCKED</span>
                                        ) : mission.requirement === 'manual_claim' ? (
                                            <span className={styles.claimBtn}>CLAIM MISSION</span>
                                        ) : (
                                            <span className={styles.lockedBadge}>IN PROGRESS</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
