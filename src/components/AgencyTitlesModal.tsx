'use client';
import { useState } from 'react';
import { Title, useHunterStore } from '@/lib/store';
import { X, Eye, EyeOff } from 'lucide-react';

interface Props {
    titles: Title[];
    visibility: Record<string, boolean>;
    onClose: () => void;
    onUpdate: () => void;
}

export default function AgencyTitlesModal({ titles, visibility, onClose, onUpdate }: Props) {
    const { updateAgencyTitleVisibility, getTheme, profile } = useHunterStore();
    const rankColor = `var(--rank-${getTheme().toLowerCase()})`;

    const handleToggle = async (titleName: string, currentHidden: boolean) => {
        await updateAgencyTitleVisibility(titleName, !currentHidden);
        onUpdate();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{
                background: '#1a1a1a',
                padding: '2rem',
                borderRadius: '8px',
                border: `2px solid ${rankColor}`,
                minWidth: '400px',
                maxWidth: '600px',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>
                <h2 style={{ color: rankColor, marginBottom: '1.5rem', textAlign: 'center' }}>MANAGE SHOWN TITLES</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Always show Upstart (default) but make it immutable? User said "Upstart" is common title. 
                         Actually user said "Agency title that will display beside Upstart". 
                         So Upstart is likely the default title, similar to 'Hunter' for users.
                         We should list other unlocked titles. */}
                    {titles.length === 0 ? (
                        <p style={{ color: '#888', textAlign: 'center' }}>No additional titles unlocked.</p>
                    ) : (
                        titles.map((title) => {
                            const isHidden = visibility[title.name] || false;
                            return (
                                <div key={title.name} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '4px',
                                    border: `1px solid var(--rarity-${title.rarity.toLowerCase()})`
                                }}>
                                    <div>
                                        <span style={{
                                            color: `var(--rarity-${title.rarity.toLowerCase()})`,
                                            fontWeight: 'bold',
                                            marginRight: '10px'
                                        }}>
                                            {title.name}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>{title.rarity}</span>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(title.name, isHidden)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: isHidden ? '#666' : '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
