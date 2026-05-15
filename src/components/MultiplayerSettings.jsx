import {
  MULTIPLAYER_CHALLENGE_CATEGORIES,
  MULTIPLAYER_DIFFICULTIES,
  normalizeMultiplayerSettings,
  validateMultiplayerSettings,
} from "../utils/multiplayer";

const DIFFICULTY_COLORS = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

/**
 * Panel para configurar las categorias y dificultades permitidas en multijugador.
 * @param {{ settings?: object, isHost: boolean, disabled?: boolean, onChange?: (settings: object) => void }} props
 */
export default function MultiplayerSettings({
  settings,
  isHost,
  disabled = false,
  onChange,
}) {
  const normalized = normalizeMultiplayerSettings(settings);
  const validation = validateMultiplayerSettings(normalized);
  const canEdit = isHost && !disabled;

  function updateCategory(categoryId) {
    if (!canEdit) return;

    const next = normalizeMultiplayerSettings(normalized);
    next.challengePool[categoryId].enabled = !next.challengePool[categoryId].enabled;
    onChange?.(next);
  }

  function updateDifficulty(categoryId, difficultyId) {
    if (!canEdit || !normalized.challengePool[categoryId].enabled) return;

    const next = normalizeMultiplayerSettings(normalized);
    next.challengePool[categoryId].difficulties[difficultyId] =
      !next.challengePool[categoryId].difficulties[difficultyId];
    onChange?.(next);
  }

  return (
    <div className="border border-gray-800 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500 tracking-widest">CONFIGURACION DE RETOS</p>
          <p className="text-[10px] text-gray-600 mt-1">
            {isHost
              ? "Selecciona categorias y dificultades para las siguientes rondas."
              : "Solo el host puede modificar estos parametros."}
          </p>
        </div>
        {isHost && (
          <span className="text-[10px] text-[#00ff41] border border-[#00ff4144] px-2 py-1 tracking-widest">
            HOST
          </span>
        )}
      </div>

      <div className="space-y-3">
        {MULTIPLAYER_CHALLENGE_CATEGORIES.map((category) => {
          const categorySettings = normalized.challengePool[category.id];
          const enabled = categorySettings.enabled;

          return (
            <div
              key={category.id}
              className={`border p-3 space-y-3 transition-colors ${
                enabled ? "border-[#00ff4133] bg-[#00ff4108]" : "border-gray-800"
              }`}
            >
              <label className={`flex items-start gap-3 ${canEdit ? "cursor-pointer" : ""}`}>
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={!canEdit}
                  onChange={() => updateCategory(category.id)}
                  className="mt-1 h-4 w-4 accent-[#00ff41] disabled:opacity-50"
                />
                <span className="min-w-0">
                  <span className={`block text-sm font-bold ${enabled ? "text-[#00ff41]" : "text-gray-500"}`}>
                    {category.label}
                  </span>
                  <span className="block text-xs text-gray-600 mt-0.5">
                    {category.description}
                  </span>
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {MULTIPLAYER_DIFFICULTIES.map((difficulty) => {
                  const selected = categorySettings.difficulties[difficulty.id];
                  const active = enabled && selected;

                  return (
                    <button
                      key={difficulty.id}
                      type="button"
                      onClick={() => updateDifficulty(category.id, difficulty.id)}
                      disabled={!canEdit || !enabled}
                      aria-pressed={active}
                      className={`border px-2 py-2 text-xs font-bold transition-colors ${
                        active
                          ? "border-[#00ff41] bg-[#00ff4110]"
                          : "border-gray-700 text-gray-600"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <span className={active ? DIFFICULTY_COLORS[difficulty.id] : ""}>
                        {difficulty.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!validation.isValid && (
        <p className="text-xs text-red-400 border-t border-gray-900 pt-3">
          {validation.message}
        </p>
      )}
    </div>
  );
}
