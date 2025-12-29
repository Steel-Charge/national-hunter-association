'use client';

import { useState, useRef, useEffect } from 'react';
import { useHunterStore, Title } from '@/lib/store';
import { X, Camera, Save, User as UserIcon, Award, Layout } from 'lucide-react';
import styles from './ProfileSettings.module.css';

interface ProfileSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const AVAILABLE_FRAMES = [
    { id: 'Common', name: 'Common' },
    { id: 'Rare', name: 'Rare' },
    { id: 'Epic', name: 'Epic' },
    { id: 'Legendary', name: 'Legendary' },
    { id: 'Mythic', name: 'Mythic' },
    { id: 'Event', name: 'Event' },
    { id: 'E', name: 'E-Rank' },
    { id: 'D', name: 'D-Rank' },
    { id: 'C', name: 'C-Rank' },
    { id: 'B', name: 'B-Rank' },
    { id: 'A', name: 'A-Rank' },
    { id: 'S', name: 'S-Rank' },
    { id: 'Streak of Lightning', name: 'Streak of Lightning' },
    { id: 'Sovreign of the Gale', name: 'Sovreign of the Gale' },
    { id: 'Unshakable Will', name: 'Unshakable Will' },
    { id: 'The Unfallen King', name: 'The Unfallen King' },
    { id: 'Tactical Master', name: 'Tactical Master' },
    { id: 'Echo of a Thousand Plans', name: 'Echo of a Thousand Plans' },
    { id: 'Flame of Will', name: 'Flame of Will' },
    { id: 'Phoenix Soul', name: 'Phoenix Soul' },
    { id: 'Wild Instinct', name: 'Wild Instinct' },
    { id: 'Beastmaster', name: 'Beastmaster' },
    { id: 'Relentless Chase', name: 'Relentless Chase' },
    { id: 'Crimson Seeker', name: 'Crimson Seeker' },
    { id: 'Precision Breaker', name: 'Precision Breaker' },
    { id: 'Fist of Ruin', name: 'Fist of Ruin' },
    { id: 'Sink or Rise', name: 'Sink or Rise' },
    { id: 'Warden of the Abyss', name: 'Warden of the Abyss' },
    { id: 'Flashstorm', name: 'Flashstorm' },
    { id: 'Thunderborn Tyrant', name: 'Thunderborn Tyrant' },
    { id: 'Balance Through Chaos', name: 'Balance Through Chaos' },
    { id: 'Soulbreaker Sage', name: 'Soulbreaker Sage' },
    { id: 'Edge Dancer', name: 'Edge Dancer' },
    { id: 'Ghost of the Edge', name: 'Ghost of the Edge' }
];

import { RANK_COLORS, Rank, calculateOverallRank } from '@/lib/game-logic';

export default function ProfileSettings({ isOpen, onClose }: ProfileSettingsProps) {
    const { profile, updateAvatar, updateName, setActiveTitle, setActiveFrame, getTheme } = useHunterStore();
    const themeRank = getTheme();
    const rankColor = RANK_COLORS[themeRank as Rank] || '#00e5ff';
    const [localName, setLocalName] = useState('');
    const [localAvatar, setLocalAvatar] = useState('');
    const [localTitle, setLocalTitle] = useState<Title | null>(null);
    const [localFrame, setLocalFrame] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (profile) {
            setLocalName(profile.name);
            setLocalAvatar(profile.avatarUrl || '');
            setLocalTitle(profile.activeTitle);
            setLocalFrame(profile.activeFrame || 'Common');
        }
    }, [profile, isOpen]);

    if (!isOpen || !profile) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                alert('File is too large! Please choose an image under 1MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (localAvatar !== profile.avatarUrl) {
                await updateAvatar(localAvatar);
            }
            if (localName !== profile.name) {
                const res = await updateName(localName);
                if (!res.success) {
                    alert(res.error);
                    setIsSaving(false);
                    return;
                }
            }
            if (localTitle && localTitle.name !== profile.activeTitle?.name) {
                await setActiveTitle(localTitle);
            }
            if (localFrame !== profile.activeFrame) {
                await setActiveFrame(localFrame);
            }
            alert('Profile updated successfully!');
            onClose();
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const unlockedFrames = profile.unlockedFrames || ['Common'];

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ '--theme-color': rankColor } as React.CSSProperties}>
                <button onClick={onClose} className={styles.closeBtn}>
                    <X size={24} />
                </button>

                <h2 className={styles.title} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}44` }}>PROFILE SETTINGS</h2>

                <div className={styles.content}>
                    {/* Avatar Section */}
                    <div className={styles.section}>
                        <div className={styles.avatarContainer}>
                            <div
                                className={styles.avatarPreview}
                                style={{
                                    backgroundImage: `url(${localAvatar || '/placeholder.png'})`,
                                    borderColor: `${rankColor}44`
                                }}
                            />
                            <button
                                className={styles.cameraBtn}
                                onClick={() => fileInputRef.current?.click()}
                                style={{ backgroundColor: rankColor }}
                            >
                                <Camera size={16} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Name Section */}
                    <div className={styles.section}>
                        <label className={styles.label} style={{ color: `${rankColor}aa` }}>
                            <UserIcon size={16} /> HUNTER NAME
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            placeholder="Enter Name"
                            style={{ borderColor: `${rankColor}33` }}
                        />
                    </div>

                    {/* Title Section */}
                    <div className={styles.section}>
                        <label className={styles.label} style={{ color: `${rankColor}aa` }}>
                            <Award size={16} /> ACTIVE TITLE
                        </label>
                        <select
                            className={styles.select}
                            value={localTitle?.name || ''}
                            onChange={(e) => {
                                const title = profile.unlockedTitles.find(t => t.name === e.target.value);
                                if (title) setLocalTitle(title);
                            }}
                            style={{ borderColor: `${rankColor}33` }}
                        >
                            {profile.unlockedTitles.map((t) => (
                                <option key={t.name} value={t.name}>
                                    {t.name} ({t.rarity})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Frame Section */}
                    <div className={styles.section}>
                        <label className={styles.label} style={{ color: `${rankColor}aa` }}>
                            <Layout size={16} /> PROFILE FRAME
                        </label>
                        <select
                            className={styles.select}
                            value={localFrame}
                            onChange={(e) => setLocalFrame(e.target.value)}
                            style={{ borderColor: `${rankColor}33` }}
                        >
                            {AVAILABLE_FRAMES.filter(f => unlockedFrames.includes(f.id)).map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                        backgroundColor: rankColor,
                        boxShadow: `0 0 20px ${rankColor}44`,
                        color: '#000'
                    }}
                >
                    <Save size={20} /> {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
            </div>
        </div>
    );
}
