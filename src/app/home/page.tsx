"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHunterStore } from '@/lib/store';
import { calculateOverallRank, RANK_COLORS, Rank } from '@/lib/game-logic';
import Navbar from '@/components/Navbar';
import ProfileView from '@/components/ProfileView';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './page.module.css';
import { Book, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProfileSettings from '@/components/ProfileSettings';
import ProfileFrame from '@/components/ProfileFrame';
import LoreModal from '@/components/LoreModal';

export default function HomePage() {
    const { profile, loading, getOverallRank, getTheme, setProfile } = useHunterStore();
    const router = useRouter();

    const [bookOpen, setBookOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => {
        if (!loading && !profile) {
            router.push('/');
        }
    }, [loading, profile, router]);

    if (loading || !profile) return <LoadingScreen loading={loading} rank={getTheme()} />;

    const overallRank = getOverallRank();
    const themeRank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;

    return (
        <div className={styles.container}>
            {/* Book icon - MOVED TO TOP LEFT */}
            <button
                onClick={() => setBookOpen(!bookOpen)}
                aria-label={bookOpen ? 'Close profile book' : 'Open profile book'}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    zIndex: 100
                }}
            >
                <Book size={36} />
            </button>

            {/* Profile Settings button - NEW TOP RIGHT */}
            <button
                onClick={() => setSettingsOpen(true)}
                aria-label="Open profile settings"
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    zIndex: 100
                }}
            >
                <Settings size={36} />
            </button>

            {/* Decorative Profile Frame Border */}
            <ProfileFrame frameId={profile.activeFrame || profile.activeTitle?.rarity || 'Common'} />

            {/* Background Image */}
            {/* Background handled globally by BackgroundWrapper */}

            <ProfileView
                profile={profile}
                overallRank={overallRank}
                themeRank={themeRank}
                specialTheme={specialTheme}
                canRemoveTitles={profile?.isAdmin}
                isOwnProfile={true}
            />

            {/* Lore Modal (formerly book) */}
            {profile && (
                <LoreModal
                    isOpen={bookOpen}
                    onClose={() => setBookOpen(false)}
                    targetProfile={profile}
                    rankColor={RANK_COLORS[themeRank] || '#00e5ff'}
                />
            )}

            {/* Profile Settings Overlay */}
            <ProfileSettings
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />

            <Navbar />
        </div>
    );
}
