'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';
import { useHunterStore, UserProfile, Agency } from '@/lib/store';
import LoadingScreen from '@/components/LoadingScreen';
import { Settings as Cog, Lock, X, MoreVertical, Crown, UserX } from 'lucide-react';
import { calculateOverallPercentage, getRankFromPercentage, Rank } from '@/lib/game-logic';
import AgencySettings from '@/components/AgencySettings';

export default function AgencyPage() {
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [agency, setAgency] = useState<Agency | null>(null);
    const [agencyRank, setAgencyRank] = useState<Rank>('E');
    const [showSettings, setShowSettings] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const router = useRouter();
    const { getTheme, profile, joinAgency, createAgency, promoteToCaptain, kickMember } = useHunterStore();

    const themeRank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;
    const rankColor = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    const isSolo = profile?.role === 'Solo';
    const isCaptain = profile?.role === 'Captain';
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
    }, [profile, router]);

    const handleJoinAgency = async () => {
        if (!inviteCode) return;
        const res = await joinAgency(inviteCode);
        if (res.success) {
            setShowJoinModal(false);
            router.refresh();
        } else {
            alert(res.error || 'Invalid invite code');
        }
    };

    const handleCreateAgency = async () => {
        if (!agencyName) return;
        try {
            await createAgency(agencyName, '/placeholder.png');
            setShowCreateModal(false);
            router.push('/agency');
        } catch (error: any) {
            alert(error.message || 'Failed to create agency');
        }
    };

    const handleHunterClick = (name: string) => {
        router.push(`/batch3/${name}`);
    };

    const handlePromoteToCaptain = async (memberId: string, memberName: string) => {
        if (confirm(`Promote ${memberName} to Captain? You will become a Hunter.`)) {
            await promoteToCaptain(memberId);
            setOpenMenuId(null);
            // Refresh data
            const { data: agencyData } = await supabase
                .from('agencies')
                .select('*')
                .eq('id', profile?.agencyId)
                .single();
            if (agencyData) setAgency(agencyData);

            const { data: membersData } = await supabase
                .from('profiles')
                .select('*')
                .eq('agency_id', profile?.agencyId);
            if (membersData) setMembers(membersData);
        }
    };

    const handleKickMember = async (memberId: string, memberName: string) => {
        if (confirm(`Kick ${memberName} from the agency? They will be redirected to role selection.`)) {
            await kickMember(memberId);
            setOpenMenuId(null);
            // Refresh members list
            const { data: membersData } = await supabase
                .from('profiles')
                .select('*')
                .eq('agency_id', profile?.agencyId);
            if (membersData) setMembers(membersData);
        }
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

            <h2 className={styles.sectionTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                {agency?.name?.toUpperCase() || 'AGENCY'} MEMBERS
            </h2>

            <div className={styles.membersGrid}>
                {members.filter(m => m.name !== profile.name).map((member) => (
                    <div
                        key={member.id}
                        className={styles.memberCard}
                        style={{ borderColor: rankColor, position: 'relative' }}
                    >
                        {isCaptain && (
                            <>
                                <button
                                    className={styles.menuButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(openMenuId === member.id ? null : member.id);
                                    }}
                                >
                                    <MoreVertical size={20} />
                                </button>

                                {openMenuId === member.id && (
                                    <div className={styles.dropdown}>
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            handlePromoteToCaptain(member.id, member.name);
                                        }}>
                                            <Crown size={16} /> Promote to Captain
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleKickMember(member.id, member.name);
                                            }}
                                            className={styles.dangerOption}
                                        >
                                            <UserX size={16} /> Kick Member
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        <div onClick={() => handleHunterClick(member.name)} style={{ cursor: 'pointer' }}>
                            <img
                                src={member.avatarUrl || '/placeholder.png'}
                                alt={member.name}
                                className={styles.memberAvatar}
                            />
                            <div className={styles.memberOverlay}>
                                <h3 className={styles.memberName}>{member.name}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showSettings && agency && (
                <AgencySettings agency={agency} onClose={() => setShowSettings(false)} />
            )}

            {showJoinModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        padding: '2rem',
                        borderRadius: '8px',
                        border: `2px solid ${rankColor}`,
                        minWidth: '400px',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowJoinModal(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={24} />
                        </button>
                        <h2 style={{ color: rankColor, marginBottom: '1rem' }}>JOIN AGENCY</h2>
                        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Enter your agency invite code</p>
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            placeholder="INVITE CODE"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#0a0a0a',
                                border: `1px solid ${rankColor}`,
                                color: '#fff',
                                borderRadius: '4px',
                                marginBottom: '1rem',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            onClick={handleJoinAgency}
                            className={styles.joinBtn}
                            style={{ width: '100%' }}
                        >
                            JOIN
                        </button>
                    </div>
                </div>
            )}

            {/* Create Agency Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        padding: '2rem',
                        borderRadius: '8px',
                        border: `2px solid ${rankColor}`,
                        minWidth: '400px',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={24} />
                        </button>
                        <h2 style={{ color: rankColor, marginBottom: '1rem' }}>CREATE AGENCY</h2>
                        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Choose a name for your agency</p>
                        <input
                            type="text"
                            value={agencyName}
                            onChange={(e) => setAgencyName(e.target.value)}
                            placeholder="AGENCY NAME"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#0a0a0a',
                                border: `1px solid ${rankColor}`,
                                color: '#fff',
                                borderRadius: '4px',
                                marginBottom: '1rem',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            onClick={handleCreateAgency}
                            className={styles.joinBtn}
                            style={{ width: '100%' }}
                        >
                            CREATE
                        </button>
                    </div>
                </div>
            )}

            <Navbar />
        </div>
    );
}
