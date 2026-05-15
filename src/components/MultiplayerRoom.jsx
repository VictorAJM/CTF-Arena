import { useState, useEffect, useRef } from "react";
import { ref, update, onValue, remove, get, runTransaction } from "firebase/database";
import { rtdb } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { useUserScores } from "../hooks/useUserScores";
import { SCORING } from "../constants/config";
import { generateChallenge } from "../utils/claudeApi";
import {
  buildRoundUpdate,
  normalizeMultiplayerSettings,
  pickRandomChallengeConfig,
  validateMultiplayerSettings,
} from "../utils/multiplayer";
import HintSystem from "./HintSystem";
import FlagValidator from "./FlagValidator";
import ChallengeDescription from "./ChallengeDescription";
import MultiplayerSettings from "./MultiplayerSettings";
import ConfirmDialog from "./ConfirmDialog";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const PLAYER_STATUS = {
  solving: { label: "Resolviendo...", color: "text-yellow-400" },
  solved: { label: "Resuelto", color: "text-[#00ff41]" },
  surrendered: { label: "Se rindio", color: "text-red-500" },
};

function getPlayerStatus(player) {
  if (player.solved) return "solved";
  if (player.surrendered) return "surrendered";
  return "solving";
}

function getTotalPoints(player) {
  const points = Number(player.totalPoints ?? 0);
  return Number.isFinite(points) ? points : 0;
}

function getRoundDelta(player) {
  const points = Number(player.pointsEarned ?? 0);
  return Number.isFinite(points) ? points : 0;
}

function formatDelta(points) {
  return points > 0 ? `+${points}` : "0";
}

function sortPlayers(players) {
  return Object.entries(players).sort(([, a], [, b]) => {
    const totalDiff = getTotalPoints(b) - getTotalPoints(a);
    if (totalDiff !== 0) return totalDiff;

    const deltaDiff = getRoundDelta(b) - getRoundDelta(a);
    if (deltaDiff !== 0) return deltaDiff;

    if (a.solved && b.solved) return (a.solvedAt ?? 0) - (b.solvedAt ?? 0);
    if (a.solved && !b.solved) return -1;
    if (!a.solved && b.solved) return 1;
    if (a.surrendered && !b.surrendered) return 1;
    if (!a.surrendered && b.surrendered) return -1;
    return 0;
  });
}

