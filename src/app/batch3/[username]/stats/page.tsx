'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import StatsView from '@/components/StatsView';
import Navbar from '@/components/Navbar';
import { useHunterStore, UserProfile } from '@/lib/store';
import { X } from 'lucide-react';
import styles from '@/app/stats/page.module.css';

export default function HunterStatsPage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const { profile: viewerProfile } = useHunterStore(); // Logged in user
    const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
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
                profileType: profileData.profile_type || 'Male'
            };

            setViewedProfile(userProfile);
            setLoading(false);
        };

        fetchProfile();
    }, [username]);

    if (loading || !viewedProfile) return <div style={{ color: '#fff', padding: '20px' }}>Loading...</div>;

    return (
        <div className={styles.container}>
            {/* Close Button - Returns to Batch 3 List */}
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

            <StatsView
                profile={viewedProfile}
                isReadOnly={true}
                viewerProfile={viewerProfile}
                onScoreUpdate={(testName, value) => {
                    // Update local state when admin edits
                    setViewedProfile(prev => prev ? {
                        ...prev,
                        testScores: { ...prev.testScores, [testName]: value }
                    } : null);
                }}
            />

            <Navbar />
        </div>
    );
}
