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
        return entries.sort((a, b) => b.score - a.score);

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}
