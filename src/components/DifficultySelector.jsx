import { SCORING } from "../constants/config";

const DIFFICULTIES = [
  { id: "easy",   label: "FÁCIL",   color: "text-green-400" },
  { id: "medium", label: "MEDIO",   color: "text-yellow-400" },
  { id: "hard",   label: "DIFÍCIL", color: "text-red-400" },
];

export default function DifficultySelector({ selected, onSelect }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2 tracking-widest">// SELECCIONA DIFICULTAD</p>
      <div className="grid grid-cols-3 gap-3">
        {DIFFICULTIES.map((d) => {
          const scoring = SCORING[d.id];
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={`border p-3 transition-all ${
                selected === d.id
                  ? "border-[#00ff41] bg-[#00ff4110]"
                  : "border-gray-700 hover:border-gray-500"
              }`}
            >
              <div className={`font-bold ${d.color}`}>{d.label}</div>
              <div className="text-xs text-gray-500 mt-1">
                {scoring.base} pts
              </div>
              <div className="text-xs text-gray-600">
                -{scoring.hintPenalty} por pista
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
