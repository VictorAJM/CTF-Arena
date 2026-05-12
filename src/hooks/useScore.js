import { useState } from "react";
import { SCORING } from "../constants/config";

export function useScore() {
  const [completedChallenges, setCompletedChallenges] = useState([]);

  const totalScore = completedChallenges.reduce((sum, c) => sum + c.pointsEarned, 0);

  function recordResult({ challenge, hintsUsed, solved }) {
    if (!solved) {
      setCompletedChallenges((prev) => [
        ...prev,
        { ...challenge, hintsUsed, pointsEarned: 0, solved: false },
      ]);
      return 0;
    }

    const { base, hintPenalty, minPoints } = SCORING[challenge.difficulty];
    const earned = Math.max(base - hintsUsed * hintPenalty, minPoints);

    setCompletedChallenges((prev) => [
      ...prev,
      { ...challenge, hintsUsed, pointsEarned: earned, solved: true },
    ]);

    return earned;
  }

  return { completedChallenges, totalScore, recordResult };
}
