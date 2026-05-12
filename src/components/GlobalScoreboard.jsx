import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function GlobalScoreboard({ onBack }) {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      orderBy("totalScore", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setPlayers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
          <h2 className="text-sm text-[#00ff41] tracking-widest">RANKING GLOBAL</h2>
          <div className="w-12" />
        </header>

        <div className="border border-[#00ff4133]">
          <div className="grid grid-cols-[2rem_1fr_6rem_5rem] gap-2 px-4 py-2 border-b border-gray-800 text-xs text-gray-500 tracking-widest">
            <span>#</span>
            <span>JUGADOR</span>
            <span className="text-right">RESUELTOS</span>
            <span className="text-right">PUNTOS</span>
          </div>

          {loading && (
            <p className="text-xs text-gray-600 animate-pulse px-4 py-6 text-center">
              Cargando ranking...
            </p>
          )}

          {!loading && players.length === 0 && (
            <p className="text-xs text-gray-600 px-4 py-6 text-center">
              Aún no hay jugadores registrados.
            </p>
          )}

          {players.map((player, i) => {
            const isMe = user && player.uid === user.uid;
            return (
              <div
                key={player.uid}
                className={`grid grid-cols-[2rem_1fr_6rem_5rem] gap-2 px-4 py-3 border-b border-gray-900 last:border-0 transition-colors ${
                  isMe ? "bg-[#00ff4108] border-l-2 border-l-[#00ff41]" : ""
                }`}
              >
                <span className="text-xs text-gray-500">
                  {MEDALS[i] ?? <span className="text-gray-600">{i + 1}</span>}
                </span>

                <span className={`text-xs truncate ${isMe ? "text-[#00ff41] font-bold" : "text-gray-300"}`}>
                  {player.displayName || player.email?.split("@")[0] || "anon"}
                  {isMe && <span className="text-gray-600 ml-1">(tú)</span>}
                </span>

                <span className="text-xs text-gray-400 text-right">
                  {player.solvedCount ?? "—"}
                </span>

                <span className={`text-xs font-bold text-right ${isMe ? "text-[#00ff41]" : "text-gray-300"}`}>
                  {player.totalScore ?? 0}
                </span>
              </div>
            );
          })}
        </div>

        {!loading && players.length === 50 && (
          <p className="text-xs text-gray-600 text-center">Mostrando top 50</p>
        )}
      </div>
    </div>
  );
}
