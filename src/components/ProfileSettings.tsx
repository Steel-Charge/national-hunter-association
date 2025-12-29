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
    { id: 'Common', name: 'Common Frame' },
    { id: 'Rare', name: 'Rare Frame' },
    { id: 'Epic', name: 'Epic Frame' },
    { id: 'Legendary', name: 'Legendary Frame' },
    { id: 'Mythic', name: 'Mythic Frame' },
    { id: 'Event', name: 'Event Frame' }
];

export default function ProfileSettings({ isOpen, onClose }: ProfileSettingsProps) {
    const { profile, updateAvatar, updateName, setActiveTitle, setActiveFrame } = useHunterStore();
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
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeBtn}>
                    <X size={24} />
                </button>

                <h2 className={styles.title}>PROFILE SETTINGS</h2>

                <div className={styles.content}>
                    {/* Avatar Section */}
                    <div className={styles.section}>
                        <div className={styles.avatarContainer}>
                            <div
                                className={styles.avatarPreview}
                                style={{ backgroundImage: `url(${localAvatar || '/placeholder.png'})` }}
                            />
                            <button
                                className={styles.cameraBtn}
                                onClick={() => fileInputRef.current?.click()}
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
                        <label className={styles.label}>
                            <UserIcon size={16} /> HUNTER NAME
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            placeholder="Enter Name"
                        />
                    </div>

                    {/* Title Section */}
                    <div className={styles.section}>
                        <label className={styles.label}>
                            <Award size={16} /> ACTIVE TITLE
                        </label>
                        <select
                            className={styles.select}
                            value={localTitle?.name || ''}
                            onChange={(e) => {
                                const title = profile.unlockedTitles.find(t => t.name === e.target.value);
                                if (title) setLocalTitle(title);
                            }}
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
                        <label className={styles.label}>
                            <Layout size={16} /> PROFILE FRAME
                        </label>
                        <select
                            className={styles.select}
                            value={localFrame}
                            onChange={(e) => setLocalFrame(e.target.value)}
                        >
                            {AVAILABLE_FRAMES.map((f) => {
                                const isUnlocked = unlockedFrames.includes(f.id);
                                return (
                                    <option key={f.id} value={f.id} disabled={!isUnlocked}>
                                        {f.name} {!isUnlocked && '[LOCKED]'}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    <Save size={20} /> {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
            </div>
        </div>
    );
}
