export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
// Force redeploy

export const RANK_COLORS: Record<Rank, string> = {
  'S': '#e0e0e0', // Silver/Prismatic Base
  'A': '#ffe597', // Gold
  'B': '#8247ff', // Purple
  'C': '#00abff', // Blue
  'D': '#2aff5f', // Green
  'E': '#ffffff', // White
};

export interface TestStandard {
  name: string;
  maxScore: number; // The value that equals 100%
  unit: string;
  inverse?: boolean; // If true, lower is better (e.g., sprint time)
}

export interface Attribute {
  name: string;
  tests: TestStandard[];
}

export const PROFILE_TYPES = {
  MALE_20_25: 'male_20_25',
  FEMALE_15_20: 'female_15_20',
  FEMALE_20_24: 'female_20_24',
  MALE_25_34: 'male_25_34',
  FEMALE_25_34: 'female_25_34',
} as const;

export const PROFILE_LABELS: Record<string, string> = {
  [PROFILE_TYPES.MALE_20_25]: 'Male: 20 - 24 years old',
  [PROFILE_TYPES.FEMALE_15_20]: 'Female: 15 - 19 years old',
  [PROFILE_TYPES.FEMALE_20_24]: 'Female: 20 - 24 years old',
  [PROFILE_TYPES.MALE_25_34]: 'Male: 25 - 34 years old',
  [PROFILE_TYPES.FEMALE_25_34]: 'Female: 25 - 34 years old',
};

const MALE_20_25_TARGETS: Record<string, Attribute> = {
  Strength: {
    name: 'Strength',
    tests: [
      { name: 'Bench Press', maxScore: 150, unit: 'kg' },
      { name: 'Deadlift', maxScore: 245, unit: 'kg' },
      { name: 'Squat', maxScore: 220, unit: 'kg' },
    ],
  },
  Endurance: {
    name: 'Endurance',
    tests: [
      { name: 'Pull-ups', maxScore: 36, unit: 'reps' },
      { name: 'Push-ups', maxScore: 47, unit: 'reps' },
    ],
  },
  Stamina: {
    name: 'Stamina',
    tests: [
      { name: 'Plank Hold', maxScore: 6, unit: 'min' },
      { name: 'Burpees in 1-minute', maxScore: 40, unit: 'reps' },
      { name: '1-mile run', maxScore: 6.3, unit: 'min', inverse: true },
    ],
  },
  Speed: {
    name: 'Speed',
    tests: [
      { name: '100m Sprint', maxScore: 10.3, unit: 's', inverse: true },
      { name: '40-yard Dash', maxScore: 4.2, unit: 's', inverse: true },
    ],
  },
  Agility: {
    name: 'Agility',
    tests: [
      { name: 'Pro Agility Shuttle', maxScore: 4, unit: 's', inverse: true },
    ],
  },
};

const FEMALE_15_20_TARGETS: Record<string, Attribute> = {
  Strength: {
    name: 'Strength',
    tests: [
      { name: 'Bench Press', maxScore: 65, unit: 'kg' },
      { name: 'Deadlift', maxScore: 115, unit: 'kg' },
      { name: 'Squat', maxScore: 105, unit: 'kg' },
    ],
  },
  Endurance: {
    name: 'Endurance',
    tests: [
      { name: 'Pull-ups', maxScore: 10, unit: 'reps' },
      { name: 'Push-ups', maxScore: 30, unit: 'reps' },
    ],
  },
  Stamina: {
    name: 'Stamina',
    tests: [
      { name: 'Plank Hold', maxScore: 6, unit: 'min' },
      { name: 'Burpees in 1-minute', maxScore: 20, unit: 'reps' },
      { name: '1-mile run', maxScore: 7.5, unit: 'min', inverse: true },
    ],
  },
  Speed: {
    name: 'Speed',
    tests: [
      { name: '100m Sprint', maxScore: 10.9, unit: 's', inverse: true },
      { name: '40-yard Dash', maxScore: 5, unit: 's', inverse: true },
    ],
  },
  Agility: {
    name: 'Agility',
    tests: [
      { name: 'Pro Agility Shuttle', maxScore: 4.75, unit: 's', inverse: true },
    ],
  },
};

