import { useEffect, useState } from "react";
import { useChallenge } from "../hooks/useChallenge";
import { useScore } from "../hooks/useScore";
import { SCORING } from "../constants/config";
import HintSystem from "./HintSystem";
import FlagValidator from "./FlagValidator";
import SolutionViewer from "./SolutionViewer";
import Scoreboard from "./Scoreboard";

export default function ChallengeCard({ category, difficulty, onReset }) {
  const { challenge, loading, error, fetchChallenge } = useChallenge();
  const { completedChallenges, totalScore, recordResult } = useScore();
  const [hintsUsed, setHintsUsed] = useState(0);
  const [phase, setPhase] = useState("playing"); // "playing" | "solved" | "surrendered"

  useEffect(() => {
    fetchChallenge(category, difficulty);
  }, [category, difficulty, fetchChallenge]);

  function handleHintUsed() {
    setHintsUsed((n) => n + 1);
  }

  function handleFlagSuccess() {
    recordResult({ challenge, hintsUsed, solved: true });
    setPhase("solved");
  }

  function handleSurrender() {
    recordResult({ challenge, hintsUsed, solved: false });
    setPhase("surrendered");
  }

  function handleNext() {
    setHintsUsed(0);
    setPhase("playing");
    fetchChallenge(category, difficulty);
  }

  if (loading) {
    return (
      <div className="border border-gray-700 p-8 text-center animate-pulse">
        <p className="text-[#00ff41] tracking-widest">
          {">>> GENERANDO RETO CON IA..."}
        </p>
        <p className="text-gray-600 text-xs mt-2">Esto puede tomar 2-4 segundos</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-800 p-6 text-center space-y-3">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={() => fetchChallenge(category, difficulty)}
          className="border border-red-600 text-red-400 px-4 py-2 text-xs hover:bg-red-900 transition-colors"
        >
          REINTENTAR
        </button>
      </div>
    );
  }

  if (!challenge) return null;

  const penalty = SCORING[difficulty].hintPenalty;

  return (
    <div className="space-y-4">
      <div className="border border-[#00ff4133] p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-500 tracking-widest">
              [{challenge.category.toUpperCase()}] [{challenge.difficulty.toUpperCase()}]
            </p>
            <h2 className="text-lg text-[#00ff41] font-bold mt-1">
              {challenge.title}
            </h2>
          </div>
          <span className="text-xs text-gray-500">{challenge.points} pts base</span>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed border-l-2 border-gray-700 pl-3">
          {challenge.description}
        </p>

        {phase === "playing" && (
          <>
            <HintSystem
              hints={challenge.hints}
              penalty={penalty}
              onHintUsed={handleHintUsed}
            />
            <FlagValidator
              correctFlag={challenge.flag}
              onSuccess={handleFlagSuccess}
            />
            <button
              onClick={handleSurrender}
              className="text-xs text-gray-600 hover:text-red-500 transition-colors underline"
            >
              Rendirse (ver solución)
            </button>
          </>
        )}
      </div>

      {(phase === "solved" || phase === "surrendered") && (
        <SolutionViewer
          solution={challenge.solution}
          flag={challenge.flag}
          onNext={handleNext}
        />
      )}

      <Scoreboard challenges={completedChallenges} total={totalScore} />

      <button
        onClick={onReset}
        className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
      >
        ← Cambiar categoría / dificultad
      </button>
    </div>
  );
}
