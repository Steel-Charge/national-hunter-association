'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useHunterStore, UserProfile } from '@/lib/store';
import { calculateOverallRank, Rank } from '@/lib/game-logic';
import { X, Save, Send, Shield, Lock, Eye, ChevronLeft } from 'lucide-react';
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
        description: "On December 29, 2021 at 00:00:01 (UTC+2), all government organizations worldwide received an identical message from an unknown sender:\n\n“PREPARE FOR REGRET”\n\nAnalysis revealed the transmission originated from a device with:\n- A timestamp 50 years in the future\n- A serial number linked to hardware not yet manufactured\n\nThe incident was officially classified as an elaborate hoax, and Global Command agreed to take no action."
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
        description: "On September 7, 2024, the National Hunter Association (NHA) was officially established.\n\nWhile drafting his inaugural announcement to registered Hunters, the NHA Director received another message—originating from the same unidentified future device as in 2021.\n\nThe message read:\n\n“ONLY THE CREATION OF A MONARCH CAN SAVE US…”"
    },
    {
        title: "The Monarch Project",
        date: "2025",
        description: "On February 20, 2025, the NHA initiated the Monarch Project.\n\nWith no confirmed understanding of what a Monarch is, the project’s goal is to:\n- Force or induce Hunters to evolve beyond known rank limitations\n- Create temporary protectors capable of defending the nation until a true Monarch emerges\n\nThe Top 50 strongest Hunters were each assigned a command group known as Agencies, tasked with training, controlling, and testing large numbers of Hunters under extreme conditions."
    }
];

const RAT_KING_INITIAL = [
    "Heya, Could you do me a favor and tell Bones to leave me the F*CK ALONE!",
    "nvm",
    "I took care of it, lol",
    "even removed myself from the Rankings 😋",
    "You’ve always been there for me, thanks for keeping this chat private, despite it being one way.\n\nI'm going dark they cant make me fight if they cant find me\n\nI’ll keep in touch\n\n🐀👑"
];

const RAT_KING_C_RANK = [
    "Heya..been a while,",
    "I thought I was done with the NHA, but they kept looking for me, so I looked more into them",
    "I think I found some files related to the Monarch Project,\n\nand holy sh*t are these things redacted",
    "I'll work my magic as always. Don't wait up."
];

const RANKS_ORDER: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S'];

export default function LoreModal({ isOpen, onClose, targetProfile, rankColor }: LoreModalProps) {
    const { profile: currentUser, updateLore } = useHunterStore();
    const [activeTab, setActiveTab] = useState<'FILE' | 'LOGS' | 'TIMELINE' | 'PHONE'>('FILE');
    const [activeContact, setActiveContact] = useState<'Rat King' | 'Bones' | null>(null);
    const [saving, setSaving] = useState(false);

    // Editable states
    const [bio, setBio] = useState(targetProfile.bio || '');
    const [managerComment, setManagerComment] = useState(targetProfile.managerComment || '');
    const [affinities, setAffinities] = useState<string[]>(targetProfile.affinities || []);
    const [classTags, setClassTags] = useState<string[]>(targetProfile.classTags || []);
    const [videoUrl, setVideoUrl] = useState(targetProfile.videoUrl || '');

    // Chat state
    const [chatMsg, setChatMsg] = useState('');
    const [chatHistory, setChatHistory] = useState<{ sender: 'Rat King' | 'User', text: string, error?: boolean }[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);

    const isSelf = currentUser?.id === targetProfile.id;
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

    useEffect(() => {
        if (isOpen) {
            setBio(targetProfile.bio || '');
            setManagerComment(targetProfile.managerComment || '');
            setAffinities(targetProfile.affinities || []);
            setClassTags(targetProfile.classTags || []);
            setVideoUrl(targetProfile.videoUrl || '');

            // Logs
            const initialLogs = { ...DEFAULT_LOGS };
            if (targetProfile.missionLogs) {
                // Normalize logs - if they were strings, wrap them in summary
                Object.entries(targetProfile.missionLogs).forEach(([rank, val]) => {
                    if (typeof val === 'string') {
                        initialLogs[rank] = { ...DEFAULT_LOGS[rank], summary: val };
                    } else {
                        initialLogs[rank] = val as MissionLog;
                    }
                });
            }
            setLocalLogs(initialLogs);

            // Generate Rat King chat history
            const targetRank = calculateOverallRank(targetProfile.testScores, targetProfile.profileType);
            const rankIdx = RANKS_ORDER.indexOf(targetRank as Rank);
            const cRankIdx = RANKS_ORDER.indexOf('C');

            let history = RAT_KING_INITIAL.map(text => ({ sender: 'Rat King' as const, text }));
            if (rankIdx >= cRankIdx) {
                history = [...history, ...RAT_KING_C_RANK.map(text => ({ sender: 'Rat King' as const, text }))];
            }
            setChatHistory(history);
        }
    }, [isOpen, targetProfile]);

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

    const handleSendMessage = () => {
        if (!chatMsg.trim()) return;
        setChatHistory(prev => [...prev, { sender: 'User', text: chatMsg, error: true }]);
        setChatMsg('');
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
                                        <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Rat King 🐀👑</span>
                                    </div>
                                    <div
                                        className={styles.contactItem}
                                        onClick={() => setActiveContact('Bones')}
                                        style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <img src="/icon.png" alt="Bones" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', marginRight: '15px' }} />
                                        <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Bones (Manager)</span>
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

                                    <div className={styles.chatMessages} style={{ height: 'calc(100% - 130px)' }}>
                                        {activeContact === 'Rat King' ? (
                                            chatHistory.map((m, i) => (
                                                <div key={i} className={m.sender === 'Rat King' ? styles.ratKingMsg : styles.userMsg}>
                                                    <div className={styles.msg}>
                                                        {m.text}
                                                        {m.error && <p className={styles.msgError}>Message failed to deliver</p>}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className={styles.ratKingMsg}>
                                                <div className={styles.msg}>
                                                    To my forced reluctance you've be assigned to my Agency.so...Welcome to ICARUS, if you mess up, I legally can't boot you, but you will wish I could.
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.chatInputArea}>
                                        <input
                                            type="text"
                                            className={styles.chatInput}
                                            placeholder="Message..."
                                            value={chatMsg}
                                            onChange={(e) => setChatMsg(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            disabled={activeContact === 'Bones'}
                                        />
                                        <button className={styles.sendBtn} onClick={handleSendMessage} disabled={activeContact === 'Bones'}>
                                            <Send size={20} />
                                        </button>
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
