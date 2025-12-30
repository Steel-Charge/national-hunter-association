'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProfileView from '@/components/ProfileView';
import Navbar from '@/components/Navbar';
import { UserProfile, Title, UserSettings, useHunterStore } from '@/lib/store';
import { calculateOverallRank, RANK_COLORS, Rank } from '@/lib/game-logic';
import { X, Book } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import styles from '@/app/home/page.module.css';
import ProfileFrame from '@/components/ProfileFrame';

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
    const [editBio, setEditBio] = useState('');
    const [editComment, setEditComment] = useState('');
    const [newVideo, setNewVideo] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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
                agencyId: profileData.agency_id, // Added mapping for permissions
                bio: profileData.bio,
                managerComment: profileData.manager_comment,
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

    // Update edit state when profile loads
    useEffect(() => {
        if (profile) {
            setEditBio(profile.bio || '');
            setEditComment(profile.managerComment || '');
            setNewVideo(null); // Reset new video on profile load
        }
    }, [profile]);

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

    const canUploadForThisProfile = viewer?.isAdmin ||
        (viewer?.role === 'Captain' && viewer?.agencyId && profile?.agencyId === viewer?.agencyId);

    console.log('[DEBUG] Permission Check:', {
        viewerId: viewer?.id,
        viewerRole: viewer?.role,
        viewerAgency: viewer?.agencyId,
        profileName: profile.name,
        profileAgency: profile.agencyId,
        canUpload: canUploadForThisProfile
    });

    const handleVideoFile = async (file: File | null) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            const result = reader.result as string;
            setNewVideo(result);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            const updates: any = {
                bio: editBio,
                manager_comment: editComment
            };
            if (newVideo) {
                updates.video_url = newVideo;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', profile.id);

            if (error) throw error;

            // Update local state
            setProfile({
                ...profile,
                bio: editBio,
                managerComment: editComment,
                videoUrl: newVideo || profile.videoUrl
            });
            setNewVideo(null);
            alert('Saved successfully!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error saving changes');
        } finally {
            setSaving(false);
        }
    };

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

            {/* Book icon to open profile interview modal - MOVED TO TOP LEFT */}
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

            {/* Profile Book Modal */}
            {/* Profile Book Modal */}
            {bookOpen && (
                <div className={styles.interviewOverlay}>
                    <div
                        onClick={() => setBookOpen(false)}
                        style={{ position: 'absolute', inset: 0 }}
                    />
                    <div className={styles.interviewModal} style={{
                        '--custom-theme-color': RANK_COLORS[(viewer?.settings?.theme || calculateOverallRank(viewer?.testScores || {}, viewer?.profileType || 'male_20_25')) as Rank] || '#00e5ff',
                        '--custom-theme-glow': RANK_COLORS[(viewer?.settings?.theme || calculateOverallRank(viewer?.testScores || {}, viewer?.profileType || 'male_20_25')) as Rank] || '#00e5ff'
                    } as React.CSSProperties}>
                        <h2 className={styles.interviewHeader}>
                            {profile.name} — Interview
                        </h2>
                        <div className={styles.interviewBody}>
                            <div className={styles.videoSection}>
                                {profile.videoUrl ? (
                                    <div className={styles.videoWrapper}>
                                        <video controls style={{ width: '100%', display: 'block' }} src={newVideo || profile.videoUrl} />
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', height: 280, borderRadius: 12, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        {newVideo ? <video controls style={{ width: '100%', borderRadius: 12 }} src={newVideo} /> : 'No interview available'}
                                    </div>
                                )}

                                {canUploadForThisProfile && (
                                    <div style={{ marginTop: 20 }}>
                                        <label className={styles.uploadLabel} style={{ marginRight: 15 }}>
                                            {newVideo ? 'Change Video' : 'Upload Video'}
                                            <input type="file" accept="video/*" onChange={(e) => handleVideoFile(e.target.files ? e.target.files[0] : null)} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div className={styles.textSection}>
                                <div>
                                    <span className={styles.sectionTitle}>BIO</span>
                                    {canUploadForThisProfile ? (
                                        <textarea
                                            value={editBio}
                                            onChange={(e) => setEditBio(e.target.value)}
                                            className={styles.editTxArea}
                                        />
                                    ) : (
                                        <p className={styles.sectionContent}>{profile.bio || '[Pending...]'}</p>
                                    )}
                                </div>

                                <div>
                                    <span className={styles.sectionTitle}>MANAGER'S COMMENT</span>
                                    {canUploadForThisProfile ? (
                                        <textarea
                                            value={editComment}
                                            onChange={(e) => setEditComment(e.target.value)}
                                            className={styles.editTxArea}
                                        />
                                    ) : (
                                        <p className={styles.sectionContent}>{profile.managerComment || '[Pending...]'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={styles.buttonGroup}>
                            {canUploadForThisProfile && (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={styles.saveButton}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                            <button onClick={() => setBookOpen(false)} className={styles.closeButton}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <Navbar />
        </div>
    );
}
