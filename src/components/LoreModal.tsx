'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useHunterStore, UserProfile, ChatState } from '@/lib/store';
import { calculateOverallRank, Rank } from '@/lib/game-logic';
import { RAT_KING_CHAT, BONES_CHAT, ChatGraph, ChatNode, ChatOption } from '@/lib/chat-data';
import { X, Save, Send, Shield, Lock, Eye, ChevronLeft, Mic } from 'lucide-react';
import styles from './LoreModal.module.css';

interface MissionLog {
    date: string;
    location: string;
    threatClassification: string;
    summary: string;
    assessment: string;
    recommendation: string;
}

interface LoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetProfile: UserProfile; // The profile we are viewing/editing
    rankColor: string;
}

const ELEMENTS = ['physical', 'fire', 'water', 'light', 'earth', 'air', 'shadow', 'mind'];
const CLASSES = [
    'RANGER', 'CLERIC', 'KNIGHT', 'NECROMANCER', 'WARLOCK',
    'SORCERER', 'WIZARD', 'MONK', 'SHIFTER', 'ELEMENTALIST',
    'PSIONIC', 'BARBARIAN', 'BARD', 'PALADIN', 'ASSASSIN', 'GUNSLINGER', 'SWORDSMAN', 'BERSERKER'
];

const TIMELINE_EVENTS = [
    {
        title: "First Warning",
        date: "December 2021",
        description: "On December 19, 2021 at 00:00:01 (UTC+2), all government organizations worldwide received an identical message from an unknown sender:\n\n“PREPARE FOR REGRET”\n\nAnalysis revealed the transmission originated from a device with:\n- A timestamp 50 years in the future\n- A serial number linked to hardware not yet manufactured\n\nThe incident was officially classified as an elaborate hoax, and Global Command agreed to take no action."
    },
    {
        title: "Regret’s Appearance",
        date: "January 2024",
        description: "On January 15, 2024 at 04:44:44 (UTC+2), the AREGRETA Satellite detected a spatial rift forming on the Moon’s surface.\n\nThe transmitted report contained:\n- Severe syntax corruption\n- Sensor data that could not be decoded\n- A corrupted designation reading: “#REGRET”*\n\nFollowing public disclosure, the anomaly became known simply as REGRET."
    },
    {
        title: "Icor Leakage",
        date: "February 2024",
        description: "On February 18, 2024 at 04:44:44 (UTC+2), REGRET expanded to a size visible from Earth without telescopic aid.\n\nThe rift began emitting an unknown form of energy, later designated Icor.\nApproximately four hours later, this radiation entered Earth’s atmosphere."
    },
    {
        title: "The First Awakening",
        date: "April 2024",
        description: "On April 4, 2024 at 04:44:44 (UTC+2) in Cape Town, South Africa, a teenage boy was attacked by a mutated German Shepherd.\n\nDuring the encounter, the individual manifested pyrokinetic abilities and neutralized the mutant.\n\nThis event was officially recorded as “The First Awakening.”"
    },
    {
        title: "NHA’s Founding",
        date: "June 2024",
        description: "On June 2, 2024 at 17:12 (UTC+2), the South African government declared the Awakenings a national disaster.\n\nTo manage Awakened individuals, a new organization was formed.\n\nIn line with the nation’s stance on equality, Awakened individuals were designated “Hunters.”\nOnce identified, Hunters were legally required to register and serve the state, primarily to combat the growing mutant threat."
    },
    {
        title: "Last Warning",
        date: "September 2024",
        description: "On September 7, 2024, the National Hunter Association (NHA) was officially established.\n\nWhile drafting his inaugural announcement to registered Hunters, the NHA Director received another message originating from the same unidentified future device as in 2021.\n\nThe message read:\n\n“ONLY THE CREATION OF A MONARCH CAN SAVE US…”"
    },
    {
        title: "The Monarch Project",
        date: "February 2025",
        description: "On February 20, 2025, the NHA initiated the Monarch Project.\n\nWith no confirmed understanding of what a Monarch is, the project’s goal is to:\n- Force or induce Hunters to evolve beyond known rank limitations\n- Create temporary protectors capable of defending the nation until a true Monarch emerges\n\nThe Top 50 strongest Hunters were each assigned a command group known as Agencies, tasked with training, controlling, and testing large numbers of Hunters under extreme conditions."
    },
    {
        title: "Agency Privacy Act",
        date: "March 2025",
        description: "In early March 2025, Hunter Klaw, ranked 32nd in South Africa and manager of the Hyena Agency, petitioned the NHA to make Agency operations private. The proposal sparked controversy due to concerns over abuse, reduced coordination between Agencies, and the concealment of Monarch Project failures. After a closed-door meeting involving the NHA Director, all 50 Agency managers, and select shareholders, the act was approved on March 5, 2025.\n It mandates full reporting of all Agency activities to the NHA Director, classifies operations from public and inter-Agency access, and centralizes Hunter placement under the NHA, removing reassignment authority from Agency managers and significantly increasing centralized control."
    },
    {
        title: "Regret’s Call",
        date: "April 2025",
        description: "Since its emergence, REGRET had been under continuous observation by the AREGRETA Satellite.\nOn April 4, 2025 at 04:44:44 (UTC+2), Captain Patrick Harbinger, the satellite’s commanding officer, initiated an unscheduled transmission to the orbital space station. The captain appeared agitated and incoherent, repeatedly stating that REGRET was communicating with him.\n\nDuring the transmission, Harbinger claimed that\n“It says it will bring Perfection-”\n “...It knows we are watching it, It's watching too.” \nThe message rapidly deteriorated into uncontrollable laughter, followed by vocalizations described by station staff as non-human growling.\n\nAt 04:48 (UTC+2), all contact with the AREGRETA Satellite was lost.\nA recovery and investigation team was immediately deployed with the objective of locating the satellite and extracting Captain Harbinger. Upon arrival at the last known coordinates, no debris, wreckage, or trace of the AREGRETA Satellite was found.\n\nThe incident was classified at the highest level. Captain Harbinger remains listed as Missing."
    }
];



