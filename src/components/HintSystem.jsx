import { useState } from "react";
import { MAX_HINTS } from "../constants/config";

export default function HintSystem({ hints = [], penalty, onHintUsed }) {
  const [revealed, setRevealed] = useState(0);

  const safeHints = Array.isArray(hints) ? hints : [];
  const available = Math.min(MAX_HINTS, safeHints.length);

  function revealNext() {
    if (revealed >= available) return;
    setRevealed((prev) => prev + 1);
    onHintUsed();
  }

  return (
    <div className="border border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 tracking-widest">// PISTAS</span>
        <span className="text-xs text-yellow-400">-{penalty} pts cada una</span>
      </div>

      {safeHints.slice(0, revealed).map((hint, i) => (
        <div key={i} className="text-sm text-yellow-300 border-l-2 border-yellow-600 pl-3">
          <span className="text-yellow-600 text-xs">HINT {i + 1}:</span>
          <p className="mt-1">{hint}</p>
        </div>
      ))}

      {revealed < available ? (
        <button
          onClick={revealNext}
          className="text-xs border border-yellow-700 text-yellow-500 px-3 py-1 hover:bg-yellow-900 transition-colors"
        >
          PEDIR PISTA ({available - revealed} restantes)
        </button>
      ) : (
        <p className="text-xs text-gray-600">No quedan más pistas.</p>
      )}
    </div>
  );
}
