export default function Scoreboard({ challenges = [], total = 0 }) {
  if (challenges.length === 0) return null;

  return (
    <div className="border border-gray-700 p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-500 tracking-widest">// SCOREBOARD</span>
        <span className="text-[#00ff41] font-bold">{total} pts</span>
      </div>

      <div className="space-y-1">
        {challenges.map((c, i) => (
          <div key={i} className="flex justify-between text-xs text-gray-400">
            <span className="truncate max-w-xs">{c.title}</span>
            <span className={c.solved ? "text-green-400" : "text-red-500"}>
              {c.solved ? `+${c.pointsEarned}` : "rendido"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
