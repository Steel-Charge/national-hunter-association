'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useHunterStore, Title } from '@/lib/store';
import { usePWA } from '@/context/PWAContext';
import { Rank } from '@/lib/game-logic';
import Navbar from '@/components/Navbar';
import { LogOut, Palette, Lock, Download, Save } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './page.module.css';
import { playSound } from '@/lib/audio';

const RANKS: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S'];

export default function SettingsPage() {
    const { profile, loading, logout, updateAvatar, updateSettings, setActiveTitle, getOverallRank, getTheme } = useHunterStore();
    const { installPWA, isInstallable } = usePWA();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Local State for Manual Save
    const [localAvatar, setLocalAvatar] = useState<string>('');
    const [localStatsCalc, setLocalStatsCalc] = useState<boolean>(true);
    const [localTheme, setLocalTheme] = useState<Rank | null>(null);
    const [localSpecialTheme, setLocalSpecialTheme] = useState<'rare' | 'epic' | 'legendary' | 'mythic' | null>(null);
    const [localActiveTitle, setLocalActiveTitle] = useState<Title | null>(null);
    const [localName, setLocalName] = useState<string>('');
    const [localPassword, setLocalPassword] = useState<string>('');
    const [localPasswordConfirm, setLocalPasswordConfirm] = useState<string>('');

    const [hasChanges, setHasChanges] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (!loading && !profile) {
            router.push('/');
        } else if (profile) {
            // Initialize local state
            setLocalAvatar(profile.avatarUrl || '');
            setLocalStatsCalc(profile.settings.statsCalculator);
            setLocalTheme(profile.settings.theme);
            setLocalSpecialTheme(profile.settings.specialTheme || null);
            setLocalActiveTitle(profile.activeTitle);
            setLocalName(profile.name);
        }
    }, [loading, profile, router]);

    if (loading || !profile) return <LoadingScreen loading={loading} rank={getTheme()} />;

    const overallRank = getOverallRank();
    const themeRank = getTheme();
    // Prefer local special theme, then local rank theme, then fallback to current theme rank
    const currentTheme = localSpecialTheme || localTheme || themeRank;
    const rankColor = currentTheme.length === 1
        ? `var(--rank-${currentTheme.toLowerCase()})`
        : `var(--rarity-${currentTheme.toLowerCase()})`;

    const handleLogout = () => {
        playSound('click');
        logout();
        router.push('/');
    };

    // --- Handlers ---

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                alert('File is too large! Please choose an image under 1MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setLocalAvatar(base64);
                setHasChanges(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleThemeChange = (rank: Rank) => {
        playSound('click');
        setLocalTheme(rank);
        setLocalSpecialTheme(null);
        setHasChanges(true);
    };

    const toggleSpecialTheme = (rarity: 'rare' | 'epic' | 'legendary' | 'mythic') => {
        playSound('click');
        const newVal = localSpecialTheme === rarity ? null : rarity;
        setLocalSpecialTheme(newVal);
        if (newVal) setLocalTheme(null);
        setHasChanges(true);
    };

    const handlePasswordUpdate = async () => {
        playSound('click');
        if (!localPassword) {
            setSaveMessage('Password cannot be empty');
            return;
        }
        if (localPassword !== localPasswordConfirm) {
            setSaveMessage('Passwords do not match');
            return;
        }

        const result = await useHunterStore.getState().updatePassword(localPassword);
        if (result.success) {
            setSaveMessage('Password Reset Successful!');
            setLocalPassword('');
            setLocalPasswordConfirm('');
        } else {
            setSaveMessage(`Error: ${result.error}`);
        }
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const saveChanges = async () => {
        playSound('click');
        if (localAvatar !== profile.avatarUrl) await updateAvatar(localAvatar);

        if (localStatsCalc !== profile.settings.statsCalculator || localTheme !== profile.settings.theme || localSpecialTheme !== profile.settings.specialTheme) {
            await updateSettings({
                statsCalculator: localStatsCalc,
                theme: localTheme,
                specialTheme: localSpecialTheme
            });
        }

        if (localActiveTitle && localActiveTitle.name !== profile.activeTitle?.name) {
            await setActiveTitle(localActiveTitle);
        }

        if (localName !== profile.name) {
            const result = await useHunterStore.getState().updateName(localName);
            if (!result.success) {
                setSaveMessage(`Error: ${result.error}`);
                setTimeout(() => setSaveMessage(''), 3000);
                return;
            }
        }

        setHasChanges(false);
        setSaveMessage('Settings Saved Successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const isRankUnlocked = (rank: Rank) => {
        const rankValues: Record<Rank, number> = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 };
        return rankValues[rank] <= rankValues[overallRank];
    };

    const countTitlesByRarity = (rarity: string) => profile.unlockedTitles.filter(t => (t.rarity || '').toLowerCase() === rarity.toLowerCase()).length;
    const rareUnlocked = countTitlesByRarity('Rare') >= 2;
    const epicUnlocked = countTitlesByRarity('Epic') >= 2;
    const legendaryUnlocked = countTitlesByRarity('Legendary') >= 2;
    const mythicUnlocked = countTitlesByRarity('Mythic') >= 2;

    return (
        <div className="container" style={{ '--rank-color': rankColor } as React.CSSProperties}>
            <Navbar />

            <div className={styles.header}>
                <h1 className={styles.pageTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                    SETTINGS
                </h1>
            </div>

            {/* Theme Section */}
            <div className={styles.section} style={{ borderColor: `${rankColor}44` }}>
                <h2 className={styles.sectionTitle} style={{ color: rankColor }}>
                    <Palette size={20} /> Change Theme
                </h2>
                <div className={styles.themeGrid}>
                    {RANKS.map((rank) => {
                        const unlocked = isRankUnlocked(rank);
                        if (!unlocked) return null;

                        const isActive = !localSpecialTheme && (localTheme || themeRank) === rank;
                        const rColor = `var(--rank-${rank.toLowerCase()})`;

                        return (
                            <button
                                key={rank}
                                className={`${styles.themeBtn} ${isActive ? styles.active : ''}`}
                                onClick={() => handleThemeChange(rank)}
                                style={isActive ? { borderColor: rColor, boxShadow: `0 0 10px ${rColor}`, color: rColor } : {}}
                            >
                                {rank}-Rank
                            </button>
                        );
                    })}

                    {rareUnlocked && (
                        <button
                            className={`${styles.themeBtn} ${localSpecialTheme === 'rare' ? styles.active : ''}`}
                            onClick={() => toggleSpecialTheme('rare')}
                            style={localSpecialTheme === 'rare' ? { borderColor: 'var(--rarity-rare)', boxShadow: `0 0 10px var(--rarity-rare)`, color: 'var(--rarity-rare)' } : {}}
                        >
                            Rare Theme
                        </button>
                    )}

                    {epicUnlocked && (
                        <button
                            className={`${styles.themeBtn} ${localSpecialTheme === 'epic' ? styles.active : ''}`}
                            onClick={() => toggleSpecialTheme('epic')}
                            style={localSpecialTheme === 'epic' ? { borderColor: 'var(--rarity-epic)', boxShadow: `0 0 10px var(--rarity-epic)`, color: 'var(--rarity-epic)' } : {}}
                        >
                            Epic Theme
                        </button>
                    )}

                    {legendaryUnlocked && (
                        <button
                            className={`${styles.themeBtn} ${localSpecialTheme === 'legendary' ? styles.active : ''}`}
                            onClick={() => toggleSpecialTheme('legendary')}
                            style={localSpecialTheme === 'legendary' ? { borderColor: 'var(--rarity-legendary)', boxShadow: `0 0 10px var(--rarity-legendary)`, color: 'var(--rarity-legendary)' } : {}}
                        >
                            Legendary Theme
                        </button>
                    )}

                    {mythicUnlocked && (
                        <button
                            className={`${styles.themeBtn} ${localSpecialTheme === 'mythic' ? styles.active : ''}`}
                            onClick={() => toggleSpecialTheme('mythic')}
                            style={localSpecialTheme === 'mythic' ? { borderColor: 'var(--rarity-mythic)', boxShadow: `0 0 10px var(--rarity-mythic)`, color: 'var(--rarity-mythic)' } : {}}
                        >
                            Mythic Theme
                        </button>
                    )}
                </div>
            </div>

            {/* Password Section */}
            <div className={styles.section} style={{ borderColor: `${rankColor}44` }}>
                <h2 className={styles.sectionTitle} style={{ color: rankColor }}>
                    <Lock size={20} /> Security
                </h2>
                <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        type="password"
                        placeholder="New Password"
                        value={localPassword}
                        onChange={(e) => setLocalPassword(e.target.value)}
                        className={styles.input}
                        style={{ borderColor: `${rankColor}44`, padding: '10px', background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: '4px' }}
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={localPasswordConfirm}
                        onChange={(e) => setLocalPasswordConfirm(e.target.value)}
                        className={styles.input}
                        style={{ borderColor: `${rankColor}44`, padding: '10px', background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: '4px' }}
                    />
                    <button
                        className={styles.themeBtn}
                        onClick={handlePasswordUpdate}
                        style={{ borderColor: rankColor, color: rankColor }}
                    >
                        Update Password
                    </button>
                </div>
            </div>

            {/* Account Actions */}
            <div className={styles.section} style={{ borderColor: `${rankColor}44` }}>
                <div className={styles.actionRow} style={{ display: 'flex', gap: '15px' }}>
                    <button className={styles.logoutBtn} onClick={handleLogout} style={{ flex: 1 }}>
                        <LogOut size={20} /> Log Out
                    </button>
                    {isInstallable && (
                        <button
                            className={styles.themeBtn}
                            onClick={() => { playSound('click'); installPWA(); }}
                            style={{ flex: 1, borderColor: '#00cc66', color: '#00cc66' }}
                        >
                            <Download size={20} /> Install App
                        </button>
                    )}
                </div>
            </div>

            {/* Floating Save Button */}
            {hasChanges && (
                <div className={styles.saveContainer} style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 100 }}>
                    <button
                        className={styles.saveBtn}
                        onClick={saveChanges}
                        style={{
                            backgroundColor: rankColor,
                            color: '#000',
                            fontWeight: 'bold',
                            padding: '12px 24px',
                            borderRadius: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: `0 0 20px ${rankColor}`
                        }}
                    >
                        <Save size={20} /> SAVE CHANGES
                    </button>
                </div>
            )}

            {saveMessage && (
                <div className={styles.popup} style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: rankColor, color: '#000', padding: '10px 20px', borderRadius: '8px', zIndex: 1000 }}>
                    {saveMessage}
                </div>
            )}
        </div>
    );
}
