# CTF Arena

AI-powered Capture The Flag platform with dynamic challenge generation, progressive hints, real-time multiplayer, and global rankings.

---

## Overview

CTF Arena generates unique challenges on demand using the Claude API. Every challenge comes with a realistic scenario, a hidden flag, three progressive hints, and a full walkthrough — so every session is both a competition and a learning experience.

Compete solo to climb the global leaderboard, or create a room and race your team to the flag.

---

## Features

- **AI-generated challenges** — unique title, description, flag, hints, and solution every time via Claude
- **9 combinations** — Web Exploitation, Cryptography, and Reverse Engineering across Easy, Medium, and Hard
- **Progressive hints** — 3 hints per challenge, each more specific; using them costs points
- **Multiplayer rooms** — 6-character room codes, shared challenge, first correct flag wins
- **Global leaderboard** — persistent rankings across all users, updated in real time
- **Auth & profiles** — email or Google sign-in; history and score persist across sessions
- **Always learn** — solve it or give up, the full solution is always revealed at the end

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Tailwind CSS |
| AI | Anthropic Claude API |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Multiplayer | Firebase Realtime Database |
| Hosting | Vercel |

---

## Getting Started

**Prerequisites:** Node.js 18+, a Firebase project with Auth + Firestore + Realtime Database, and an Anthropic API key.

```bash
git clone https://github.com/your-team/ctf-arena.git
cd ctf-arena
npm install
```

Create `.env.local` in the project root:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> Never commit `.env.local` — it is already in `.gitignore`.

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Project Structure

```
ctf-arena/
├── src/
│   ├── components/
│   │   ├── CategorySelector.jsx
│   │   ├── DifficultySelector.jsx
│   │   ├── ChallengeCard.jsx
│   │   ├── HintSystem.jsx
│   │   ├── FlagValidator.jsx
│   │   ├── SolutionViewer.jsx
│   │   ├── Scoreboard.jsx
│   │   ├── AuthScreen.jsx
│   │   ├── UserProfile.jsx
│   │   ├── GlobalScoreboard.jsx
│   │   ├── MultiplayerLobby.jsx
│   │   └── MultiplayerRoom.jsx
│   ├── hooks/
│   │   ├── useChallenge.js
│   │   ├── useScore.js
│   │   └── useUserScores.js
│   ├── utils/
│   │   ├── claudeApi.js
│   │   ├── promptBuilder.js
│   │   └── flagValidator.js
│   ├── data/
│   │   └── fallbackChallenges.json
│   ├── App.jsx
│   └── main.jsx
├── CLAUDE.md
└── package.json
```

---

## Scoring

| Difficulty | Base | Hint Penalty | Minimum |
|---|---|---|---|
| Easy | 100 pts | −10 per hint | 50 pts |
| Medium | 300 pts | −30 per hint | 150 pts |
| Hard | 500 pts | −50 per hint | 250 pts |

Giving up awards 0 points but unlocks the full solution. Multiplayer scores are saved to the global leaderboard.

---

## Multiplayer

1. Sign in and open **Multiplayer**
2. Create a room — share the 6-character code with your team
3. Host starts the match; Claude generates one challenge for the entire room
4. First player to submit the correct flag wins the round

---

## Development

```bash
npm run dev       # dev server
npm run build     # production build
npm run preview   # preview production build locally
```

See [CLAUDE.md](./CLAUDE.md) for full developer docs: API integration, prompt engineering, Firestore schema, and coding conventions.

---

## Team

| Name | Role |
|---|---|
| [Nombre 1] | AI Engineer |
| [Nombre 2] | Frontend Lead |
| [Nombre 3] | Backend / Auth |
| [Nombre 4] | Multiplayer / DevOps |

---

## License

Built for an academic cybersecurity course. Not licensed for commercial use.
