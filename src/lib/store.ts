import { create } from 'zustand';
import { supabase } from './supabase';
import { ATTRIBUTES, calculateAttributeRank, calculateOverallRank, getAttributes, Rank } from './game-logic';
import { MISSION_PATHS } from './missions';

export interface Title {
    name: string;
    rarity: 'Legendary' | 'Epic' | 'Rare' | 'Common' | 'Mythic' | 'Event' | 'Challenge';
    is_hidden?: boolean;
}

export interface UserSettings {
    statsCalculator: boolean;
    theme: Rank | null;
    // Optional special theme unlocked by title rarities
    specialTheme?: 'rare' | 'epic' | 'legendary' | 'mythic' | null;
    exclusiveGlitch?: boolean;
}

export interface UserProfile {
    id: string; // Add UUID
    name: string;
    avatarUrl?: string;
    videoUrl?: string; // Existing
    bio?: string;      // New
    managerComment?: string; // New
    activeTitle: Title | null;
    activeFrame?: string;
    unlockedFrames?: string[];
    unlockedTitles: Title[];
    testScores: Record<string, number>; // Test Name -> Value
    completedQuests: string[]; // Quest IDs that have been completed
    trackedQuests: string[];   // Assigned active mission slots (max 3)
    settings: UserSettings;
    isAdmin: boolean; // Admin flag
    profileType: string; // Profile type for attribute targets
    email?: string;
    phone?: string;
    password?: string;
    role: 'Hunter' | 'Captain' | 'Admin' | 'Solo';
    agencyId?: string;
    agencyName?: string;
    affinities?: string[];
    classTags?: string[];
    missionLogs?: any[];
}

export interface Agency {
    id: string;
    name: string;
    logo_url: string;
    invite_code: string;
    captain_id: string;
    created_at: string;
    unlocked_titles?: Title[]; // JSONB in DB
    title_visibility?: Record<string, boolean>; // JSONB (titleName -> isHidden)
}

const DEFAULT_SETTINGS: UserSettings = {
    statsCalculator: false, // Disabled by default for non-admins
    theme: null,
    specialTheme: null
};

// Permission helper: Check if user can self-manage (update stats, claim missions without approval)
export const canSelfManage = (profile: UserProfile | null): boolean => {
    if (!profile) return false;
    // Admins, Solo hunters, and Captains can self-manage
    return profile.isAdmin || profile.role === 'Solo' || profile.role === 'Captain';
};

// Title Helpers
export const isDefaultTitle = (titleName: string): boolean => {
    return titleName === 'Hunter';
};

export const getDisplayTitle = (titleName: string, role: string | undefined): string => {
    if (!isDefaultTitle(titleName)) return titleName;

    if (role === 'Captain') return 'Captain';
    if (role === 'Solo') return 'Nameless';
    return 'Hunter';
};

const DEFAULT_PROFILE: UserProfile = {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Edgelord',
    avatarUrl: '/placeholder.png',
    activeTitle: { name: 'Challenger of Storms', rarity: 'Legendary' },
    activeFrame: 'Legendary',
    unlockedFrames: ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'],
    unlockedTitles: [
        { name: 'Windrunner', rarity: 'Mythic' },
        { name: 'Challenger of Storms', rarity: 'Legendary' },
        { name: 'Streak of Lightning', rarity: 'Epic' },
        { name: 'Fleet Foot', rarity: 'Rare' },
        { name: 'Hunter', rarity: 'Common' },
    ],
    testScores: {
        // Strength: 22% (D rank: 17-34%)
        'Bench Press': 60,
        'Deadlift': 60,
        'Squat': 0,

        // Endurance: 33% (D rank: 17-34%)
        'Pull-ups': 30,
        'Push-ups': 1,

        // Stamina: 8% (E rank: 0-17%)
        'Plank Hold': 1.2,
        'Burpees': 7,
        '1-mile run': 0,

        // Speed: 64% (B rank: 51-68%)
        '100m Sprint': 17.6,
        '40-yard Dash': 6.1,

        // Agility: 48% (C rank: 34-51%)
        'Pro Agility Shuttle': 8.3,
    },
    completedQuests: [
        'windrunner_1', // Fleet Foot
        'windrunner_2', // Streak of Lightning
        'windrunner_3', // Challenger of Storms
        'windrunner_mythic', // Windrunner (Mythic)
    ],
    settings: { statsCalculator: true, theme: null, specialTheme: null }, // Admin has statsCalculator enabled
    isAdmin: true, // Edgelord is admin
    profileType: 'male_20_25',
    role: 'Solo',
    trackedQuests: []
};

const TOTO_PROFILE: Partial<UserProfile> = {
    testScores: {
        'Squat': 100,
        'Burpees': 1,
        'Deadlift': 0,
        'Pull-ups': 0,
        'Push-ups': 0,
        '1-mile run': 0,
        'Bench Press': 60,
        'Plank Hold': 0.33,
        '100m Sprint': 19.6,
        '40-yard Dash': 6.45,
        'Pro Agility Shuttle': 6.9,
    },
    unlockedTitles: [{ name: 'Hunter', rarity: 'Common' }],
    completedQuests: [],
    settings: DEFAULT_SETTINGS
};

const LOCKJAW_PROFILE: Partial<UserProfile> = {
    testScores: {
        'Squat': 50,
        'Burpees': 1,
        'Deadlift': 0,
        'Pull-ups': 13,
        'Push-ups': 0,
        '1-mile run': 0,
        'Bench Press': 40,
        'Plank Hold': 0.39,
        '100m Sprint': 18.2,
        '40-yard Dash': 6.9,
        'Pro Agility Shuttle': 7.5,
    },
    unlockedTitles: [{ name: 'Hunter', rarity: 'Common' }],
    completedQuests: [],
    settings: DEFAULT_SETTINGS
};

const NEW_HUNTER_PROFILE: UserProfile = {
    id: '',
    name: '',
    avatarUrl: '/placeholder.png',
    activeTitle: { name: 'Hunter', rarity: 'Common' },
    activeFrame: 'Common',
    unlockedFrames: ['Common'],
    unlockedTitles: [{ name: 'Hunter', rarity: 'Common' }],
    testScores: {}, // Empty scores = 0 in UI
    completedQuests: [],
    settings: DEFAULT_SETTINGS,
    isAdmin: false,
    profileType: 'male_20_25',
    role: 'Solo',
    trackedQuests: []
};

