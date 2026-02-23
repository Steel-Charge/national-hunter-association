"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHunterStore } from '@/lib/store';
import { calculateOverallRank, RANK_COLORS, RARITY_COLORS, Rank } from '@/lib/game-logic';
import Navbar from '@/components/Navbar';
import ProfileView from '@/components/ProfileView';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './page.module.css';
import { Book, Settings, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProfileSettings from '@/components/ProfileSettings';
import ProfileFrame from '@/components/ProfileFrame';
import LoreModal from '@/components/LoreModal';
import WeightCheckInModal from '@/components/WeightCheckInModal';

export default function HomePage() {
    const { profile, loading, getOverallRank, getTheme, setProfile } = useHunterStore();
    const router = useRouter();

    const [bookOpen, setBookOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [weightModalOpen, setWeightModalOpen] = useState(false);

    useEffect(() => {
        if (!loading && !profile) {
            router.push('/');
        }
    }, [loading, profile, router]);

    if (loading || !profile) return <LoadingScreen loading={loading} rank={getTheme()} />;

    const overallRank = getOverallRank();
    const themeRank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;
    const rankColor = specialTheme ? (RARITY_COLORS[specialTheme] || RANK_COLORS[themeRank as Rank]) : (RANK_COLORS[themeRank as Rank] || '#ffffff');

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

            {/* Weight Check-in button */}
            <button
                onClick={() => setWeightModalOpen(true)}
                aria-label="Open weight check-in"
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '70px',
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    zIndex: 100
                }}
            >
                <Calendar size={36} />
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
                    rankColor={rankColor}
                />
            )}

            {/* Profile Settings Overlay */}
            <ProfileSettings
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />

            {/* Weight Check-in Modal */}
            {weightModalOpen && (
                <WeightCheckInModal onClose={() => setWeightModalOpen(false)} />
            )}

            <Navbar />
        </div>
    );
}
