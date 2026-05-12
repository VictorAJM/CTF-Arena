import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import AuthScreen from "./components/AuthScreen";
import CategorySelector from "./components/CategorySelector";
import DifficultySelector from "./components/DifficultySelector";
import ChallengeCard from "./components/ChallengeCard";
import UserProfile from "./components/UserProfile";
import GlobalScoreboard from "./components/GlobalScoreboard";

const NAV = [
  { id: "home", label: "JUGAR" },
  { id: "ranking", label: "RANKING" },
  { id: "profile", label: "PERFIL" },
];

export default function App() {
  const { user, loading, logout } = useAuth();
  const [screen, setScreen] = useState("home");
  const [category, setCategory] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center font-mono">
        <p className="text-[#00ff41] tracking-widest animate-pulse">INICIANDO...</p>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  if (screen === "profile") return <UserProfile onBack={() => setScreen("home")} />;
  if (screen === "ranking") return <GlobalScoreboard onBack={() => setScreen("home")} />;

  function handleStart() {
    if (category && difficulty) setGameStarted(true);
  }

  function handleReset() {
    setCategory(null);
    setDifficulty(null);
    setGameStarted(false);
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e0e0e0] font-mono p-4">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#00ff41] tracking-widest">
            {">>> CTF ARENA <<<"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">AI-powered Capture The Flag</p>
        </div>

        <nav className="flex items-center gap-1">
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { setScreen(id); if (id === "home") handleReset(); }}
              className={`px-3 py-1.5 text-xs tracking-widest transition-colors ${
                screen === id
                  ? "bg-[#00ff41] text-black font-bold"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={logout}
            className="ml-3 text-xs text-gray-600 hover:text-red-500 transition-colors"
          >
            SALIR
          </button>
        </nav>
      </header>

      {!gameStarted ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <CategorySelector selected={category} onSelect={setCategory} />
          <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
          {category && difficulty && (
            <button
              onClick={handleStart}
              className="w-full py-3 bg-[#00ff41] text-black font-bold tracking-widest hover:bg-[#00cc33] transition-colors"
            >
              INICIAR RETO
            </button>
          )}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          <ChallengeCard
            category={category}
            difficulty={difficulty}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}
