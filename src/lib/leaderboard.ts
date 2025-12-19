import { supabase } from './supabase';
import { ATTRIBUTES, calculateAttributeRank, getRankFromPercentage, Rank } from './game-logic';

export interface LeaderboardEntry {
    name: string;
    rank: Rank;
    score: number;
}

const RANK_VALUES: Record<Rank, number> = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 };

export async function getLeaderboard(attribute?: string): Promise<LeaderboardEntry[]> {
    try {
        const SPECIAL_NAME = "01010100 01101000 01100101 00100000 01100101 01101110 01100100 00100000 01101001 01100110 00100000 01110111 01100101 00100000 01100110 01100001 01101001 01101100 00101110 00101110 00101110";
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('name, test_scores');

        if (error) throw error;
        if (!profiles) return [];

        const entries = profiles.map(profile => {
            const testScores = profile.test_scores || {};

            if (attribute && ATTRIBUTES[attribute]) {
                // Attribute specific ranking
                const { percentage, rank } = calculateAttributeRank(attribute, testScores);
                // Score = Percentage * 100
                // Example: 50% -> 5000
                const score = Math.round(percentage * 100);

                return {
                    name: profile.name,
                    rank,
                    score
                };
            } else {
                // Overall ranking
                // Calculate percentage for each attribute
                let totalPercentage = 0;
                let count = 0;

                Object.keys(ATTRIBUTES).forEach(attr => {
                    const { percentage } = calculateAttributeRank(attr, testScores);
                    totalPercentage += percentage;
                    count++;
                });

                const averagePercentage = count > 0 ? totalPercentage / count : 0;

                // Score = Average Percentage * 100
                // Example: 29% -> 2900
                // If this is the special binary profile, force S (100%) locally
                if (profile.name === SPECIAL_NAME) {
                    const forcedPercentage = 100;
                    const forcedScore = Math.round(forcedPercentage * 100);
                    return {
                        name: profile.name,
                        rank: 'S' as Rank,
                        score: forcedScore
                    };
                }

                const score = Math.round(averagePercentage * 100);

                // Rank based on the average percentage
                const overallRank = getRankFromPercentage(averagePercentage);

                return {
                    name: profile.name,
                    rank: overallRank,
                    score
                };
            }
        });

        // Sort by score descending
        const sorted = entries.sort((a, b) => b.score - a.score);

        // Exclude the special binary profile from being displayed in the public rankings
        const filtered = sorted.filter(e => e.name !== SPECIAL_NAME);
        return filtered;

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}
