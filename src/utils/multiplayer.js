export const MULTIPLAYER_TIMER_DURATION_MS = 5 * 60 * 1000;

export function makePlayerEntry(user) {
  return {
    displayName: user.displayName || user.email?.split("@")[0] || "anon",
    solved: false,
    surrendered: false,
    pointsEarned: 0,
    totalPoints: 0,
    hintsUsed: 0,
    solvedAt: null,
  };
}

export function resetPlayerProgress(players = {}) {
  return Object.fromEntries(
    Object.entries(players).map(([uid, player]) => [
      uid,
      {
        ...player,
        solved: false,
        surrendered: false,
        pointsEarned: 0,
        totalPoints: Number(player.totalPoints ?? 0),
        hintsUsed: 0,
        solvedAt: null,
      },
    ])
  );
}

export function pickRandomChallengeConfig() {
  const categories = ["web", "crypto", "reversing"];
  const difficulties = ["easy", "medium", "hard"];

  return {
    category: categories[Math.floor(Math.random() * categories.length)],
    difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
  };
}

export function buildRoundUpdate(challenge, players, now = Date.now()) {
  return {
    status: "playing",
    challenge,
    timerEnd: now + MULTIPLAYER_TIMER_DURATION_MS,
    roundId: now,
    players: resetPlayerProgress(players),
  };
}
