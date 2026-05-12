# CTF Challenge Builder — Project Plan
> Materia: Ciberseguridad | Proyecto Final | Equipo: [Nombre del equipo]

---

## 1. Descripción del Proyecto

**CTF Challenge Builder** es una aplicación web impulsada por IA que genera dinámicamente retos de Capture The Flag en tres categorías: **Web Exploitation**, **Cryptography** y **Reverse Engineering**. Los retos incluyen pistas progresivas, un sistema de scoring en tiempo real y soluciones explicadas al finalizar cada challenge.

El diferenciador clave es que **ningún reto se repite**: la IA genera el enunciado, el flag, las pistas y la solución de forma dinámica en cada sesión, haciendo la plataforma infinitamente rejugable.

---

## 2. Objetivos

| # | Objetivo | Tipo |
|---|----------|------|
| 1 | Generar retos CTF únicos por sesión usando la API de Claude | Funcional |
| 2 | Soportar 3 categorías: Web, Crypto, Reversing | Funcional |
| 3 | Implementar sistema de pistas progresivas (hasta 3 pistas por reto) | Funcional |
| 4 | Scoreboard en tiempo real con penalización por pistas usadas | Funcional |
| 5 | Mostrar solución detallada al rendirse o al completar el reto | Funcional |
| 6 | Interfaz limpia y temática (estilo terminal hacker) | No funcional |
| 7 | Demostrar uso de IA generativa aplicada a ciberseguridad | Rúbrica |

---

## 3. Alcance

### ✅ Incluido (MVP para la entrega)
- Generación dinámica de retos con Claude API
- 3 categorías × 3 niveles de dificultad (Fácil, Medio, Difícil) = 9 combinaciones
- Validación de flags (case-insensitive, formato `FLAG{...}`)
- Sistema de pistas progresivas (cada pista resta puntos)
- **Autenticación de usuarios** (registro e inicio de sesión)
- **Persistencia de scores en base de datos** (historial por usuario)
- **Scoreboard global** con ranking entre todos los usuarios registrados
- **Modo Multiplayer** — sala de retos simultáneos en tiempo real
- Solución explicada paso a paso al terminar
- UI responsive con tema dark/terminal

### ❌ Fuera de alcance (post-entrega)
- Retos con entornos reales (contenedores Docker)

---

## 4. Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React + Tailwind CSS | Rápido de desarrollar, componentes reutilizables |
| Backend / AI | Anthropic Claude API (`claude-sonnet-4`) | Motor de generación de retos |
| Backend API | Node.js + Express | API REST para auth, scores y usuarios |
| Autenticación | Firebase Auth | Registro/login con Google y email sin fricción |
| Base de datos | Firebase Firestore | Persistencia de scores, usuarios y sesiones en tiempo real |
| Multiplayer | Firebase Realtime Database | Sincronización de salas multijugador con WebSockets nativos |
| Hosting | Vercel (frontend) + Firebase Functions (backend) | Deploy gratuito y rápido |
| Estilos | Tailwind + fuente monospace | Estética terminal |

---

## 5. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIO                               │
│                  (Browser - React App)                       │
└──────┬──────────────────┬───────────────────┬───────────────┘
       │                  │                   │
       ▼                  ▼                   ▼
┌─────────────┐  ┌────────────────┐  ┌───────────────────┐
│  Auth Layer  │  │ Challenge Engine│  │  Multiplayer Room │
│             │  │                │  │                   │
│ Firebase    │  │ - ChallengeCard │  │ Firebase Realtime │
│ Auth        │  │ - HintSystem   │  │ Database          │
│             │  │ - FlagValidator│  │                   │
│ Login/Reg   │  │ - Scoreboard   │  │ - Sala de reto    │
│ Google/Email│  │ - SolutionView │  │ - Sync de flags   │
└──────┬──────┘  └───────┬────────┘  │ - Ranking live    │
       │                 │           └─────────┬─────────┘
       ▼                 ▼                     │
┌─────────────────────────────────────────────▼─────────────┐
│                    Firebase Firestore                        │
│                                                             │
│  users/{uid}           scores/{uid}/challenges[]            │
│  - displayName         - challengeId, category, difficulty  │
│  - email               - pointsEarned, hintsUsed, solvedAt  │
│  - totalScore          - timeTaken                          │
│  - rank                                                     │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
                       ┌──────────────────┐
                       │  Anthropic API    │
                       │  /v1/messages     │
                       │                  │
                       │  Genera:          │
                       │  - Enunciado      │
                       │  - Flag           │
                       │  - Pistas (3)     │
                       │  - Solución       │
                       └──────────────────┘
