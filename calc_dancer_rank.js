const {
    calculateAttributeRank,
    calculateOverallRank,
    calculateOverallPercentage,
    PROFILE_TYPES
} = require('./src/lib/game-logic');

const dancerScores = {
    "Squat": 60,
    "Push-ups": 1,
    "Plank Hold": 0.39,
    "100m Sprint": 21.6,
    "Bench Press": 30,
    "40-yard Dash": 6.6,
    "Pro Agility Shuttle": 6.2
};

const profileType = 'female_15_20';

const overallPercentage = calculateOverallPercentage(dancerScores, profileType);
const overallRank = calculateOverallRank(dancerScores, profileType);

console.log('Overall Percentage:', overallPercentage);
console.log('Overall Rank:', overallRank);

const attrs = ['Strength', 'Endurance', 'Stamina', 'Speed', 'Agility'];
attrs.forEach(attr => {
    const res = calculateAttributeRank(attr, dancerScores, profileType);
    console.log(`${attr}: ${res.percentage.toFixed(2)}% (${res.rank})`);
});
