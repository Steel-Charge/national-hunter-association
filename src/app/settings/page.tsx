'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useHunterStore, UserSettings, Title } from '@/lib/store';
import { Rank } from '@/lib/game-logic';
import Navbar from '@/components/Navbar';
import { LogOut, Image as ImageIcon, Calculator, Palette, Award, Save } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './page.module.css';

const RANKS: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S'];

export default function SettingsPage() {
    const { profile, loading, logout, updateAvatar, updateSettings, setActiveTitle, getOverallRank, getTheme } = useHunterStore();
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
    // Use local theme if selected, otherwise current theme
    const currentTheme = localTheme || themeRank;
    const rankColor = `var(--rank-${currentTheme.toLowerCase()})`;

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    // --- Handlers ---

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
            // Limit file size to 1MB to prevent DB issues
            if (file.size > 1024 * 1024) {
                alert('File is too large! Please choose an image under 1MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                console.log('File converted to Base64, length:', base64.length);
                setLocalAvatar(base64);
                setHasChanges(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleStatsCalculator = () => {
        setLocalStatsCalc(!localStatsCalc);
        setHasChanges(true);
    };

    const handleThemeChange = (rank: Rank) => {
        setLocalTheme(rank);
        // Deselect any special rarity theme when choosing a rank theme
        setLocalSpecialTheme(null);
        setHasChanges(true);
    };

    const toggleSpecialTheme = (rarity: 'rare' | 'epic' | 'legendary' | 'mythic') => {
        const newVal = localSpecialTheme === rarity ? null : rarity;
        setLocalSpecialTheme(newVal);
        // If selecting a special theme, clear the rank theme selection
        if (newVal) setLocalTheme(null);
        setHasChanges(true);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const titleName = e.target.value;
        const title = profile.unlockedTitles.find(t => t.name === titleName);
        if (title) {
            setLocalActiveTitle(title);
            setHasChanges(true);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalName(e.target.value);
        setHasChanges(true);
    };

    const handlePasswordUpdate = async () => {
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
        // Commit all changes to store/DB
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

    // Helper to check if a rank is unlocked (<= overall rank)
    const isRankUnlocked = (rank: Rank) => {
        const rankValues: Record<Rank, number> = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 };
        return rankValues[rank] <= rankValues[overallRank];
    };

    // Count titles by rarity to determine unlocks for rarity themes
    const countTitlesByRarity = (rarity: string) => profile.unlockedTitles.filter(t => (t.rarity || '').toLowerCase() === rarity.toLowerCase()).length;
    const rareUnlocked = countTitlesByRarity('Rare') >= 2;
    const epicUnlocked = countTitlesByRarity('Epic') >= 2;
    const legendaryUnlocked = countTitlesByRarity('Legendary') >= 2;
    const mythicUnlocked = countTitlesByRarity('Mythic') >= 2;

    return (
        <div className="container" style={{ '--rank-color': rankColor } as React.CSSProperties}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                    SETTINGS
                </h1>
            </div>

            {/* Theme Section - FILTERED TO ONLY SHOW UNLOCKED */}
            <div className={styles.section} style={{ borderColor: `${rankColor}44` }}>
                <h2 className={styles.sectionTitle} style={{ color: rankColor }}>
                    <Palette size={20} /> Change Theme
                </h2>
                <div className={styles.themeGrid}>
                    {RANKS.map((rank) => {
                        const unlocked = isRankUnlocked(rank);
                        if (!unlocked) return null; // HIDE LOCKED THEMES

                        const isActive = (localTheme || overallRank) === rank;
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

                    {/* Rarity themes - ALSO HIDE LOCKED */}
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

            {/* Reset Password Section */}
            <div className={styles.section} style={{ borderColor: `${rankColor}44` }}>
                <h2 className={styles.sectionTitle} style={{ color: rankColor }}>
                    Reset Password
                </h2>
                <div className={styles.row} style={{ flexDirection: 'column', gap: '15px', alignItems: 'stretch' }}>
                    <input
                        type="password"
                        value={localPassword}
                        onChange={(e) => setLocalPassword(e.target.value)}
                        placeholder="New Password"
                        className={styles.select}
                        style={{ borderColor: rankColor }}
                    />
                    <input
                        type="password"
                        value={localPasswordConfirm}
                        onChange={(e) => setLocalPasswordConfirm(e.target.value)}
                        placeholder="Confirm New Password"
                        className={styles.select}
                        style={{ borderColor: rankColor }}
                    />
                    <button
                        className={styles.themeBtn}
                        onClick={handlePasswordUpdate}
                        style={{ backgroundColor: `${rankColor}22`, borderColor: rankColor }}
                    >
                        Update Password
                    </button>
                </div>
            </div>

            {/* Save Button for Theme */}
            {hasChanges && (
                <div className={styles.saveContainer}>
                    <button className={styles.saveBtn} onClick={saveChanges} style={{ backgroundColor: rankColor, boxShadow: `0 0 15px ${rankColor}` }}>
                        <Save size={20} /> Save Changes
                    </button>
                </div>
            )}

            {/* Save Message Popup */}
            {saveMessage && (
                <div className={styles.popup}>
                    {saveMessage}
                </div>
            )}

            {/* Logout Button */}
            <button className={styles.logoutBtn} onClick={handleLogout}>
                <LogOut size={20} /> Log Out
            </button>

            <Navbar />
        </div>
    );
}
