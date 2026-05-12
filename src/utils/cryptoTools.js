import CryptoJS from "crypto-js";

export const CRYPTO_TOOLS_DEF = [
  {
    name: "crypto_operations",
    description: "Realiza operaciones criptográficas y de transformación de texto (cifrado, hashing, codificación). Utiliza esta herramienta para generar los retos de CTF de criptografía con valores precisos en lugar de adivinarlos.",
    cache_control: { type: "ephemeral" },
    input_schema: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          description: "La operación a realizar.",
          enum: [
            "base64_encode", "base64_decode",
            "hex_encode", "hex_decode",
            "caesar_cipher", "vigenere_cipher", "substitution_cipher",
            "string_to_numbers", "numbers_to_string",
            "xor", "not",
            "md5", "sha1", "ntlm"
          ]
        },
        input: {
          type: "string",
          description: "El texto de entrada a transformar o cifrar."
        },
        key: {
          type: "string",
          description: "La clave para cifrados (número para Caesar, palabra para Vigenère, alfabeto de 26 letras para sustitución, clave para XOR)."
        },
        mode: {
          type: "string",
          enum: ["encrypt", "decrypt"],
          description: "Para cifrados direccionales (caesar_cipher, vigenere_cipher, substitution_cipher), especifica si se debe cifrar o descifrar. Por defecto asume 'encrypt'."
        }
      },
      required: ["operation", "input"]
    }
  }
];

export function executeCryptoTool(toolCall) {
  const { operation, input, key, mode = "encrypt" } = toolCall.input;
  
  try {
    switch (operation) {
      case "base64_encode":
        return btoa(input);
      case "base64_decode":
        return atob(input);
      case "hex_encode":
        return Array.from(input).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      case "hex_decode":
        return input.match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
      case "string_to_numbers":
        return input.toUpperCase().replace(/[^A-Z]/g, '').split('').map(c => c.charCodeAt(0) - 65).join(',');
      case "numbers_to_string":
        return input.split(',').map(n => String.fromCharCode(parseInt(n.trim(), 10) + 65)).join('');
      case "caesar_cipher": {
        const shift = parseInt(key, 10) || 0;
        const actualShift = mode === "decrypt" ? (26 - (shift % 26)) % 26 : shift % 26;
        return input.replace(/[a-zA-Z]/g, (char) => {
          const base = char <= 'Z' ? 65 : 97;
          return String.fromCharCode(((char.charCodeAt(0) - base + actualShift) % 26) + base);
        });
      }
      case "vigenere_cipher": {
        if (!key) throw new Error("Vigenère requires a key");
        let keyIndex = 0;
        const k = key.toUpperCase().replace(/[^A-Z]/g, '');
        return input.replace(/[a-zA-Z]/g, (char) => {
          const base = char <= 'Z' ? 65 : 97;
          const kChar = k[keyIndex % k.length];
          const shift = kChar.charCodeAt(0) - 65;
          keyIndex++;
          const actualShift = mode === "decrypt" ? (26 - shift) % 26 : shift;
          return String.fromCharCode(((char.charCodeAt(0) - base + actualShift) % 26) + base);
        });
      }
      case "substitution_cipher": {
        if (!key || key.length !== 26) throw new Error("Substitution requires a 26-character alphabet key");
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const map = mode === "decrypt" 
          ? Object.fromEntries(key.toUpperCase().split('').map((c, i) => [c, alphabet[i]]))
          : Object.fromEntries(alphabet.split('').map((c, i) => [c, key.toUpperCase()[i]]));
        
        return input.replace(/[a-zA-Z]/g, (char) => {
          const isLower = char >= 'a' && char <= 'z';
          const mapped = map[char.toUpperCase()] || char;
          return isLower ? mapped.toLowerCase() : mapped;
        });
      }
      case "xor": {
        if (!key) throw new Error("XOR requires a key");
        return Array.from(input).map((char, i) => {
          const kChar = key[i % key.length];
          return String.fromCharCode(char.charCodeAt(0) ^ kChar.charCodeAt(0));
        }).join('');
      }
      case "not": {
        return Array.from(input).map(char => String.fromCharCode(~char.charCodeAt(0) & 0xFF)).join('');
      }
      case "md5":
        return CryptoJS.MD5(input).toString();
      case "sha1":
        return CryptoJS.SHA1(input).toString();
      case "ntlm": {
        // NTLM is MD4 of UTF-16LE encoded password
        const wordArray = CryptoJS.enc.Utf16LE.parse(input);
        return CryptoJS.MD4(wordArray).toString(CryptoJS.enc.Hex).toUpperCase();
      }
      default:
        throw new Error(`Operación desconocida: ${operation}`);
    }
  } catch (error) {
    return `Error ejecutando la operación: ${error.message}`;
  }
}