```

---

## 6. Diseño de la Generación de Retos (Prompt Engineering)

El corazón del sistema es un prompt estructurado que le pide a Claude generar un JSON con todo el reto:

```json
{
  "title": "SQL Injection en Login",
  "category": "web",
  "difficulty": "medium",
  "description": "Enunciado del reto...",
  "flag": "FLAG{sql_1nj3ct10n_byp4ss}",
  "hints": [
    "Hint 1 (más vaga)",
    "Hint 2 (más específica)",
    "Hint 3 (casi la solución)"
  ],
  "solution": "Explicación paso a paso detallada...",
  "points": 300
}
```

### Categorías y temas por categoría

**Web Exploitation**
- SQL Injection (login bypass, data extraction)
- XSS (reflected, stored)
- IDOR (Insecure Direct Object Reference)
- Path Traversal
- Command Injection

**Cryptography**
- Caesar / ROT13
- Base64 encoding
- XOR cipher
- Vigenère cipher
- Hash cracking (MD5, SHA1 con diccionario conocido)

**Reverse Engineering**
- Análisis de pseudocódigo
- Algoritmos ofuscados
- Decodificación de binarios simples
- Análisis de strings y patrones

---

## 7. Sistema de Puntuación

| Dificultad | Puntos base | Penalización por pista |
|------------|-------------|----------------------|
| Fácil | 100 | -10 pts |
| Medio | 300 | -30 pts |
| Difícil | 500 | -50 pts |

**Reglas:**
- Máximo 3 pistas por reto
- Rendirse = 0 puntos pero se muestra la solución
- Score mínimo por reto completado = 50% del base (aunque se usen todas las pistas)

---

## 8. Flujo de Usuario

```
Inicio
  │
  ▼
Seleccionar categoría (Web / Crypto / Reversing)
  │
  ▼
Seleccionar dificultad (Fácil / Medio / Difícil)
  │
  ▼
[API Call] → Claude genera el reto
  │
  ▼
Pantalla del reto:
  ├── Enunciado
  ├── Input para el flag
  ├── Botón "Pedir pista" (-puntos)
  └── Botón "Rendirse" (ver solución)
  │
  ▼
Usuario ingresa flag
  │
  ├─ Correcto → Sumar puntos → Scoreboard → Siguiente reto
  └─ Incorrecto → Mensaje de error → Intentar de nuevo
