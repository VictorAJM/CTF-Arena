# ⚔️ CTF Arena

> AI-powered Capture The Flag platform with real-time multiplayer, dynamic challenge generation, and global rankings.

---

## What is CTF Arena?

CTF Arena is a web app that uses AI to generate infinite, unique Capture The Flag challenges across three categories: **Web Exploitation**, **Cryptography**, and **Reverse Engineering**. No two sessions are the same — every challenge is generated on the fly by Claude, complete with progressive hints, a scoring system, and a step-by-step solution at the end.

Compete solo or create a room and challenge your friends in real time.

---

## Features

- **AI-Generated Challenges** — Claude generates a unique title, description, flag, hints, and solution every time. No repeated challenges.
- **3 Categories × 3 Difficulty Levels** — Web, Crypto, and Reversing across Easy, Medium, and Hard.
- **Progressive Hints** — Up to 3 hints per challenge, each one more specific. Using hints costs points.
- **Multiplayer Rooms** — Create a room with a 6-character code, invite friends, and race to solve the same challenge simultaneously.
- **Global Scoreboard** — Persistent rankings across all registered users, updated in real time.
- **Auth & Profiles** — Sign up with email or Google. Your history, stats, and score are saved across sessions.
- **Solutions Explained** — Whether you solve it or give up, you always learn the concept behind the challenge.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| AI Engine | Anthropic Claude API (`claude-sonnet-4`) |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Multiplayer | Firebase Realtime Database |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://firebase.google.com) project with Auth, Firestore, and Realtime Database enabled
- An [Anthropic API key](https://console.anthropic.com)

### Installation

```bash
git clone https://github.com/your-team/ctf-arena.git
cd ctf-arena
npm install
```

### Environment Variables

Create a `.env.local` file in the root of the project:

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

> ⚠️ Never commit `.env.local`. It is already listed in `.gitignore`.

### Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

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
├── .env.local         ← not committed
└── package.json
```

---

## Scoring

| Difficulty | Base Points | Hint Penalty | Minimum |
|---|---|---|---|
| Easy | 100 pts | −10 pts | 50 pts |
| Medium | 300 pts | −30 pts | 150 pts |
| Hard | 500 pts | −50 pts | 250 pts |

- Maximum 3 hints per challenge.
- Giving up awards 0 points, but unlocks the full solution.
- Multiplayer scores are saved to the global leaderboard.

---

## Multiplayer

1. Sign in and go to **Multiplayer**.
2. Create a room — you'll get a 6-character code.
3. Share the code with your team.
4. Once everyone's in, the host starts the match.
5. Claude generates one challenge for the entire room. First to submit the correct flag wins.

---

## Development

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build locally
```

See [CLAUDE.md](./CLAUDE.md) for detailed developer documentation: API integration, prompt engineering, Firestore schema, and coding conventions.

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

This project was built for an academic cybersecurity course. Not licensed for commercial use.
