import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserScores } from "../hooks/useUserScores";

const CATEGORY_COLORS = {
  web: "text-blue-400",
  crypto: "text-yellow-400",
  reversing: "text-purple-400",
};

const DIFFICULTY_COLORS = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

export default function UserProfile({ onBack }) {
  const { user, logout } = useAuth();
  const { getUserScores } = useUserScores();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserScores(user.uid)
      .then(setScores)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.uid]);

  const totalScore = scores.reduce((s, c) => s + (c.pointsEarned ?? 0), 0);
  const solved = scores.filter((c) => c.solved).length;
  const byCategory = ["web", "crypto", "reversing"].map((cat) => ({
    cat,
    count: scores.filter((c) => c.category === cat && c.solved).length,
  }));

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e0e0e0] font-mono p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← VOLVER
          </button>
          <button
            onClick={logout}
            className="text-xs text-red-600 hover:text-red-400 transition-colors"
          >
            CERRAR SESIÓN
          </button>
        </header>

        <div className="border border-[#00ff4133] p-4 space-y-1">
          <p className="text-[#00ff41] font-bold text-lg tracking-widest">
            {user.displayName || user.email}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="border border-gray-800 p-3 text-center">
            <p className="text-2xl font-bold text-[#00ff41]">{totalScore}</p>
            <p className="text-xs text-gray-500 mt-1">PUNTOS TOTALES</p>
          </div>
          <div className="border border-gray-800 p-3 text-center">
            <p className="text-2xl font-bold text-[#00ff41]">{solved}</p>
            <p className="text-xs text-gray-500 mt-1">RETOS RESUELTOS</p>
          </div>
          <div className="border border-gray-800 p-3 text-center">
            <p className="text-2xl font-bold text-[#00ff41]">{scores.length}</p>
            <p className="text-xs text-gray-500 mt-1">INTENTADOS</p>
          </div>
        </div>

        <div className="border border-gray-800 p-4 space-y-2">
          <p className="text-xs text-gray-500 tracking-widest mb-3">RETOS POR CATEGORÍA</p>
          {byCategory.map(({ cat, count }) => (
            <div key={cat} className="flex justify-between items-center">
              <span className={`text-xs uppercase tracking-widest ${CATEGORY_COLORS[cat]}`}>
                {cat}
              </span>
              <span className="text-xs text-gray-400">{count} resueltos</span>
            </div>
          ))}
        </div>

        <div className="border border-gray-800 p-4 space-y-3">
          <p className="text-xs text-gray-500 tracking-widest">HISTORIAL</p>

          {loading && (
            <p className="text-xs text-gray-600 animate-pulse">Cargando historial...</p>
          )}

          {!loading && scores.length === 0 && (
            <p className="text-xs text-gray-600">Aún no has intentado ningún reto.</p>
          )}

          {!loading && scores.map((entry) => (
            <div
              key={entry.id}
              className="flex justify-between items-start border-b border-gray-900 pb-2 last:border-0 last:pb-0"
            >
              <div className="space-y-0.5">
                <p className="text-xs text-gray-300">{entry.title}</p>
                <div className="flex gap-2">
                  <span className={`text-[10px] uppercase ${CATEGORY_COLORS[entry.category]}`}>
                    {entry.category}
                  </span>
                  <span className={`text-[10px] uppercase ${DIFFICULTY_COLORS[entry.difficulty]}`}>
                    {entry.difficulty}
                  </span>
                  {entry.hintsUsed > 0 && (
                    <span className="text-[10px] text-gray-600">
                      {entry.hintsUsed} pista{entry.hintsUsed > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-bold ${entry.solved ? "text-[#00ff41]" : "text-red-600"}`}
              >
                {entry.solved ? `+${entry.pointsEarned}` : "✗"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
