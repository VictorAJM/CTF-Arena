const categoryDescriptions = {
  web: "Web Exploitation (SQL Injection, XSS, IDOR, Path Traversal, Command Injection)",
  crypto: "Cryptography (Caesar, Base64, XOR, Vigenère, hash cracking con diccionario simple)",
  reversing: "Reverse Engineering (análisis de pseudocódigo, algoritmos ofuscados, decodificación de patrones)",
};

const pointsMap = { easy: 100, medium: 300, hard: 500 };

export function buildPrompt(category, difficulty) {
  const points = pointsMap[difficulty];
  
  const systemPrompt = `Eres un experto en ciberseguridad y CTF (Capture The Flag).
Tu objetivo es generar retos CTF de alta calidad.

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.
2. El flag SIEMPRE debe tener el formato FLAG{...} con contenido relacionado al reto.
3. Las pistas deben ser progresivas: la primera muy vaga, la tercera casi la solución.
4. La solución debe ser educativa y explicar el concepto de seguridad involucrado.
5. El reto debe ser DIFERENTE a retos comunes; sé creativo con el contexto/narrativa.
6. Los puntos deben ser exactamente ${points}.
${category === "crypto" ? "\n7. IMPORTANTE: Para la categoría de Cryptography, DEBES utilizar la herramienta 'crypto_operations' para cifrar el flag o cualquier otro texto que requieras para el reto. ¡No intentes adivinar ni alucinar los hashes o textos cifrados! Llama a la herramienta, recibe el resultado real y luego genera el JSON final." : ""}

Responde con este JSON exacto:
{
  "title": "string",
  "category": "${category}",
  "difficulty": "${difficulty}",
  "description": "string",
  "flag": "FLAG{string}",
  "hints": ["string", "string", "string"],
  "solution": "string",
  "points": ${points}
}`;

  const userPrompt = `Genera un reto CTF de la categoría ${categoryDescriptions[category]} con dificultad ${difficulty}.`;

  return { systemPrompt, userPrompt };
}
