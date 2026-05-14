import { useState, useEffect } from "react";
import { ref, update, onValue } from "firebase/database";
import { rtdb } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { useUserScores } from "../hooks/useUserScores";
import { SCORING } from "../constants/config";
import HintSystem from "./HintSystem";
import FlagValidator from "./FlagValidator";
import ChallengeDescription from "./ChallengeDescription";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const PLAYER_STATUS = {
  solving:    { label: "Resolviendo...", color: "text-yellow-400" },
  solved:     { label: "✓ Resuelto",    color: "text-[#00ff41]"  },
  surrendered:{ label: "✗ Se rindió",   color: "text-red-500"    },
};

function getPlayerStatus(p) {
  if (p.solved) return "solved";
  if (p.surrendered) return "surrendered";
  return "solving";
}

function sortPlayers(players) {
  return Object.entries(players).sort(([, a], [, b]) => {
    // Solved players first, ordered by solve time
    if (a.solved && !b.solved) return -1;
    if (!a.solved && b.solved) return 1;
    if (a.solved && b.solved) return a.solvedAt - b.solvedAt;
    // Surrendered last
    if (a.surrendered && !b.surrendered) return 1;
    if (!a.surrendered && b.surrendered) return -1;
    return 0;
  });
}

export default function MultiplayerRoom({ roomCode, challenge, timerEnd, onFinished }) {
  const { user } = useAuth();
  const { saveScore } = useUserScores();

  const { base, hintPenalty, minPoints } = SCORING[challenge.difficulty];

  const [players, setPlayers] = useState({});
  const [gameStatus, setGameStatus] = useState("playing");
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000))
  );
  const [phase, setPhase] = useState("playing"); // "playing" | "solved" | "surrendered"
  const [hintsUsed, setHintsUsed] = useState(0);

  // Sync room state in real-time
  useEffect(() => {
    const unsub = onValue(ref(rtdb, `rooms/${roomCode}`), (snap) => {
      const data = snap.val();
      if (!data) return;

      const ps = data.players ?? {};
      setPlayers(ps);

      if (data.status === "finished") {
        setGameStatus("finished");
        return;
      }

      // Auto-finish when every player is done
      const allDone = Object.values(ps).every((p) => p.solved || p.surrendered);
      if (allDone && data.status === "playing") {
        update(ref(rtdb, `rooms/${roomCode}`), { status: "finished" });
      }
    });
    return () => unsub();
  }, [roomCode]);

  // Countdown timer
  useEffect(() => {
    if (gameStatus === "finished") return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        update(ref(rtdb, `rooms/${roomCode}`), { status: "finished" });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerEnd, gameStatus, roomCode]);

  async function handleSolve() {
    const pointsEarned = Math.max(base - hintsUsed * hintPenalty, minPoints);
    await update(ref(rtdb, `rooms/${roomCode}/players/${user.uid}`), {
      solved: true,
      hintsUsed,
      pointsEarned,
      solvedAt: Date.now(),
    });
    saveScore(user.uid, challenge, hintsUsed, true).catch(console.error);
    setPhase("solved");
  }

  async function handleSurrender() {
    await update(ref(rtdb, `rooms/${roomCode}/players/${user.uid}`), {
      surrendered: true,
      hintsUsed,
      pointsEarned: 0,
      solvedAt: null,
    });
    saveScore(user.uid, challenge, hintsUsed, false).catch(console.error);
    setPhase("surrendered");
  }

  const sorted = sortPlayers(players);

  // ── FINISHED SCREEN ──────────────────────────────────────────
  if (gameStatus === "finished") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <p className="text-[#00ff41] text-sm tracking-widest font-bold">PARTIDA FINALIZADA</p>
          <p className="text-xs text-gray-500 mt-1">{challenge.title}</p>
        </div>

        {/* Final ranking */}
        <div className="border border-[#00ff4133]">
          <div className="grid grid-cols-[2rem_1fr_7rem_5rem] gap-2 px-4 py-2 border-b border-gray-800 text-xs text-gray-500 tracking-widest">
            <span>#</span>
            <span>JUGADOR</span>
            <span className="text-right">ESTADO</span>
            <span className="text-right">PUNTOS</span>
          </div>
          {sorted.map(([uid, p], i) => {
            const isMe = uid === user.uid;
            const { label, color } = PLAYER_STATUS[getPlayerStatus(p)];
            return (
              <div
                key={uid}
                className={`grid grid-cols-[2rem_1fr_7rem_5rem] gap-2 px-4 py-3 border-b border-gray-900 last:border-0 ${
                  isMe ? "bg-[#00ff4108] border-l-2 border-l-[#00ff41]" : ""
                }`}
              >
                <span className="text-xs text-gray-500">{i + 1}</span>
                <span className={`text-xs truncate ${isMe ? "text-[#00ff41] font-bold" : "text-gray-300"}`}>
                  {p.displayName}{isMe && " (tú)"}
                </span>
                <span className={`text-xs text-right ${color}`}>{label}</span>
                <span className={`text-xs font-bold text-right ${p.solved ? "text-[#00ff41]" : "text-gray-600"}`}>
                  {p.pointsEarned > 0 ? `+${p.pointsEarned}` : "0"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Solution */}
        <div className="border border-gray-800 p-4 space-y-2">
          <p className="text-xs text-gray-500 tracking-widest">SOLUCIÓN</p>
          <p className="text-xs text-gray-300 leading-relaxed">{challenge.solution}</p>
          <p className="text-sm text-[#00ff41] font-bold mt-2 border-t border-gray-800 pt-2">
            {challenge.flag}
          </p>
        </div>

        <button
          onClick={onFinished}
          className="w-full py-3 bg-[#00ff41] text-black font-bold tracking-widest hover:bg-[#00cc33] transition-colors"
        >
          VOLVER AL LOBBY
        </button>
      </div>
    );
  }

  // ── PLAYING SCREEN ───────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex justify-between items-center border border-gray-800 px-4 py-2">
        <div>
          <p className="text-xs text-gray-500">
            [{challenge.category.toUpperCase()}] [{challenge.difficulty.toUpperCase()}]
            {" · "}{challenge.points} pts base
          </p>
          <p className="text-sm text-[#00ff41] font-bold">{challenge.title}</p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-[#00ff41]"}`}>
            {formatTime(timeLeft)}
          </p>
          <p className="text-[10px] text-gray-600 tracking-widest">SALA {roomCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Challenge + interaction */}
        <div className="lg:col-span-2 border border-gray-800 p-4 space-y-4">
          <ChallengeDescription description={challenge.description} />

          {phase === "playing" && (
            <>
              <HintSystem
                hints={challenge.hints}
                penalty={hintPenalty}
                onHintUsed={() => setHintsUsed((n) => n + 1)}
              />
              <FlagValidator
                correctFlag={challenge.flag}
                onSuccess={handleSolve}
              />
              <button
                onClick={handleSurrender}
                className="text-xs text-gray-600 hover:text-red-500 transition-colors underline"
              >
                Rendirse
              </button>
            </>
          )}

          {phase === "solved" && (
            <p className="text-[#00ff41] text-sm font-bold tracking-widest text-center py-6">
              ✓ FLAG CORRECTO — ESPERANDO A LOS DEMÁS
            </p>
          )}

          {phase === "surrendered" && (
            <div className="text-center py-6 space-y-1">
              <p className="text-red-500 text-sm tracking-widest">✗ TE RENDISTE</p>
              <p className="text-xs text-gray-600">Esperando que termine la partida...</p>
            </div>
          )}
        </div>

        {/* Live ranking sidebar */}
        <div className="border border-gray-800 p-4 space-y-1">
          <p className="text-xs text-gray-500 tracking-widest mb-3">RANKING EN VIVO</p>
          {sorted.map(([uid, p], i) => {
            const isMe = uid === user.uid;
            const { label, color } = PLAYER_STATUS[getPlayerStatus(p)];
            return (
              <div
                key={uid}
                className={`py-2 border-b border-gray-900 last:border-0 ${
                  isMe ? "border-l-2 border-l-[#00ff41] pl-2" : ""
                }`}
              >
                <div className="flex justify-between">
                  <span className={`text-xs ${isMe ? "text-[#00ff41] font-bold" : "text-gray-300"}`}>
                    {i + 1}. {p.displayName}
                  </span>
                  <span className={`text-xs font-bold ${p.solved ? "text-[#00ff41]" : "text-gray-600"}`}>
                    {p.solved ? `+${p.pointsEarned}` : "—"}
                  </span>
                </div>
                <p className={`text-[10px] mt-0.5 ${color}`}>{label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
