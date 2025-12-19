'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProfileView from '@/components/ProfileView';
import Navbar from '@/components/Navbar';
import { UserProfile, Title, UserSettings, useHunterStore } from '@/lib/store';
import { calculateOverallRank } from '@/lib/game-logic';
import { X, Book } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import styles from '@/app/home/page.module.css';

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
                        profileType: 'male_20_25'
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
                .select('name, rarity')
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

    const overallRank = calculateOverallRank(profile.testScores);
    // Use the viewed profile's theme
    const themeRank = profile.settings.theme || overallRank;
    const specialTheme = profile.settings.specialTheme || null;

    const canUploadForThisProfile = viewer?.name === 'Edgelord' && profile.name !== 'Edgelord';

    const handleVideoFile = async (file: File | null) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            const result = reader.result as string;
            try {
                // Update profile in DB
                const { error } = await supabase
                    .from('profiles')
                    .update({ video_url: result })
                    .eq('id', profile.id);
                if (error) {
                    console.error('Error uploading video:', error);
                    return;
                }
                // Update local state
                setProfile({ ...profile, videoUrl: result });
            } catch (err) {
                console.error('Upload failed', err);
            }
        };
        reader.readAsDataURL(file);
    };

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

            {/* Book icon to open profile interview modal */}
            <button
                onClick={() => setBookOpen(!bookOpen)}
                aria-label={bookOpen ? 'Close profile book' : 'Open profile book'}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '80px',
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
                specialTheme={specialTheme}
            />

            {/* Profile Book Modal */}
            {bookOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
                    <div
                        onClick={() => setBookOpen(false)}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }}
                    />
                    <div style={{ position: 'relative', maxWidth: 900, margin: '6vh auto', background: '#0b0b0b', padding: 24, borderRadius: 10, zIndex: 2001, color: '#fff' }}>
                        <h2 style={{ marginTop: 0 }}>{profile.name} — Interview</h2>
                        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                {profile.videoUrl ? (
                                    <video controls style={{ width: '100%', borderRadius: 6 }} src={profile.videoUrl} />
                                ) : (
                                    <div style={{ width: '100%', height: 240, borderRadius: 6, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                                        No interview available
                                    </div>
                                )}

                                {canUploadForThisProfile && (
                                    <div style={{ marginTop: 12 }}>
                                        <label style={{ display: 'inline-block', padding: '8px 12px', borderRadius: 8, background: '#1f6feb', cursor: 'pointer' }}>
                                            Upload Video
                                            <input type="file" accept="video/*" onChange={(e) => handleVideoFile(e.target.files ? e.target.files[0] : null)} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div style={{ width: 320 }}>
                                <h3>Bio</h3>
                                <p style={{ color: '#ccc' }}>[Pending...]</p>
                                <h3>Manager's Comment</h3>
                                <p style={{ color: '#ccc' }}>[Pending...]</p>
                            </div>
                        </div>
                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setBookOpen(false)} style={{ padding: '8px 12px', borderRadius: 8, background: '#222', color: '#fff', border: '1px solid #333' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <Navbar />
        </div>
    );
}
