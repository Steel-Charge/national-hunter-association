'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';
import { useHunterStore, UserProfile, Agency } from '@/lib/store';
import LoadingScreen from '@/components/LoadingScreen';
import { Settings as Cog, Lock } from 'lucide-react';
import { calculateOverallPercentage, getRankFromPercentage, Rank } from '@/lib/game-logic';
import AgencySettings from '@/components/AgencySettings';

export default function AgencyPage() {
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [agency, setAgency] = useState<Agency | null>(null);
    const [agencyRank, setAgencyRank] = useState<Rank>('E');
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { getTheme, profile } = useHunterStore();

    const themeRank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;
    const rankColor = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    const isSolo = profile?.role === 'Solo';
    const isNamelessInBatch3 = isSolo && agency?.name === 'Batch 3';

    useEffect(() => {
        const fetchData = async () => {
            if (!profile) return;

            // If no agency_id, redirect to role selection
            if (!profile.agencyId) {
                router.push('/role-selection');
                return;
            }

            // 1. Fetch Agency Data
            const { data: agencyData, error: agencyError } = await supabase
                .from('agencies')
                .select('*')
                .eq('id', profile.agencyId)
                .single();

            if (agencyError) {
                console.error('Error fetching agency:', agencyError);
            } else {
                setAgency(agencyData);
            }

            // 2. Fetch Members
            const { data: membersData, error: membersError } = await supabase
                .from('profiles')
                .select('*')
                .eq('agency_id', profile.agencyId);

            if (membersError) {
                console.error('Error fetching members:', membersError);
            } else {
                const mappedMembers = (membersData || []).map(p => ({
                    id: p.id,
                    name: p.name,
                    avatarUrl: p.avatar_url,
                    activeTitle: p.active_title,
                    testScores: p.test_scores || {},
                    profileType: p.profile_type || 'male_20_25',
                    role: p.role,
                    settings: p.settings
                })) as any[];

                setMembers(mappedMembers);

                // 3. Calculate Agency Rank
                if (mappedMembers.length > 0) {
                    const totalAvg = mappedMembers.reduce((acc, m) => acc + calculateOverallPercentage(m.testScores, m.profileType), 0);
                    const agencyAvg = totalAvg / mappedMembers.length;
                    setAgencyRank(getRankFromPercentage(agencyAvg));
                }
            }

            setLoading(false);
        };

        fetchData();
    }, [profile, profile?.agencyId]);

    const handleHunterClick = (username: string) => {
        router.push(`/batch3/${username}`);
    };

    if (loading || !profile) return <LoadingScreen loading={loading} rank={getTheme()} />;

    return (
        <div className={styles.container} style={{ '--rank-color': rankColor } as React.CSSProperties}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                    {profile.name.toUpperCase()}
                </h1>
                <p className={styles.pageSubtitle} style={{ color: `var(--rarity-${profile.activeTitle?.rarity?.toLowerCase() || 'common'})`, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {profile.activeTitle?.name || 'HUNTER'}
                </p>
            </div>

            <div className={styles.agencySection}>
                <div className={styles.agencyInfo}>
                    <h2 className={styles.agencyName} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                        {agency?.name?.toUpperCase() || 'LOADING...'}
                    </h2>

                    <div className={styles.agencyStats}>
                        <p>MEMBERS: [{members.length}/10]</p>
                        <p>RANK: <span style={{ color: `var(--rank-${agencyRank.toLowerCase()})` }}>{agencyRank}</span></p>
                    </div>

                    <div className={styles.agencyTitles}>
                        <p className={styles.label}>TITLES:</p>
                        <div className={styles.titleBadge}>UPSTART</div>
                    </div>
                </div>

                <div className={styles.agencyLogoContainer}>
                    <img
                        src={agency?.logo_url || '/placeholder.png'}
                        alt="Agency Logo"
                        className={styles.agencyLogo}
                    />
                </div>

                <button
                    className={styles.settingsTrigger}
                    onClick={() => setShowSettings(true)}
                >
                    <Cog size={24} />
                </button>
            </div>

            {isSolo ? (
                <div className={styles.restrictedView}>
                    <div className={styles.restrictedContent}>
                        <Lock size={48} className={styles.lockIcon} />
                        <h3>RANKINGS RESTRICTED</h3>
                        <p>This feature is only available for hunters who are part of an agency.</p>
                        <button onClick={() => router.push('/role-selection')} className={styles.joinBtn}>
                            JOIN AN AGENCY
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <h2 className={styles.sectionTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                        {agency?.name?.toUpperCase() || 'AGENCY'} MEMBERS
                    </h2>

                    <div className={styles.membersGrid}>
                        {members.filter(m => m.name !== profile.name).map((member) => (
                            <div
                                key={member.id}
                                onClick={() => handleHunterClick(member.name)}
                                className={styles.memberCard}
                                style={{ borderColor: rankColor }}
                            >
                                <img
                                    src={member.avatarUrl || '/placeholder.png'}
                                    alt={member.name}
                                    className={styles.memberAvatar}
                                />
                                <div className={styles.memberOverlay}>
                                    <h3 className={styles.memberName}>{member.name}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {showSettings && agency && (
                <AgencySettings agency={agency} onClose={() => setShowSettings(false)} />
            )}

            <Navbar />
        </div>
    );
}
