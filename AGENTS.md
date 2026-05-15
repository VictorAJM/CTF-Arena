# AGENTS.md — CTF Challenge Builder

> Este archivo le da contexto a Codex (o cualquier AI assistant) sobre el proyecto para que pueda ayudar de forma efectiva en el desarrollo.

---

## ¿Qué es este proyecto?

**CTF Challenge Builder** es una aplicación web React que usa la API de Anthropic Codex para generar dinámicamente retos de Capture The Flag en las categorías: Web Exploitation, Cryptography y Reverse Engineering.

La app es un **single-page application** sin backend propio. Toda la lógica de generación de retos ocurre via llamadas directas a la Anthropic API desde el frontend.

---

## Stack

- **Framework:** React 18 (Vite)
- **Estilos:** Tailwind CSS v3
- **AI:** Anthropic Codex API (`Codex-sonnet-4-20250514`)
- **Estado:** React hooks (`useState`, `useReducer`)
- **Deploy:** Vercel

---

## Estructura del proyecto

```
ctf-challenge-builder/
├── src/
│   ├── components/
│   │   ├── CategorySelector.jsx     # Selección de categoría (Web/Crypto/Reversing)
│   │   ├── DifficultySelector.jsx   # Selección de dificultad (Fácil/Medio/Difícil)
│   │   ├── ChallengeCard.jsx        # Pantalla principal del reto
│   │   ├── HintSystem.jsx           # Sistema de pistas progresivas
│   │   ├── FlagValidator.jsx        # Input y validación del flag
│   │   ├── SolutionViewer.jsx       # Solución detallada post-reto
│   │   └── Scoreboard.jsx           # Score acumulado de la sesión
│   ├── hooks/
│   │   ├── useChallenge.js          # Lógica de generación y estado del reto
│   │   └── useScore.js              # Lógica de puntuación
│   ├── utils/
│   │   ├── claudeApi.js             # Wrapper de la Anthropic API (con tool calling y caching)
│   │   ├── cryptoTools.js           # Herramientas criptográficas locales para Codex
│   │   ├── promptBuilder.js         # Construcción del prompt por categoría/dificultad
│   │   └── flagValidator.js         # Normalización y comparación del flag
│   ├── constants/
│   │   └── config.js                # Puntos, penalizaciones, configuración global
│   ├── App.jsx
│   └── main.jsx
├── AGENTS.md                        # Este archivo
├── PROJECT_PLAN.md
├── .env.local                       # ANTHROPIC_API_KEY (nunca commitear)
└── package.json
```

---

## Variables de entorno

```bash
# .env.local
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

> ⚠️ **Nunca commitear `.env.local`**. Está en `.gitignore`. Para el deploy en Vercel, agregar la variable en el dashboard de Environment Variables.

---

## Llamada a la API de Codex

Toda la integración está en `src/utils/claudeApi.js`:

```javascript
// src/utils/claudeApi.js (Resumido)
import { buildPrompt } from "./promptBuilder";
import { CRYPTO_TOOLS_DEF, executeCryptoTool } from "./cryptoTools";

