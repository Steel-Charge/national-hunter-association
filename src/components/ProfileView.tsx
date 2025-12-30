import { useState } from 'react';
import styles from '@/app/home/page.module.css';
import { UserProfile, useHunterStore, getDisplayTitle, isDefaultTitle } from '@/lib/store';
import { Pencil, X } from 'lucide-react';
import TitleSelectionModal from './TitleSelectionModal';

interface ProfileViewProps {
    profile: UserProfile;
    overallRank: string;
    themeRank: string;
    specialTheme?: 'rare' | 'epic' | 'legendary' | 'mythic' | null;
    canRemoveTitles?: boolean;
    isOwnProfile?: boolean;
}

export default function ProfileView({ profile, overallRank, themeRank, specialTheme, canRemoveTitles = false, isOwnProfile = false }: ProfileViewProps) {
    const { removeTitle } = useHunterStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const colorVar = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    // Filter unlocked titles to only show those that are NOT hidden
    const displayedTitles = profile.unlockedTitles.filter(t => !t.is_hidden);

    const handleRemoveTitle = async (titleName: string) => {
        if (window.confirm(`Are you sure you want to remove the title "${titleName}"?`)) {
            await removeTitle(profile.id, titleName);
        }
    };

    return (
        <div className={styles.content}>
            <div className={styles.profileSection}>
                <div className={styles.info}>
                    <h1
                        className={`${styles.name} ${specialTheme === 'mythic' ? 'mythic-text' : ''}`}
                        style={specialTheme === 'mythic' ? {} : { color: colorVar, textShadow: `0 0 10px ${colorVar}` }}
                    >
                        {profile.name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                        {(() => {
                            const titleName = profile.activeTitle?.name || 'Hunter';
                            const rarity = profile.activeTitle?.rarity || 'Common';
                            const displayTitle = getDisplayTitle(titleName, profile.role);
                            const isDefault = isDefaultTitle(titleName);
                            // If default, use rank color (colorVar). Else use rarity color.
                            const titleColor = isDefault ? colorVar : `var(--rarity-${rarity.toLowerCase()})`;

                            return (
                                <p
                                    className={`${styles.title} ${rarity.toLowerCase() === 'mythic' ? 'mythic-text' : ''}`}
                                    style={rarity.toLowerCase() === 'mythic' ? { margin: 0 } : { color: titleColor, margin: 0 }}
                                >
                                    {displayTitle}
                                </p>
                            );
                        })()}
                        {isOwnProfile && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                                title="Edit displayed titles"
                            >
                                <Pencil size={14} />
                            </button>
                        )}
                    </div>

                    <div className={styles.badges}>
                        {displayedTitles.map((title, i) => {
                            const isMythicTitle = title.rarity?.toLowerCase() === 'mythic';
                            const displayTitle = getDisplayTitle(title.name, profile.role);
                            const isDefault = isDefaultTitle(title.name);
                            const titleColor = isDefault ? colorVar : `var(--rarity-${title.rarity?.toLowerCase() || 'common'})`;

                            return (
                                <div
                                    key={i}
                                    className={`${styles.badge} ${isMythicTitle ? 'mythic-text' : ''}`}
                                    style={isMythicTitle ? {
                                        background: 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        borderColor: 'var(--rarity-mythic)',
                                        borderWidth: '2px'
                                    } : {
                                        borderColor: titleColor,
                                        color: titleColor,
                                        background: 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {displayTitle}
                                    {canRemoveTitles && title.name !== 'Hunter' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveTitle(title.name);
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: 'red', cursor: 'pointer', padding: 0, display: 'flex' }}
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.rankSection}>
                    <span className={styles.rankLabel} style={{ color: `var(--rank-${themeRank.toLowerCase()})` }}>RANK:</span>
                    <span className={`${styles.rankValue} rank-${themeRank} rank-text`}>
                        {overallRank}
                    </span>
                </div>
            </div>

            <TitleSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                unlockedTitles={profile.unlockedTitles}
                rankColor={colorVar}
                role={profile.role}
            />
        </div>
    );
}
