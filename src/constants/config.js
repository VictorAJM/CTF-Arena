export const SCORING = {
  easy:   { base: 100, hintPenalty: 10,  minPoints: 50  },
  medium: { base: 300, hintPenalty: 30,  minPoints: 150 },
  hard:   { base: 500, hintPenalty: 50,  minPoints: 250 },
};

export const MAX_HINTS = 3;

export const CATEGORIES = ["web", "crypto", "reversing"];
export const DIFFICULTIES = ["easy", "medium", "hard"];

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