```

---

## 9. Componentes de la Aplicación

### 9.1 `<CategorySelector />`
- Grid de 3 tarjetas (Web, Crypto, Reversing)
- Animación de hover con glow verde
- Muestra descripción al hover

### 9.2 `<DifficultySelector />`
- Tres botones: Fácil / Medio / Difícil
- Muestra puntos y penalización asociados

### 9.3 `<ChallengeCard />`
- Área del enunciado (estilo terminal)
- Timer visual (opcional, estético)
- Input del flag con validación
- Estado de loading mientras genera la IA

### 9.4 `<HintSystem />`
- Botón bloqueado hasta que el usuario lo solicite
- Reveal progresivo (Hint 1 → 2 → 3)
- Contador visual de pistas disponibles
- Descuento de puntos visible en tiempo real

### 9.5 `<FlagValidator />`
- Normaliza el input (trim, uppercase)
- Compara contra el flag generado
- Feedback de correcto/incorrecto con animación

### 9.6 `<SolutionViewer />`
- Se activa al rendirse o al completar
- Muestra la solución paso a paso
- Explica el concepto de seguridad detrás del reto
- Botón "Siguiente reto"

### 9.7 `<Scoreboard />`
- Lista de retos completados en la sesión
- Puntos obtenidos por reto
- Total acumulado
- Categorías completadas

### 9.8 `<AuthScreen />`
- Formulario de registro (email + contraseña)
- Login con Google (Firebase Auth)
- Redirección automática si ya hay sesión activa
- Manejo de errores (correo en uso, contraseña débil, etc.)

### 9.9 `<UserProfile />`
- Muestra el historial de retos resueltos por el usuario autenticado
- Estadísticas: retos por categoría, racha, score total
- Datos leídos desde Firestore `scores/{uid}/challenges[]`

### 9.10 `<GlobalScoreboard />`
- Ranking global de todos los usuarios registrados
- Columnas: posición, nombre, score total, retos resueltos
- Actualización en tiempo real via Firestore `onSnapshot`
- Highlight de la fila del usuario actual

### 9.11 `<MultiplayerLobby />`
- Crear sala (genera código de 6 caracteres) o unirse con código
- Lista de jugadores en la sala con estado (listo / esperando)
- Host puede iniciar la partida cuando todos están listos
- Sincronizado via Firebase Realtime Database

### 9.12 `<MultiplayerRoom />`
- Todos los jugadores resuelven el **mismo reto generado por IA** simultáneamente
- Ranking en vivo: quién va ganando, quién ya envió el flag
- Temporizador global de la sala
- Al terminar: tabla de resultados con posiciones finales

---

## 10. Plan de Desarrollo — 4 Programadores

### Roles del equipo

| # | Integrante | Rol | Responsabilidad principal |
|---|-----------|-----|--------------------------|
| P1 | [Nombre 1] | **AI Engineer** | Claude API, prompt engineering, generación de retos |
| P2 | [Nombre 2] | **Frontend Lead** | UI/UX, componentes React, estilos Tailwind |
| P3 | [Nombre 3] | **Backend / Auth** | Firebase Auth, Firestore, persistencia de datos |
| P4 | [Nombre 4] | **Multiplayer / DevOps** | Firebase Realtime DB, salas, deploy, integración final |

---

### Fase 1 — Setup y arquitectura base (Día 1)
> **Todo el equipo** | Duración: 1 día

| Tarea | Responsable |
|-------|-------------|
| Crear repositorio GitHub, configurar ramas (`main`, `dev`, feature branches) | P4 |
| Inicializar proyecto Vite + React + Tailwind | P2 |
| Configurar proyecto Firebase (Auth, Firestore, Realtime DB) | P3 |
| Crear `.env.local` con keys de Firebase y Anthropic | P4 |
| Definir estructura de carpetas del repo | P1 |
| Kickoff: acordar convenciones de código, PR reviews, daily sync | Todos |

---

### Fase 2 — Core de IA y generación de retos (Días 2–3)
> **P1 lidera** | P2 apoya en UI del loading state

| Tarea | Responsable |
|-------|-------------|
| Implementar `claudeApi.js` (fetch a `/v1/messages`) | P1 |
| Diseñar y probar prompts por categoría y dificultad | P1 |
| Parseo defensivo del JSON + manejo de errores y retry | P1 |
| Generar los 18 retos de fallback (`fallbackChallenges.json`) | P1 |
| Crear `useChallenge.js` hook (estado del reto activo) | P1 |
| Loading skeleton mientras genera la IA | P2 |

**Entregable de fase:** función `generateChallenge(category, difficulty)` funcional y testeada.

---

### Fase 3 — Autenticación y base de datos (Días 2–4)
> **P3 lidera** | Corre en paralelo con Fase 2

| Tarea | Responsable |
|-------|-------------|
| Configurar Firebase Auth (email/contraseña + Google) | P3 |
| Implementar `<AuthScreen />` (login y registro) | P3 |
| Contexto global de autenticación (`AuthContext.jsx`) | P3 |
| Rutas protegidas (redirigir si no hay sesión) | P3 |
| Diseñar esquema de Firestore (`users/`, `scores/`) | P3 |
| Función para guardar score al completar reto | P3 |
| Función para leer historial del usuario (`useUserScores.js`) | P3 |
| Implementar `<UserProfile />` con historial y estadísticas | P3 |

**Entregable de fase:** flujo completo de login → jugar → score guardado en Firestore.

---

### Fase 4 — UI principal de retos (Días 3–5)
> **P2 lidera** | P1 apoya en lógica de flag

| Tarea | Responsable |
|-------|-------------|
| `<CategorySelector />` con animaciones | P2 |
| `<DifficultySelector />` con tabla de puntos | P2 |
| `<ChallengeCard />` estilo terminal | P2 |
| `<HintSystem />` con reveal progresivo | P2 |
| `<FlagValidator />` con normalización y feedback visual | P1 + P2 |
| `<SolutionViewer />` con explicación paso a paso | P2 |
| `useScore.js` hook (cálculo de puntos y penalizaciones) | P1 |
| Integrar `generateChallenge` dentro del flujo de UI | P1 + P2 |

**Entregable de fase:** flujo completo de solo player funcional end-to-end.

---

### Fase 5 — Scoreboard global y perfil (Días 5–6)
> **P3 y P2** colaboran

| Tarea | Responsable |
|-------|-------------|
| `<GlobalScoreboard />` con ranking en tiempo real (`onSnapshot`) | P3 |
| Highlight de fila del usuario actual en el ranking | P2 |
| Paginación del scoreboard (top 50) | P3 |
| `<UserProfile />` conectado a Firestore | P3 |
| Navegación entre pantallas (Home / Jugar / Perfil / Ranking) | P2 |

**Entregable de fase:** scoreboard global visible y actualizado en tiempo real.

---

### Fase 6 — Modo Multiplayer (Días 5–7)
> **P4 lidera** | P1 apoya con generación del reto compartido

| Tarea | Responsable |
|-------|-------------|
| Diseñar esquema de salas en Realtime DB (`rooms/{roomId}`) | P4 |
| `<MultiplayerLobby />`: crear sala y unirse con código | P4 |
| Sincronización de jugadores en sala (lista en tiempo real) | P4 |
| Trigger: host inicia sala → Claude genera reto → se distribuye a todos | P4 + P1 |
| `<MultiplayerRoom />`: reto simultáneo + ranking en vivo | P4 |
| Temporizador global sincronizado | P4 |
| Pantalla de resultados finales de la sala | P4 |
| Guardar score de partida multiplayer en Firestore | P3 + P4 |

**Entregable de fase:** 2 jugadores pueden entrar a una sala y resolver el mismo reto en tiempo real.

---

### Fase 7 — Polish, integración y testing (Día 7)
> **Todo el equipo**

| Tarea | Responsable |
|-------|-------------|
| Probar las 9 combinaciones categoría × dificultad | P1 |
| Probar flujo completo: registro → reto → score → ranking | P3 |
| Probar sala multiplayer con 2–4 jugadores | P4 |
| Responsive en móvil | P2 |
| Animaciones finales y consistencia visual | P2 |
| Manejo de edge cases (flag vacío, API timeout, sala llena) | Todos |
| Code review final y merge a `main` | Todos |

---

### Fase 8 — Deploy y presentación (Día 8)
> **P4 coordina** | Todos contribuyen a la PPT

| Tarea | Responsable |
|-------|-------------|
| Deploy frontend en Vercel | P4 |
| Configurar variables de entorno en Vercel | P4 |
| Verificar que la app funciona en URL pública | Todos |
| Preparar slides (arquitectura, demo, rúbrica) | P2 + P3 |
| Preparar guión de demo en vivo (30 min) | P1 |
| Ensayo de presentación | Todos |

---

### Cronograma visual

```
         Día 1   Día 2   Día 3   Día 4   Día 5   Día 6   Día 7   Día 8
