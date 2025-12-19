'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProfileView from '@/components/ProfileView';
import Navbar from '@/components/Navbar';
import { UserProfile, Title, UserSettings } from '@/lib/store';
import { calculateOverallRank } from '@/lib/game-logic';
import { X } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import styles from '@/app/home/page.module.css';

export default function HunterProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) return;

            // 1. Get Profile
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('name', username)
                .single();

            if (error || !profileData) {
                console.error('Error fetching profile:', error);
                setLoading(false);
                return;
            }

            // 2. Get Unlocked Titles
            const { data: titlesData } = await supabase
                .from('unlocked_titles')
                .select('name, rarity')
                .eq('profile_id', profileData.id);

            // 3. Get Completed Quests
            const { data: questsData } = await supabase
                .from('completed_quests')
                .select('quest_id')
                .eq('profile_id', profileData.id);

            const userProfile: UserProfile = {
                name: profileData.name,
                avatarUrl: profileData.avatar_url,
                activeTitle: profileData.active_title || { name: 'Hunter', rarity: 'Common' },
                testScores: profileData.test_scores || {},
                unlockedTitles: titlesData || [],
                completedQuests: questsData?.map((q: { quest_id: string }) => q.quest_id) || [],
                settings: profileData.settings || { statsCalculator: true, theme: null },
                isAdmin: profileData.is_admin || false,
                profileType: profileData.profile_type || 'male_20_25'
            };

            setProfile(userProfile);
            setLoading(false);
        };

        fetchProfile();
    }, [username]);

    if (loading || !profile) return <LoadingScreen loading={loading} rank={profile?.settings?.theme || 'E'} />;

    const overallRank = calculateOverallRank(profile.testScores);
    // Use the viewed profile's theme
    const themeRank = profile.settings.theme || overallRank;

    return (
        <div className={styles.container}>
            {/* Close Button */}
            <button
                onClick={() => router.push('/batch3')}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'transparent',
                    border: 'none',
                    color: 'red',
                    cursor: 'pointer',
                    zIndex: 100
                }}
            >
                <X size={40} />
            </button>

            {/* Background Image for the VIEWED profile */}
            {profile.avatarUrl && (
                <img
                    src={profile.avatarUrl}
                    alt="Background"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: -2,
                    }}
                />
            )}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000',
                    opacity: 0, // Profile page has 0 opacity overlay usually, but maybe we want it slightly visible?
                    // Actually, BackgroundWrapper handles this for the logged in user.
                    // Here we are manually rendering the background for the VIEWED user.
                    // Let's match the "Profile Page" style which is 0 opacity.
                    zIndex: -1,
                    pointerEvents: 'none'
                }}
            />
            {/* Bottom Gradient */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '40%',
                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.6) 50%, transparent 100%)',
                    zIndex: -1,
                    pointerEvents: 'none'
                }}
            />

            <ProfileView
                profile={profile}
                overallRank={overallRank}
                themeRank={themeRank}
            />

            <Navbar />
        </div>
    );
}
