export type ChatSpeaker = 'Rat King' | 'Bones' | 'User';

export interface ChatOption {
    label: string;
    nextId: string;
    requiredTitle?: string; // e.g. "CONSPIRACY"
    rewardTitle?: { name: string; rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' };
}

export interface ChatNode {
    id: string;
    speaker: ChatSpeaker;
    text: string;
    audioUrl?: string; // For placeholder audio
    nextId?: string; // Auto-advance to this node
    options?: ChatOption[]; // User choices
    // Requirements to SEE this node
    reqRank?: string; // e.g. "C"
    reqTimeWait?: number; // Hours to wait after previous node
    isEnd?: boolean; // Conversation pauses here
}

export type ChatGraph = Record<string, ChatNode>;

export const RAT_KING_CHAT: ChatGraph = {
    // --- INITIAL SEQUENCE ---
    'root': {
        id: 'root',
        speaker: 'Rat King',
        text: "Heya [username]!",
        nextId: 'rk_1'
    },
    'rk_1': {
        id: 'rk_1',
        speaker: 'Rat King',
        text: "Could you do me a favor?",
        options: [
            { label: "Sure.", nextId: 'rk_2a' },
            { label: "Depends what it is?", nextId: 'rk_2a' }
        ]
    },
    'rk_2a': {
        id: 'rk_2a',
        speaker: 'Rat King',
        text: "Tell Bones to leave me the F*CK ALONE!",
        nextId: 'rk_3'
    },
    'rk_3': {
        id: 'rk_3',
        speaker: 'Rat King',
        text: "nvm",
        nextId: 'rk_4'
    },
    'rk_4': {
        id: 'rk_4',
        speaker: 'Rat King',
        text: "I took care of it, lol",
        nextId: 'rk_5'
    },
    'rk_5': {
        id: 'rk_5',
        speaker: 'User', // Auto-reply from user for flow? Or Rat King continues? Script says User: "?"
        text: "?",
        nextId: 'rk_6'
    },
    'rk_6': {
        id: 'rk_6',
        speaker: 'Rat King',
        text: "even removed myself from the Rankings 😋",
        options: [
            { label: "What!?WHY!?", nextId: 'rk_7a' },
            { label: "👍", nextId: 'rk_7b' }
        ]
    },
    'rk_7a': { // Path A: What!?WHY!?
        id: 'rk_7a',
        speaker: 'Rat King',
        text: "You’ve always been there for me, thanks for keeping this chat private,",
        nextId: 'rk_8a'
    },
    'rk_8a': {
        id: 'rk_8a',
        speaker: 'User',
        text: "You didn’t answer my question😑", // User response
        nextId: 'rk_9'
    },
    'rk_7b': { // Path B: Thumbs up
        id: 'rk_7b',
        speaker: 'Rat King',
        text: "You’ve always been there for me, thanks for keeping this chat private,",
        nextId: 'rk_8b'
    },
    'rk_8b': {
        id: 'rk_8b',
        speaker: 'User',
        text: "This sounds like a goodbye?", // User response
        nextId: 'rk_9'
    },
    'rk_9': {
        id: 'rk_9',
        speaker: 'Rat King',
        text: "I'm going dark they can't make me fight, if they cant find me\nI’ll keep in touch\n🐀👑",
        options: [
            { label: "Stay safe", nextId: 'rk_end_1' },
            { label: "The NHA is dangerous, be careful out there", nextId: 'rk_end_1' }
        ]
    },
    'rk_end_1': {
        id: 'rk_end_1',
        speaker: 'Rat King',
        text: "...", // Placeholder to show conversation "ended" locally
        isEnd: true,
        nextId: 'c_rank_start' // Logically connects to next, but gating handles visibility
    },

    // --- C-RANK SEQUENCE ---
    'c_rank_start': {
        id: 'c_rank_start',
        speaker: 'Rat King',
        text: "[username]!",
        reqRank: 'C',
        nextId: 'c_1'
    },
    'c_1': {
        id: 'c_1',
        speaker: 'User',
        text: "Rat!",
        nextId: 'c_2'
    },
    'c_2': {
        id: 'c_2',
        speaker: 'Rat King',
        text: "Been a while,",
        nextId: 'c_3'
    },
    'c_3': {
        id: 'c_3',
        speaker: 'Rat King',
        text: "I thought I was done with the NHA, but they kept looking for me,",
        options: [
            { label: "Are you okay?", nextId: 'c_4a' },
            { label: "I THOUGHT YOU DIED!!☠️☠️", nextId: 'c_4a' }
        ]
    },
    'c_4a': {
        id: 'c_4a',
        speaker: 'Rat King',
        text: "Well I’m alive,\nI thought it only fair I look into NHA, get some blackmail so they can back off ",
        options: [
            { label: "Get anything?", nextId: 'c_5a' },
            { label: "Are they talking sh*t about me?", nextId: 'c_5a' }
        ]
    },
    'c_5a': {
        id: 'c_5a',
        speaker: 'Rat King',
        text: "I think I found some files related to the Monarch Project, but holy sh*t are these things redacted",
        nextId: 'c_6'
    },
    'c_6': {
        id: 'c_6',
        speaker: 'Rat King',
        text: "I'll work my magic as always. Don't wait up.",
        isEnd: true,
        nextId: 'wait_24h_start'
    },

    // --- 24 HOURS LATER ---
    'wait_24h_start': {
        id: 'wait_24h_start',
        speaker: 'Rat King',
        text: "Found something",
        reqTimeWait: 24, // 24 hours after reaching this node's predecessor
        options: [
            { label: "About time", nextId: 'w_1' },
            { label: "Dont keep me in suspense", nextId: 'w_1' }
        ]
    },
    'w_1': {
        id: 'w_1',
        speaker: 'Rat King',
        text: "Do you know what Aregeta is?",
        options: [
            { label: "The satellite?", nextId: 'w_2a' },
            { label: "Bless you", nextId: 'w_2b' }
        ]
    },
    'w_2a': {
        id: 'w_2a',
        speaker: 'Rat King',
        text: "Yes",
        nextId: 'w_3'
    },
    'w_2b': {
        id: 'w_2b',
        speaker: 'Rat King',
        text: "Haha, very funny",
        nextId: 'w_3'
    },
    'w_3': {
        id: 'w_3',
        speaker: 'Rat King',
        text: "The satellite that went MISSING\nIt was put in charge to watch REGRET after it discovered it.",
        options: [
            { label: "How did they lose it?", nextId: 'w_4' },
            { label: "Why should I care about this?", nextId: 'w_4' }
        ]
    },
    'w_4': {
        id: 'w_4',
        speaker: 'Rat King',
        text: "Get this, Captain harbinger the astronaut who went missing made to calls the last one lasted 44 seconds to the space station, but before that he contact Bones for 20 minutes\nThe NHA doesn't even know",
        nextId: 'w_5'
    },
    'w_5': {
        id: 'w_5',
        speaker: 'User',
        text: "Bones? As in our manager Bones?",
        nextId: 'w_6'
    },
    'w_6': {
        id: 'w_6',
        speaker: 'Rat King',
        text: "Bingo",
        nextId: 'w_7'
    },
    'w_7': {
        id: 'w_7',
        speaker: 'User',
        text: "What did they talk about?",
        nextId: 'w_8'
    },
    'w_8': {
        id: 'w_8',
        speaker: 'Rat King',
        text: "Dont get disappointed but only received this",
        nextId: 'w_audio'
    },
    'w_audio': {
        id: 'w_audio',
        speaker: 'Rat King',
        text: "[Audio Playback Placeholder]", // Placeholder for audio file
        audioUrl: '/audio/placeholder.mp3', // Placeholder path
        nextId: 'w_9'
    },
    'w_9': {
        id: 'w_9',
        speaker: 'User',
        text: "You really came out of hiding for this?",
        nextId: 'w_10'
    },
    'w_10': {
        id: 'w_10',
        speaker: 'Rat King',
        text: "I came out of hiding because I need YOU, to get some info out of Bones so I can get his passwords.",
        nextId: 'w_11'
    },
    'w_11': {
        id: 'w_11',
        speaker: 'User',
        text: "Isn’t hacking your whole thing?",
        nextId: 'w_12'
    },
    'w_12': {
        id: 'w_12',
        speaker: 'Rat King',
        text: "Will you help or not?",
        options: [
            {
                label: "I’ll see what I can do",
                nextId: 'w_end_help',
                rewardTitle: { name: 'CONSPIRACY', rarity: 'Epic' }
            },
            {
                label: "You’re on your own.",
                nextId: 'w_end_reject',
                rewardTitle: { name: 'NOT MY PROBLEM', rarity: 'Mythic' }
            }
        ]
    },
    'w_end_help': {
        id: 'w_end_help',
        speaker: 'Rat King',
        text: "Good. Talk soon.",
        isEnd: true
    },
    'w_end_reject': {
        id: 'w_end_reject',
        speaker: 'Rat King',
        text: "Fine. Be that way.",
        isEnd: true
    }
};

export const BONES_CHAT: ChatGraph = {
    'root': {
        id: 'root',
        speaker: 'Bones',
        text: "Welcome to ICARUS, if you mess up, I legally can't boot you,.",
        nextId: 'b_1'
    },
    'b_1': {
        id: 'b_1',
        speaker: 'Bones',
        text: "BUT YOU WILL WISH I COULD",
        nextId: 'b_2'
    },
    'b_2': {
        id: 'b_2',
        speaker: 'User',
        text: "uh..Hello to you too",
        nextId: 'b_3'
    },
    'b_3': {
        id: 'b_3',
        speaker: 'Bones',
        text: "Don’t have time to chat, This line should be used to discuss Missions only.\nUnderstood?",
        options: [
            { label: "Understood😐", nextId: 'b_under', rewardTitle: { name: 'First Day', rarity: 'Common' } },
            { label: "Sooo…We aren’t going to be Besties?", nextId: 'b_blocked', rewardTitle: { name: 'First Day', rarity: 'Common' } }
        ]
    },
    'b_under': {
        id: 'b_under',
        speaker: 'Bones',
        text: "Good.",
        isEnd: true,
        // Assuming "First Day" Common is earned just by completing this intro? Or maybe specific path?
        // Request says: Earn: “First Day” title Rarity common at end
        nextId: 'b_reward'
    },
    'b_blocked': {
        id: 'b_blocked',
        speaker: 'Bones',
        text: "[THIS USER HAS TEMPORARILY BLOCKED THIS CHAT. PLEASE TRY AGAIN LATER]",
        isEnd: true,
        nextId: 'b_reward' // Still give reward? Based on "User: '?' ... Blocked" sequence in prompt seems like loop
    },
    'b_reward': {
        id: 'b_reward',
        speaker: 'Bones',
        text: "(System: Conversation Ended)",
        isEnd: true,
        // Using a hidden node or just detecting end to give reward
        // We'll handle reward logic in the component when reaching this state
    }
};
