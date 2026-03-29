# GameDex From hypervoid-runner

A fast-paced web-based 3D tunnel runner built with **Three.js + Vite**. You navigate left/right through a neon wormhole, collect **K coins**, avoid obstacles, and push for a high score.

## Project Overview

`hypervoid-runner` is a browser game prototype with a modular architecture. It focuses on smooth movement, lightweight visual effects, and easy local deployment.

## Features

- Username entry on start screen (persisted via `localStorage`)
- Endless wormhole run illusion with animated tunnel + particle streaks
- Smooth left/right lane steering with keyboard (`A/D` or arrow keys)
- K coin collectibles with collision scoring
- Obstacle collisions causing game over
- Dynamic speed increase over time for difficulty ramp
- Game over screen with restart and per-user best score tracking
- Basic bloom/glow post-processing and lightweight scene lighting

## Tech Stack

- **JavaScript (ES Modules)**
- **Three.js** for 3D rendering
- **Vite** for development/build tooling
- **localStorage** for username and score persistence

## Folder Structure

```txt
hypervoid-runner/
├─ public/
├─ src/
│  ├─ core/
│  │  ├─ constants.js      # Shared gameplay constants
│  │  └─ engine.js         # Scene/camera/renderer/composer/bootstrap
│  ├─ systems/
│  │  ├─ collision.js      # Collision checks
│  │  ├─ gameLoop.js       # Main gameplay loop and orchestration
│  │  ├─ input.js          # Keyboard input handling
│  │  └─ scoring.js        # Score state handling
│  ├─ ui/
│  │  └─ screens.js        # Start/HUD/GameOver DOM components
│  ├─ utils/
│  │  ├─ math.js           # Clamp/lerp/random helpers
│  │  └─ storage.js        # localStorage helpers
│  ├─ visuals/
│  │  ├─ items.js          # Coin/obstacle pooling + spawn logic
│  │  ├─ particles.js      # Particle streak field
│  │  ├─ player.js         # Player mesh
│  │  └─ wormhole.js       # Tunnel mesh and animation
│  └─ main.js              # App wiring and UI state transitions
├─ index.html
├─ package.json
└─ vite.config.js
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the local URL printed by Vite (typically `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview
```

## Deploy on Vercel

1. Push this project to GitHub.
2. In Vercel, click **Add New Project** and import the repo.
3. Keep defaults:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy.

## Future Improvements

- Add audio FX + adaptive music intensity
- Add mobile touch controls
- Add procedural tunnel deformation shader
- Add combo multipliers and power-ups
- Add pause menu and settings panel
- Add global leaderboard backend (optional)
