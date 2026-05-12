import { buildPrompt } from "./promptBuilder";
import { getFallbackChallenge } from "./fallbackLoader";
import { CRYPTO_TOOLS_DEF, executeCryptoTool } from "./cryptoTools";

const MAX_RETRIES = 2;
const MAX_TOOL_LOOPS = 5;

async function fetchFromClaude(category, difficulty) {
  const { systemPrompt, userPrompt } = buildPrompt(category, difficulty);
  
  const system = [
    {
      type: "text",
      text: systemPrompt,
      cache_control: { type: "ephemeral" }
    }
  ];

  let messages = [
    { role: "user", content: userPrompt }
  ];

  const tools = category === "crypto" ? CRYPTO_TOOLS_DEF : undefined;

  for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
    const payload = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system,
      messages,
    };
    if (tools) payload.tools = tools;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    messages.push({ role: "assistant", content: data.content });

    if (data.stop_reason === "tool_use") {
      const toolResults = [];
      for (const block of data.content) {
        if (block.type === "tool_use") {
          let resultText;
          try {
            if (block.name === "crypto_operations") {
              resultText = executeCryptoTool(block);
            } else {
              resultText = `Unknown tool: ${block.name}`;
            }
          } catch (e) {
            resultText = `Error: ${e.message}`;
          }
          
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: String(resultText)
          });
        }
      }
      
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    const textBlock = data.content.find(c => c.type === "text");
    if (!textBlock) throw new Error("No text content returned by API");
    
    const clean = textBlock.text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }
  
  throw new Error("Exceeded maximum tool execution loops");
}

export async function generateChallenge(category, difficulty) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fetchFromClaude(category, difficulty);
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
