import { create } from 'zustand';
import { supabase } from './supabase';
import { ATTRIBUTES, calculateAttributeRank, calculateOverallRank, getAttributes, Rank } from './game-logic';

export interface Title {
    name: string;
    rarity: 'Legendary' | 'Epic' | 'Rare' | 'Common' | 'Mythic';
}

export interface UserSettings {
    statsCalculator: boolean;
    theme: Rank | null;
}

export interface UserProfile {
    name: string;
    avatarUrl?: string;
    activeTitle: Title;
    unlockedTitles: Title[];
    testScores: Record<string, number>; // Test Name -> Value
    completedQuests: string[]; // Quest IDs that have been completed
    settings: UserSettings;
    isAdmin: boolean; // Admin flag
    profileType: string; // Profile type for attribute targets
}

const DEFAULT_SETTINGS: UserSettings = {
    statsCalculator: false, // Disabled by default for non-admins
    theme: null
};

const DEFAULT_PROFILE: UserProfile = {
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
    settings: { statsCalculator: true, theme: null }, // Admin has statsCalculator enabled
    isAdmin: true, // Edgelord is admin
    profileType: 'male_20_25'
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
    name: '',
    avatarUrl: '/placeholder.png',
    activeTitle: { name: 'Hunter', rarity: 'Common' },
    unlockedTitles: [{ name: 'Hunter', rarity: 'Common' }],
    testScores: {}, // Empty scores = 0 in UI
    completedQuests: [],
    settings: DEFAULT_SETTINGS,
    isAdmin: false,
    profileType: 'male_20_25'
};

interface HunterState {
    profile: UserProfile | null;
    loading: boolean;
    setProfile: (profile: UserProfile | null) => void;
    setLoading: (loading: boolean) => void;
    fetchProfile: (name: string) => Promise<void>;
    createProfile: (name: string, password?: string, profileType?: string) => Promise<void>;
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
    getStats: () => { name: string; percentage: number; rank: Rank }[];
    getOverallRank: () => Rank;
    getTheme: () => Rank;
    initialize: () => void;
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
                    .select('name, rarity')
                    .eq('profile_id', profileData.id);

                // 3. Get Completed Quests
                const { data: questsData } = await supabase
                    .from('completed_quests')
                    .select('quest_id')
                    .eq('profile_id', profileData.id);

                set({
                    profile: {
                        name: profileData.name,
                        avatarUrl: profileData.avatar_url,
                        activeTitle: profileData.active_title || { name: 'Hunter', rarity: 'Common' },
                        testScores: profileData.test_scores || {},
                        unlockedTitles: titlesData || [],
                        completedQuests: questsData?.map((q: { quest_id: string }) => q.quest_id) || [],
                        settings: profileData.settings || DEFAULT_SETTINGS,
                        isAdmin: profileData.is_admin || false,
                        profileType: profileData.profile_type || 'male_20_25'
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            set({ loading: false });
        }
    },

    createProfile: async (name: string, password?: string, profileType: string = 'male_20_25') => {
        try {
            let initialProfile = { ...NEW_HUNTER_PROFILE, name, profileType };

            if (name === 'Edgelord') initialProfile = DEFAULT_PROFILE;
            else if (name === 'Toto') initialProfile = { ...NEW_HUNTER_PROFILE, ...TOTO_PROFILE, name, profileType: 'male_20_25' };
            else if (name === 'Lockjaw') initialProfile = { ...NEW_HUNTER_PROFILE, ...LOCKJAW_PROFILE, name, profileType: 'male_20_25' };

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
                    profile_type: initialProfile.profileType
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
                    name: newProfile.name,
                    activeTitle: newProfile.active_title || { name: 'Hunter', rarity: 'Common' },
                    testScores: newProfile.test_scores || {},
                    unlockedTitles: initialProfile.unlockedTitles as Title[],
                    completedQuests: initialProfile.completedQuests as string[],
                    settings: initialProfile.settings,
                    isAdmin: name === 'Edgelord', // Only Edgelord is admin
                    profileType: initialProfile.profileType
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
                        'Edgelord': 'Qwerty1',
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
                // Lazy migration: If DB has 'default' password, allow login with expected password and update DB
                if (profileData.password === 'default') {
                    const expectedPasswords: Record<string, string> = {
                        'Edgelord': 'Qwerty1',
                        'Toto': 'Password1',
                        'Lockjaw': 'Password2'
                    };

                    if (password === expectedPasswords[name]) {
                        console.log('Lazy migration: Updating password...');
                        // Update DB with correct password
                        await supabase
                            .from('profiles')
                            .update({ password: password })
                            .eq('name', name);

                        localStorage.setItem('last_user', name);
                        await get().fetchProfile(name);
                        return true;
                    }
                }

                // Normal login
                if (profileData.password === password) {
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
        if (targetName && targetName !== profile.name && !profile.isAdmin) {
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
            .eq('name', nameToUpdate);

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
            // Get profile ID
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id')
                .eq('name', profile.name)
                .single();

            if (profileData) {
                // Insert Quest
                await supabase.from('completed_quests').insert({
                    profile_id: profileData.id,
                    quest_id: questId
                });

                // Insert Title if new
                if (!titleExists) {
                    await supabase.from('unlocked_titles').insert({
                        profile_id: profileData.id,
                        name: title.name,
                        rarity: title.rarity
                    });
                }
            }
        } catch (error) {
            console.error('Error claiming quest:', error);
            // Revert optimistic update on error? For now, just log.
        }
    },

    requestTitle: async (questId: string, title: Title) => {
        const profile = get().profile;
        if (!profile) return;

        try {
            // Get profile ID
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id')
                .eq('name', profile.name)
                .single();

            if (profileData) {
                // Create title request
                await supabase.from('title_requests').insert({
                    profile_id: profileData.id,
                    quest_id: questId,
                    title_name: title.name,
                    title_rarity: title.rarity,
                    status: 'pending'
                });
            }
        } catch (error) {
            console.error('Error requesting title:', error);
        }
    },

    getPendingRequests: async () => {
        const profile = get().profile;
        if (!profile) return [];

        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id')
                .eq('name', profile.name)
                .single();

            if (profileData) {
                const { data: requests } = await supabase
                    .from('title_requests')
                    .select('quest_id')
                    .eq('profile_id', profileData.id)
                    .eq('status', 'pending');

                return requests?.map(r => r.quest_id) || [];
            }
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
            .eq('name', profile.name);

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
            .eq('name', profile.name);

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
            .eq('name', profile.name);

        if (error) console.error('Error updating settings:', error);
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
    }
}));

