import { useState, useCallback } from "react";
import { generateChallenge } from "../utils/claudeApi";

export function useChallenge() {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchChallenge = useCallback(async (category, difficulty) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateChallenge(category, difficulty);
      setChallenge(data);
    } catch (err) {
      setError(err.message || "Error generando el reto. ¿Revisaste la API key?");
    } finally {
      setLoading(false);
    }
  }, []);

  return { challenge, loading, error, fetchChallenge };
}
