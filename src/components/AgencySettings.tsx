'use client';

import { useState } from 'react';
import { useHunterStore, Agency } from '@/lib/store';
import styles from './AgencySettings.module.css';
import { X, Copy, Trash2, LogOut, UserMinus } from 'lucide-react';

interface Props {
    agency: Agency;
    onClose: () => void;
}

export default function AgencySettings({ agency, onClose }: Props) {
    const { profile, updateAgency, leaveAgency, kickMember, disbandAgency } = useHunterStore();
    const [newName, setNewName] = useState(agency.name);
    const [newLogo, setNewLogo] = useState(agency.logo_url);
    const [isSaving, setIsSaving] = useState(false);

    const isCaptain = profile?.role === 'Captain' && profile?.id === agency.captain_id;

    const handleSave = async () => {
        setIsSaving(true);
        await updateAgency({ name: newName, logo_url: newLogo });
        setIsSaving(false);
        onClose();
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(agency.invite_code);
        alert('Invite code copied!');
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}><X /></button>
                <h2 className={styles.title}>AGENCY SETTINGS</h2>

                <div className={styles.content}>
                    {isCaptain && (
                        <div className={styles.section}>
                            <h3>MANAGE AGENCY</h3>
                            <div className={styles.inputGroup}>
                                <label>Agency Name</label>
                                <input value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                            <button onClick={handleSave} disabled={isSaving} className={styles.saveBtn}>
                                {isSaving ? 'SAVING...' : 'UPDATE AGENCY'}
                            </button>
                        </div>
                    )}

                    <div className={styles.section}>
                        <h3>INVITE CODE</h3>
                        <div className={styles.codeBox}>
                            <span>{agency.invite_code}</span>
                            <button onClick={handleCopyCode}><Copy size={16} /></button>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button onClick={() => leaveAgency()} className={styles.actionBtn}>
                            <LogOut size={16} /> LEAVE AGENCY
                        </button>

                        {isCaptain && (
                            <button onClick={disbandAgency} className={`${styles.actionBtn} ${styles.danger}`}>
                                <Trash2 size={16} /> DISBAND AGENCY
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
