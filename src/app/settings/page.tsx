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
    const [localActiveTitle, setLocalActiveTitle] = useState<Title | null>(null);

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
            setLocalActiveTitle(profile.activeTitle);
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

    const saveChanges = async () => {
        // Commit all changes to store/DB
        if (localAvatar !== profile.avatarUrl) await updateAvatar(localAvatar);

        if (localStatsCalc !== profile.settings.statsCalculator || localTheme !== profile.settings.theme) {
            await updateSettings({
                statsCalculator: localStatsCalc,
                theme: localTheme
            });
        }

        if (localActiveTitle && localActiveTitle.name !== profile.activeTitle.name) {
            await setActiveTitle(localActiveTitle);
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

    return (
        <div className="container" style={{ '--rank-color': rankColor } as React.CSSProperties}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                    SETTINGS
                </h1>
            </div>

            {/* Profile Image Section */}
            <div className={styles.section} style={{ borderColor: `${rankColor}44` }}>
                <h2 className={styles.sectionTitle} style={{ color: rankColor }}>
                    <ImageIcon size={20} /> Change Profile Image
                </h2>
                {localAvatar && (
                    <div className={styles.avatarPreview} style={{ backgroundImage: `url(${localAvatar})` }} />
                )}
                <div className={styles.row} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.fileInput}
                        ref={fileInputRef}
                    />
                    <button
                        className={styles.themeBtn}
                        onClick={() => fileInputRef.current?.click()}
                        style={{ marginTop: '10px' }}
                    >
                        Upload Image
                    </button>
                </div>
            </div>

            {/* Active Title Section */}
            <div className={styles.section} style={{ borderColor: `${rankColor}44` }}>
                <h2 className={styles.sectionTitle} style={{ color: rankColor }}>
                    <Award size={20} /> Set Active Title
                </h2>
                <div className={styles.row}>
                    <select
                        className={styles.select}
                        value={localActiveTitle?.name || ''}
                        onChange={handleTitleChange}
                        style={{ borderColor: rankColor }}
                    >
                        {profile.unlockedTitles.map((title, i) => (
                            <option key={i} value={title.name}>
                                {title.name} ({title.rarity})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Calculator Section - Only visible for admins */}
            {profile.isAdmin && (
                <div className={styles.section} style={{ borderColor: `${rankColor}44` }}>
                    <h2 className={styles.sectionTitle} style={{ color: rankColor }}>
                        <Calculator size={20} /> Stats Calculator
                    </h2>
                    <div className={styles.row}>
                        <span className={styles.label}>Enable Stats Updates</span>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={localStatsCalc}
                                onChange={toggleStatsCalculator}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>
                </div>
            )}

            {/* Theme Section */}
            <div className={styles.section} style={{ borderColor: `${rankColor}44` }}>
                <h2 className={styles.sectionTitle} style={{ color: rankColor }}>
                    <Palette size={20} /> Change Theme
                </h2>
                <div className={styles.themeGrid}>
                    {RANKS.map((rank) => {
                        const unlocked = isRankUnlocked(rank);
                        const isActive = (localTheme || overallRank) === rank;
                        const rColor = `var(--rank-${rank.toLowerCase()})`;

                        return (
                            <button
                                key={rank}
                                className={`${styles.themeBtn} ${isActive ? styles.active : ''}`}
                                onClick={() => unlocked && handleThemeChange(rank)}
                                disabled={!unlocked}
                                style={isActive ? { borderColor: rColor, boxShadow: `0 0 10px ${rColor}`, color: rColor } : {}}
                            >
                                {rank}-Rank
                                {!unlocked && <span style={{ display: 'block', fontSize: '0.7rem' }}>[LOCKED]</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Save Button */}
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
