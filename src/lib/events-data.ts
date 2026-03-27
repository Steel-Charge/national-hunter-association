export interface EventMission {
    id: string;
    title: string;
    description: string;
    rarity: 'Legendary' | 'Mythic' | 'Epic' | 'Rare' | 'Common';
    points: number;
    requirement: string;
}

export interface NPC {
    id: string;
    name: string;
    title: string;
    avatarUrl: string;
    points: number;
    rank: string;
    isNPC: boolean;
}

export const PHOENIX_GAMES_END_DATE = '2026-09-30T23:59:59';

export const EVENT_MISSIONS: EventMission[] = [
    {
        id: 'better',
        title: 'BETTER',
        description: 'Pass one person in the Rankings, or Be No.1 in the Rankings.',
        rarity: 'Legendary',
        points: 150,
        requirement: 'rank_pass'
    },
    {
        id: 'built_different',
        title: 'BUILT DIFFERENT',
        description: 'Train for 5 days in a row.',
        rarity: 'Legendary',
        points: 150,
        requirement: 'streak_5'
    },
    {
        id: 'mutant',
        title: 'MUTANT',
        description: 'Rank up in 2 stats from Last Evaluation.',
        rarity: 'Mythic',
        points: 200,
        requirement: 'rank_up_2'
    },
    {
        id: 'evolving',
        title: 'Evolving',
        description: 'Enter a competition of a sport or an activity you’ve never done competitively before.',
        rarity: 'Epic',
        points: 100,
        requirement: 'manual_claim'
    },
    {
        id: 'ascended',
        title: 'Ascended',
        description: 'Earn all event titles.',
        rarity: 'Mythic', // User didn't specify, but sounds mythic
        points: 250,
        requirement: 'all_titles'
    }
];

export const HYENA_NPCS: NPC[] = [
    {
        id: 'npc_grimm',
        name: 'Grimm',
        title: 'Hyena Captain',
        avatarUrl: '/placeholder.png',
        points: 850,
        rank: 'S',
        isNPC: true
    },
    {
        id: 'npc_lockjaw',
        name: 'Lockjaw',
        title: 'Gambit',
        avatarUrl: '/placeholder.png',
        points: 720,
        rank: 'A',
        isNPC: true
    },
    {
        id: 'npc_mana',
        name: 'Mana',
        title: 'Faery',
        avatarUrl: '/placeholder.png',
        points: 610,
        rank: 'B',
        isNPC: true
    },
    {
        id: 'npc_dala',
        name: 'Dala',
        title: 'Toto',
        avatarUrl: '/placeholder.png',
        points: 440,
        rank: 'C',
        isNPC: true
    },
    {
        id: 'npc_performer',
        name: 'Performer',
        title: 'Dancer',
        avatarUrl: '/placeholder.png',
        points: 320,
        rank: 'D',
        isNPC: true
    }
];
