import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import AuthScreen from "./components/AuthScreen";
import CategorySelector from "./components/CategorySelector";
import DifficultySelector from "./components/DifficultySelector";
import ChallengeCard from "./components/ChallengeCard";
import UserProfile from "./components/UserProfile";

export default function App() {
  const { user, loading, logout } = useAuth();
  const [screen, setScreen] = useState("home"); // "home" | "profile"
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

  if (screen === "profile") {
    return <UserProfile onBack={() => setScreen("home")} />;
  }

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScreen("profile")}
            className="text-xs text-gray-400 hover:text-[#00ff41] transition-colors tracking-widest"
          >
            {user.displayName || user.email.split("@")[0]}
          </button>
          <button
            onClick={logout}
            className="text-xs text-gray-600 hover:text-red-500 transition-colors"
          >
            SALIR
          </button>
        </div>
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