interface HunterState {
    profile: UserProfile | null;
    loading: boolean;
    setProfile: (profile: UserProfile | null) => void;
    setLoading: (loading: boolean) => void;
    fetchProfile: (name: string) => Promise<void>;
    createProfile: (name: string, password?: string, profileType?: string, contactInfo?: { email?: string, phone?: string }) => Promise<void>;
    login: (name: string, password?: string) => Promise<boolean>;
    logout: () => void;
    updateScore: (testName: string, value: number, targetName?: string) => Promise<void>;
    claimQuest: (questId: string, title: Title) => Promise<void>;
    requestTitle: (questId: string, title: Title) => Promise<void>;
    getPendingRequests: () => Promise<string[]>;
    getRequestsForUser: (username: string) => Promise<any[]>;
    approveRequest: (requestId: string, username: string) => Promise<void>;
    denyRequest: (requestId: string) => Promise<void>;
    setActiveTitle: (title: Title) => Promise<void>;
    updateAvatar: (url: string) => Promise<void>;
    setActiveFrame: (frame: string) => Promise<void>;
    updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
    updateName: (newName: string) => Promise<{ success: boolean; error?: string }>;
    updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
    requestOTP: (username: string) => Promise<{ success: boolean; error?: string }>;
    verifyOTP: (username: string, otp: string) => Promise<{ success: boolean; error?: string }>;
    resetPassword: (username: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    removeTitle: (profileId: string, titleName: string) => Promise<void>;
    updateTitleVisibility: (titleName: string, isHidden: boolean) => Promise<void>;
    requestStatUpdate: (statName: string, newValue: number, oldValue: number) => Promise<void>;
    getPendingStatRequests: (username?: string) => Promise<any[]>;
    approveStatRequest: (requestId: string) => Promise<void>;
    denyStatRequest: (requestId: string) => Promise<void>;
    getStats: () => { name: string; percentage: number; rank: Rank }[];
    getOverallRank: () => Rank;
    getTheme: () => Rank;
    initialize: () => void;
    // Agency Actions
    createAgency: (name: string, logoUrl: string) => Promise<void>;
    joinAgency: (inviteCode: string, asSolo?: boolean) => Promise<{ success: boolean; error?: string }>;
    leaveAgency: (promoNext?: boolean) => Promise<void>;
    kickMember: (memberId: string) => Promise<void>;
    promoteToCaptain: (memberId: string) => Promise<void>;
    disbandAgency: () => Promise<void>;
    updateAgency: (data: Partial<Agency>) => Promise<{ success: boolean; error?: string }>;
    getAgencyMembers: (agencyId: string) => Promise<UserProfile[]>;
    toggleTrackQuest: (questId: string) => Promise<void>;
    // Friend System Actions
    connections: UserProfile[];
    pendingRequests: UserProfile[];
    sentRequestIds: string[];
    fetchConnections: () => Promise<void>;
    addConnection: (friendId: string) => Promise<void>;
    removeConnection: (friendId: string) => Promise<void>;
    acceptRequest: (friendId: string) => Promise<void>;
    declineRequest: (friendId: string) => Promise<void>;
    searchHunters: (query: string) => Promise<UserProfile[]>;
    // Agency Title Actions
    claimAgencyTitle: (title: Title) => Promise<void>;
    updateAgencyTitleVisibility: (titleName: string, isHidden: boolean) => Promise<void>;
    updateLore: (profileId: string, data: { bio?: string, managerComment?: string, videoUrl?: string, affinities?: string[], classTags?: string[], missionLogs?: any[] }) => Promise<void>;
}

export const useHunterStore = create<HunterState>((set, get) => ({
    profile: null,
    connections: [],
    pendingRequests: [],
    sentRequestIds: [],
    loading: true,
    setProfile: (profile) => set({ profile }),
    setLoading: (loading) => set({ loading }),

    fetchProfile: async (name: string) => {
        set({ loading: true });
        try {
            // 1. Get Profile
            let { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('name', name)
                .single();

            if (profileError && profileError.code === 'PGRST116') {
                // Profile not found, create it if it's one of the allowed users
                if (['Edgelord', 'Toto', 'Lockjaw'].includes(name)) {
                    await get().createProfile(name);
                    return; // createProfile will fetch again
                }
            }

            if (profileData) {
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

                // If this is the special binary profile, enable the exclusive glitch theme locally
                const SPECIAL_BINARY_NAME = '01010100 01101000 01100101 00100000 01100101 01101110 01100100 00100000 01101001 01100110 00100000 01110111 01100101 00100000 01100110 01100001 01101001 01101100 00101110 00101110 00101110';
                const isExclusive = profileData.name === SPECIAL_BINARY_NAME;

                // Prepare unlocked titles; if exclusive, ensure Monarch of Finality (Mythic) exists and remove 'Hunter'
                let unlocked: Title[] = (titlesData || []).map((t: any) => ({
                    name: t.name,
                    rarity: t.rarity,
                    is_hidden: t.is_hidden || false
                }));
                if (isExclusive) {
                    // remove any 'Hunter' title
                    unlocked = unlocked.filter((t: any) => t.name !== 'Hunter');
                    // ensure Monarch of Finality exists
                    if (!unlocked.some((t: any) => t.name === 'Monarch of Finality')) {
                        unlocked.unshift({ name: 'Monarch of Finality', rarity: 'Mythic', is_hidden: false });
                    }
                }

                set({
                    profile: {
                        id: profileData.id,
                        name: profileData.name,
                        avatarUrl: profileData.avatar_url,
                        videoUrl: profileData.video_url,
                        activeTitle: isExclusive ? { name: 'Monarch of Finality', rarity: 'Mythic', is_hidden: false } : (profileData.active_title || { name: 'Hunter', rarity: 'Common', is_hidden: false }),
                        testScores: profileData.test_scores || {},
                        unlockedTitles: unlocked,
                        completedQuests: questsData?.map((q: { quest_id: string }) => q.quest_id) || [],
                        settings: isExclusive ? { ...(profileData.settings || DEFAULT_SETTINGS), theme: 'S', exclusiveGlitch: true } : (profileData.settings || DEFAULT_SETTINGS),
                        isAdmin: profileData.is_admin || false,
                        profileType: profileData.profile_type || 'male_20_25',
                        role: profileData.role || 'Hunter',
                        agencyId: profileData.agency_id,
                        bio: profileData.bio,
                        managerComment: profileData.manager_comment,
                        affinities: profileData.affinities || [],
                        classTags: profileData.class_tags || [],
                        missionLogs: profileData.mission_logs || [],
                        email: profileData.email,
                        phone: profileData.phone,
                        trackedQuests: profileData.tracked_quests || [],
                        activeFrame: profileData.active_frame || (isExclusive ? 'Mythic' : 'Common'),
                        unlockedFrames: (() => {
                            const base = profileData.unlocked_frames || ['Common'];
                            const ranks: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S'];
                            const currentRank = calculateOverallRank(profileData.test_scores || {}, profileData.profile_type || 'male_20_25');
                            const currentRankIdx = ranks.indexOf(currentRank as Rank);
                            const rankFrames = currentRankIdx !== -1 ? ranks.slice(0, currentRankIdx + 1) : [];

                            // Title-based frames
                            const titleFrames = (titlesData || []).map((t: any) => t.name).filter(name => [
                                'Streak of Lightning', 'Sovreign of the Gale', 'Unshakable Will', 'The Unfallen King',
                                'Tactical Master', 'Echo of a Thousand Plans', 'Flame of Will', 'Phoenix Soul',
                                'Wild Instinct', 'Beastmaster', 'Relentless Chase', 'Crimson Seeker',
                                'Precision Breaker', 'Fist of Ruin', 'Sink or Rise', 'Warden of the Abyss',
                                'Flashstorm', 'Thunderborn Tyrant', 'Balance Through Chaos', 'Soulbreaker Sage',
                                'Edge Dancer', 'Ghost of the Edge'
                            ].includes(name));

                            return Array.from(new Set([...base, ...rankFrames, ...titleFrames]));
                        })()
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            set({ loading: false });
        }
    },

    createProfile: async (name: string, password?: string, profileType: string = 'male_20_25', contactInfo?: { email?: string, phone?: string }) => {
        try {
            let hashedPassword = password;
            if (password) {
                const hashRes = await fetch('/api/auth/hash', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'hash', password })
                });
                const hashData = await hashRes.json();
                if (hashData.hash) hashedPassword = hashData.hash;
            }

            let initialProfile: UserProfile = { ...NEW_HUNTER_PROFILE, name, password: hashedPassword, profileType, ...contactInfo };

            if (name === 'Edgelord') initialProfile = DEFAULT_PROFILE;
            else if (name === 'Toto') initialProfile = { ...NEW_HUNTER_PROFILE, ...TOTO_PROFILE, name, profileType: 'male_20_25' };
            else if (name === 'Lockjaw') initialProfile = { ...NEW_HUNTER_PROFILE, ...LOCKJAW_PROFILE, name, profileType: 'male_20_25' };

            // If creating the special binary profile, enable exclusive glitch theme and give Monarch of Finality
            const SPECIAL_BINARY_NAME = '01010100 01101000 01100101 00100000 01100101 01101110 01100100 00100000 01101001 01100110 00100000 01110111 01100101 00100000 01100110 01100001 01101001 01101100 00101110 00101110 00101110';
            if (name === SPECIAL_BINARY_NAME) {
                initialProfile = {
                    ...initialProfile,
                    settings: { ...(initialProfile.settings || DEFAULT_SETTINGS), theme: 'S', exclusiveGlitch: true },
                    // give them only the special Mythic title
                    unlockedTitles: [{ name: 'Monarch of Finality', rarity: 'Mythic' }],
                    activeTitle: { name: 'Monarch of Finality', rarity: 'Mythic' }
                } as UserProfile;
            }

            // Insert Profile
            const { data: newProfile, error } = await supabase
                .from('profiles')
                .insert([{
                    name,
                    password: password || 'default',
                    active_title: initialProfile.activeTitle,
                    test_scores: initialProfile.testScores,
                    settings: initialProfile.settings,
                    is_admin: initialProfile.isAdmin,
                    profile_type: initialProfile.profileType,
                    email: initialProfile.email,
                    phone: initialProfile.phone,
                    active_frame: initialProfile.activeFrame,
                    unlocked_frames: initialProfile.unlockedFrames
                }])
                .select()
                .single();

            if (error || !newProfile) throw error;

            // Insert Default Titles
            const titlesToInsert = initialProfile.unlockedTitles.map((t: Title) => ({
                profile_id: newProfile.id,
                name: t.name,
                rarity: t.rarity
            }));
            await supabase.from('unlocked_titles').insert(titlesToInsert);

            // Insert Default Quests
            const questsToInsert = initialProfile.completedQuests.map((q: string) => ({
                profile_id: newProfile.id,
                quest_id: q
            }));
            if (questsToInsert.length > 0) {
                await supabase.from('completed_quests').insert(questsToInsert);
            }

            // Update local state directly instead of fetching to avoid race conditions
            set({
                profile: {
                    id: newProfile.id,
                    name: newProfile.name,
                    activeTitle: newProfile.active_title || { name: 'Hunter', rarity: 'Common' },
                    testScores: newProfile.test_scores || {},
                    unlockedTitles: initialProfile.unlockedTitles as Title[],
                    completedQuests: initialProfile.completedQuests as string[],
                    settings: initialProfile.settings,
                    isAdmin: name === 'Edgelord', // Only Edgelord is admin
                    profileType: initialProfile.profileType,
                    role: initialProfile.role,
                    agencyId: newProfile.agency_id,
                    bio: newProfile.bio,
                    managerComment: newProfile.manager_comment,
                    trackedQuests: newProfile.tracked_quests || []
                }
            });
        } catch (error) {
            console.error('Error creating profile:', error);
            throw error;
        }
    },

    login: async (name: string, password?: string) => {
        console.log('Login started for:', name);
        set({ loading: true });
        try {
            // Check if user exists
            console.log('Checking if user exists...');
            let { data: profileData, error } = await supabase
                .from('profiles')
                .select('password')
                .eq('name', name)
                .single();
            console.log('User check result:', { profileData, error });

            if (error && error.code === 'PGRST116') {
                console.log('User not found, checking allowed list...');
                // User not found, check if it's one of the allowed new users
                if (['Edgelord', 'Toto', 'Lockjaw'].includes(name)) {
                    // Verify password for creation
                    const expectedPasswords: Record<string, string> = {
                        'Edgelord': 'Mcpe32767',
                        'Toto': 'Password1',
                        'Lockjaw': 'Password2'
                    };

                    if (password === expectedPasswords[name]) {
                        console.log('Creating new profile...');
                        await get().createProfile(name, password);
                        localStorage.setItem('last_user', name);
                        return true;
                    } else {
                        console.log('Wrong password for creation');
                        return false; // Wrong password for creation
                    }
                }
                return false; // Unknown user
            }

            // User exists, check password
            if (profileData) {
                console.log('User exists, checking password...');

                let isMatch = false;
                if (password) {
                    // 1. Try bcrypt comparison
                    const compareRes = await fetch('/api/auth/hash', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'compare', password, hash: profileData.password })
                    });
                    const compareData = await compareRes.json();
                    isMatch = compareData.match;

                    // 2. Fallback for plain-text (auto-migrate)
                    // Lazy migration: If DB has 'default' password, or matches input exactly
                    if (!isMatch && (profileData.password === 'default' || password === profileData.password)) {
                        const expectedPasswords: Record<string, string> = {
                            'Edgelord': 'Mcpe32767',
                            'Toto': 'Password1',
                            'Lockjaw': 'Password2'
                        };

                        if (password === expectedPasswords[name] || password === profileData.password) {
                            console.log(`Auto-migrating legacy password for user: ${name}`);
                            const hashRes = await fetch('/api/auth/hash', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'hash', password })
                            });
                            const hashData = await hashRes.json();
                            if (hashData.hash) {
                                await supabase.from('profiles').update({ password: hashData.hash }).eq('name', name);
                                isMatch = true;
                            }
                        }
                    }
                }

                if (isMatch) {
                    console.log('Password match, logging in...');
                    localStorage.setItem('last_user', name);
                    await get().fetchProfile(name);
                    return true;
                } else {
                    console.log('Password mismatch');
                }
            }

            return false; // Wrong password
        } catch (error) {
            console.error('Login error:', error);
            return false;
        } finally {
            console.log('Login finished, setting loading false');
            set({ loading: false });
        }
    },

    logout: () => {
        localStorage.removeItem('last_user');
        set({ profile: null });
    },

    updateScore: async (testName: string, value: number, targetName?: string) => {
        const profile = get().profile;
        if (!profile) return;

        // Determine which profile to update
        const nameToUpdate = targetName || profile.name;

        // If updating another user's profile, admin must be logged in
        if (targetName && targetName !== profile.name && profile.role !== 'Admin') {
            console.error('Only admins can update other users\' scores');
            return;
        }

        // Fetch the target profile's current scores if updating someone else
        let currentScores = profile.testScores;
        if (targetName && targetName !== profile.name) {
            const { data } = await supabase
                .from('profiles')
                .select('test_scores')
                .eq('name', targetName)
                .single();
            currentScores = data?.test_scores || {};
        }

        const newScores = { ...currentScores, [testName]: value };

        // Optimistic update (only if editing own profile)
        if (!targetName || targetName === profile.name) {
            set({ profile: { ...profile, testScores: newScores } });
        }

        // DB Update
        const { error } = await supabase
            .from('profiles')
            .update({ test_scores: newScores })
            .eq(targetName && targetName !== profile.name ? 'name' : 'id', targetName && targetName !== profile.name ? nameToUpdate : profile.id);

        if (error) console.error('Error updating score:', error);
    },

    claimQuest: async (questId: string, title: Title) => {
        const profile = get().profile;
        if (!profile) return;
        if (profile.completedQuests.includes(questId)) return;

        // Optimistic update
        const newCompletedQuests = [...profile.completedQuests, questId];
        const titleExists = profile.unlockedTitles.some(t => t.name === title.name);
        const newUnlockedTitles = titleExists
            ? profile.unlockedTitles
            : [...profile.unlockedTitles, title];

        const newTrackedQuests = (profile.trackedQuests || []).filter(id => id !== questId);

        set({
            profile: {
                ...profile,
                completedQuests: newCompletedQuests,
                unlockedTitles: newUnlockedTitles,
                trackedQuests: newTrackedQuests
            }
        });

        try {
            // Insert Quest
            await supabase.from('completed_quests').insert({
                profile_id: profile.id,
                quest_id: questId
            });

            // Insert Title if new
            if (!titleExists) {
                await supabase.from('unlocked_titles').insert({
                    profile_id: profile.id,
                    name: title.name,
                    rarity: title.rarity
                });
            }
        } catch (error) {
            console.error('Error claiming quest:', error);
            // Revert optimistic update on error? For now, just log.
        }
    },

    removeTitle: async (profileId: string, titleName: string) => {
        const profile = get().profile;
        if (!profile) return;

        // Prevent removing the default 'Hunter' title
        if (titleName === 'Hunter') {
            console.warn('Cannot remove default Hunter title');
            return;
        }

        // DB Delete from unlocked_titles
        const { error: titleError } = await supabase
            .from('unlocked_titles')
            .delete()
            .eq('profile_id', profileId)
            .eq('name', titleName);

        if (titleError) {
            console.error('Error removing title:', titleError);
            return;
        }

        // Find the quest associated with this title to remove completion as well
        let questIdToRemove: string | null = null;
        for (const path of MISSION_PATHS) {
            const quest = path.quests.find(q => q.reward.name === titleName);
            if (quest) {
                questIdToRemove = quest.id;
                break;
            }
        }

        if (questIdToRemove) {
            const { error: questError } = await supabase
                .from('completed_quests')
                .delete()
                .eq('profile_id', profileId)
                .eq('quest_id', questIdToRemove);

            if (questError) {
                console.error('Error removing quest completion:', questError);
            }
        }

        // Check if it was the active title or hidden
        const isSelf = profile.id === profileId;
        if (isSelf) {
            const newUnlocked = profile.unlockedTitles.filter(t => t.name !== titleName);
            const newCompleted = questIdToRemove
                ? profile.completedQuests.filter(id => id !== questIdToRemove)
                : profile.completedQuests;

            let newActive = profile.activeTitle;
            if (profile.activeTitle && profile.activeTitle.name === titleName) {
                newActive = { name: 'Hunter', rarity: 'Common' };
                await get().setActiveTitle(newActive);
            }
            set({
                profile: {
                    ...profile,
                    unlockedTitles: newUnlocked,
                    completedQuests: newCompleted,
                    activeTitle: newActive
                }
            });
        }
    },

    updateTitleVisibility: async (titleName: string, isHidden: boolean) => {
        const profile = get().profile;
        if (!profile) return;

        // Optimistic update
        const newUnlocked = profile.unlockedTitles.map(t =>
            t.name === titleName ? { ...t, is_hidden: isHidden } : t
        );
        set({ profile: { ...profile, unlockedTitles: newUnlocked } });

        // DB Update
        const { error } = await supabase
            .from('unlocked_titles')
            .update({ is_hidden: isHidden })
            .eq('profile_id', profile.id)
            .eq('name', titleName);

        if (error) {
            console.error('Error updating title visibility:', error);
            // Revert
            set({ profile: { ...profile, unlockedTitles: profile.unlockedTitles } });
        }
    },

    requestTitle: async (questId: string, title: Title) => {
        const profile = get().profile;
        if (!profile) return;

        try {
            // Create title request
            await supabase.from('title_requests').insert({
                profile_id: profile.id,
                quest_id: questId,
                title_name: title.name,
                title_rarity: title.rarity,
                status: 'pending'
            });
        } catch (error) {
            console.error('Error requesting title:', error);
        }
    },

    getPendingRequests: async () => {
        const profile = get().profile;
        if (!profile) return [];

        try {
            const { data: requests } = await supabase
                .from('title_requests')
                .select('quest_id')
                .eq('profile_id', profile.id)
                .eq('status', 'pending');

            return requests?.map(r => r.quest_id) || [];
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        }
        return [];
    },

    getRequestsForUser: async (username: string) => {
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id')
                .eq('name', username)
                .single();

            if (profileData) {
                const { data: requests } = await supabase
                    .from('title_requests')
                    .select('*')
                    .eq('profile_id', profileData.id)
                    .eq('status', 'pending');

                return requests || [];
            }
        } catch (error) {
            console.error('Error fetching requests for user:', error);
        }
        return [];
    },

    approveRequest: async (requestId: string, username: string) => {
        const profile = get().profile;
        // Allow both Admins and Captains to approve requests
        if (!profile || (profile.role !== 'Admin' && profile.role !== 'Captain')) return;

        try {
            // Get the request details
            const { data: request } = await supabase
                .from('title_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (!request) return;

            // Get target profile
            const { data: targetProfile } = await supabase
                .from('profiles')
                .select('id, agency_id')
                .eq('name', username)
                .single();

            if (!targetProfile) return;

            // If Captain, verify target is in same agency
            if (profile.role === 'Captain') {
                if (targetProfile.agency_id !== profile.agencyId) {
                    console.error('Captain can only approve requests from their own agency');
                    return;
                }
            }

            // Get reviewer profile ID
            const { data: reviewerProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('name', profile.name)
                .single();

            // Add quest to completed_quests
            await supabase.from('completed_quests').insert({
                profile_id: targetProfile.id,
                quest_id: request.quest_id
            });

            // Add title to unlocked_titles
            await supabase.from('unlocked_titles').insert({
                profile_id: targetProfile.id,
                name: request.title_name,
                rarity: request.title_rarity
            });

            // Update request status
            await supabase
                .from('title_requests')
                .update({
                    status: 'approved',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: reviewerProfile?.id
                })
                .eq('id', requestId);
        } catch (error) {
            console.error('Error approving request:', error);
        }
    },

    denyRequest: async (requestId: string) => {
        const profile = get().profile;
        // Allow both Admins and Captains to deny requests
        if (!profile || (profile.role !== 'Admin' && profile.role !== 'Captain')) return;

        try {
            // Get reviewer profile ID
            const { data: reviewerProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('name', profile.name)
                .single();

            // Update request status to denied
            await supabase
                .from('title_requests')
                .update({
                    status: 'denied',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: reviewerProfile?.id
                })
                .eq('id', requestId);
        } catch (error) {
            console.error('Error denying request:', error);
        }
    },

    setActiveTitle: async (title: Title) => {
        const profile = get().profile;
        if (!profile) return;

        // Optimistic update
        set({ profile: { ...profile, activeTitle: title } });

        // DB Update
        const { error } = await supabase
            .from('profiles')
            .update({ active_title: title })
            .eq('id', profile.id);

        if (error) console.error('Error setting active title:', error);
    },

    setActiveFrame: async (frame: string) => {
        const profile = get().profile;
        if (!profile) return;

        // Optimistic update
        set({ profile: { ...profile, activeFrame: frame } });

        // DB Update
        const { error } = await supabase
            .from('profiles')
            .update({ active_frame: frame })
            .eq('id', profile.id);

        if (error) console.error('Error setting active frame:', error);
    },

    updateAvatar: async (url: string) => {
        const profile = get().profile;
        if (!profile) return;

        console.log('Updating avatar, length:', url.length);
        set({ profile: { ...profile, avatarUrl: url } });

        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: url })
            .eq('id', profile.id);

        if (error) {
            console.error('Error updating avatar in DB:', error);
            // Revert optimistic update if failed
            // Fetch profile again to reset
            await get().fetchProfile(profile.name);
        } else {
            console.log('Avatar updated successfully in DB');
        }
    },

    updateSettings: async (newSettings: Partial<UserSettings>) => {
        const profile = get().profile;
        if (!profile) return;

        const updatedSettings = { ...profile.settings, ...newSettings };
        set({ profile: { ...profile, settings: updatedSettings } });

        const { error } = await supabase
            .from('profiles')
            .update({ settings: updatedSettings })
            .eq('id', profile.id);

        if (error) console.error('Error updating settings:', error);
    },

    updateName: async (newName: string) => {
        const profile = get().profile;
        if (!profile) return { success: false, error: 'Not logged in' };

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ name: newName })
                .eq('id', profile.id);

            if (error) {
                if (error.code === '23505') {
                    return { success: false, error: 'Name already taken' };
                }
                throw error;
            }

            // Update local state and last_user
            set({ profile: { ...profile, name: newName } });
            localStorage.setItem('last_user', newName);

            return { success: true };
        } catch (error: any) {
            console.error('Error updating name:', error);
            return { success: false, error: error.message };
        }
    },

    updatePassword: async (newPassword: string) => {
        const profile = get().profile;
        if (!profile) return { success: false, error: 'Not logged in' };

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ password: newPassword })
                .eq('id', profile.id);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error('Error updating password:', error);
            return { success: false, error: error.message };
        }
    },

    requestOTP: async (username: string) => {
        try {
            // 1. Check if user exists and has email or phone
            const { data: user, error } = await supabase
                .from('profiles')
                .select('id, email, phone')
                .eq('name', username)
                .single();

            if (error || !user) {
                return { success: false, error: 'User not found' };
            }

            if (!user.email && !user.phone) {
                return { success: false, error: 'No contact information (email/phone) linked to this account.' };
            }

            // 2. Generate OTP
            const otpBuffer = new Uint32Array(1);
            window.crypto.getRandomValues(otpBuffer);
            const otp = (otpBuffer[0] % 900000 + 100000).toString(); // 6-digit OTP
            const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

            // 3. Save OTP to DB
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ otp, otp_expiry: expiry })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 4. Send Real OTP (Email/SMS) via API route
            try {
                const apiResponse = await fetch('/api/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username,
                        otp,
                        email: user.email,
                        phone: user.phone
                    }),
                });

                const apiData = await apiResponse.json();
                if (!apiResponse.ok) {
                    console.warn('Real OTP sending failed, falling back to console log:', apiData.error);
                } else {
                    console.log(`[PASS_RESET] Real OTP sent via ${apiData.sentVia}`);
                }
            } catch (apiErr) {
                console.error('Error calling send-otp API:', apiErr);
            }

            // Always log to console for development/fallback
            // console.log(`[PASS_RESET] OTP for ${username}: ${otp} (Sent to ${user.email || user.phone})`);

            return { success: true };
        } catch (error: any) {
            console.error('Error requesting OTP:', error);
            return { success: false, error: error.message };
        }
    },

    verifyOTP: async (username: string, otp: string) => {
        try {
            const { data: user, error } = await supabase
                .from('profiles')
                .select('otp, otp_expiry')
                .eq('name', username)
                .single();

            if (error || !user) return { success: false, error: 'User not found' };

            if (user.otp !== otp) {
                return { success: false, error: 'Invalid OTP' };
            }

            if (new Date(user.otp_expiry) < new Date()) {
                return { success: false, error: 'OTP has expired' };
            }

            return { success: true };
        } catch (error: any) {
            console.error('Error verifying OTP:', error);
            return { success: false, error: error.message };
        }
    },

    resetPassword: async (username: string, newPassword: string) => {
        try {
            // Hash the new password before saving
            const hashRes = await fetch('/api/auth/hash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'hash', password: newPassword })
            });
            const hashData = await hashRes.json();
            if (!hashData.hash) throw new Error('Failed to hash password');

            const { error } = await supabase
                .from('profiles')
                .update({
                    password: hashData.hash,
                    otp: null,
                    otp_expiry: null
                })
                .eq('name', username);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            console.error('Error resetting password:', error);
            return { success: false, error: error.message };
        }
    },

    requestStatUpdate: async (statName: string, newValue: number, oldValue: number) => {
        const profile = get().profile;
        if (!profile || !profile.id) {
            console.error('Unable to send request: Profile not loaded or ID missing');
            return;
        }

        try {
            console.log(`Requesting stat update for ${profile.name}: ${statName} ${oldValue} -> ${newValue}`);
            const { data: existing, error: checkError } = await supabase
                .from('stat_requests')
                .select('id')
                .eq('profile_id', profile.id)
                .eq('stat_name', statName)
                .eq('status', 'pending')
                .maybeSingle();

            if (checkError) throw checkError;

            if (existing) {
                console.log('Updating existing pending request:', existing.id);
                const { error: updateReqError } = await supabase
                    .from('stat_requests')
                    .update({
                        new_value: newValue,
                        old_value: oldValue,
                        requested_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                if (updateReqError) throw updateReqError;
            } else {
                console.log('Inserting new pending request');
                const { error: insertError } = await supabase.from('stat_requests').insert({
                    profile_id: profile.id,
                    stat_name: statName,
                    new_value: newValue,
                    old_value: oldValue,
                    status: 'pending'
                });
                if (insertError) throw insertError;
            }
        } catch (error: any) {
            console.error('Error in requestStatUpdate:', error.message || error);
            throw error;
        }
    },

    getPendingStatRequests: async (username?: string) => {
        try {
            console.log('Fetching pending stat requests for:', username || 'ALL');
            let query = supabase
                .from('stat_requests')
                .select(`
                    id, 
                    profile_id, 
                    stat_name, 
                    new_value, 
                    old_value, 
                    status, 
                    requested_at,
                    profiles!profile_id ( name )
                `)
                .eq('status', 'pending');

            if (username) {
                const { data: userData } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('name', username)
                    .maybeSingle();

                if (userData) {
                    query = query.eq('profile_id', userData.id);
                } else {
                    console.warn(`User ${username} not found for request filtering`);
                    return [];
                }
            }

            const { data, error: queryError } = await query;
            if (queryError) throw queryError;

            console.log(`Found ${data?.length || 0} pending requests`);
            return data || [];
        } catch (error: any) {
            console.error('Error in getPendingStatRequests:', error.message || error);
            return [];
        }
    },

    approveStatRequest: async (requestId: string) => {
        const profile = get().profile;
        if (!profile || (profile.role !== 'Admin' && profile.role !== 'Captain')) return;

        try {
            // 1. Get request data
            const { data: request, error: getReqError } = await supabase
                .from('stat_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (getReqError || !request) return;

            // 2. Update hunter's profile stats
            const { data: targetProfile, error: getTargetError } = await supabase
                .from('profiles')
                .select('test_scores')
                .eq('id', request.profile_id)
                .single();

            if (getTargetError) throw getTargetError;

            const updatedScores = {
                ...(targetProfile?.test_scores || {}),
                [request.stat_name]: request.new_value
            };

            const { error: updateProfError } = await supabase
                .from('profiles')
                .update({ test_scores: updatedScores })
                .eq('id', request.profile_id);

            if (updateProfError) throw updateProfError;

            // 3. Mark request as approved
            const { error: finalError } = await supabase
                .from('stat_requests')
                .update({
                    status: 'approved',
                    resolved_at: new Date().toISOString(),
                    resolved_by: profile.id
                })
                .eq('id', requestId);

            if (finalError) throw finalError;

        } catch (error: any) {
            console.error('Error approving stat request:', error.message || error);
        }
    },

    denyStatRequest: async (requestId: string) => {
        const profile = get().profile;
        if (!profile || (profile.role !== 'Admin' && profile.role !== 'Captain')) return;

        try {
            await supabase
                .from('stat_requests')
                .update({
                    status: 'denied',
                    resolved_at: new Date().toISOString(),
                    resolved_by: profile.id
                })
                .eq('id', requestId);
        } catch (error: any) {
            console.error('Error denying stat request:', error.message || error);
        }
    },

    getStats: () => {
        const profile = get().profile;
        if (!profile) return [];

        const attributes = getAttributes(profile.profileType);
        const stats = Object.keys(attributes).map(attrName => {
            const { percentage, rank } = calculateAttributeRank(attrName, profile.testScores, profile.profileType);
            return {
                name: attrName,
                percentage,
                rank
            };
        });

        return stats;
    },

    getOverallRank: () => {
        const profile = get().profile;
        if (!profile) return 'E';
        return calculateOverallRank(profile.testScores, profile.profileType);
    },

    getTheme: () => {
        const profile = get().profile;
        if (!profile) return 'E';
        return profile.settings.theme || get().getOverallRank();
    },

    initialize: () => {
        const lastUser = localStorage.getItem('last_user');
        if (lastUser) {
            get().fetchProfile(lastUser);
        } else {
            set({ loading: false });
        }
    },

    // Agency Actions
    createAgency: async (name: string, logoUrl: string) => {
        const profile = get().profile;
        if (!profile) return;

        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data: agency, error } = await supabase
            .from('agencies')
            .insert({ name, logo_url: logoUrl, invite_code: inviteCode, captain_id: profile.id })
            .select()
            .single();

        if (error) throw error;

        await supabase
            .from('profiles')
            .update({ agency_id: agency.id, role: 'Captain' })
            .eq('id', profile.id);

        await get().fetchProfile(profile.name);
    },

    joinAgency: async (inviteCode: string, asSolo: boolean = false) => {
        const profile = get().profile;
        if (!profile) return { success: false, error: 'No profile' };

        // If current user is Captain, promote next member before leaving
        if (profile.role === 'Captain' && profile.agencyId) {
            const { data: members } = await supabase
                .from('profiles')
                .select('id, created_at')
                .eq('agency_id', profile.agencyId)
                .neq('id', profile.id)
                .order('created_at', { ascending: true });

            const nextMember = members?.[0];
            if (nextMember) {
                // Update agency captain
                await supabase.from('agencies').update({ captain_id: nextMember.id }).eq('id', profile.agencyId);
                // Promote next member to Captain
                await supabase.from('profiles').update({ role: 'Captain' }).eq('id', nextMember.id);
            }
        }

        const { data: agency, error } = await supabase
            .from('agencies')
            .select('id')
            .eq('invite_code', inviteCode)
            .single();

        if (error || !agency) return { success: false, error: 'Invalid invite code' };

        // If joining as Solo (Nameless), set role to 'Solo', otherwise 'Hunter'
        const role = asSolo ? 'Solo' : 'Hunter';

        await supabase
            .from('profiles')
            .update({ agency_id: agency.id, role })
            .eq('id', profile.id);

        await get().fetchProfile(profile.name);
        return { success: true };
    },

    leaveAgency: async (promoNext: boolean = true) => {
        const profile = get().profile;
        if (!profile || !profile.agencyId) return;

        // If captain, promote the next oldest member
        if (profile.role === 'Captain' && promoNext) {
            const { data: members } = await supabase
                .from('profiles')
                .select('id, created_at')
                .eq('agency_id', profile.agencyId)
                .order('created_at', { ascending: true });

            const nextMember = members?.find(m => m.id !== profile.id);
            if (nextMember) {
                await supabase.from('agencies').update({ captain_id: nextMember.id }).eq('id', profile.agencyId);
                await supabase.from('profiles').update({ role: 'Captain' }).eq('id', nextMember.id);
            } else {
                // No one left, disband
                await get().disbandAgency();
                return;
            }
        }

        await supabase
            .from('profiles')
            .update({ agency_id: null, role: 'Solo' })
            .eq('id', profile.id);

        await get().fetchProfile(profile.name);
    },

    kickMember: async (memberId: string) => {
        const profile = get().profile;
        if (!profile || profile.role !== 'Captain') return;

        await supabase
            .from('profiles')
            .update({ agency_id: null, role: 'Solo' })
            .eq('id', memberId)
            .eq('agency_id', profile.agencyId);
    },

    promoteToCaptain: async (memberId: string) => {
        const profile = get().profile;
        if (!profile || profile.role !== 'Captain' || !profile.agencyId) return;

        try {
            // Demote current captain to Hunter
            await supabase.from('profiles').update({ role: 'Hunter' }).eq('id', profile.id);

            // Promote member to Captain
            await supabase.from('profiles').update({ role: 'Captain' }).eq('id', memberId);

            // Update agency captain_id
            await supabase.from('agencies').update({ captain_id: memberId }).eq('id', profile.agencyId);

            // Refresh profile
            await get().fetchProfile(profile.name);
        } catch (error) {
            console.error('Error promoting to captain:', error);
        }
    },

    disbandAgency: async () => {
        const profile = get().profile;
        if (!profile || profile.role !== 'Captain' || !profile.agencyId) return;

        await supabase.from('profiles').update({ agency_id: null, role: 'Solo' }).eq('agency_id', profile.agencyId);
        await supabase.from('agencies').delete().eq('id', profile.agencyId);

        await get().fetchProfile(profile.name);
    },

    updateAgency: async (data: Partial<Agency>) => {
        const profile = get().profile;
        if (!profile || profile.role !== 'Captain' || !profile.agencyId) {
            console.error('updateAgency failed: missing profile or not captain', { profile });
            return { success: false, error: 'You must be a Captain to update agency settings.' };
        }

        console.log('Attempting to update agency ID:', profile.agencyId, 'with data:', data);
        const { data: updatedData, error } = await supabase
            .from('agencies')
            .update(data)
            .eq('id', profile.agencyId)
            .select();

        if (error) {
            console.error('Error updating agency:', error);
            return { success: false, error: error.message };
        } else {
            console.log('Agency update query completed. Updated rows:', updatedData);
            if (!updatedData || updatedData.length === 0) {
                console.warn('SUCCESS returned but 0 rows were updated. Check if agency ID exists or RLS policy allows updates.');
                return { success: false, error: 'Update failed. You may not have permission or the agency does not exist.' };
            } else {
                console.log('Agency updated successfully:', updatedData[0]);
                await get().fetchProfile(profile.name);
                return { success: true };
            }
        }
    },

    getAgencyMembers: async (agencyId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('agency_id', agencyId);

        if (error) return [];
        return (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatar_url,
            activeTitle: p.active_title,
            testScores: p.test_scores || {},
            profileType: p.profile_type || 'male_20_25',
            role: p.role,
            settings: p.settings
        })) as any[];
    },

    toggleTrackQuest: async (questId: string) => {
        const profile = get().profile;
        if (!profile) return;

        let newTracked = [...(profile.trackedQuests || [])];
        if (newTracked.includes(questId)) {
            newTracked = newTracked.filter(id => id !== questId);
        } else {
            if (newTracked.length >= 3) {
                alert('You can only track 3 missions at a time.');
                return;
            }
            newTracked.push(questId);
        }

        const { error } = await supabase
            .from('profiles')
            .update({ tracked_quests: newTracked })
            .eq('id', profile.id);

        if (!error) {
            set({ profile: { ...profile, trackedQuests: newTracked } });
        } else {
            console.error('Error toggling tracked quest:', error);
        }
    },

    // Friend System Implementation
    fetchConnections: async () => {
        const profile = get().profile;
        if (!profile) return;

        try {
            const { data, error } = await supabase
                .from('connections')
                .select(`
                    id,
                    user_id,
                    friend_id,
                    status,
                    sender:profiles!user_id (
                        id, name, avatar_url, active_title, test_scores, profile_type, role, agency_id, agencies!agency_id ( name )
                    ),
                    receiver:profiles!friend_id (
                        id, name, avatar_url, active_title, test_scores, profile_type, role, agency_id, agencies!agency_id ( name )
                    )
                `)
                .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`);

            if (error) throw error;

            const connections: UserProfile[] = [];
            const pendingRequests: UserProfile[] = [];
            const sentRequestIds: string[] = [];

            (data || []).forEach((conn: any) => {
                if (conn.status === 'accepted') {
                    const other = conn.user_id === profile.id ? conn.receiver : conn.sender;
                    connections.push({
                        id: other.id,
                        name: other.name,
                        avatarUrl: other.avatar_url,
                        activeTitle: other.active_title,
                        testScores: other.test_scores || {},
                        profileType: other.profile_type || 'male_20_25',
                        role: other.role,
                        agencyId: other.agency_id,
                        agencyName: other.agencies?.name
                    } as any as UserProfile);
                } else if (conn.status === 'pending') {
                    if (conn.friend_id === profile.id) {
                        // Incoming request
                        pendingRequests.push({
                            id: conn.sender.id,
                            name: conn.sender.name,
                            avatarUrl: conn.sender.avatar_url,
                            activeTitle: conn.sender.active_title,
                            testScores: conn.sender.test_scores || {},
                            profileType: conn.sender.profile_type || 'male_20_25',
                            role: conn.sender.role,
                            agencyId: conn.sender.agency_id,
                            agencyName: conn.sender.agencies?.name
                        } as any as UserProfile);
                    } else {
                        // Outgoing request
                        sentRequestIds.push(conn.friend_id);
                    }
                }
            });

            set({ connections, pendingRequests, sentRequestIds });
        } catch (error) {
            console.error('Error fetching connections:', error);
        }
    },

    addConnection: async (friendId: string) => {
        const profile = get().profile;
        if (!profile) return;

        try {
            const { error } = await supabase
                .from('connections')
                .insert({ user_id: profile.id, friend_id: friendId, status: 'pending' });

            if (error) throw error;

            await get().fetchConnections();
        } catch (error: any) {
            if (error.code === '23505') {
                alert('Request already sent or connection exists.');
            } else {
                console.error('Error adding connection:', error);
            }
        }
    },

    removeConnection: async (friendId: string) => {
        const profile = get().profile;
        if (!profile) return;

        try {
            const { error } = await supabase
                .from('connections')
                .delete()
                .or(`and(user_id.eq.${profile.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${profile.id})`);

            if (error) throw error;

            await get().fetchConnections();
        } catch (error) {
            console.error('Error removing connection:', error);
        }
    },

    acceptRequest: async (friendId: string) => {
        const profile = get().profile;
        if (!profile) return;

        try {
            const { error } = await supabase
                .from('connections')
                .update({ status: 'accepted' })
                .eq('user_id', friendId)
                .eq('friend_id', profile.id);

            if (error) throw error;

            await get().fetchConnections();
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    },

    declineRequest: async (friendId: string) => {
        await get().removeConnection(friendId);
    },

    searchHunters: async (query: string) => {
        if (!query.trim()) return [];

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    name,
                    avatar_url,
                    active_title,
                    test_scores,
                    profile_type,
                    role,
                    agency_id,
                    agencies!agency_id ( name )
                `)
                .ilike('name', `%${query}%`)
                .limit(10);

            if (error) throw error;

            return (data || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                avatarUrl: p.avatar_url,
                activeTitle: p.active_title,
                testScores: p.test_scores || {},
                profileType: p.profile_type || 'male_20_25',
                role: p.role,
                agencyId: p.agency_id,
                agencyName: p.agencies?.name
            })) as any as UserProfile[];
        } catch (error) {
            console.error('Error searching hunters:', error);
            return [];
        }
    },


    claimAgencyTitle: async (title: Title) => {
        const profile = get().profile;
        if (!profile || !profile.agencyId) return;

        try {
            // Fetch current agency data first to ensure we have latest titles
            const { data: currentAgency, error: fetchError } = await supabase
                .from('agencies')
                .select('unlocked_titles')
                .eq('id', profile.agencyId)
                .single();

            if (fetchError) throw fetchError;

            const currentTitles = (currentAgency.unlocked_titles || []) as Title[];

            // Check if already unlocked
            if (currentTitles.some(t => t.name === title.name)) return;

            const newTitles = [...currentTitles, title];

            const { error } = await supabase
                .from('agencies')
                .update({ unlocked_titles: newTitles })
                .eq('id', profile.agencyId);

            if (error) throw error;

            console.log('Agency title claimed:', title);
        } catch (error) {
            console.error('Error claiming agency title:', error);
        }
    },

    updateAgencyTitleVisibility: async (titleName: string, isHidden: boolean) => {
        const profile = get().profile;
        if (!profile || !profile.agencyId) return;

        // Only Captain (or Admin) should be able to do this - UI should strictly enforce, but store can also check
        if (profile.role !== 'Captain' && !profile.isAdmin) return;

        try {
            // Fetch current
            const { data: currentAgency, error: fetchError } = await supabase
                .from('agencies')
                .select('title_visibility')
                .eq('id', profile.agencyId)
                .single();

            if (fetchError) throw fetchError;

            const currentVisibility = (currentAgency.title_visibility || {}) as Record<string, boolean>;
            const newVisibility = { ...currentVisibility, [titleName]: isHidden };

            const { error } = await supabase
                .from('agencies')
                .update({ title_visibility: newVisibility })
                .eq('id', profile.agencyId);

            if (error) throw error;
            console.log('Agency title visibility updated:', titleName, isHidden);
        } catch (error) {
            console.error('Error updating agency title visibility:', error);
        }
    },

    updateLore: async (profileId: string, data: any) => {
        const profile = get().profile;
        if (!profile) return;

        try {
            const updates: any = {};
            if (data.bio !== undefined) updates.bio = data.bio;
            if (data.managerComment !== undefined) updates.manager_comment = data.managerComment;
            if (data.videoUrl !== undefined) updates.video_url = data.videoUrl;
            if (data.affinities !== undefined) updates.affinities = data.affinities;
            if (data.classTags !== undefined) updates.class_tags = data.classTags;
            if (data.missionLogs !== undefined) updates.mission_logs = data.missionLogs;

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', profileId);

            if (error) throw error;

            // If we updated our own profile, update local state
            if (profile.id === profileId) {
                set({
                    profile: {
                        ...profile,
                        ...data
                    }
                });
            }
        } catch (error) {
            console.error('Error updating lore:', error);
            throw error;
        }
    }
}));


