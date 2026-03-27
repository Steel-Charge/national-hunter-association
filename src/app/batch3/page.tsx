'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';
import LoadingScreen from '@/components/LoadingScreen';
import { Settings as Cog, X, MoreVertical, Crown, UserX, Search, PenTool, ChevronLeft } from 'lucide-react';
import { calculateOverallPercentage, getRankFromPercentage, Rank } from '@/lib/game-logic';
import AgencySettings from '@/components/AgencySettings';
import AgencyTitlesModal from '@/components/AgencyTitlesModal';
import TrainingView from '@/components/TrainingView';
import { useHunterStore, UserProfile, Agency, Title, getDisplayTitle, isDefaultTitle } from '@/lib/store';
import { playSound } from '@/lib/audio';

type HubView = 'home' | 'agency' | 'allies' | 'events' | 'training';

export default function AgencyPage() {
    const router = useRouter();
    const { getTheme, profile, updateAgency, joinAgency, createAgency, promoteToCaptain, kickMember, connections, pendingRequests, sentRequestIds, fetchConnections, addConnection, acceptRequest, declineRequest, searchHunters } = useHunterStore();

    const [members, setMembers] = useState<UserProfile[]>([]);
    const [agency, setAgency] = useState<Agency | null>(null);
    const [agencyRank, setAgencyRank] = useState<Rank>('E');
    const [showSettings, setShowSettings] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTitlesModal, setShowTitlesModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<HubView>('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [description, setDescription] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showLogoPreview, setShowLogoPreview] = useState(false);

    const themeRank = getTheme();
    const specialTheme = profile?.settings?.specialTheme || null;
    const rankColor = specialTheme ? `var(--rarity-${specialTheme})` : `var(--rank-${themeRank.toLowerCase()})`;

    const isSolo = profile?.role === 'Solo';
    const isCaptain = profile?.role === 'Captain';

    const navigateTo = (view: HubView) => {
        playSound('click');
        setActiveView(view);
    };

    const goHome = () => {
        playSound('click');
        setActiveView('home');
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!profile) return;

            // If no agency_id, redirect to role selection
            if (!profile.agencyId) {
                router.push('/role-selection');
                return;
            }

            try {
                // Parallelize agency and members fetching
                const [agencyResult, membersResult] = await Promise.all([
                    supabase
                        .from('agencies')
                        .select('*')
                        .eq('id', profile.agencyId)
                        .single(),
                    supabase
                        .from('profiles')
                        .select('*')
                        .eq('agency_id', profile.agencyId)
                ]);

                // Process agency data
                if (agencyResult.error) {
                    console.error('Error fetching agency:', agencyResult.error);
                } else {
                    setAgency(agencyResult.data);
                    setDescription(agencyResult.data.description || 'This is a New agency...');
                }

                // Process members data
                if (membersResult.error) {
                    console.error('Error fetching members:', membersResult.error);
                } else {
                    const mappedMembers = (membersResult.data || []).map(p => ({
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

                    // Calculate Agency Rank
                    if (mappedMembers.length > 0) {
                        const totalAvg = mappedMembers.reduce((acc, m) => acc + calculateOverallPercentage(m.testScores, m.profileType), 0);
                        const agencyAvg = totalAvg / mappedMembers.length;
                        setAgencyRank(getRankFromPercentage(agencyAvg));
                    }
                }
            } catch (error) {
                console.error('Error fetching Hub data:', error);
            } finally {
                setLoading(false);
            }

            // Fetch connections in background (non-blocking)
            fetchConnections();
        };

        fetchData();
    }, [profile, router, fetchConnections]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        const results = await searchHunters(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
    };

    const handleAddFriend = async (friendId: string) => {
        await addConnection(friendId);
    };

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

    const handleSaveDescription = async () => {
        if (!agency) return;
        try {
            await updateAgency(agency.id, { description });
            setAgency({ ...agency, description });
        } catch (error) {
            alert('Failed to update description');
        }
    };

    const handlePromoteToCaptain = async (memberId: string, memberName: string) => {
        if (confirm(`Promote ${memberName} to Captain? You will become a Hunter.`)) {
            await promoteToCaptain(memberId);
            setOpenMenuId(null);
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
            const { data: membersData } = await supabase
                .from('profiles')
                .select('*')
                .eq('agency_id', profile?.agencyId);
            if (membersData) setMembers(membersData);
        }
    };

    if (loading || !profile) return <LoadingScreen loading={loading} rank={getTheme()} />;

    // ─── View labels for sub-pages ─────────────────────────────────────────────
    const VIEW_LABELS: Record<HubView, string> = {
        home: 'HUB',
        agency: 'AGENCY',
        allies: 'ALLIES',
        events: 'EVENTS',
        training: 'WORKOUT PLAN',
    };

    return (
        <div className={styles.container} style={{ '--rank-color': rankColor } as React.CSSProperties}>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className={styles.header}>
                {activeView !== 'home' && (
                    <button className={styles.backBtn} onClick={goHome} aria-label="Back to hub">
                        <ChevronLeft size={24} />
                    </button>
                )}
                {activeView !== 'training' ? (
                    <div className={styles.headerTitles}>
                        <h1 className={styles.pageTitle} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                            {activeView === 'home' ? profile.name.toUpperCase() : VIEW_LABELS[activeView]}
                        </h1>
                        {activeView === 'home' && (() => {
                            const titleName = profile.activeTitle?.name || 'Hunter';
                            const rarity = profile.activeTitle?.rarity || 'Common';
                            const displayTitle = getDisplayTitle(titleName, profile.role, profile.agencyName);
                            const isDefault = isDefaultTitle(titleName);
                            const titleColor = isDefault ? rankColor : `var(--rarity-${rarity.toLowerCase()})`;
                            return (
                                <p className={styles.pageSubtitle} style={{ color: titleColor, fontWeight: 'bold', fontSize: '1.2rem' }}>
                                    {displayTitle.toUpperCase()}
                                </p>
                            );
                        })()}
                    </div>
                ) : (
                    <div style={{ flex: 1 }} /> // Spacer to keep layout if needed, though TrainingView has its own
                )}
                {activeView === 'home' && !isSolo && (
                    <button
                        className={styles.settingsTrigger}
                        onClick={() => setShowSettings(true)}
                    >
                        <Cog size={24} />
                    </button>
                )}
            </div>

            {/* ── HOME: 4-tile grid ──────────────────────────────────────── */}
            {activeView === 'home' && (
                <div className={styles.hubGrid}>
                    {/* Top row: Agency + Allies */}
                    <div className={styles.hubTopRow}>
                        {/* Agency tile */}
                        <button
                            className={`${styles.hubTile} ${isSolo ? styles.hubTileDisabled : ''}`}
                            style={{ borderColor: isSolo ? 'rgba(255,255,255,0.1)' : rankColor, boxShadow: isSolo ? 'none' : `0 0 20px ${rankColor}22` }}
                            onClick={() => { if (!isSolo) navigateTo('agency'); }}
                            disabled={isSolo}
                        >
                            <div className={styles.hubTileIcon}>
                                {/* Shield + sword SVG */}
                                <svg viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.tileIconSvg}>
                                    <path d="M40 5 L70 18 L70 45 C70 65 40 85 40 85 C40 85 10 65 10 45 L10 18 Z" stroke={isSolo ? 'rgba(255,255,255,0.2)' : rankColor} strokeWidth="3" fill="none" strokeLinejoin="round" />
                                    <line x1="40" y1="25" x2="40" y2="65" stroke={isSolo ? 'rgba(255,255,255,0.2)' : rankColor} strokeWidth="2.5" strokeLinecap="round" />
                                    <line x1="28" y1="38" x2="52" y2="38" stroke={isSolo ? 'rgba(255,255,255,0.2)' : rankColor} strokeWidth="2.5" strokeLinecap="round" />
                                    <circle cx="40" cy="52" r="4" stroke={isSolo ? 'rgba(255,255,255,0.2)' : rankColor} strokeWidth="2" fill="none" />
                                </svg>
                            </div>
                            <span className={styles.hubTileLabel} style={{ color: isSolo ? 'rgba(255,255,255,0.2)' : rankColor }}>
                                AGENCY
                            </span>
                        </button>

                        {/* Allies tile */}
                        <button
                            className={styles.hubTile}
                            style={{ borderColor: rankColor, boxShadow: `0 0 20px ${rankColor}22` }}
                            onClick={() => navigateTo('allies')}
                        >
                            <div className={styles.hubTileIcon}>
                                {/* Helmet SVG */}
                                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.tileIconSvg}>
                                    <path d="M40 10 C20 10 14 28 14 40 L14 55 C14 58 17 60 20 60 L28 60 L28 68 L52 68 L52 60 L60 60 C63 60 66 58 66 55 L66 40 C66 28 60 10 40 10 Z" stroke={rankColor} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
                                    <path d="M14 40 L28 40 L28 55 L14 55" stroke={rankColor} strokeWidth="2" fill="none" />
                                    <line x1="28" y1="35" x2="66" y2="35" stroke={rankColor} strokeWidth="2" />
                                    <circle cx="52" cy="22" r="3" stroke={rankColor} strokeWidth="1.5" fill="none" />
                                </svg>
                            </div>
                            <span className={styles.hubTileLabel} style={{ color: rankColor }}>ALLIES</span>
                        </button>
                    </div>

                    {/* Events tile (full width) */}
                    <button
                        className={`${styles.hubTile} ${styles.hubTileWide} ${styles.hubTileDisabled}`}
                        style={{ borderColor: 'rgba(255,255,255,0.12)', boxShadow: 'none' }}
                        disabled
                    >
                        <div className={styles.hubTileIcon}>
                            {/* Calendar SVG */}
                            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.tileIconSvg}>
                                <rect x="8" y="16" width="64" height="56" rx="6" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" fill="none" />
                                <line x1="8" y1="30" x2="72" y2="30" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                                <line x1="26" y1="8" x2="26" y2="24" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="54" y1="8" x2="54" y2="24" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round" />
                                <rect x="20" y="38" width="10" height="10" rx="2" fill="rgba(255,255,255,0.15)" />
                                <rect x="35" y="38" width="10" height="10" rx="2" fill="rgba(255,255,255,0.15)" />
                                <rect x="50" y="38" width="10" height="10" rx="2" fill="rgba(255,255,255,0.15)" />
                                <rect x="20" y="54" width="10" height="10" rx="2" fill="rgba(255,255,255,0.15)" />
                                <path d="M35 59 L40 54 L45 59" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" fill="none" />
                            </svg>
                        </div>
                        <span className={styles.hubTileLabel} style={{ color: 'rgba(255,255,255,0.25)' }}>EVENTS</span>
                        <span className={styles.comingSoonBadge}>COMING SOON</span>
                    </button>

                    {/* Training tile (full width) */}
                    <button
                        className={`${styles.hubTile} ${styles.hubTileWide}`}
                        style={{ borderColor: rankColor, boxShadow: `0 0 20px ${rankColor}22` }}
                        onClick={() => navigateTo('training')}
                    >
                        <div className={styles.hubTileIcon}>
                            {/* Workout / clipboard + dumbbell SVG */}
                            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.tileIconSvg}>
                                <rect x="18" y="10" width="38" height="52" rx="4" stroke={rankColor} strokeWidth="2.5" fill="none" />
                                <rect x="28" y="6" width="18" height="8" rx="3" stroke={rankColor} strokeWidth="2" fill="none" />
                                <line x1="26" y1="28" x2="48" y2="28" stroke={rankColor} strokeWidth="2" strokeLinecap="round" />
                                <line x1="26" y1="37" x2="48" y2="37" stroke={rankColor} strokeWidth="2" strokeLinecap="round" />
                                <line x1="26" y1="46" x2="42" y2="46" stroke={rankColor} strokeWidth="2" strokeLinecap="round" />
                                <rect x="22" y="25" width="4" height="6" rx="1" stroke={rankColor} strokeWidth="1.5" fill="none" />
                                <rect x="22" y="34" width="4" height="6" rx="1" stroke={rankColor} strokeWidth="1.5" fill="none" />
                                <rect x="22" y="43" width="4" height="6" rx="1" stroke={rankColor} strokeWidth="1.5" fill="none" />
                                {/* Pencil */}
                                <line x1="54" y1="52" x2="66" y2="40" stroke={rankColor} strokeWidth="2.5" strokeLinecap="round" />
                                <polygon points="66,40 70,44 58,56 54,52" stroke={rankColor} strokeWidth="2" fill="none" />
                                <line x1="54" y1="56" x2="52" y2="62" stroke={rankColor} strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className={styles.hubTileLabel} style={{ color: rankColor }}>WORKOUT PLAN</span>
                    </button>
                </div>
            )}

            {/* ── AGENCY view ────────────────────────────────────────────── */}
            {activeView === 'agency' && (
                <>
                    <div className={styles.agencySection}>
                        <div className={styles.agencyHeaderRow}>
                            <div className={styles.agencyInfo}>
                                <h2 className={styles.agencyName} style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}` }}>
                                    {isSolo ? 'NAMELESS' : (agency?.name?.toUpperCase() || 'LOADING...')}
                                </h2>
                                {!isSolo && (
                                    <div className={styles.agencyStats}>
                                        <div className={styles.statRow}><span className={styles.statLabel}>MEMBERS:</span> [{members.length}/10]</div>
                                        <div className={styles.statRow}>
                                            <span className={styles.statLabel}>AGENCY RANK:</span> <span className={styles.rankValue} style={{ color: `var(--rank-${agencyRank.toLowerCase()})` }}>{agencyRank}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.agencyLogoContainer}>
                                <img
                                    src={isSolo ? '/logo_new.png' : (agency?.logo_url || '/placeholder.png')}
                                    alt="Agency Logo"
                                    className={styles.agencyLogo}
                                    onClick={() => setShowLogoPreview(true)}
                                    style={{ cursor: 'pointer' }}
                                />
                                {!isSolo && (
                                    <div className={styles.managerInfo}>
                                        <span className={styles.assignedManagerLabel}>ASSIGNED MANAGER:</span>
                                        <span className={styles.managerName}>HUNTER BONES</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isSolo ? (
                            <div className={styles.descriptionContainer}>
                                <div className={styles.descriptionLabel}>ASSOCIATION MESSAGE :</div>
                                <div className={styles.descriptionReadonly} style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>
                                    "While no manager has been assigned to you, rest assured the Association is monitoring your development. Like all our agents, strive for growth. Your progress matters."
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={styles.agencyTitles}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <p className={styles.descriptionLabel} style={{ margin: 0 }}>TITLES :</p>
                                        {isCaptain && (
                                            <button
                                                onClick={() => setShowTitlesModal(true)}
                                                style={{ background: 'none', border: 'none', color: rankColor, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', opacity: 0.6 }}
                                            >
                                                <PenTool size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {(() => {
                                            const isUpstartHidden = (agency?.title_visibility as Record<string, boolean> || {})['UPSTART'];
                                            if (isUpstartHidden) return null;
                                            return <div className={styles.commonTitle}>UPSTART</div>;
                                        })()}
                                        {(agency?.unlocked_titles as Title[] || []).map((title: Title) => {
                                            const isHidden = (agency?.title_visibility as Record<string, boolean> || {})[title.name];
                                            if (isHidden) return null;
                                            return (
                                                <div
                                                    key={title.name}
                                                    className={styles.commonTitle}
                                                    style={{
                                                        color: `var(--rarity-${title.rarity.toLowerCase()})`,
                                                        borderColor: `var(--rarity-${title.rarity.toLowerCase()})`,
                                                        textShadow: `0 0 5px var(--rarity-${title.rarity.toLowerCase()})`
                                                    }}
                                                >
                                                    {title.name.toUpperCase()}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className={styles.descriptionContainer}>
                                    <div className={styles.descriptionLabel}>DESCRIPTION :</div>
                                    {isCaptain ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <textarea
                                                className={styles.agencyDescription}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                onBlur={handleSaveDescription}
                                                placeholder="Enter agency description..."
                                            />
                                        </div>
                                    ) : (
                                        <div className={styles.descriptionReadonly}>
                                            {agency?.description || "This is a New agency..."}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Members grid */}
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

                                <div
                                    onClick={() => { playSound('click'); handleHunterClick(member.name); }}
                                    className={styles.memberContentWrapper}
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
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── ALLIES view ────────────────────────────────────────────── */}
            {activeView === 'allies' && (
                <div className={styles.networkView}>
                    <form onSubmit={handleSearch} className={styles.searchBarContainer}>
                        <div className={styles.searchInputWrapper} style={{ borderColor: rankColor }}>
                            <Search className={styles.searchIcon} size={20} style={{ color: rankColor }} />
                            <input
                                type="text"
                                placeholder="SEARCH HUNTER'S USERNAME..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </form>

                    {searchResults.length > 0 && (
                        <div className={styles.searchResults}>
                            {searchResults.map((hunter) => (
                                <div key={hunter.id} className={styles.searchResultItem} style={{ borderBottomColor: `${rankColor}33` }}>
                                    <div className={styles.resultInfo}>
                                        <div className={styles.resultMain}>
                                            <span className={styles.resultLabel}>USERNAME: </span>
                                            <span className={styles.resultValue}>{hunter.name}</span>
                                        </div>
                                        <div className={styles.resultSub}>
                                            <div>
                                                <span className={styles.resultLabel}>RANK: </span>
                                                {(() => {
                                                    const rank = getRankFromPercentage(calculateOverallPercentage(hunter.testScores, hunter.profileType));
                                                    return (
                                                        <span className={styles.resultValue} style={{ color: `var(--rank-${rank.toLowerCase()})` }}>
                                                            {rank}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div>
                                                <span className={styles.resultLabel}>AGENCY: </span>
                                                <span className={styles.resultValue}>{hunter.role === 'Solo' ? 'NAMELESS' : (hunter.agencyName || 'NAMELESS')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {hunter.id !== profile.id && (
                                        <>
                                            {connections.some(c => c.id === hunter.id) ? (
                                                <span className={styles.statusBadge} style={{ color: rankColor }}>FRIENDS</span>
                                            ) : sentRequestIds.includes(hunter.id) ? (
                                                <button className={styles.requestedBtn} disabled>REQUESTED</button>
                                            ) : pendingRequests.some(r => r.id === hunter.id) ? (
                                                <div className={styles.actionGroup}>
                                                    <button onClick={() => acceptRequest(hunter.id)} className={styles.acceptBtn}>ACCEPT</button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddFriend(hunter.id)}
                                                    className={styles.addFriendBtn}
                                                    style={{ backgroundColor: rankColor }}
                                                >
                                                    ADD
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {pendingRequests.length > 0 && (
                        <div className={styles.pendingSection}>
                            <h3 className={styles.pendingTitle} style={{ color: rankColor }}>PENDING REQUESTS</h3>
                            <div className={styles.pendingList}>
                                {pendingRequests.map((req) => (
                                    <div key={req.id} className={styles.pendingItem} style={{ borderColor: `${rankColor}44` }}>
                                        <div className={styles.pendingInfo}>
                                            <img src={req.avatarUrl || '/placeholder.png'} alt={req.name} className={styles.miniAvatar} />
                                            <span>{req.name}</span>
                                        </div>
                                        <div className={styles.pendingActions}>
                                            <button onClick={() => acceptRequest(req.id)} className={styles.acceptBtn} style={{ backgroundColor: rankColor }}>ACCEPT</button>
                                            <button onClick={() => declineRequest(req.id)} className={styles.declineBtn}>DECLINE</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.connectionsSection}>
                        <p className={styles.connectionHint}>
                            {connections.length > 0 ? "YOUR NETWORK" : "CONNECTIONS ADDED WILL BE DISPLAYED HERE."}
                        </p>
                        <div className={styles.connectionsGrid}>
                            {connections.map((conn) => (
                                <div
                                    key={conn.id}
                                    className={styles.connectionCard}
                                    style={{ borderColor: rankColor }}
                                >
                                    <div
                                        className={styles.memberContentWrapper}
                                        onClick={() => handleHunterClick(conn.name)}
                                    >
                                        <img
                                            src={conn.avatarUrl || '/placeholder.png'}
                                            alt={conn.name}
                                            className={`${styles.memberAvatar} ${conn.avatarUrl ? '' : styles.grayscale}`}
                                        />
                                        <div className={styles.memberOverlay}>
                                            <h3 className={styles.memberName}>{conn.name}</h3>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── EVENTS view ────────────────────────────────────────────── */}
            {activeView === 'events' && (
                <div className={styles.emptyView}>
                    <div className={styles.emptyIcon} style={{ color: rankColor }}>🗓️</div>
                    <p className={styles.emptyMessage} style={{ color: `${rankColor}99` }}>EVENTS COMING SOON</p>
                </div>
            )}

            {/* ── TRAINING view ──────────────────────────────────────────── */}
            {activeView === 'training' && (
                <TrainingView profileName={profile.name} rankColor={rankColor} />
            )}

            {/* ── Modals ────────────────────────────────────────────────── */}
            {showSettings && agency && (
                <AgencySettings agency={agency} onClose={() => setShowSettings(false)} />
            )}

            {showJoinModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '8px', border: `2px solid ${rankColor}`, minWidth: '400px', position: 'relative' }}>
                        <button onClick={() => setShowJoinModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <h2 style={{ color: rankColor, marginBottom: '1rem' }}>JOIN AGENCY</h2>
                        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Enter your agency invite code</p>
                        <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="INVITE CODE" style={{ width: '100%', padding: '0.75rem', background: '#0a0a0a', border: `1px solid ${rankColor}`, color: '#fff', borderRadius: '4px', marginBottom: '1rem', fontSize: '1rem' }} />
                        <button onClick={handleJoinAgency} className={styles.joinBtn} style={{ width: '100%' }}>JOIN</button>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '8px', border: `2px solid ${rankColor}`, minWidth: '400px', position: 'relative' }}>
                        <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <h2 style={{ color: rankColor, marginBottom: '1rem' }}>CREATE AGENCY</h2>
                        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Choose a name for your agency</p>
                        <input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="AGENCY NAME" style={{ width: '100%', padding: '0.75rem', background: '#0a0a0a', border: `1px solid ${rankColor}`, color: '#fff', borderRadius: '4px', marginBottom: '1rem', fontSize: '1rem' }} />
                        <button onClick={handleCreateAgency} className={styles.joinBtn} style={{ width: '100%' }}>CREATE</button>
                    </div>
                </div>
            )}

            {showTitlesModal && agency && (
                <AgencyTitlesModal
                    titles={agency.unlocked_titles as Title[] || []}
                    visibility={agency.title_visibility as Record<string, boolean> || {}}
                    onClose={() => setShowTitlesModal(false)}
                    onUpdate={async () => {
                        const { data: agencyData } = await supabase
                            .from('agencies')
                            .select('*')
                            .eq('id', profile?.agencyId)
                            .single();
                        if (agencyData) setAgency(agencyData);
                    }}
                />
            )}

            {/* Logo Preview Modal */}
            {showLogoPreview && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'pointer' }} onClick={() => setShowLogoPreview(false)}>
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowLogoPreview(false)} style={{ position: 'absolute', top: '-50px', right: '0', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '2rem' }}>
                            <X size={32} />
                        </button>
                        <img src={isSolo ? '/logo_new.png' : (agency?.logo_url || '/placeholder.png')} alt="Agency Logo Preview" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', border: `3px solid ${rankColor}`, borderRadius: '8px', boxShadow: `0 0 30px ${rankColor}` }} />
                    </div>
                </div>
            )}

            <Navbar />
        </div>
    );
}