export default function MultiplayerRoom({
  roomCode,
  challenge: initialChallenge,
  timerEnd: initialTimerEnd,
  roundId: initialRoundId,
  settings: initialSettings,
  isHost = false,
  onExitGroup,
}) {
  const { user } = useAuth();
  const { saveScore } = useUserScores();

  const [activeChallenge, setActiveChallenge] = useState(initialChallenge);
  const [activeTimerEnd, setActiveTimerEnd] = useState(initialTimerEnd);
  const [players, setPlayers] = useState({});
  const [gameStatus, setGameStatus] = useState("playing");
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Math.ceil((initialTimerEnd - Date.now()) / 1000))
  );
  const [roomSettings, setRoomSettings] = useState(
    normalizeMultiplayerSettings(initialSettings)
  );
  const [phase, setPhase] = useState("playing");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [roundLoading, setRoundLoading] = useState(false);
  const [roundError, setRoundError] = useState(null);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  const activeRoundRef = useRef(initialRoundId ?? initialTimerEnd);
  const { base, hintPenalty, minPoints } =
    SCORING[activeChallenge?.difficulty] ?? SCORING.easy;

  useEffect(() => {
    const roomRef = ref(rtdb, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, (snap) => {
      const data = snap.val();
      if (!data) {
        onExitGroup?.();
        return;
      }

      const nextPlayers = data.players ?? {};
      setPlayers(nextPlayers);
      setRoomSettings(normalizeMultiplayerSettings(data.settings));

      if (data.status === "playing" && data.challenge && data.timerEnd) {
        const nextRoundId = data.roundId ?? data.timerEnd;
        const isNewRound = nextRoundId !== activeRoundRef.current;

        setActiveChallenge(data.challenge);
        setActiveTimerEnd(data.timerEnd);
        setTimeLeft(Math.max(0, Math.ceil((data.timerEnd - Date.now()) / 1000)));
        setGameStatus("playing");

        if (isNewRound) {
          activeRoundRef.current = nextRoundId;
          setPhase("playing");
          setHintsUsed(0);
          setRoundError(null);
        }

        const allDone =
          Object.keys(nextPlayers).length > 0 &&
          Object.values(nextPlayers).every((player) => player.solved || player.surrendered);

        if (allDone) {
          update(roomRef, { status: "finished" });
        }
        return;
      }

      if (data.status === "finished") {
        setGameStatus("finished");
      }
    });

    return () => unsub();
  }, [roomCode, onExitGroup]);

  useEffect(() => {
    if (gameStatus !== "playing" || !activeTimerEnd) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeTimerEnd - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        update(ref(rtdb, `rooms/${roomCode}`), { status: "finished" });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimerEnd, gameStatus, roomCode]);

  async function handleSolve() {
    const pointsEarned = Math.max(base - hintsUsed * hintPenalty, minPoints);
    const solvedAt = Date.now();
    const result = await runTransaction(ref(rtdb, `rooms/${roomCode}/players/${user.uid}`), (player) => {
      if (!player || player.solved || player.surrendered) return;

      return {
        ...player,
        solved: true,
        hintsUsed,
        pointsEarned,
        totalPoints: getTotalPoints(player) + pointsEarned,
        solvedAt,
      };
    });

    if (result.committed) {
      saveScore(user.uid, activeChallenge, hintsUsed, true).catch(console.error);
      setPhase("solved");
    }
  }

  async function handleSurrender() {
    const result = await runTransaction(ref(rtdb, `rooms/${roomCode}/players/${user.uid}`), (player) => {
      if (!player || player.solved || player.surrendered) return;

      return {
        ...player,
        surrendered: true,
        hintsUsed,
        pointsEarned: 0,
        totalPoints: getTotalPoints(player),
        solvedAt: null,
      };
    });

    if (result.committed) {
      saveScore(user.uid, activeChallenge, hintsUsed, false).catch(console.error);
      setPhase("surrendered");
    }
  }

  async function handleStartNextRound() {
    setRoundLoading(true);
    setRoundError(null);

    try {
      const roomSnap = await get(ref(rtdb, `rooms/${roomCode}`));
      if (!roomSnap.exists()) throw new Error("room-not-found");
      const room = roomSnap.val();
      const settings = normalizeMultiplayerSettings(room?.settings ?? roomSettings);
      const validation = validateMultiplayerSettings(settings);

      if (!validation.isValid) {
        setRoundError(validation.message);
        return;
      }

      const { category, difficulty } = pickRandomChallengeConfig(settings);
      const nextChallenge = await generateChallenge(category, difficulty);
      const latestRoomSnap = await get(ref(rtdb, `rooms/${roomCode}`));
      if (!latestRoomSnap.exists()) throw new Error("room-not-found");
      const latestPlayers = latestRoomSnap.val()?.players ?? players;

      await update(
        ref(rtdb, `rooms/${roomCode}`),
        buildRoundUpdate(nextChallenge, latestPlayers)
      );
    } catch {
      setRoundError("Error generando el nuevo reto. Intenta de nuevo.");
    } finally {
      setRoundLoading(false);
    }
  }

  async function handleSettingsChange(settings) {
    if (!isHost) return;

    const normalized = normalizeMultiplayerSettings(settings);
    setRoomSettings(normalized);
    setRoundError(null);

    try {
      await update(ref(rtdb, `rooms/${roomCode}`), { settings: normalized });
    } catch {
      setRoundError("Error actualizando la configuracion.");
    }
  }

  async function handleCloseGroup() {
    try {
      await remove(ref(rtdb, `rooms/${roomCode}`));
    } catch {
      // Firebase listener also handles closed rooms.
    }
    onExitGroup?.();
  }

  async function handleExitGroup() {
    try {
      await remove(ref(rtdb, `rooms/${roomCode}/players/${user.uid}`));
    } catch {
      // Ignore exit errors and return the player to the main menu.
    }
    onExitGroup?.();
  }

  const sorted = sortPlayers(players);

  if (!activeChallenge) {
    return (
      <div className="max-w-2xl mx-auto border border-gray-800 p-6 text-center">
        <p className="text-[#00ff41] text-sm tracking-widest animate-pulse">
          SINCRONIZANDO SALA...
        </p>
      </div>
    );
  }

  if (gameStatus === "finished") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[#00ff41] text-sm tracking-widest font-bold">LOBBY DE GRUPO</p>
          <p className="text-xs text-gray-500">Partida finalizada: {activeChallenge.title}</p>
          <p className="text-[10px] text-gray-600 tracking-widest">SALA {roomCode}</p>
        </div>

        <div className="border border-[#00ff4133]">
          <div className="grid grid-cols-[2rem_1fr_5rem_5rem] gap-2 px-4 py-2 border-b border-gray-800 text-xs text-gray-500 tracking-widest">
            <span>#</span>
            <span>JUGADOR</span>
            <span className="text-right">DELTA</span>
            <span className="text-right">TOTAL</span>
          </div>
          {sorted.map(([uid, player], i) => {
            const isMe = uid === user.uid;
            const roundDelta = getRoundDelta(player);
            return (
              <div
                key={uid}
                className={`grid grid-cols-[2rem_1fr_5rem_5rem] gap-2 px-4 py-3 border-b border-gray-900 last:border-0 ${
                  isMe ? "bg-[#00ff4108] border-l-2 border-l-[#00ff41]" : ""
                }`}
              >
                <span className="text-xs text-gray-500">{i + 1}</span>
                <span className={`text-xs truncate ${isMe ? "text-[#00ff41] font-bold" : "text-gray-300"}`}>
                  {player.displayName}{isMe && " (tu)"}
                </span>
                <span className={`text-xs font-bold text-right ${roundDelta > 0 ? "text-[#00ff41]" : "text-gray-600"}`}>
                  {formatDelta(roundDelta)}
                </span>
                <span className="text-xs font-bold text-right text-gray-200">
                  {getTotalPoints(player)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="border border-gray-800 p-4 space-y-2">
          <p className="text-xs text-gray-500 tracking-widest">SOLUCION</p>
          <p className="text-xs text-gray-300 leading-relaxed">{activeChallenge.solution}</p>
          <p className="text-sm text-[#00ff41] font-bold mt-2 border-t border-gray-800 pt-2">
            {activeChallenge.flag}
          </p>
        </div>

        <MultiplayerSettings
          settings={roomSettings}
          isHost={isHost}
          disabled={roundLoading}
          onChange={handleSettingsChange}
        />

        <div className="border border-gray-800 p-4 space-y-3 text-center">
          {isHost ? (
            <>
              <p className="text-xs text-gray-500">
                El grupo sigue activo. Puedes generar otro reto o cerrar la sala para todos.
              </p>
              {roundError && <p className="text-red-400 text-xs">{roundError}</p>}
              <button
                onClick={handleStartNextRound}
                disabled={roundLoading}
                className="w-full py-3 bg-[#00ff41] text-black font-bold tracking-widest hover:bg-[#00cc33] transition-colors disabled:opacity-50"
              >
                {roundLoading ? "GENERANDO RETO..." : "GENERAR NUEVO RETO"}
              </button>
              <button
                onClick={() => setConfirmLeaveOpen(true)}
                disabled={roundLoading}
                className="w-full text-xs text-gray-600 hover:text-red-500 transition-colors py-2 disabled:opacity-50"
              >
                CERRAR GRUPO
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500 animate-pulse tracking-widest">
                ESPERANDO NUEVO RETO DEL HOST...
              </p>
              <button
                onClick={() => setConfirmLeaveOpen(true)}
                className="w-full text-xs text-gray-600 hover:text-red-500 transition-colors py-2"
              >
                SALIR DEL GRUPO
              </button>
            </>
          )}
        </div>

        <ConfirmDialog
          open={confirmLeaveOpen}
          title={isHost ? "¿Cerrar grupo?" : "¿Salir del grupo?"}
          message={
            isHost
              ? "Cerrar el grupo finalizará la sesión para el resto de los jugadores."
              : "¿Estás seguro que quieres salir del grupo?"
          }
          confirmDisabled={roundLoading}
          onConfirm={isHost ? handleCloseGroup : handleExitGroup}
          onCancel={() => setConfirmLeaveOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border border-gray-800 px-4 py-2">
        <div>
          <p className="text-xs text-gray-500">
            [{activeChallenge.category.toUpperCase()}] [{activeChallenge.difficulty.toUpperCase()}]
            {" - "}{activeChallenge.points} pts base
          </p>
          <p className="text-sm text-[#00ff41] font-bold">{activeChallenge.title}</p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-[#00ff41]"}`}>
            {formatTime(timeLeft)}
          </p>
          <p className="text-[10px] text-gray-600 tracking-widest">SALA {roomCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-gray-800 p-4 space-y-4">
          <ChallengeDescription description={activeChallenge.description} />

          {phase === "playing" && (
            <>
              <HintSystem
                hints={activeChallenge.hints}
                penalty={hintPenalty}
                onHintUsed={() => setHintsUsed((n) => n + 1)}
              />
              <FlagValidator correctFlag={activeChallenge.flag} onSuccess={handleSolve} />
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
              FLAG CORRECTO - ESPERANDO A LOS DEMAS
            </p>
          )}

          {phase === "surrendered" && (
            <div className="text-center py-6 space-y-1">
              <p className="text-red-500 text-sm tracking-widest">TE RENDISTE</p>
              <p className="text-xs text-gray-600">Esperando que termine la partida...</p>
            </div>
          )}
        </div>

        <div className="border border-gray-800 p-4 space-y-1">
          <p className="text-xs text-gray-500 tracking-widest mb-3">RANKING EN VIVO</p>
          {sorted.map(([uid, player], i) => {
            const isMe = uid === user.uid;
            const { label, color } = PLAYER_STATUS[getPlayerStatus(player)];
            return (
              <div
                key={uid}
                className={`py-2 border-b border-gray-900 last:border-0 ${
                  isMe ? "border-l-2 border-l-[#00ff41] pl-2" : ""
                }`}
              >
                <div className="flex justify-between">
                  <span className={`text-xs ${isMe ? "text-[#00ff41] font-bold" : "text-gray-300"}`}>
                    {i + 1}. {player.displayName}
                  </span>
                  <span className="text-xs font-bold text-gray-200">
                    {getTotalPoints(player)}
                  </span>
                </div>
                <p className={`text-[10px] mt-0.5 ${color}`}>
                  {label} - Delta {formatDelta(getRoundDelta(player))}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
