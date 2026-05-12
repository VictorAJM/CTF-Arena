import { buildPrompt } from "./promptBuilder";
import { getFallbackChallenge } from "./fallbackLoader";

const MAX_RETRIES = 2;

async function fetchFromClaude(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  const text = data.content[0].text;
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function generateChallenge(category, difficulty) {
  const prompt = buildPrompt(category, difficulty);
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fetchFromClaude(prompt);
    } catch (err) {
      lastError = err;
      console.warn(`Intento ${attempt + 1} fallido:`, err.message);
    }
  }

  console.error("Todos los intentos fallaron, usando fallback:", lastError);
  const fallback = getFallbackChallenge(category, difficulty);
  if (fallback) return fallback;
  throw new Error("No se pudo generar el reto. Verifica tu API key.");
}
