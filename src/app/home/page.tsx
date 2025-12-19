"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHunterStore } from '@/lib/store';
import Navbar from '@/components/Navbar';
import ProfileView from '@/components/ProfileView';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './page.module.css';
import { Book } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
    const { profile, loading, getOverallRank, getTheme, setProfile } = useHunterStore();
    const router = useRouter();

    const [bookOpen, setBookOpen] = useState(false);

    const canUpload = profile?.name === 'Edgelord';

    const handleVideoFile = async (file: File | null) => {
        if (!file || !profile) return;
        const reader = new FileReader();
        reader.onload = async () => {
            const result = reader.result as string;
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ video_url: result })
                    .eq('id', profile.id);
                if (error) {
                    console.error('Error uploading video:', error);
                    return;
                }
                setProfile({ ...profile, videoUrl: result });
            } catch (err) {
                console.error('Upload failed', err);
            }
        };
        reader.readAsDataURL(file);
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
            {/* Book icon on logged-in profile */}
            <button
                onClick={() => setBookOpen(!bookOpen)}
                aria-label={bookOpen ? 'Close profile book' : 'Open profile book'}
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
                <Book size={36} />
            </button>
            {/* Background Image */}
            {/* Background handled globally by BackgroundWrapper */}

            <ProfileView
                profile={profile}
                overallRank={overallRank}
                themeRank={themeRank}
                specialTheme={specialTheme}
            />

                    {/* Profile Book Modal for logged-in user */}
                    {bookOpen && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
                            <div
                                onClick={() => setBookOpen(false)}
                                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }}
                            />
                            <div style={{ position: 'relative', maxWidth: 900, margin: '6vh auto', background: '#0b0b0b', padding: 24, borderRadius: 10, zIndex: 2001, color: '#fff' }}>
                                <h2 style={{ marginTop: 0 }}>{profile?.name} — Interview</h2>
                                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        {profile?.videoUrl ? (
                                            <video controls style={{ width: '100%', borderRadius: 6 }} src={profile?.videoUrl} />
                                        ) : (
                                            <div style={{ width: '100%', height: 240, borderRadius: 6, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                                                No interview available
                                            </div>
                                        )}

                                        {canUpload && (
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
