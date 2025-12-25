import { create } from 'zustand';
import { supabase } from './supabase';
import { ATTRIBUTES, calculateAttributeRank, calculateOverallRank, getAttributes, Rank } from './game-logic';
import { MISSION_PATHS } from './missions';

export interface Title {
    name: string;
    rarity: 'Legendary' | 'Epic' | 'Rare' | 'Common' | 'Mythic';
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
    activeTitle: Title;
    unlockedTitles: Title[];
    testScores: Record<string, number>; // Test Name -> Value
    completedQuests: string[]; // Quest IDs that have been completed
    settings: UserSettings;
    isAdmin: boolean; // Admin flag
    profileType: string; // Profile type for attribute targets
    email?: string;
    phone?: string;
    password?: string;
    role: 'Hunter' | 'Captain' | 'Admin' | 'Solo';
    agencyId?: string;
}

export interface Agency {
    id: string;
    name: string;
    logo_url: string;
    invite_code: string;
    captain_id: string;
    created_at: string;
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

const DEFAULT_PROFILE: UserProfile = {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Edgelord',
    avatarUrl: '/placeholder.png',
    activeTitle: { name: 'Challenger of Storms', rarity: 'Legendary' },
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
    role: 'Solo'
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
    unlockedTitles: [{ name: 'Hunter', rarity: 'Common' }],
    testScores: {}, // Empty scores = 0 in UI
    completedQuests: [],
    settings: DEFAULT_SETTINGS,
    isAdmin: false,
    profileType: 'male_20_25',
    role: 'Solo'
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
    disbandAgency: () => Promise<void>;
    updateAgency: (data: Partial<Agency>) => Promise<void>;
    getAgencyMembers: (agencyId: string) => Promise<UserProfile[]>;
}

export const useHunterStore = create<HunterState>((set, get) => ({
    profile: null,
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
                        email: profileData.email,
                        phone: profileData.phone
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
                    phone: initialProfile.phone
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
                    managerComment: newProfile.manager_comment
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

        set({
            profile: {
                ...profile,
                completedQuests: newCompletedQuests,
                unlockedTitles: newUnlockedTitles
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
            if (profile.activeTitle.name === titleName) {
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
        if (!profile || !profile.isAdmin) return;

        try {
            // Get the request details
            const { data: request } = await supabase
                .from('title_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (!request) return;

            // Get target profile ID
            const { data: targetProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('name', username)
                .single();

            if (!targetProfile) return;

            // Get admin profile ID
            const { data: adminProfile } = await supabase
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
                    reviewed_by: adminProfile?.id
                })
                .eq('id', requestId);
        } catch (error) {
            console.error('Error approving request:', error);
        }
    },

    denyRequest: async (requestId: string) => {
        const profile = get().profile;
        if (!profile || !profile.isAdmin) return;

        try {
            // Get admin profile ID
            const { data: adminProfile } = await supabase
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
                    reviewed_by: adminProfile?.id
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

    disbandAgency: async () => {
        const profile = get().profile;
        if (!profile || profile.role !== 'Captain' || !profile.agencyId) return;

        await supabase.from('profiles').update({ agency_id: null, role: 'Solo' }).eq('agency_id', profile.agencyId);
        await supabase.from('agencies').delete().eq('id', profile.agencyId);

        await get().fetchProfile(profile.name);
    },

    updateAgency: async (data: Partial<Agency>) => {
        const profile = get().profile;
        if (!profile || profile.role !== 'Captain' || !profile.agencyId) return;

        await supabase.from('agencies').update(data).eq('id', profile.agencyId);
        await get().fetchProfile(profile.name);
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
            role: p.role,
        })) as any[];
    }
}));


