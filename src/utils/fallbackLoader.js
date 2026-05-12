import fallback from "../data/fallbackChallenges.json";

export function getFallbackChallenge(category, difficulty) {
  const pool = fallback.filter(
    (c) => c.category === category && c.difficulty === difficulty
  );
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
