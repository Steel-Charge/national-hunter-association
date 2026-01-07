import React, { useState } from 'react';
import { Title, useHunterStore, getDisplayTitle } from '@/lib/store';
import { X, Filter, Save, Eye, EyeOff } from 'lucide-react';
import styles from './TitleSelectionModal.module.css';

interface TitleSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    unlockedTitles: Title[];
    rankColor: string;
    role: string;
    agencyName?: string;
}

const RARITIES = ['Mythic', 'Legendary', 'Epic', 'Rare', 'Common'];

export default function TitleSelectionModal({ isOpen, onClose, unlockedTitles, rankColor, role, agencyName }: TitleSelectionModalProps) {
    const { updateTitleVisibility } = useHunterStore();
    const [filter, setFilter] = useState<string | null>(null);
    const [localTitles, setLocalTitles] = useState<Title[]>(unlockedTitles);
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const filteredTitles = filter
        ? localTitles.filter(t => t.rarity === filter)
        : localTitles;

    const toggleLocalVisibility = (titleName: string) => {
        setLocalTitles(prev => prev.map(t =>
            t.name === titleName ? { ...t, is_hidden: !t.is_hidden } : t
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Find titles that changed
            for (const title of localTitles) {
                const original = unlockedTitles.find(t => t.name === title.name);
                if (original && original.is_hidden !== title.is_hidden) {
                    await updateTitleVisibility(title.name, !!title.is_hidden);
                }
            }
            onClose();
        } catch (error) {
            console.error('Error saving title visibility:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ '--rank-color': rankColor } as React.CSSProperties}>
                <div className={styles.header}>
                    <h2>Manage Titles</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
                </div>

                <div className={styles.filterBar}>
                    <Filter size={18} />
                    <button
                        className={`${styles.filterTab} ${!filter ? styles.activeFilter : ''}`}
                        onClick={() => setFilter(null)}
                    >
                        All
                    </button>
                    {RARITIES.map(r => (
                        <button
                            key={r}
                            className={`${styles.filterTab} ${filter === r ? styles.activeFilter : ''}`}
                            onClick={() => setFilter(r)}
                            style={{ '--rarity-color': `var(--rarity-${r.toLowerCase()})` } as React.CSSProperties}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                <div className={styles.titleList}>
                    {filteredTitles.map((title) => (
                        <div key={title.name} className={styles.titleItem}>
                            <div className={styles.titleInfo}>
                                <span
                                    className={styles.rarityBadge}
                                    style={{ borderColor: `var(--rarity-${title.rarity.toLowerCase()})`, color: `var(--rarity-${title.rarity.toLowerCase()})` }}
                                >
                                    {title.rarity}
                                </span>
                                <span className={styles.titleName}>{getDisplayTitle(title.name, role, agencyName)}</span>
                            </div>
                            <button
                                onClick={() => toggleLocalVisibility(title.name)}
                                className={`${styles.visibilityBtn} ${title.is_hidden ? styles.hidden : ''}`}
                                title={title.is_hidden ? "Show on profile" : "Hide from profile"}
                            >
                                {title.is_hidden ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    ))}
                </div>

                <div className={styles.footer}>
                    <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