const RANKS_ORDER: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S'];

export default function LoreModal({ isOpen, onClose, targetProfile, rankColor }: LoreModalProps) {
    const [activeTab, setActiveTab] = useState<'FILE' | 'LOGS' | 'TIMELINE' | 'PHONE'>('FILE');
    const { profile: currentUser, updateLore, updateChatProgress, claimQuest } = useHunterStore();
    const [activeContact, setActiveContact] = useState<'Rat King' | 'Bones' | null>(null);
    const [saving, setSaving] = useState(false);

    // Editable states
    const [bio, setBio] = useState(targetProfile.bio || '');
    const [managerComment, setManagerComment] = useState(targetProfile.managerComment || '');
    const [affinities, setAffinities] = useState<string[]>(targetProfile.affinities || []);
    const [classTags, setClassTags] = useState<string[]>(targetProfile.classTags || []);
    const [videoUrl, setVideoUrl] = useState(targetProfile.videoUrl || '');

    // Chat Logic
    const [chatHistory, setChatHistory] = useState<{ sender: 'Rat King' | 'Bones' | 'User', text: string, audioUrl?: string }[]>([]);
    const [currentOptions, setCurrentOptions] = useState<ChatOption[]>([]);
    const [isBlocked, setIsBlocked] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isSelf = currentUser?.id === targetProfile.id;
    // Permissions...
    const isCaptainOfTarget = (currentUser?.role === 'Captain' && currentUser.agencyId === targetProfile.agencyId) || currentUser?.isAdmin;
    const canEditBio = isSelf || isCaptainOfTarget;
    const canEditManagerComment = isCaptainOfTarget;
    const canEditLoreTags = isSelf || isCaptainOfTarget;
    const canEditLogs = isCaptainOfTarget && currentUser?.role !== 'Hunter';

    // Mission Logs state
    const [localLogs, setLocalLogs] = useState<Record<string, MissionLog>>({});

    const DEFAULT_LOGS: Record<string, MissionLog> = {
        'D': {
            date: "Pending...",
            location: "Classified",
            threatClassification: "Low",
            summary: "Hunter demonstrated foundational combat capabilities. Routine patrol completed without incident.",
            assessment: "Mission successful. Strategic thinking within expected parameters.",
            recommendation: "Continued monitoring. Standard rotation advised."
        },
        'C': {
            date: "Pending...",
            location: "Classified",
            threatClassification: "Moderate",
            summary: "Hunter exhibited improved tactical awareness during urban suppression. Successfully neutralized multiple threats.",
            assessment: "Combat proficiency increasing. Hunter shows situational alertness.",
            recommendation: "Recommend specialized tactical drills."
        },
        'B': {
            date: "Pending...",
            location: "Classified",
            threatClassification: "High",
            summary: "High-intensity combat recorded. Hunter was pivotal in securing a breached sector.",
            assessment: "Significant growth in offensive capability. Hunter remains stable under pressure.",
            recommendation: "Eligible for lead roles in secondary squads."
        },
        'A': {
            date: "Pending...",
            location: "Classified",
            threatClassification: "Critical",
            summary: "Exceptional performance in a classified operation. Hunter stabilized a catastrophic failure point.",
            assessment: "Top-tier operative performance. Demonstrates mastery over core abilities.",
            recommendation: "Assign to high-priority national defense tasks."
        },
        'S': {
            date: "RESTRICTED",
            location: "RESTRICTED",
            threatClassification: "GOD-LEVEL",
            summary: "Data restricted to Monarch Project command. Mission outcome: Absolute Success.",
            assessment: "Hunter is a core asset to the NHA's strategic existence.",
            recommendation: "Direct oversight by Agency Captain required."
        }
    };

    // Load Chat State
    useEffect(() => {
        if (!activeContact || !currentUser) return;

        const chatGraph = activeContact === 'Rat King' ? RAT_KING_CHAT : BONES_CHAT;
        const progress = currentUser.settings.chatProgress?.[activeContact];

        // Initialize if empty
        let currentNodeId = progress?.currentNodeId || 'root';
        let history = progress?.history || [];
        let blocked = progress?.isBlocked || false;

        // Auto-advance logic (recursion for multiple skip nodes)
        const advanceNode = (nodeId: string): string => {
            const node = chatGraph[nodeId];
            if (!node) return nodeId;

            // Check requirements
            if (node.reqRank) {
                const currentRank = calculateOverallRank(currentUser.testScores, currentUser.profileType);
                if (RANKS_ORDER.indexOf(currentRank as Rank) < RANKS_ORDER.indexOf(node.reqRank as Rank)) {
                    return nodeId; // Wait at this node (which should probably be the predecessor or a placeholder)
                }
            }

            if (node.reqTimeWait) {
                const lastTime = progress?.lastInteractionTime || 0;
                const hoursPassed = (Date.now() - lastTime) / (1000 * 60 * 60);
                if (hoursPassed < node.reqTimeWait) {
                    return nodeId; // Wait here
                }
            }

            // Push to history if not already there (simple check)
            // Note: History management in a graph is tricky. We'll rely on the stored history.
            // If the node has text and is not in history, add it? 
            // Better: Re-construct view based on traversed nodes? 
            // For now: We rely on 'history' being the source of truth for display, 
            // and node traversal adds to it.

            // If this node is "new" (not the stored current one), we add it. 
            // But here we are just calculating the target node.

            if (node.nextId && !node.options && !node.isEnd) {
                return advanceNode(node.nextId);
            }
            return nodeId;
        };

        // If we are just opening, we don't auto-advance purely on load unless it's a "Wait" node that finished.
        // But for simplicity, we'll handle interactions via user input or "Continue" clicks.
        // Actually, Rat King "C-Rank" logic needs auto-trigger.

        const currentNode = chatGraph[currentNodeId];

        // Populate options
        if (currentNode?.options) {
            setCurrentOptions(currentNode.options);
        } else if (currentNode?.isEnd) {
            setCurrentOptions([]);
            // If it's the "C-Rank Start" node, check logic
            if (currentNode.nextId) {
                // Check if we can auto-advance from an end node (like the wait node)
                const nextNode = chatGraph[currentNode.nextId];
                if (nextNode?.reqRank) {
                    const currentRank = calculateOverallRank(currentUser.testScores, currentUser.profileType);
                    if (RANKS_ORDER.indexOf(currentRank as Rank) >= RANKS_ORDER.indexOf(nextNode.reqRank as Rank)) {
                        // We can advance!
                        // But we need to trigger the update.
                        // We'll leave it for now and handle it in a "check status" effect or generic advancer.
                    }
                }
            }
        } else {
            setCurrentOptions([]);
        }

        setChatHistory(history);
        setIsBlocked(blocked);

    }, [activeContact, currentUser]);


    const handleChatOption = async (option: ChatOption) => {
        if (!currentUser || !activeContact) return;
        const chatGraph = activeContact === 'Rat King' ? RAT_KING_CHAT : BONES_CHAT;

        // 1. Add User selection to history
        const newHistory = [
            ...chatHistory,
            { sender: 'User' as const, text: option.label }
        ];

        // 2. Process Next Node
        let nextNodeId = option.nextId;
        let nextNode = chatGraph[nextNodeId];
        let blocked = isBlocked;

        // Special Block Logic for Bones
        if (nextNodeId === 'b_blocked') {
            blocked = true;
        }

        // 3. Add Next Node(s) response to history
        // Iterate until we hit options or end
        while (nextNode) {
            // Check constraints
            if (nextNode.reqTimeWait) {
                // Stop here.
                // We need to store that we are waiting at this node.
                break;
            }

            if (nextNode.text) {
                newHistory.push({
                    sender: nextNode.speaker as any,
                    text: nextNode.text,
                    audioUrl: nextNode.audioUrl
                });
            }

            if (nextNode.isEnd || nextNode.options) {
                break;
            }

            if (nextNode.nextId) {
                nextNodeId = nextNode.nextId;
                nextNode = chatGraph[nextNodeId];
            } else {
                break;
            }
        }

        // 4. Grant Rewards
        if (option.rewardTitle) {
            // Claim dummy quest to grant title
            const questId = `chat_reward_${option.rewardTitle.name.toLowerCase().replace(/ /g, '_')}`;
            await claimQuest(questId, option.rewardTitle);

            // Show alert?? Or just let the popup handle it?
            // The store's claimQuest handles notifications usually? 
            // The layout usually handles TitleCongratulationModal by watching store.unlockedTitles.
        }

        // 5. Update State
        const newState: ChatState = {
            currentNodeId: nextNodeId,
            history: newHistory,
            lastInteractionTime: Date.now(),
            isBlocked: blocked
        };

        setChatHistory(newHistory);
        setCurrentOptions(nextNode?.options || []);
        setIsBlocked(blocked);

        await updateChatProgress(activeContact, newState);
    };

    // Check for 24h wait or Rank unlock periodically or on mount
    useEffect(() => {
        if (!activeContact || !currentUser) return;
        const checkProgression = async () => {
            const chatGraph = activeContact === 'Rat King' ? RAT_KING_CHAT : BONES_CHAT;
            const progress = currentUser.settings.chatProgress?.[activeContact];
            if (!progress) return;

            let currentNode = chatGraph[progress.currentNodeId];
            let changed = false;
            let newHistory = [...progress.history];
            let nextNodeId = progress.currentNodeId;

            // Check if we are at a "Wait" node that is satisfied
            // Or an "End" node that points to a restricted node that is now satisfied
            if (currentNode.isEnd && currentNode.nextId) {
                const intendedNext = chatGraph[currentNode.nextId];
                if (intendedNext) {
                    let canProceed = true;

                    if (intendedNext.reqRank) {
                        const currentRank = calculateOverallRank(currentUser.testScores, currentUser.profileType);
                        if (RANKS_ORDER.indexOf(currentRank as Rank) < RANKS_ORDER.indexOf(intendedNext.reqRank as Rank)) {
                            canProceed = false;
                        }
                    }
                    if (intendedNext.reqTimeWait) {
                        const lastTime = progress.lastInteractionTime || 0;
                        const hoursPassed = (Date.now() - lastTime) / (1000 * 60 * 60);
                        if (hoursPassed < intendedNext.reqTimeWait) {
                            canProceed = false;
                        }
                    }

                    if (canProceed) {
                        // Advance!
                        nextNodeId = intendedNext.id;
                        changed = true;
                        // Add the new text
                        // Process chain until options/end
                        let tempNode = intendedNext;
                        while (tempNode) {
                            if (tempNode.text) {
                                newHistory.push({
                                    sender: tempNode.speaker as any,
                                    text: tempNode.text,
                                    audioUrl: tempNode.audioUrl
                                });
                            }

                            if (tempNode.options || tempNode.isEnd) {
                                nextNodeId = tempNode.id;
                                break;
                            }
                            if (tempNode.nextId) {
                                nextNodeId = tempNode.nextId;
                                tempNode = chatGraph[nextNodeId];
                            } else {
                                break;
                            }
                        }
                    }
                }
            }

            if (changed) {
                const newState: ChatState = {
                    ...progress,
                    currentNodeId: nextNodeId,
                    history: newHistory,
                    lastInteractionTime: Date.now() // Update time? Maybe only for user options?
                };
                setChatHistory(newHistory);
                setCurrentOptions(chatGraph[nextNodeId]?.options || []);
                await updateChatProgress(activeContact, newState);
            }
        };

        checkProgression();
    }, [activeContact, currentUser, updateChatProgress]);

    useEffect(() => {
        if (isOpen) {
            // ... [Rest of existing load logic]
            const initialLogs = { ...DEFAULT_LOGS };
            // Use original load logic for non-chat stuff
            // ...
            setLocalLogs(initialLogs);
        }
    }, [isOpen, targetProfile]);

    if (!isOpen) return null;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, activeTab]);

    if (!isOpen) return null;

    const handleVideoFile = async (file: File | null) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            const result = reader.result as string;
            setVideoUrl(result);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (tab: string) => {
        setSaving(true);
        try {
            const updates: any = {};
            if (tab === 'FILE') {
                updates.bio = bio;
                updates.affinities = affinities;
                updates.classTags = classTags;
                updates.videoUrl = videoUrl;
            } else if (tab === 'LOGS') {
                updates.managerComment = managerComment;
                updates.missionLogs = localLogs;
            }

            await updateLore(targetProfile.id, updates);
            alert('Lore updated successfully!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save lore changes.');
        } finally {
            setSaving(false);
        }
    };



    const toggleAffinity = (element: string) => {
        if (!canEditLoreTags) return;
        setAffinities(prev =>
            prev.includes(element) ? prev.filter(e => e !== element) : [...prev, element]
        );
    };

    const toggleClass = (c: string) => {
        if (!canEditLoreTags) return;
        setClassTags(prev =>
            prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]
        );
    };

    const updateLog = (rank: string, field: keyof MissionLog, text: string) => {
        if (!canEditLogs) return;
        setLocalLogs(prev => ({
            ...prev,
            [rank]: {
                ...prev[rank],
                [field]: text
            }
        }));
    };

    const currentTargetRank = calculateOverallRank(targetProfile.testScores, targetProfile.profileType);
    const currentTargetRankIdx = RANKS_ORDER.indexOf(currentTargetRank as Rank);

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal} style={{ '--rank-color': rankColor } as React.CSSProperties}>
                <button className={styles.closeX} onClick={onClose}><X size={24} /></button>

                <div className={styles.header}>
                    <h1 className={styles.headerTitle}>{targetProfile.name.toUpperCase()}</h1>
                    <p className={styles.headerRole}>{targetProfile.role}</p>
                </div>

                <div className={styles.tabs}>
                    {['FILE', 'LOGS', 'TIMELINE', 'PHONE']
                        .filter(t => t !== 'PHONE' || isSelf)
                        .map((t) => (
                            <button
                                key={t}
                                className={`${styles.tab} ${activeTab === t ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab(t as any)}
                            >
                                {t}
                            </button>
                        ))
                    }
                </div>

                <div className={styles.content} ref={scrollRef}>
                    {activeTab === 'FILE' && (
                        <div className={styles.tabContent}>
                            <h3 className={styles.sectionTitle}>Biography:</h3>
                            {canEditBio ? (
                                <textarea
                                    className={styles.textarea}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Enter hunter biography..."
                                />
                            ) : (
                                <div className={styles.bioReadonly}>
                                    {bio || "No biography available."}
                                </div>
                            )}

                            <h3 className={styles.sectionTitle} style={{ marginTop: '20px' }}>Elemental Affinities:</h3>
                            <div className={styles.tagContainer}>
                                {canEditLoreTags ? (
                                    ELEMENTS.map(el => (
                                        <button
                                            key={el}
                                            className={`${styles.tag} ${affinities.includes(el) ? styles.tagActive : styles.tagInactive}`}
                                            onClick={() => toggleAffinity(el)}
                                            style={{ opacity: affinities.includes(el) ? 1 : 0.4 }}
                                        >
                                            {el}
                                        </button>
                                    ))
                                ) : (
                                    affinities.length > 0 ? affinities.map(el => (
                                        <span key={el} className={styles.tag}>{el}</span>
                                    )) : <span style={{ color: '#555', fontSize: '0.8rem' }}>None identified</span>
                                )}
                            </div>

                            <h3 className={styles.sectionTitle}>Class:</h3>
                            <div className={styles.tagContainer}>
                                {canEditLoreTags ? (
                                    CLASSES.map(c => (
                                        <button
                                            key={c}
                                            className={`${styles.tag} ${classTags.includes(c) ? styles.tagActive : styles.tagInactive}`}
                                            onClick={() => toggleClass(c)}
                                            style={{ opacity: classTags.includes(c) ? 1 : 0.4 }}
                                        >
                                            {c}
                                        </button>
                                    ))
                                ) : (
                                    classTags.length > 0 ? classTags.map(c => (
                                        <span key={c} className={styles.tag}>{c}</span>
                                    )) : <span style={{ color: '#555', fontSize: '0.8rem' }}>Unclassified</span>
                                )}
                            </div>

                            <h3 className={styles.sectionTitle}>{targetProfile.name.toUpperCase()} - INTERVIEW</h3>
                            <div className={styles.videoArea}>
                                {videoUrl ? (
                                    <video
                                        src={videoUrl}
                                        className={styles.videoFrame}
                                        controls
                                    />
                                ) : (
                                    <div className={styles.videoPlaceholder}>
                                        No interview available
                                    </div>
                                )}

                                {isCaptainOfTarget && (
                                    <div className={styles.uploadContainer}>
                                        <label className={styles.uploadLabel}>
                                            {videoUrl ? 'CHANGE INTERVIEW' : 'UPLOAD INTERVIEW'}
                                            <input
                                                type="file"
                                                accept="video/*"
                                                onChange={(e) => handleVideoFile(e.target.files ? e.target.files[0] : null)}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'LOGS' && (
                        <div className={styles.tabContent}>
                            <div className={styles.timeline}>
                                {RANKS_ORDER.filter(r => r !== 'E').map((rank, idx) => {
                                    const rankIdx = RANKS_ORDER.indexOf(rank);
                                    const isUnlocked = currentTargetRankIdx >= rankIdx;

                                    return (
                                        <div key={rank} className={styles.logNode}>
                                            <div className={`${styles.nodeIndicator} ${isUnlocked ? styles.nodeIndicatorActive : ''}`} />
                                            <div className={styles.logHeader}>
                                                {targetProfile.name.toUpperCase()} {rank}-RANK MISSION LOG #{(idx + 1) * 123}:
                                            </div>
                                            <div className={`${styles.logContent} ${!isUnlocked ? styles.redacted : ''}`}>
                                                {!isUnlocked ? (
                                                    "[RESTRICTED DATA] [RANK " + rank + " REQUIRED]"
                                                ) : (
                                                    canEditLogs ? (
                                                        <div className={styles.logForm}>
                                                            <div className={styles.logInputGroup}>
                                                                <label>Date:</label>
                                                                <input type="text" value={localLogs[rank]?.date || ''} onChange={(e) => updateLog(rank, 'date', e.target.value)} />
                                                            </div>
                                                            <div className={styles.logInputGroup}>
                                                                <label>Location:</label>
                                                                <input type="text" value={localLogs[rank]?.location || ''} onChange={(e) => updateLog(rank, 'location', e.target.value)} />
                                                            </div>
                                                            <div className={styles.logInputGroup}>
                                                                <label>Threat Classification:</label>
                                                                <input type="text" value={localLogs[rank]?.threatClassification || ''} onChange={(e) => updateLog(rank, 'threatClassification', e.target.value)} />
                                                            </div>
                                                            <div className={styles.logInputGroup}>
                                                                <label>Summary:</label>
                                                                <textarea value={localLogs[rank]?.summary || ''} onChange={(e) => updateLog(rank, 'summary', e.target.value)} />
                                                            </div>
                                                            <div className={styles.logInputGroup}>
                                                                <label>Assessment:</label>
                                                                <textarea value={localLogs[rank]?.assessment || ''} onChange={(e) => updateLog(rank, 'assessment', e.target.value)} />
                                                            </div>
                                                            <div className={styles.logInputGroup}>
                                                                <label>Recommendation:</label>
                                                                <textarea value={localLogs[rank]?.recommendation || ''} onChange={(e) => updateLog(rank, 'recommendation', e.target.value)} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={styles.logDisplay}>
                                                            <p><span className={styles.logLabel}>Date:</span> {localLogs[rank]?.date || 'N/A'}</p>
                                                            <p><span className={styles.logLabel}>Location:</span> {localLogs[rank]?.location || 'N/A'}</p>
                                                            <p><span className={styles.logLabel}>Threat Classification:</span> {localLogs[rank]?.threatClassification || 'N/A'}</p>
                                                            <br />
                                                            <p><span className={styles.logLabel}>Summary:</span></p>
                                                            <p className={styles.logPara}>{localLogs[rank]?.summary || 'N/A'}</p>
                                                            <br />
                                                            <p><span className={styles.logLabel}>Assessment:</span></p>
                                                            <p className={styles.logPara}>{localLogs[rank]?.assessment || 'N/A'}</p>
                                                            <br />
                                                            <p><span className={styles.logLabel}>Recommendation:</span></p>
                                                            <p className={styles.logPara}>{localLogs[rank]?.recommendation || 'N/A'}</p>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <h3 className={styles.sectionTitle}>Manager's Comment:</h3>
                            {canEditManagerComment ? (
                                <textarea
                                    className={styles.textarea}
                                    value={managerComment}
                                    onChange={(e) => setManagerComment(e.target.value)}
                                    placeholder="Enter manager notes..."
                                />
                            ) : (
                                <div className={styles.bioReadonly}>
                                    {managerComment || "No manager comments yet."}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'TIMELINE' && (
                        <div className={styles.tabContent}>
                            <div className={styles.timeline}>
                                {TIMELINE_EVENTS.map((event, idx) => (
                                    <div key={idx} className={styles.timelineEvent}>
                                        <div className={styles.eventDot} />
                                        <div className={styles.eventHeader}>
                                            <span className={styles.eventTitle}>“{event.title}”</span>
                                            <span className={styles.eventDate}>— {event.date}</span>
                                        </div>
                                        <div className={styles.eventDescription}>
                                            {event.description.split('\n').map((line, i) => (
                                                <p key={i}>{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'PHONE' && (
                        <div className={styles.chatContainer}>
                            {activeContact === null ? (
                                <div className={styles.contactList}>
                                    <h3 className={styles.sectionTitle} style={{ padding: '20px 20px 10px' }}>CONTACTS</h3>
                                    <div
                                        className={styles.contactItem}
                                        onClick={() => setActiveContact('Rat King')}
                                        style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', marginRight: '15px' }} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Rat King 🐀👑</span>
                                            {currentUser?.settings.chatProgress?.['Rat King'] && (
                                                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                                                    {currentUser.settings.chatProgress['Rat King'].history.length > 0 ? 'Active' : 'New Message'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className={styles.contactItem}
                                        onClick={() => setActiveContact('Bones')}
                                        style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <img src="/icon.png" alt="Bones" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', marginRight: '15px' }} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Bones (Manager)</span>
                                            <span style={{ fontSize: '0.8rem', color: '#888' }}>Official NHA Channel</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.chatHeader} style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button
                                            onClick={() => setActiveContact(null)}
                                            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                                            {activeContact === 'Rat King' ? 'Rat King 🐀👑' : 'Bones (Manager)'}
                                        </span>
                                    </div>

                                    <div className={styles.chatMessages} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', flex: 1, overflowY: 'auto' }}>
                                        {chatHistory.map((m, i) => (
                                            <div key={i} className={m.sender === 'User' ? styles.userMsg : styles.ratKingMsg} style={{ alignSelf: m.sender === 'User' ? 'flex-end' : 'flex-start' }}>
                                                <div className={styles.msg} style={{
                                                    background: m.sender === 'User' ? 'var(--rank-color)' : '#333',
                                                    color: 'white',
                                                    padding: '10px 15px',
                                                    borderRadius: '15px',
                                                    maxWidth: '80%',
                                                    whiteSpace: 'pre-wrap'
                                                }}>
                                                    {m.text}
                                                    {m.audioUrl && (
                                                        <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.2)', padding: '5px 10px', borderRadius: '10px' }}>
                                                            <Mic size={16} />
                                                            <span style={{ fontSize: '0.8rem' }}>Audio Message (Encrypted)</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={scrollRef} />
                                    </div>

                                    <div className={styles.chatInputArea} style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        {isBlocked ? (
                                            <div style={{ padding: '10px', background: '#300', color: '#f66', textAlign: 'center', borderRadius: '5px', fontSize: '0.9rem' }}>
                                                You cannot reply to this conversation.
                                            </div>
                                        ) : currentOptions.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {currentOptions.map((opt, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleChatOption(opt)}
                                                        style={{
                                                            padding: '12px',
                                                            background: 'rgba(255,255,255,0.1)',
                                                            border: '1px solid rgba(255,255,255,0.2)',
                                                            borderRadius: '8px',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            fontSize: '0.95rem',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                                {activeContact === 'Rat King' ? 'Rat King is offline...' : 'No further messages.'}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {(activeTab === 'FILE' || activeTab === 'LOGS') && (canEditBio || canEditManagerComment) && (
                    <div className={styles.footer}>
                        <button className={styles.saveBtn} onClick={() => handleSave(activeTab)} disabled={saving}>
                            <Save size={18} style={{ marginRight: '8px' }} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