async function fetchFromClaude(category, difficulty) {
  const { systemPrompt, userPrompt } = buildPrompt(category, difficulty);
  const tools = category === "crypto" ? CRYPTO_TOOLS_DEF : undefined;
  
  let messages = [{ role: "user", content: userPrompt }];
  
  // Loop para soportar uso de herramientas
  for (let loop = 0; loop < 5; loop++) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "Codex-sonnet-4-20250514",
        max_tokens: 1024,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        tools,
        messages,
      }),
    });

    const data = await response.json();
    messages.push({ role: "assistant", content: data.content });

    if (data.stop_reason === "tool_use") {
      // Ejecutar herramienta local (ej. cifrado o hash) y devolver "tool_result"
      const toolResults = procesarHerramientasLocales(data.content);
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Retornar JSON parseado
    const textBlock = data.content.find(c => c.type === "text");
    return JSON.parse(textBlock.text.replace(/```json|```/g, "").trim());
  }
}
```

---

## Estructura del JSON que genera Codex

Codex **siempre debe devolver exactamente este JSON** y nada más:

```json
{
  "title": "Título del reto",
  "category": "web | crypto | reversing",
  "difficulty": "easy | medium | hard",
  "description": "Enunciado detallado del reto. Debe incluir contexto realista.",
  "flag": "FLAG{flag_unica_aqui}",
  "hints": [
    "Pista 1: vaga, solo orienta la dirección",
    "Pista 2: más específica, reduce el espacio de búsqueda",
    "Pista 3: casi la solución, solo falta el paso final"
  ],
  "solution": "Explicación completa paso a paso de cómo resolver el reto, incluyendo el concepto de seguridad que ilustra.",
  "points": 100
}
```

**Reglas del flag:**
- Siempre formato `FLAG{...}`
- Usar guiones bajos en lugar de espacios
- Relacionado con la técnica del reto (ej. `FLAG{sql_bypass_r00t}`)
- Sin caracteres especiales que rompan JSON

---

## Prompt Engineering

El prompt base está en `src/utils/promptBuilder.js`:

```javascript
export function buildPrompt(category, difficulty) {
  const categoryDescriptions = {
    web: "Web Exploitation (SQL Injection, XSS, IDOR, Path Traversal, Command Injection)",
    crypto: "Cryptography (Caesar, Base64, XOR, Vigenère, hash cracking con diccionario simple)",
    reversing: "Reverse Engineering (análisis de pseudocódigo, algoritmos ofuscados, decodificación de patrones)",
  };

  const points = pointsMap[difficulty];

  const systemPrompt = `Eres un experto en ciberseguridad y CTF (Capture The Flag).
Tu objetivo es generar retos CTF de alta calidad.

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.
2. El flag SIEMPRE debe tener el formato FLAG{...} con contenido relacionado al reto.
// ... (otras reglas) ...
${category === "crypto" ? "\\n7. IMPORTANTE: Para la categoría de Cryptography, DEBES utilizar la herramienta 'crypto_operations' para cifrar el flag o cualquier otro texto que requieras para el reto. ¡No intentes adivinar ni alucinar los hashes o textos cifrados! Llama a la herramienta, recibe el resultado real y luego genera el JSON final." : ""}

Responde con este JSON exacto:
{
  "title": "string",
  "category": "${category}",
  "difficulty": "${difficulty}",
  "description": "string",
  "flag": "FLAG{string}",
  "hints": ["string", "string", "string"],
  "solution": "string",
  "points": ${pointsMap[difficulty]}
}`;
}
```

---

## Sistema de Puntuación

Definido en `src/constants/config.js`:

```javascript
export const SCORING = {
  easy:   { base: 100, hintPenalty: 10,  minPoints: 50  },
  medium: { base: 300, hintPenalty: 30,  minPoints: 150 },
  hard:   { base: 500, hintPenalty: 50,  minPoints: 250 },
};

// Rendirse = 0 puntos (pero se muestra la solución)
// Completar con todas las pistas usadas = minPoints
```

---

## Validación del Flag

```javascript
// src/utils/flagValidator.js
export function validateFlag(input, correctFlag) {
  const normalize = (s) => s.trim().toUpperCase().replace(/\s/g, "");
  return normalize(input) === normalize(correctFlag);
}
```

---

## Convenciones de código

- **Componentes:** PascalCase (`ChallengeCard.jsx`)
- **Hooks:** camelCase con prefijo `use` (`useChallenge.js`)
- **Utilidades:** camelCase (`claudeApi.js`)
- **Constantes:** UPPER_SNAKE_CASE (`SCORING`, `MAX_HINTS`)
- **Props:** siempre con PropTypes o JSDoc comentado
- **Comentarios:** en español (el equipo trabaja en español)

---

## Manejo de errores

Todo llamado a la API debe manejarse con try/catch:

```javascript
const [loading, setLoading] = useState(false);
const [error, setError]     = useState(null);

async function fetchChallenge() {
  setLoading(true);
  setError(null);
  try {
    const challenge = await generateChallenge(category, difficulty);
    setCurrentChallenge(challenge);
  } catch (err) {
    setError("Error generando el reto. ¿Revisaste la API key?");
  } finally {
    setLoading(false);
  }
}
```

---

## Fallback de retos (para demo sin internet)

Si la API falla durante la demo, cargar desde `src/data/fallbackChallenges.json`:

```javascript
import fallback from "../data/fallbackChallenges.json";

// Seleccionar reto aleatório del fallback según categoría y dificultad
export function getFallbackChallenge(category, difficulty) {
  const pool = fallback.filter(
    (c) => c.category === category && c.difficulty === difficulty
  );
  return pool[Math.floor(Math.random() * pool.length)];
}
```

> Tener mínimo **2 retos pre-generados** por cada combinación (3 categorías × 3 dificultades = 18 retos en el fallback).

---

## Comandos de desarrollo

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Deploy a Vercel (requiere Vercel CLI)
vercel --prod
```

---

## Cómo pedirle ayuda a Codex en el desarrollo

Cuando uses Codex para ayudar con este proyecto, incluye este contexto:

> "Estoy trabajando en CTF Challenge Builder, una app React que usa la API de Anthropic para generar retos CTF dinámicamente. El stack es React + Tailwind + Codex API. [Tu pregunta aquí]"

Codex tendrá contexto completo del proyecto con este `AGENTS.md` en el repo.

---

## Checklist antes del deploy final

- [ ] `.env.local` está en `.gitignore` y NO está commiteado
- [ ] La API key está configurada en Vercel Environment Variables
- [ ] Los 18 retos de fallback están en `fallbackChallenges.json`
- [ ] Probadas las 9 combinaciones categoría × dificultad
- [ ] Responsive en móvil (para la demo)
- [ ] Loading states funcionando (la API tarda 2-4 segundos)
- [ ] Manejo de error visible al usuario si la API falla
