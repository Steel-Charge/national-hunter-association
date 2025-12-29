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

export default function HomePage() {
    const { profile, loading, getOverallRank, getTheme, setProfile } = useHunterStore();
    const router = useRouter();

    const [bookOpen, setBookOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const canUpload = profile?.name === 'Edgelord';

    const [editBio, setEditBio] = useState('');
    const [editComment, setEditComment] = useState('');
    const [newVideo, setNewVideo] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Update edit state when profile loads
    useEffect(() => {
        if (profile) {
            setEditBio(profile.bio || '');
            setEditComment(profile.managerComment || '');
            setNewVideo(null);
        }
    }, [profile]);

    const handleVideoFile = async (file: File | null) => {
        if (!file || !profile) return;
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

            {/* Profile Book Modal for logged-in user */}
            {bookOpen && (
                <div className={styles.interviewOverlay}>
                    <div
                        onClick={() => setBookOpen(false)}
                        style={{ position: 'absolute', inset: 0 }}
                    />
                    <div className={styles.interviewModal} style={{
                        '--custom-theme-color': RANK_COLORS[(profile?.settings?.theme || calculateOverallRank(profile?.testScores || {}, profile?.profileType || 'male_20_25')) as Rank] || '#00e5ff',
                        '--custom-theme-glow': RANK_COLORS[(profile?.settings?.theme || calculateOverallRank(profile?.testScores || {}, profile?.profileType || 'male_20_25')) as Rank] || '#00e5ff'
                    } as React.CSSProperties}>
                        <h2 className={styles.interviewHeader}>
                            {profile?.name} — Interview
                        </h2>
                        <div className={styles.interviewBody}>
                            <div className={styles.videoSection}>
                                {profile?.videoUrl ? (
                                    <div className={styles.videoWrapper}>
                                        <video controls style={{ width: '100%', display: 'block' }} src={newVideo || profile?.videoUrl} />
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', height: 280, borderRadius: 12, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        {newVideo ? <video controls style={{ width: '100%', borderRadius: 12 }} src={newVideo} /> : 'No interview available'}
                                    </div>
                                )}

                                {canUpload && (
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
                                    {canUpload ? (
                                        <textarea
                                            value={editBio}
                                            onChange={(e) => setEditBio(e.target.value)}
                                            className={styles.editTxArea}
                                        />
                                    ) : (
                                        <p className={styles.sectionContent}>{profile?.bio || '[Pending...]'}</p>
                                    )}
                                </div>

                                <div>
                                    <span className={styles.sectionTitle}>MANAGER'S COMMENT</span>
                                    {canUpload ? (
                                        <textarea
                                            value={editComment}
                                            onChange={(e) => setEditComment(e.target.value)}
                                            className={styles.editTxArea}
                                        />
                                    ) : (
                                        <p className={styles.sectionContent}>{profile?.managerComment || '[Pending...]'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={styles.buttonGroup}>
                            {canUpload && (
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

            {/* Profile Settings Overlay */}
            <ProfileSettings
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />

            <Navbar />
        </div>
    );
}
