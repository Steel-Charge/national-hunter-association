'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHunterStore, Agency } from '@/lib/store';
import styles from './AgencySettings.module.css';
import { X, Copy, Trash2, LogOut, UserMinus, UserPlus, Building2 } from 'lucide-react';

interface Props {
    agency: Agency;
    onClose: () => void;
}

export default function AgencySettings({ agency, onClose }: Props) {
    const router = useRouter();
    const { profile, updateAgency, leaveAgency, kickMember, disbandAgency, joinAgency, createAgency, getTheme } = useHunterStore();
    const [newName, setNewName] = useState(agency.name);
    const [logoPreview, setLogoPreview] = useState(agency.logo_url);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isSavingLogo, setIsSavingLogo] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [agencyName, setAgencyName] = useState('');

    const isCaptain = profile?.role === 'Captain';
    const isSolo = profile?.role === 'Solo';
    const isHunter = profile?.role === 'Hunter';

    // Get user's theme color
    const themeRank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;
    const rankColor = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;



    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveLogo = async () => {
        setIsSavingLogo(true);
        await updateAgency({ logo_url: logoPreview });
        setIsSavingLogo(false);
        alert('Agency Logo Updated Successfully!');
        // Set a timestamp to force cache bypass
        sessionStorage.setItem('agency_updated', Date.now().toString());
        // Close modal and force reload with cache bypass
        onClose();
        window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
    };

    const handleSaveName = async () => {
        setIsSavingName(true);
        console.log('Attempting to save name:', newName);
        await updateAgency({ name: newName });
        setIsSavingName(false);
        alert('Agency Name Updated Successfully!');
        // Force reload with cache bypass
        sessionStorage.setItem('agency_updated', Date.now().toString());
        onClose();
        window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(agency.invite_code);
        alert('Invite code copied!');
    };

    const handleJoinAgency = async () => {
        if (!inviteCode) return;
        const res = await joinAgency(inviteCode);
        if (res.success) {
            setShowJoinModal(false);
            onClose();
            router.refresh();
        } else {
            alert(res.error || 'Invalid invite code');
        }
    };

    const handleCreateAgency = async () => {
        if (!agencyName) return;
        try {
            await createAgency(agencyName, '/placeholder.png');
            setShowCreateModal(false);
            onClose();
            router.push('/batch3');
        } catch (error: any) {
            alert(error.message || 'Failed to create agency');
        }
    };

    return (
        <div className={styles.overlay} style={{ '--rank-color': rankColor } as React.CSSProperties}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}><X /></button>
                <h2 className={styles.title}>AGENCY SETTINGS</h2>

                <div className={styles.content}>
                    {(isSolo || isHunter) && (
                        <div className={styles.section}>
                            <h3>{isSolo ? 'JOIN OR CREATE AGENCY' : 'SWITCH OR START AGENCY'}</h3>
                            <p style={{ color: '#aaa', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                {isSolo
                                    ? 'As a Solo hunter, you can join an existing agency or create your own.'
                                    : 'You can join a different agency using a code, or start your own and become Captain.'
                                }
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                                <button
                                    onClick={() => setShowJoinModal(true)}
                                    className={styles.saveBtn}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <UserPlus size={18} /> JOIN AGENCY
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className={styles.saveBtn}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Building2 size={18} /> CREATE AGENCY
                                </button>
                            </div>
                        </div>
                    )}

                    {isCaptain && (
                        <>
                            <div className={styles.section}>
                                <h3>UPDATE AGENCY NAME</h3>
                                <div className={styles.inputGroup}>
                                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Agency Name" />
                                </div>
                                <button onClick={handleSaveName} disabled={isSavingName} className={styles.saveBtn}>
                                    {isSavingName ? 'SAVING...' : 'SAVE NAME'}
                                </button>
                            </div>

                            <div className={styles.section}>
                                <h3>UPDATE AGENCY LOGO</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '150px',
                                        height: '150px',
                                        border: `2px solid ${rankColor}`,
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <img
                                            src={logoPreview || '/placeholder.png'}
                                            alt="Agency Logo Preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        style={{ display: 'none' }}
                                        id="logo-upload"
                                    />
                                    <label htmlFor="logo-upload" className={styles.uploadBtn}>
                                        UPLOAD IMAGE
                                    </label>
                                    <button onClick={handleSaveLogo} disabled={isSavingLogo} className={styles.saveBtn}>
                                        {isSavingLogo ? 'SAVING...' : 'SAVE LOGO'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <div className={styles.section}>
                        <h3>INVITE CODE</h3>
                        <div className={styles.codeBox}>
                            <span>{agency.invite_code}</span>
                            <button onClick={handleCopyCode}><Copy size={16} /></button>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {/* Hide Leave button for default Batch 3 agency */}
                        {agency.invite_code !== 'BATCH3-DEFAULT' && (
                            <button onClick={async () => {
                                await leaveAgency();
                                onClose();
                                router.push('/batch3');
                            }} className={styles.actionBtn}>
                                <LogOut size={16} /> LEAVE AGENCY
                            </button>
                        )}

                        {isCaptain && (
                            <button onClick={disbandAgency} className={`${styles.actionBtn} ${styles.danger}`}>
                                <Trash2 size={16} /> DISBAND AGENCY
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Join Agency Modal */}
            {showJoinModal && (
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
                        border: '2px solid var(--rank-color, #00e5ff)',
                        minWidth: '400px',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowJoinModal(false)}
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
                        <h2 style={{ color: 'var(--rank-color, #00e5ff)', marginBottom: '1rem' }}>JOIN AGENCY</h2>
                        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Enter your agency invite code</p>
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            placeholder="INVITE CODE"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#0a0a0a',
                                border: '1px solid var(--rank-color, #00e5ff)',
                                color: '#fff',
                                borderRadius: '4px',
                                marginBottom: '1rem',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            onClick={handleJoinAgency}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'var(--rank-color, #00e5ff)',
                                border: 'none',
                                color: '#000',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            JOIN
                        </button>
                    </div>
                </div>
            )}

            {/* Create Agency Modal */}
            {showCreateModal && (
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
                        border: '2px solid var(--rank-color, #00e5ff)',
                        minWidth: '400px',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowCreateModal(false)}
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
                        <h2 style={{ color: 'var(--rank-color, #00e5ff)', marginBottom: '1rem' }}>CREATE AGENCY</h2>
                        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Choose a name for your agency</p>
                        <input
                            type="text"
                            value={agencyName}
                            onChange={(e) => setAgencyName(e.target.value)}
                            placeholder="AGENCY NAME"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#0a0a0a',
                                border: '1px solid var(--rank-color, #00e5ff)',
                                color: '#fff',
                                borderRadius: '4px',
                                marginBottom: '1rem',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            onClick={handleCreateAgency}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'var(--rank-color, #00e5ff)',
                                border: 'none',
                                color: '#000',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            CREATE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
