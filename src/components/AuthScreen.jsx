import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const FIREBASE_ERRORS = {
  "auth/email-already-in-use": "El correo ya está registrado.",
  "auth/invalid-email": "Correo inválido.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/user-not-found": "No existe una cuenta con ese correo.",
  "auth/wrong-password": "Contraseña incorrecta.",
  "auth/invalid-credential": "Credenciales inválidas.",
  "auth/popup-closed-by-user": "Cerraste el popup de Google antes de terminar.",
};

export default function AuthScreen() {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!displayName.trim()) {
          setError("El nombre de usuario es requerido.");
          setLoading(false);
          return;
        }
        await register(email, password, displayName.trim());
      }
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || "Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || "Error al iniciar con Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e0e0e0] font-mono flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#00ff41] tracking-widest">
            {">>> CTF ARENA <<<"}
          </h1>
          <p className="text-xs text-gray-500 mt-1">AI-powered Capture The Flag</p>
        </div>

        <div className="border border-[#00ff4133] p-6 space-y-5">
          <div className="flex border border-gray-700">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-2 text-xs tracking-widest transition-colors ${
                mode === "login"
                  ? "bg-[#00ff41] text-black font-bold"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              INICIAR SESIÓN
            </button>
            <button
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 py-2 text-xs tracking-widest transition-colors ${
                mode === "register"
                  ? "bg-[#00ff41] text-black font-bold"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              REGISTRARSE
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="text-xs text-gray-500 tracking-widest block mb-1">
                  NOMBRE DE USUARIO
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="h4ck3r_name"
                  className="w-full bg-[#0d0d0d] border border-gray-700 text-[#e0e0e0] px-3 py-2 text-sm focus:outline-none focus:border-[#00ff41] transition-colors"
                  autoComplete="username"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 tracking-widest block mb-1">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@ctf.local"
                className="w-full bg-[#0d0d0d] border border-gray-700 text-[#e0e0e0] px-3 py-2 text-sm focus:outline-none focus:border-[#00ff41] transition-colors"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 tracking-widest block mb-1">
                CONTRASEÑA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0d0d0d] border border-gray-700 text-[#e0e0e0] px-3 py-2 text-sm focus:outline-none focus:border-[#00ff41] transition-colors"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs border border-red-900 px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#00ff41] text-black font-bold text-sm tracking-widest hover:bg-[#00cc33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "PROCESANDO..." : mode === "login" ? "ENTRAR" : "CREAR CUENTA"}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-800" />
            <span className="text-xs text-gray-600">O</span>
            <div className="flex-1 border-t border-gray-800" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-2 border border-gray-700 text-sm text-gray-300 hover:border-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>G</span>
            <span>Continuar con Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
