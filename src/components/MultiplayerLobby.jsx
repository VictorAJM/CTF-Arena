import { useState, useEffect, useRef } from "react";
import { ref, set, get, update, onValue, remove, onDisconnect } from "firebase/database";
import { rtdb } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { generateChallenge } from "../utils/claudeApi";

const TIMER_DURATION_MS = 5 * 60 * 1000;

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function makePlayerEntry(user) {
  return {
    displayName: user.displayName || user.email.split("@")[0],
    solved: false,
    surrendered: false,
    pointsEarned: 0,
    hintsUsed: 0,
    solvedAt: null,
  };
}

export default function MultiplayerLobby({ onGameStart, onBack }) {
  const { user } = useAuth();
  const [view, setView] = useState("select"); // "select" | "waiting"
  const [roomCode, setRoomCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [roomData, setRoomData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  // Ref to read isHost inside onValue closure without stale state
  const isHostRef = useRef(false);

  useEffect(() => {
    if (view !== "waiting" || !roomCode) return;

    const unsub = onValue(ref(rtdb, `rooms/${roomCode}`), (snap) => {
      const data = snap.val();
      if (!data) { onBack(); return; }
      setRoomData(data);
      if (data.status === "playing") {
        onGameStart({
          roomCode,
          challenge: data.challenge,
          timerEnd: data.timerEnd,
          isHost: isHostRef.current,
        });
      }
    });

    return () => unsub();
  }, [view, roomCode]);

  async function handleCreate() {
    setError(null);
    setLoading(true);
    const code = generateCode();
    try {
      await set(ref(rtdb, `rooms/${code}`), {
        hostUid: user.uid,
        status: "waiting",
        createdAt: Date.now(),
        challenge: null,
        timerEnd: null,
        players: { [user.uid]: makePlayerEntry(user) },
      });
      // Remove whole room when host disconnects
      onDisconnect(ref(rtdb, `rooms/${code}`)).remove();

      isHostRef.current = true;
      setIsHost(true);
      setRoomCode(code);
      setView("waiting");
    } catch {
      setError("Error creando la sala. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    setError(null);
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 6) { setError("El código debe tener 6 caracteres."); return; }

    setLoading(true);
    try {
      const snap = await get(ref(rtdb, `rooms/${code}`));
      if (!snap.exists()) { setError("Sala no encontrada."); return; }
      const data = snap.val();
      if (data.status !== "waiting") { setError("La partida ya comenzó."); return; }

      const playerRef = ref(rtdb, `rooms/${code}/players/${user.uid}`);
      await set(playerRef, makePlayerEntry(user));
      // Remove player entry on disconnect
      onDisconnect(playerRef).remove();

      isHostRef.current = false;
      setIsHost(false);
      setRoomCode(code);
      setView("waiting");
    } catch {
      setError("Error uniéndose. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const categories = ["web", "crypto", "reversing"];
      const difficulties = ["easy", "medium", "hard"];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      const challenge = await generateChallenge(category, difficulty);

      await update(ref(rtdb, `rooms/${roomCode}`), {
        status: "playing",
        challenge,
        timerEnd: Date.now() + TIMER_DURATION_MS,
      });
      // onGameStart fires via onValue listener
    } catch {
      setError("Error generando el reto. Intenta de nuevo.");
      setLoading(false);
    }
  }

  async function handleLeave() {
    try {
      if (isHost) {
        await remove(ref(rtdb, `rooms/${roomCode}`));
      } else {
        await remove(ref(rtdb, `rooms/${roomCode}/players/${user.uid}`));
      }
    } catch { /* ignore */ }
    onBack();
  }

  // ── SELECT VIEW ──────────────────────────────────────────────
  if (view === "select") {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[#00ff41] text-sm tracking-widest font-bold">MODO MULTIJUGADOR</p>
          <p className="text-xs text-gray-500">Compite en tiempo real contra otros jugadores</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3 bg-[#00ff41] text-black font-bold tracking-widest hover:bg-[#00cc33] transition-colors disabled:opacity-50"
          >
            {loading ? "CREANDO SALA..." : "CREAR SALA"}
          </button>

          <div className="border border-gray-800 p-4 space-y-3">
            <p className="text-xs text-gray-500 tracking-widest">UNIRSE CON CÓDIGO</p>
            <input
              type="text"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              className="w-full bg-[#0d0d0d] border border-gray-700 text-[#00ff41] px-3 py-2 text-center tracking-[0.5em] text-lg font-bold focus:outline-none focus:border-[#00ff41] uppercase"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading || joinInput.length < 6}
              className="w-full py-2 border border-[#00ff41] text-[#00ff41] text-sm tracking-widest hover:bg-[#00ff4111] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "UNIÉNDOSE..." : "UNIRSE"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── WAITING ROOM ─────────────────────────────────────────────
  const players = roomData?.players ?? {};
  const playerList = Object.entries(players);
  const hostUid = roomData?.hostUid;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="border border-[#00ff4133] p-6 text-center space-y-2">
        <p className="text-xs text-gray-500 tracking-widest">CÓDIGO DE SALA</p>
        <p className="text-5xl font-bold text-[#00ff41] tracking-[0.5em]">{roomCode}</p>
        <p className="text-xs text-gray-600">Comparte este código con tus compañeros</p>
      </div>

      <div className="border border-gray-800 p-4 space-y-2">
        <p className="text-xs text-gray-500 tracking-widest mb-3">
          JUGADORES ({playerList.length})
        </p>
        {playerList.map(([uid, p]) => (
          <div key={uid} className="flex items-center justify-between py-1">
            <span className={`text-xs ${uid === user.uid ? "text-[#00ff41]" : "text-gray-300"}`}>
              {p.displayName}
              {uid === user.uid && <span className="text-gray-600 ml-1">(tú)</span>}
            </span>
            {uid === hostUid && (
              <span className="text-[10px] text-[#00ff41] border border-[#00ff4144] px-1.5 py-0.5">
                HOST
              </span>
            )}
          </div>
        ))}
        {isHost && playerList.length < 2 && (
          <p className="text-xs text-gray-600 mt-2 border-t border-gray-900 pt-2">
            Puedes iniciar solo o esperar más jugadores.
          </p>
        )}
      </div>

      {error && <p className="text-red-400 text-xs text-center">{error}</p>}

      <div className="space-y-2">
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-3 bg-[#00ff41] text-black font-bold tracking-widest hover:bg-[#00cc33] transition-colors disabled:opacity-50"
          >
            {loading ? "GENERANDO RETO..." : "INICIAR PARTIDA"}
          </button>
        ) : (
          <p className="text-xs text-gray-500 text-center animate-pulse tracking-widest py-3">
            ESPERANDO AL HOST...
          </p>
        )}
        <button
          onClick={handleLeave}
          disabled={loading}
          className="w-full text-xs text-gray-600 hover:text-red-500 transition-colors py-2"
        >
          ABANDONAR SALA
        </button>
      </div>
    </div>
  );
}
