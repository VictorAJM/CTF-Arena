export const MULTIPLAYER_TIMER_DURATION_MS = 5 * 60 * 1000;

export const MULTIPLAYER_CHALLENGE_CATEGORIES = [
  {
    id: "web",
    label: "Web Exploitation",
    description: "SQL Injection, XSS, IDOR, Path Traversal",
  },
  {
    id: "crypto",
    label: "Cryptography",
    description: "Caesar, Base64, XOR, Vigenere, Hash cracking",
  },
];

export const MULTIPLAYER_DIFFICULTIES = [
  { id: "easy", label: "Facil" },
  { id: "medium", label: "Medio" },
  { id: "hard", label: "Dificil" },
];

const DEFAULT_DIFFICULTIES = Object.fromEntries(
  MULTIPLAYER_DIFFICULTIES.map((difficulty) => [difficulty.id, true])
);

export const DEFAULT_MULTIPLAYER_SETTINGS = {
  hostInstructions: "",
  challengePool: Object.fromEntries(
    MULTIPLAYER_CHALLENGE_CATEGORIES.map((category) => [
      category.id,
      {
        enabled: true,
        difficulties: { ...DEFAULT_DIFFICULTIES },
      },
    ])
  ),
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function normalizeMultiplayerSettings(settings = DEFAULT_MULTIPLAYER_SETTINGS) {
  const sourcePool = settings?.challengePool ?? {};
  const hostInstructions =
    typeof settings?.hostInstructions === "string"
      ? settings.hostInstructions.slice(0, 400)
      : DEFAULT_MULTIPLAYER_SETTINGS.hostInstructions;

  return {
    hostInstructions,
    challengePool: Object.fromEntries(
      MULTIPLAYER_CHALLENGE_CATEGORIES.map((category) => {
        const defaultCategory = DEFAULT_MULTIPLAYER_SETTINGS.challengePool[category.id];
        const sourceCategory = sourcePool[category.id] ?? {};
        const sourceDifficulties = sourceCategory.difficulties ?? {};

        return [
          category.id,
          {
            enabled:
              typeof sourceCategory.enabled === "boolean"
                ? sourceCategory.enabled
                : defaultCategory.enabled,
            difficulties: Object.fromEntries(
              MULTIPLAYER_DIFFICULTIES.map((difficulty) => [
                difficulty.id,
                typeof sourceDifficulties[difficulty.id] === "boolean"
                  ? sourceDifficulties[difficulty.id]
                  : defaultCategory.difficulties[difficulty.id],
              ])
            ),
          },
        ];
      })
    ),
  };
}

export function createDefaultMultiplayerSettings() {
  return clone(DEFAULT_MULTIPLAYER_SETTINGS);
}

export function validateMultiplayerSettings(settings) {
  const normalized = normalizeMultiplayerSettings(settings);
  const selectedCategories = MULTIPLAYER_CHALLENGE_CATEGORIES.filter(
    (category) => normalized.challengePool[category.id].enabled
  );

  if (selectedCategories.length === 0) {
    return {
      isValid: false,
      message: "Selecciona al menos una categoria de reto.",
      settings: normalized,
    };
  }

  const categoryWithoutDifficulty = selectedCategories.find((category) => {
    const difficulties = normalized.challengePool[category.id].difficulties;
    return !MULTIPLAYER_DIFFICULTIES.some((difficulty) => difficulties[difficulty.id]);
  });

  if (categoryWithoutDifficulty) {
    return {
      isValid: false,
      message: `Selecciona al menos una dificultad para ${categoryWithoutDifficulty.label}.`,
      settings: normalized,
    };
  }

  return { isValid: true, message: null, settings: normalized };
}

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

export function pickRandomChallengeConfig(settings = DEFAULT_MULTIPLAYER_SETTINGS) {
  const validation = validateMultiplayerSettings(settings);
  if (!validation.isValid) throw new Error(validation.message);

  const selectedCategories = MULTIPLAYER_CHALLENGE_CATEGORIES.filter(
    (category) => validation.settings.challengePool[category.id].enabled
  );
  const selectedCategory =
    selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
  const selectedDifficulties = MULTIPLAYER_DIFFICULTIES.filter(
    (difficulty) =>
      validation.settings.challengePool[selectedCategory.id].difficulties[difficulty.id]
  );
  const selectedDifficulty =
    selectedDifficulties[Math.floor(Math.random() * selectedDifficulties.length)];

  return {
    category: selectedCategory.id,
    difficulty: selectedDifficulty.id,
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