const FEMALE_20_24_TARGETS: Record<string, Attribute> = {
  Strength: {
    name: 'Strength',
    tests: [
      { name: 'Bench Press', maxScore: 75, unit: 'kg' },
      { name: 'Deadlift', maxScore: 125, unit: 'kg' },
      { name: 'Squat', maxScore: 110, unit: 'kg' },
    ],
  },
  Endurance: {
    name: 'Endurance',
    tests: [
      { name: 'Pull-ups', maxScore: 22, unit: 'reps' },
      { name: 'Push-ups', maxScore: 30, unit: 'reps' },
    ],
  },
  Stamina: {
    name: 'Stamina',
    tests: [
      { name: 'Plank Hold', maxScore: 6, unit: 'min' },
      { name: 'Burpees in 1-minute', maxScore: 20, unit: 'reps' },
      { name: '1-mile run', maxScore: 6, unit: 'min', inverse: true },
    ],
  },
  Speed: {
    name: 'Speed',
    tests: [
      { name: '100m Sprint', maxScore: 10.5, unit: 's', inverse: true },
      { name: '40-yard Dash', maxScore: 4.8, unit: 's', inverse: true },
    ],
  },
  Agility: {
    name: 'Agility',
    tests: [
      { name: 'Pro Agility Shuttle', maxScore: 4.5, unit: 's', inverse: true },
    ],
  },
};

const MALE_25_34_TARGETS: Record<string, Attribute> = {
  Strength: {
    name: 'Strength',
    tests: [
      { name: 'Bench Press', maxScore: 180, unit: 'kg' },
      { name: 'Deadlift', maxScore: 245, unit: 'kg' },
      { name: 'Squat', maxScore: 220, unit: 'kg' },
    ],
  },
  Endurance: {
    name: 'Endurance',
    tests: [
      { name: 'Pull-ups', maxScore: 40, unit: 'reps' },
      { name: 'Push-ups', maxScore: 50, unit: 'reps' },
    ],
  },
  Stamina: {
    name: 'Stamina',
    tests: [
      { name: 'Plank Hold', maxScore: 6, unit: 'min' },
      { name: 'Burpees in 1-minute', maxScore: 30, unit: 'reps' },
      { name: '1-mile run', maxScore: 5.10, unit: 'min', inverse: true },
    ],
  },
  Speed: {
    name: 'Speed',
    tests: [
      { name: '100m Sprint', maxScore: 10.2, unit: 's', inverse: true },
      { name: '40-yard Dash', maxScore: 4.2, unit: 's', inverse: true },
    ],
  },
  Agility: {
    name: 'Agility',
    tests: [
      { name: 'Pro Agility Shuttle', maxScore: 4.4, unit: 's', inverse: true },
    ],
  },
};

const FEMALE_25_34_TARGETS: Record<string, Attribute> = {
  Strength: {
    name: 'Strength',
    tests: [
      { name: 'Bench Press', maxScore: 90, unit: 'kg' },
      { name: 'Deadlift', maxScore: 180, unit: 'kg' },
      { name: 'Squat', maxScore: 135, unit: 'kg' },
    ],
  },
  Endurance: {
    name: 'Endurance',
    tests: [
      { name: 'Pull-ups', maxScore: 22, unit: 'reps' },
      { name: 'Push-ups', maxScore: 40, unit: 'reps' },
    ],
  },
  Stamina: {
    name: 'Stamina',
    tests: [
      { name: 'Plank Hold', maxScore: 6, unit: 'min' },
      { name: 'Burpees in 1-minute', maxScore: 30, unit: 'reps' },
      { name: '1-mile run', maxScore: 6.05, unit: 'min', inverse: true },
    ],
  },
  Speed: {
    name: 'Speed',
    tests: [
      { name: '100m Sprint', maxScore: 10.5, unit: 's', inverse: true },
      { name: '40-yard Dash', maxScore: 5.2, unit: 's', inverse: true },
    ],
  },
  Agility: {
    name: 'Agility',
    tests: [
      { name: 'Pro Agility Shuttle', maxScore: 4.7, unit: 's', inverse: true },
    ],
  },
};

