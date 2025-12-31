'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProfileView from '@/components/ProfileView';
import Navbar from '@/components/Navbar';
import { UserProfile, Title, UserSettings, useHunterStore, getDisplayTitle, isDefaultTitle } from '@/lib/store';
import { calculateOverallRank, RANK_COLORS, Rank } from '@/lib/game-logic';
import { X, Book } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import styles from '@/app/home/page.module.css';
import ProfileFrame from '@/components/ProfileFrame';
import LoreModal from '@/components/LoreModal';

export default function HunterProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;
    const SPECIAL_NAME = "01010100 01101000 01100101 00100000 01100101 01101110 01100100 00100000 01101001 01100110 00100000 01110111 01100101 00100000 01100110 01100001 01101001 01101100 00101110 00101110 00101110";

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Viewer (logged-in) profile from global store
    const viewer = useHunterStore(state => state.profile);
    const [bookOpen, setBookOpen] = useState(false);

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
                // If Supabase says no rows, allow a local-only special profile for the binary identity
                console.error('Error fetching profile. data:', profileData, 'error:', error);
                if (username === SPECIAL_NAME) {
                    const userProfile: UserProfile = {
                        id: 'local-special',
                        name: SPECIAL_NAME,
                        avatarUrl: '/edgelord.jpg',
                        activeTitle: { name: 'Monarch of Finality', rarity: 'Mythic' } as Title,
                        testScores: {},
                        unlockedTitles: [{ name: 'Monarch of Finality', rarity: 'Mythic' } as Title],
                        completedQuests: [],
                        settings: { statsCalculator: true, theme: 'S', exclusiveGlitch: true } as UserSettings,
                        isAdmin: false,
                        profileType: 'male_20_25',
                        role: 'Hunter',
                        trackedQuests: []
                    };

                    setProfile(userProfile);
                    setLoading(false);
                    return;
                }

                setFetchError(error ? JSON.stringify(error) : 'Profile not found');
                setLoading(false);
                return;
            }

            // 2. Get Unlocked Titles
            const { data: titlesData } = await supabase
                .from('unlocked_titles')
                .select('name, rarity, is_hidden')
                .eq('profile_id', profileData.id);

            // 3. Get Completed Quests
            const { data: questsData } = await supabase
                .from('completed_quests')
                .select('quest_id')
                .eq('profile_id', profileData.id);

            const userProfile: UserProfile = {
                id: profileData.id,
                name: profileData.name,
                avatarUrl: profileData.avatar_url,
                videoUrl: profileData.video_url,
                activeTitle: profileData.active_title || { name: 'Hunter', rarity: 'Common' },
                testScores: profileData.test_scores || {},
                unlockedTitles: (titlesData || []).map((t: any) => ({
                    name: t.name,
                    rarity: t.rarity,
                    is_hidden: t.is_hidden || false
                })),
                completedQuests: questsData?.map((q: { quest_id: string }) => q.quest_id) || [],
                settings: profileData.settings || { statsCalculator: true, theme: null },
                isAdmin: profileData.is_admin || false,
                profileType: profileData.profile_type || 'male_20_25',
                role: profileData.role || 'Hunter',
                agencyId: profileData.agency_id,
                bio: profileData.bio,
                managerComment: profileData.manager_comment,
                affinities: profileData.affinities || [],
                classTags: profileData.class_tags || [],
                missionLogs: profileData.mission_logs || [],
                trackedQuests: profileData.tracked_quests || [],
                activeFrame: profileData.active_frame || 'Common',
                unlockedFrames: (() => {
                    const base = profileData.unlocked_frames || ['Common'];
                    const ranks: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S'];
                    const currentRank = calculateOverallRank(profileData.test_scores || {}, profileData.profile_type || 'male_20_25');
                    const currentRankIdx = ranks.indexOf(currentRank as Rank);
                    const rankFrames = currentRankIdx !== -1 ? ranks.slice(0, currentRankIdx + 1) : [];

                    const titleNames = (titlesData || []).map((t: any) => t.name);
                    const titleFrames = titleNames.filter(name => [
                        'Streak of Lightning', 'Sovreign of the Gale', 'Unshakable Will', 'The Unfallen King',
                        'Tactical Master', 'Echo of a Thousand Plans', 'Flame of Will', 'Phoenix Soul',
                        'Wild Instinct', 'Beastmaster', 'Relentless Chase', 'Crimson Seeker',
                        'Precision Breaker', 'Fist of Ruin', 'Sink or Rise', 'Warden of the Abyss',
                        'Flashstorm', 'Thunderborn Tyrant', 'Balance Through Chaos', 'Soulbreaker Sage',
                        'Edge Dancer', 'Ghost of the Edge'
                    ].includes(name));

                    return Array.from(new Set([...base, ...rankFrames, ...titleFrames]));
                })()
            };

            setProfile(userProfile);
            setLoading(false);
        };

        fetchProfile();
    }, [username]);

    if (loading) return <LoadingScreen loading={loading} rank={profile?.settings?.theme || 'E'} />;

    if (fetchError) {
        return (
            <div style={{ padding: 24 }}>
                <h2>Could not load profile</h2>
                <p style={{ color: 'red' }}>{fetchError}</p>
                <button onClick={() => router.push('/batch3')}>Back to Rankings</button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={{ padding: 24 }}>
                <h2>Profile not found</h2>
                <button onClick={() => router.push('/batch3')}>Back</button>
            </div>
        );
    }

    const overallRank = calculateOverallRank(profile.testScores, profile.profileType);
    // Use the viewed profile's theme
    const themeRank = profile.settings.theme || overallRank;
    const specialTheme = profile.settings.specialTheme || null;
    const rankColor = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    return (
        <div className={styles.container}>
            {/* Decorative Profile Frame Border */}
            <ProfileFrame frameId={profile.activeFrame || profile.activeTitle?.rarity || 'Common'} />

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

            {/* Book icon to open profile Lore modal */}
            <button
                onClick={() => setBookOpen(true)}
                aria-label="Open profile lore"
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
                    opacity: 0,
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
                specialTheme={specialTheme}
                canRemoveTitles={viewer?.isAdmin}
                isOwnProfile={viewer?.id === profile.id}
            />

            <LoreModal
                isOpen={bookOpen}
                onClose={() => setBookOpen(false)}
                targetProfile={profile}
                rankColor={rankColor}
            />

            <Navbar />
        </div>
    );
}
