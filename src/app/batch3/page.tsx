'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';
import { useHunterStore } from '@/lib/store';
import LoadingScreen from '@/components/LoadingScreen';
import { Settings as Cog } from 'lucide-react';

interface HunterPreview {
    id: string;
    name: string;
    avatar_url: string | null;
    active_title: { name: string; rarity: string } | null;
}

interface AgencyData {
    name: string;
    description: string;
    logo_url: string;
}

export default function Batch3Page() {
    const [hunters, setHunters] = useState<HunterPreview[]>([]);
    const [agency, setAgency] = useState<AgencyData | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();
    const { getTheme, profile } = useHunterStore();
    const themeRank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;
    const rankColor = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Hunters
            const { data: huntersData, error: huntersError } = await supabase
                .from('profiles')
                .select('id, name, avatar_url, active_title');

            if (huntersError) {
                console.error('Error fetching hunters:', huntersError);
            } else {
                const filteredHunters = (huntersData || []).filter(h => h.name !== profile?.name);
                setHunters(filteredHunters);
            }

            // Fetch Agency Data
            const { data: agencyData, error: agencyError } = await supabase
                .from('agencies')
                .select('*')
                .single();

            if (agencyError) {
                console.error('Error fetching agency:', agencyError);
            } else {
                setAgency(agencyData);
            }

            setLoading(false);
        };

        fetchData();
    }, [profile]);

    const handleHunterClick = (username: string) => {
        router.push(`/batch3/${username}`);
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !profile?.isAdmin) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `agency-logo-${Date.now()}.${fileExt}`;
            const filePath = `agency/${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars') // Using avatars bucket as it likely exists and is configured for public access
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Agencies table
            const { error: updateError } = await supabase
                .from('agencies')
                .update({ logo_url: publicUrl })
                .eq('name', agency?.name || 'BATCH 3');

            if (updateError) throw updateError;

            // 4. Update local state
            if (agency) {
                setAgency({ ...agency, logo_url: publicUrl });
            }
            setShowSettings(false);
        } catch (error: any) {
            console.error('Error uploading logo:', error);
            alert(`Failed to upload logo: ${error.message || 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    if (loading || !profile) return <LoadingScreen loading={loading} rank={getTheme()} />;

    return (
        <div className={styles.container} style={{ '--rank-color': rankColor } as React.CSSProperties}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                    {profile.name.toUpperCase()}
                </h1>
                <p className={styles.pageSubtitle} style={{ color: `var(--rarity-${profile.activeTitle?.rarity?.toLowerCase() || 'common'})`, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {profile.activeTitle?.name || 'HUNTER'}
                </p>
            </div>

            <div className={styles.agencySection}>
                <div className={styles.agencyInfo}>
                    <h2 className={styles.agencyName} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                        {agency?.name || 'BATCH 3'}
                    </h2>
                    <p className={styles.agencyDescriptionLabel}>DESCRIPTION:</p>
                    <p className={styles.agencyDescription}>
                        {agency?.description || 'LOADING DESCRIPTION...'}
                    </p>
                </div>
                <div className={styles.agencyLogoContainer}>
                    {isUploading ? (
                        <div className={styles.loader}></div>
                    ) : (
                        <img
                            src={agency?.logo_url || '/placeholder.png'}
                            alt="Agency Logo"
                            className={styles.agencyLogo}
                        />
                    )}
                </div>

                {profile.isAdmin && (
                    <>
                        <button
                            className={styles.settingsTrigger}
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            <Cog size={20} />
                        </button>

                        {showSettings && (
                            <div className={styles.settingsMenu}>
                                <button
                                    className={styles.updateLogoBtn}
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Uploading...' : 'Update Agency Logo'}
                                </button>
                                <input
                                    type="file"
                                    id="logo-upload"
                                    hidden
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            <h2 className={styles.sectionTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                {agency?.name || 'BATCH 3'} MEMBERS
            </h2>

            <div className={styles.content}>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px',
                    padding: '0 20px',
                    maxWidth: '600px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    {hunters.map((hunter) => (
                        <div
                            key={hunter.id}
                            onClick={() => handleHunterClick(hunter.name)}
                            style={{
                                border: `1px solid ${rankColor}`,
                                borderRadius: '10px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                position: 'relative',
                                aspectRatio: '2/3',
                                transition: 'transform 0.2s',
                                boxShadow: `0 0 5px ${rankColor}40`
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {/* Image */}
                            <img
                                src={hunter.avatar_url || '/placeholder.png'}
                                alt={hunter.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />

                            {/* Overlay Name */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                                padding: '15px 10px',
                                textAlign: 'center'
                            }}>
                                <h3 style={{
                                    color: '#fff',
                                    textTransform: 'uppercase',
                                    margin: 0,
                                    fontSize: '1.2rem',
                                    fontWeight: '900',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                                }}>
                                    {hunter.name}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Navbar />
        </div>
    );
}