export function getAttributes(profileType: string = PROFILE_TYPES.MALE_20_25): Record<string, Attribute> {
  if (profileType === PROFILE_TYPES.FEMALE_15_20) {
    return FEMALE_15_20_TARGETS;
  }
  if (profileType === PROFILE_TYPES.FEMALE_20_24) {
    return FEMALE_20_24_TARGETS;
  }
  if (profileType === PROFILE_TYPES.MALE_25_34) {
    return MALE_25_34_TARGETS;
  }
  if (profileType === PROFILE_TYPES.FEMALE_25_34) {
    return FEMALE_25_34_TARGETS;
  }
  return MALE_20_25_TARGETS;
}

// Keep ATTRIBUTES for backward compatibility or default usage
export const ATTRIBUTES = MALE_20_25_TARGETS;

export function calculatePercentage(value: number, standard: TestStandard): number {
  if (value <= 0 && !standard.inverse) return 0;
  if (standard.inverse) {
    // For inverse (time), smaller is better.
    // 100% is achieving maxScore or less.
    // Let's say baseline "zero" is 2x maxScore for simplicity in this game logic,
    // or just use a simple ratio where maxScore/value * 100.
    // Example: Run 6.3m = 100%. Run 12.6m = 50%. Run 3.15m = 200% (capped at 100 usually?)
    // The prompt implies simple percentage. Let's stick to the example logic but adapted for inverse.
    // Actually, for speed, 10.3s is 100%. If I run 20.6s, am I 50%? Yes.
    // So (Target / Actual) * 100
    if (value <= 0) return 0; // Invalid time
    return Math.min(100, (standard.maxScore / value) * 100);
  } else {
    // Normal: (Actual / Target) * 100
    return Math.min(100, (value / standard.maxScore) * 100);
  }
}

export function getRankFromPercentage(percentage: number): Rank {
  if (percentage >= 85) return 'S';
  if (percentage >= 68) return 'A';
  if (percentage >= 51) return 'B';
  if (percentage >= 34) return 'C';
  if (percentage >= 17) return 'D';
  return 'E';
}

export function calculateAttributeRank(
  attributeName: string,
  userScores: Record<string, number>, // Map of test name -> value
  profileType: string = PROFILE_TYPES.MALE_20_25
): { percentage: number; rank: Rank } {
  const attributes = getAttributes(profileType);
  const attribute = attributes[attributeName];
  if (!attribute) return { percentage: 0, rank: 'E' };

  let totalPercentage = 0;
  let count = 0;

  attribute.tests.forEach((test) => {
    let score = userScores[test.name];
    // Fallback for renamed Burpees key to preserve existing data
    if (score === undefined && test.name === 'Burpees in 1-minute') {
      score = userScores['Burpees'];
    }

    if (score !== undefined && score !== null) {
      totalPercentage += calculatePercentage(score, test);
      count++;
    }
  });

  if (count === 0) return { percentage: 0, rank: 'E' };

  const averagePercentage = totalPercentage / count;
  return {
    percentage: averagePercentage,
    rank: getRankFromPercentage(averagePercentage),
  };
}

export function calculateOverallPercentage(
  userScores: Record<string, number>,
  profileType: string = PROFILE_TYPES.MALE_20_25
): number {
  let totalPercentage = 0;
  let count = 0;
  const attributes = getAttributes(profileType);

  Object.keys(attributes).forEach((attr) => {
    const { percentage } = calculateAttributeRank(attr, userScores, profileType);
    totalPercentage += percentage;
    count++;
  });

  if (count === 0) return 0;
  return totalPercentage / count;
}

export function calculateOverallRank(
  userScores: Record<string, number>,
  profileType: string = PROFILE_TYPES.MALE_20_25
): Rank {
  const averagePercentage = calculateOverallPercentage(userScores, profileType);
  return getRankFromPercentage(averagePercentage);
}
