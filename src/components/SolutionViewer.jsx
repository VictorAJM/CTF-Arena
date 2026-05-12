export default function SolutionViewer({ solution, flag, onNext }) {
  return (
    <div className="border border-gray-600 p-4 space-y-4 bg-[#111]">
      <p className="text-xs text-gray-500 tracking-widest">// SOLUCIÓN</p>

      <div className="border border-green-900 bg-[#001a00] px-3 py-2 text-sm">
        <span className="text-green-600 text-xs">FLAG: </span>
        <span className="text-green-400 font-bold">{flag}</span>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
        {solution}
      </p>

      <button
        onClick={onNext}
        className="w-full py-2 border border-[#00ff41] text-[#00ff41] text-sm hover:bg-[#00ff4110] transition-colors"
      >
        SIGUIENTE RETO →
      </button>
    </div>
  );
}
