export const WEB_TOOLS_DEF = [
  {
    name: "generate_web_environment",
    description: "Crea un entorno web vulnerable para retos CTF. Retorna la URL generada.",
    cache_control: { type: "ephemeral" },
    input_schema: {
      type: "object",
      properties: {
        template: {
          type: "string",
          enum: ["dashboard", "ecommerce", "blog"],
          description: "Plantilla base del sitio."
        },
        theme_color: {
          type: "string",
          description: "Color CSS (ej. '#e74c3c') para personalizar el diseño."
        },
        vulnerabilities: {
          type: "array",
          items: { type: "string" },
          description: "Vulns a habilitar. dashboard: ['sqli_auth', 'idor']. ecommerce: ['sqli_search', 'path_traversal', 'file_metadata']. blog: ['info_exposure', 'file_metadata']."
        },
        db_settings: {
          type: "object",
          properties: {
            hash_passwords: { type: "boolean", description: "Si es true, la API hashea las contraseñas con MD5. TRUCO: Si quieres que el usuario dumpee la DB y crackee el hash para conseguir una pista/flag, pon una contraseña de <= 7 caracteres en 'mock_data' y pon esto en true." },
            disable_baseline_mock_data: { type: "boolean", description: "Si es true, la API no inyectará datos extra y la DB solo tendrá lo que pongas en 'mock_data'. Útil para que la página no tenga ruido y sea totalmente temática a tu narrativa." }
          }
        },
        file_metadata_payload: {
          type: "string",
          description: "String (ej. flag) que la API inyectará AUTOMÁTICAMENTE al final de un archivo de imagen/PDF nativo de la página (no necesitas elegir la imagen). El jugador obtiene la flag abriendo la imagen como texto. Solo usa esto para la vulnerabilidad 'file_metadata'."
        },
        mock_data: {
          type: "object",
          description: "Datos para SQLite. Envía contraseñas en texto plano. dashboard(users: username, password, role, department; messages: sender_id, receiver_id, content, is_read). ecommerce(users: username, password, role, bio; products: name, price, description, internal_description, image_url). blog(posts: title, content, author, is_published; comments: post_id, author, content)."
        },
        custom_files: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "string" },
              content: { type: "string" }
            }
          },
          description: "Archivos a generar (ej. { path: 'secret.txt', content: 'FLAG{...}' })."
        }
      },
      required: ["template"]
    }
  }
];

export async function executeWebTool(toolCall) {
  const config = toolCall.input;
  
  // Temporary logging to inspect the config sent by Claude
  console.log("=== CLAUDE GENERATED CONFIG ===");
  console.log(JSON.stringify(config, null, 2));
  console.log("===============================");

  try {
    const res = await fetch("https://omiags.online/ctf-api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (res.ok) {
      return `Éxito. URL generada: ${data.url} (Expira en ${data.expires_in})`;
    }
    return `Error de la API: ${JSON.stringify(data)}`;
  } catch (e) {
    return `Error de conexión: ${e.message}`;
  }
}