P1 AI    [Setup] [──── Core AI + Prompts ────] [Flag] [────────] [Test] [Demo]
P2 UI    [Setup] [Load] [──── UI Retos ──────────────] [Score]  [Polish][PPT ]
P3 Auth  [Setup] [──── Auth + Firestore ─────────────] [Rank──] [──────][Test][PPT]
P4 Multi [Setup] [Repo] [────────────────] [── Multiplayer ────] [Test] [Deploy]
```

---

## 11. Rúbrica vs Implementación

| Criterio de evaluación | Cómo lo cubrimos |
|------------------------|-----------------|
| **La aplicación ayuda en ciberseguridad** | Enseña técnicas reales de ataque/defensa a través de retos prácticos |
| **Innovación / funcionalidad** | Generación infinita de retos únicos con IA; nadie ve el mismo reto dos veces |
| **Presentación** | Demo en vivo: generar un reto en tiempo real frente al jurado |
| **Trabajo en equipo** | Roles definidos por componente (ver Fase) |
| **Uso de tema de clase** | Cubre Web exploitation, Criptografía y Análisis de binarios |

---

## 12. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| API de Claude falla en demo | Baja | Alto | Tener 18 retos pre-generados en `fallbackChallenges.json` |
| JSON malformado del LLM | Media | Medio | Parseo defensivo + retry automático (máx. 2 reintentos) |
| Reto inválido / flag incorrecto | Media | Medio | Prompt con few-shot examples y validación de formato |
| Firebase quota excedida en demo | Baja | Alto | Plan Spark es gratuito; evitar reads innecesarios con caché local |
| Desincronización en sala multiplayer | Media | Medio | Firebase Realtime DB maneja conflictos con `serverTimestamp` |
| Integración tardía de módulos | Media | Alto | PR reviews diarios; Fase 7 de integración con un día completo |
| Tiempo insuficiente para Multiplayer | Media | Medio | Multiplayer es bonus; el MVP sin él ya cubre la rúbrica completa |

---

## 13. Entregables

- [ ] Repositorio GitHub con el código fuente
- [ ] App deployada y accesible en URL pública
- [ ] Presentación (PPT/Google Slides) con arquitectura y demo
- [ ] Este documento de Project Plan
- [ ] `CLAUDE.md` con instrucciones para desarrolladores

---

## 14. Equipo y Roles

| Integrante | Rol | Módulos principales |
|-----------|-----|---------------------|
| [Nombre 1] | **AI Engineer** | `claudeApi.js`, prompt engineering, `useChallenge.js`, fallback JSON, `FlagValidator` |
| [Nombre 2] | **Frontend Lead** | `CategorySelector`, `DifficultySelector`, `ChallengeCard`, `HintSystem`, `SolutionViewer`, `GlobalScoreboard` UI, PPT |
| [Nombre 3] | **Backend / Auth** | Firebase Auth, `AuthScreen`, `AuthContext`, Firestore schema, `useUserScores`, `UserProfile`, `GlobalScoreboard` data |
| [Nombre 4] | **Multiplayer / DevOps** | Firebase Realtime DB, `MultiplayerLobby`, `MultiplayerRoom`, repo setup, deploy Vercel |

> Dinos los nombres reales del equipo para actualizar este documento.