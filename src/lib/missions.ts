export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Event' | 'Challenge';

export interface Quest {
    id: string;
    name: string;
    description: string;
    reward: {
        name: string;
        rarity: Rarity;
    };
}

export interface MissionPath {
    id: string;
    name: string;
    theme: string;
    focusStats: string[];
    quests: Quest[];
}

export const MISSION_PATHS: MissionPath[] = [
    {
        id: 'windrunner',
        name: 'Path of the Windrunner',
        theme: 'Speed and stamina',
        focusStats: ['Speed', 'Stamina'],
        quests: [
            {
                id: 'windrunner_1',
                name: 'Fleet Foot',
                description: 'Run 3 km in under 15 minutes',
                reward: { name: 'Fleet Foot', rarity: 'Rare' }
            },
            {
                id: 'windrunner_2',
                name: 'Streak of Lightning',
                description: 'Run 5 km in under 25 minutes',
                reward: { name: 'Streak of Lightning', rarity: 'Epic' }
            },
            {
                id: 'windrunner_3',
                name: 'Challenger of Storms',
                description: 'Win or place top 3 in a local 5k or 10k race',
                reward: { name: 'Challenger of Storms', rarity: 'Legendary' }
            },
            {
                id: 'windrunner_mythic',
                name: 'Sovreign of the Gale',
                description: 'Complete all Path of the Windrunner missions',
                reward: { name: 'Sovreign of the Gale', rarity: 'Mythic' }
            }
        ]
    },
    {
        id: 'juggernaut',
        name: 'Path of the Juggernaut',
        theme: 'Tank-style toughness and persistence',
        focusStats: ['Endurance', 'Strength'],
        quests: [
            {
                id: 'juggernaut_1',
                name: 'Iron Skin',
                description: 'Take 10 full-body hits (e.g., sparring or combat drills) without backing down',
                reward: { name: 'Iron Skin', rarity: 'Rare' }
            },
            {
                id: 'juggernaut_2',
                name: 'Unshakable Will',
                description: 'Go through 3 consecutive rounds of high-intensity drills without rest',
                reward: { name: 'Unshakable Will', rarity: 'Epic' }
            },
            {
                id: 'juggernaut_3',
                name: 'Unstoppable Force',
                description: 'Complete a Spartan/mud/obstacle race while carrying extra weight',
                reward: { name: 'Unstoppable Force', rarity: 'Legendary' }
            },
            {
                id: 'juggernaut_mythic',
                name: 'The Unfallen King',
                description: 'Complete all Path of the Juggernaut missions',
                reward: { name: 'The Unfallen King', rarity: 'Mythic' }
            }
        ]
    },
    {
        id: 'arcanist',
        name: 'Path of the Mastermind',
        theme: 'Intelligence and technical skill',
        focusStats: ['Agility', 'Precision', 'Coordination'],
        quests: [
            {
                id: 'arcanist_1',
                name: 'Mind Over Muscle',
                description: 'Complete a complex combo or movement routine under a time limit',
                reward: { name: 'Mind Over Muscle', rarity: 'Rare' }
            },
            {
                id: 'arcanist_2',
                name: 'Tactical Master',
                description: 'Memorize and execute 5 complex movement drills perfectly',
                reward: { name: 'Tactical Master', rarity: 'Epic' }
            },
            {
                id: 'arcanist_3',
                name: 'Mastermind',
                description: 'Lead a team-based simulation or challenge and win',
                reward: { name: 'Mastermind', rarity: 'Legendary' }
            },
            {
                id: 'arcanist_mythic',
                name: 'Echo of a Thousand Plans',
                description: 'Complete all Path of the Arcanist missions',
                reward: { name: 'Echo of a Thousand Plans', rarity: 'Mythic' }
            }
        ]
    },
    {
        id: 'phoenix',
        name: 'Path of the Phoenix',
        theme: 'Rebirth through struggle and perseverance',
        focusStats: ['All stats', 'Recovery emphasis'],
        quests: [
            {
                id: 'phoenix_1',
                name: 'Ash Walker',
                description: 'Come back after injury or illness and complete a baseline test',
                reward: { name: 'Ash Walker', rarity: 'Rare' }
            },
            {
                id: 'phoenix_2',
                name: 'Flame of Will',
                description: 'Hit a personal record after at least 1 month of consistent training',
                reward: { name: 'Flame of Will', rarity: 'Epic' }
            },
            {
                id: 'phoenix_3',
                name: 'Wings of the Reborn',
                description: 'Complete all your baseline stats again and show 20%+ improvement overall',
                reward: { name: 'Wings of the Reborn', rarity: 'Legendary' }
            },
            {
                id: 'phoenix_mythic',
                name: 'Phoenix Soul',
                description: 'Complete all Path of the Phoenix missions',
                reward: { name: 'Phoenix Soul', rarity: 'Mythic' }
            }
        ]
    },
    {
        id: 'beastmaster',
        name: 'Path of the Beastmaster',
        theme: 'Outdoors, survival, and animalistic endurance',
        focusStats: ['Endurance', 'Stamina', 'Agility'],
        quests: [
            {
                id: 'beastmaster_1',
                name: 'Forest Runner',
                description: 'Complete a trail run or hike 10km with gear',
                reward: { name: 'Forest Runner', rarity: 'Rare' }
            },
            {
                id: 'beastmaster_2',
                name: 'Wild Instinct',
                description: 'Build a shelter, make a fire, or survive a day off the grid',
                reward: { name: 'Wild Instinct', rarity: 'Epic' }
            },
            {
                id: 'beastmaster_3',
                name: 'Alpha of the Wild',
                description: 'Win a wilderness survival challenge or complete a multi-day hike',
                reward: { name: 'Alpha of the Wild', rarity: 'Legendary' }
            },
            {
                id: 'beastmaster_mythic',
                name: 'Beastmaster',
                description: 'Complete all Path of the Beastmaster missions',
                reward: { name: 'Beastmaster', rarity: 'Mythic' }
            }
        ]
    },
    {
        id: 'bloodhound',
        name: 'Path of the Bloodhound',
        theme: 'Relentless pursuit, tracking, and endurance',
        focusStats: ['Stamina', 'Speed', 'Awareness'],
        quests: [
            {
                id: 'bloodhound_1',
                name: "Hunter's Smell",
                description: 'Complete a scavenger or orienteering challenge across a 3km course',
                reward: { name: "Hunter's Smell", rarity: 'Rare' }
            },
            {
                id: 'bloodhound_2',
                name: 'Relentless Chase',
                description: 'Track and "tag" moving targets over a 5km run (team exercise)',
                reward: { name: 'Relentless Chase', rarity: 'Epic' }
            },
            {
                id: 'bloodhound_3',
                name: 'The Final Hunt',
                description: 'Win a timed, multi-zone tracking competition',
                reward: { name: 'The Final Hunt', rarity: 'Legendary' }
            },
            {
                id: 'bloodhound_mythic',
                name: 'Crimson Seeker',
                description: 'Complete all Path of the Bloodhound missions',
                reward: { name: 'Crimson Seeker', rarity: 'Mythic' }
            }
        ]
    },
    {
        id: 'ironfist',
        name: 'Path of the Iron Fist',
        theme: 'Hand-to-hand mastery and precision striking',
        focusStats: ['Strength', 'Agility'],
        quests: [
            {
                id: 'ironfist_1',
                name: 'Strike Initiate',
                description: 'Land 100 clean strikes on pads with proper form',
                reward: { name: 'Strike Initiate', rarity: 'Rare' }
            },
            {
                id: 'ironfist_2',
                name: 'Precision Breaker',
                description: 'Break a board, brick, or target object with a single controlled strike',
                reward: { name: 'Precision Breaker', rarity: 'Epic' }
            },
            {
                id: 'ironfist_3',
                name: 'The One-Punch Trial',
                description: 'Drop your opponent with a single strike in a controlled sparring match',
                reward: { name: 'The One-Punch Trial', rarity: 'Legendary' }
            },
            {
                id: 'ironfist_mythic',
                name: 'Fist of Ruin',
                description: 'Complete all Path of the Iron Fist missions',
                reward: { name: 'Fist of Ruin', rarity: 'Mythic' }
            }
        ]
    },
    {
        id: 'abyssdiver',
        name: 'Path of the Abyss Diver',
        theme: 'Facing fear, resilience, and breath control',
        focusStats: ['Stamina', 'Endurance', 'Mental fortitude'],
        quests: [
            {
                id: 'abyssdiver_1',
                name: 'Hold the Line',
                description: 'Hold your breath for 90 seconds under water',
                reward: { name: 'Hold the Line', rarity: 'Rare' }
            },
            {
                id: 'abyssdiver_2',
                name: 'Sink or Rise',
                description: 'Dive 3 meters and retrieve an object from the bottom',
                reward: { name: 'Sink or Rise', rarity: 'Epic' }
            },
            {
                id: 'abyssdiver_3',
                name: 'Descent into Madness',
                description: 'Perform underwater challenges (like swimming blindfolded) under time',
                reward: { name: 'Descent into Madness', rarity: 'Legendary' }
            },
            {
                id: 'abyssdiver_mythic',
                name: 'Warden of the Abyss',
                description: 'Complete all Path of the Abyss Diver missions',
                reward: { name: 'Warden of the Abyss', rarity: 'Mythic' }
            }
        ]
    },
    {
        id: 'thunderclap',
        name: 'Path of the Thunderclap',
        theme: 'Explosive movement and raw acceleration',
        focusStats: ['Speed', 'Agility', 'Reflexes'],
        quests: [
            {
                id: 'thunderclap_1',
                name: 'Flashstarter',
                description: 'Sprint 20m in under 3 seconds',
                reward: { name: 'Flashstarter', rarity: 'Rare' }
            },
            {
                id: 'thunderclap_2',
                name: 'Flashstorm',
                description: 'Perform 5 perfect plyometric drills in sequence',
                reward: { name: 'Flashstorm', rarity: 'Epic' }
            },
            {
                id: 'thunderclap_3',
                name: 'Clap of Judgment',
                description: 'Win a sprint tournament or reflex showdown',
                reward: { name: 'Clap of Judgment', rarity: 'Legendary' }
            },
            {
                id: 'thunderclap_mythic',
                name: 'Thunderborn Tyrant',
                description: 'Complete all Path of the Thunderclap missions',
                reward: { name: 'Thunderborn Tyrant', rarity: 'Mythic' }
            }
        ]
    },
    {
        id: 'warmonk',
        name: 'Path of the War Monk',
        theme: 'Control, endurance, and self-mastery',
        focusStats: ['All-around', 'Focused discipline'],
        quests: [
            {
                id: 'warmonk_1',
                name: 'Calm Before the Storm',
                description: 'Meditate and hold a perfect stance for 10 minutes',
                reward: { name: 'Calm Before the Storm', rarity: 'Rare' }
            },
            {
                id: 'warmonk_2',
                name: 'Balance Through Chaos',
                description: 'Complete yoga or tai chi session after a HIIT workout',
                reward: { name: 'Balance Through Chaos', rarity: 'Epic' }
            },
            {
                id: 'warmonk_3',
                name: 'Ascension Duel',
                description: 'Win a mixed-skills challenge (endurance + precision + strength)',
                reward: { name: 'Ascension Duel', rarity: 'Legendary' }
            },
            {
                id: 'warmonk_mythic',
                name: 'Soulbreaker Sage',
                description: 'Complete all Path of the War Monk missions',
                reward: { name: 'Soulbreaker Sage', rarity: 'Mythic' }
            }
        ]
    },
    {
        id: 'bladewalker',
        name: 'Path of the Bladewalker',
        theme: 'Dexterity, weapon skill',
        focusStats: ['Agility', 'Coordination', 'Precision'],
        quests: [
            {
                id: 'bladewalker_1',
                name: 'Steel Initiate',
                description: 'Perform 50 clean "blade strikes" in a timed trial',
                reward: { name: 'Steel Initiate', rarity: 'Rare' }
            },
            {
                id: 'bladewalker_2',
                name: 'Edge Dancer',
                description: 'Complete a combo routine with zero errors',
                reward: { name: 'Edge Dancer', rarity: 'Epic' }
            },
            {
                id: 'bladewalker_3',
                name: 'Blade Ascendant',
                description: 'Win a sparring or stick-fighting match',
                reward: { name: 'Blade Ascendant', rarity: 'Legendary' }
            },
            {
                id: 'bladewalker_mythic',
                name: 'Ghost of the Edge',
                description: 'Complete all Path of the Bladewalker missions',
                reward: { name: 'Ghost of the Edge', rarity: 'Mythic' }
            }
        ]
    }
];