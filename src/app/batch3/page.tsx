'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';
import { useHunterStore } from '@/lib/store';
import LoadingScreen from '@/components/LoadingScreen';

interface HunterPreview {
    id: string;
    name: string;
    avatar_url: string | null;
    active_title: { name: string; rarity: string } | null;
}

export default function Batch3Page() {
    const [hunters, setHunters] = useState<HunterPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { getTheme, profile } = useHunterStore();
    const themeRank = getTheme();
    const rankColor = `var(--rank-${themeRank.toLowerCase()})`;

    useEffect(() => {
        const fetchHunters = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, avatar_url, active_title');

            if (error) {
                console.error('Error fetching hunters:', error);
            } else {
                // Filter out the logged-in user
                const filteredHunters = (data || []).filter(h => h.name !== profile?.name);
                setHunters(filteredHunters);
            }
            setLoading(false);
        };

        fetchHunters();
    }, [profile]);

    const handleHunterClick = (username: string) => {
        router.push(`/batch3/${username}`);
    };

    if (loading || !profile) return <LoadingScreen loading={loading} rank={getTheme()} />;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                    {profile.name.toUpperCase()}
                </h1>
                <p className={styles.pageSubtitle} style={{ color: `var(--rarity-${profile.activeTitle?.rarity?.toLowerCase() || 'common'})`, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {profile.activeTitle?.name || 'HUNTER'}
                </p>
            </div>

            <h2 className={styles.sectionTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                BATCH 3 RANKINGS
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
