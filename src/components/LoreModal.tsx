'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useHunterStore, UserProfile } from '@/lib/store';
import { calculateOverallRank, Rank } from '@/lib/game-logic';
import { X, Save, Send, Shield, Lock, Eye } from 'lucide-react';
import styles from './LoreModal.module.css';

interface LoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetProfile: UserProfile; // The profile we are viewing/editing
    rankColor: string;
}

const ELEMENTS = ['physical', 'fire', 'water', 'light', 'earth', 'air', 'shadow', 'mind'];
const CLASSES = [
    'Ranger', 'cleric', 'knight', 'necromancer', 'warlock',
    'sorcerer', 'wizard', 'monk', 'shifter', 'elementalist',
    'psionic', 'barbarian', 'bard', 'paladin', 'assassin', 'gunslinger'
];

const RAT_KING_INITIAL = [
    "Heya, Could you do me a favor and tell Bones to leave me the F*CK ALONE!",
    "nvm",
    "i took care of it, lol",
    "even removed myself from the Rankings 😋",
    "You’ve always been there for me, thanks for keeping this chat private, despite it being one way. Im going dark they cant make me fight, if they cant find me\n\nI’ll keep in touch🐀👑"
];

const RAT_KING_C_RANK = [
    "Heya..been a while,",
    "I thought I was done with the NHA, but they kept looking for me, so i looked more into them",
    "I think i found some files related to the Monarch Project, and holy sh*t are these things redacted",
    "I'll work my magic as always. Don't wait up."
];

const RANKS_ORDER: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S'];

export default function LoreModal({ isOpen, onClose, targetProfile, rankColor }: LoreModalProps) {
    const { profile: currentUser, updateLore } = useHunterStore();
    const [activeTab, setActiveTab] = useState<'FILE' | 'LOGS' | 'TIMELINE' | 'RAT KING'>('FILE');
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

    const isCaptainOfTarget = currentUser?.role === 'Captain' && currentUser.agencyId === targetProfile.agencyId;
    const isSelf = currentUser?.id === targetProfile.id;
    const canEditBio = isCaptainOfTarget || isSelf;
    const canEditManagerComment = isCaptainOfTarget;
    const canEditLoreTags = isCaptainOfTarget;

    useEffect(() => {
        if (isOpen) {
            setBio(targetProfile.bio || '');
            setManagerComment(targetProfile.managerComment || '');
            setAffinities(targetProfile.affinities || []);
            setClassTags(targetProfile.classTags || []);
            setVideoUrl(targetProfile.videoUrl || '');

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
                    {['FILE', 'LOGS', 'TIMELINE', 'RAT KING'].map((t) => (
                        <button
                            key={t}
                            className={`${styles.tab} ${activeTab === t ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(t as any)}
                        >
                            {t}
                        </button>
                    ))}
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
                            {canEditLoreTags ? (
                                <select
                                    className={styles.select}
                                    value={classTags[0] || ''}
                                    onChange={(e) => setClassTags([e.target.value])}
                                >
                                    <option value="">Select Class</option>
                                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            ) : (
                                <div className={styles.tagContainer}>
                                    {classTags.length > 0 ? classTags.map(c => (
                                        <span key={c} className={styles.tag}>{c}</span>
                                    )) : <span style={{ color: '#555', fontSize: '0.8rem' }}>Unclassified</span>}
                                </div>
                            )}

                            <h3 className={styles.sectionTitle}>{targetProfile.name.toUpperCase()} - INTERVIEW</h3>
                            {videoUrl ? (
                                <iframe
                                    src={videoUrl.replace('watch?v=', 'embed/')}
                                    className={styles.videoFrame}
                                    frameBorder="0"
                                    allowFullScreen
                                />
                            ) : (
                                <div className={styles.videoPlaceholder}>
                                    No interview available
                                </div>
                            )}
                            {canEditBio && (
                                <input
                                    type="text"
                                    className={styles.chatInput}
                                    style={{ marginTop: '10px' }}
                                    placeholder="Enter Video URL (Youtube/Vimeo)"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                />
                            )}
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
                                                SISYPHUS {rank}-RANK MISSION LOG #{(idx + 1) * 123}:
                                            </div>
                                            <div className={`${styles.logContent} ${!isUnlocked ? styles.redacted : ''}`}>
                                                {!isUnlocked ? (
                                                    "[RESTRICTED DATA] [RANK " + rank + " REQUIRED]"
                                                ) : (
                                                    "Mission successful. Hunter demonstrated exceptional combat capabilities and strategic thinking. Further monitoring recommended."
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
                        <div className={styles.videoPlaceholder}>
                            Timeline data pending...
                        </div>
                    )}

                    {activeTab === 'RAT KING' && (
                        <div className={styles.chatContainer}>
                            <div className={styles.chatMessages}>
                                {chatHistory.map((m, i) => (
                                    <div key={i} className={m.sender === 'Rat King' ? styles.ratKingMsg : styles.userMsg}>
                                        <div className={styles.msg}>
                                            {m.text}
                                            {m.error && <p className={styles.msgError}>Message failed to deliver</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.chatInputArea}>
                                <input
                                    type="text"
                                    className={styles.chatInput}
                                    placeholder="Message..."
                                    value={chatMsg}
                                    onChange={(e) => setChatMsg(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button className={styles.sendBtn} onClick={handleSendMessage}>
                                    <Send size={20} />
                                </button>
                            </div>
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
