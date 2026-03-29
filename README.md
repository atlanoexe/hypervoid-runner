# Hypervoid Runner

Hypervoid Runner is a browser-based 3D tunnel runner built with Three.js and Vite. You pilot a Mirage controller through a collapsing digital tunnel, collect K coins, dodge asteroid waves, and survive long enough to build score and combo.

## Current Gameplay

- Username entry screen with local username persistence
- Loading screen while the Mirage glTF player asset is fetched
- Mirage controller player model loaded from `public/models/mirage/`
- Desktop controls with `W/A/S/D` or arrow keys
- Mobile controls with drag-based steering
- Unified input intent layer for consistent steering across desktop and mobile
- Full `X/Y` movement inside a circular tunnel boundary
- Randomized asteroid and coin spawning with progressive difficulty
- Event-driven scoring with combo growth from coins and near misses
- Visible live combo multiplier in the HUD and game-over summary
- Temporary coin pickup audio only
- HUD, loading overlay, start screen, restart flow, and game-over screen

## Controls

Desktop:
- `A/D` or `Left/Right` to steer horizontally
- `W/S` or `Up/Down` to steer vertically

Mobile:
- Drag on the play area to steer
- Input is normalized, smoothed, and deadzoned to reduce jitter and drift

## Scoring

The current score formula is:

```txt
score = round(coins^1.2 * exp(time / 25) * comboMultiplier)
```

Current combo multiplier:

```txt
comboMultiplier = 1 + min(combo, 12) * 0.08
```

Notes:
- Collecting a coin increases `coins` and `combo`
- A near miss increases `combo`
- Crashing or leaving the tunnel boundary breaks the combo

## Architecture

The project now follows a state-driven split between simulation and rendering.

- `src/core/state.js`
  - Single source of truth for player, run, world, and entity state
- `src/systems/`
  - Gameplay logic only
  - Input intent, player simulation, difficulty, pattern selection, spawning, item movement, collision, scoring, and audio event handling
- `src/visuals/`
  - Rendering only
  - Mesh creation, mesh syncing, player render behavior, tunnel visuals, and particle visuals
- `src/ui/`
  - Read-only DOM overlays for start, loading, HUD, and game-over states

The main loop in `src/systems/gameLoop.js` keeps simulation and rendering separated:

- Update phase
  - input intent
  - player simulation
  - spawning
  - item updates
  - collision
  - scoring
  - difficulty
- Render phase
  - player visual sync
  - item visual sync
  - tunnel and particle updates
  - engine render

## Folder Structure

```txt
hypervoid-runner/
- public/
  - models/
    - mirage/
      - Miragej.gltf
      - Miragej.bin
      - Combined.png
- src/
  - core/
    - constants.js
    - engine.js
    - itemConfig.js
    - state.js
  - systems/
    - audioSystem.js
    - collision.js
    - difficultySystem.js
    - gameLoop.js
    - input.js
    - inputSystem.js
    - itemSystem.js
    - playerSystem.js
    - scoring.js
    - spawnSystem.js
  - ui/
    - screens.js
  - utils/
    - math.js
    - storage.js
  - visuals/
    - items.js
    - itemsRender.js
    - particles.js
    - player.js
    - playerRender.js
    - wormhole.js
  - main.js
- .gitattributes
- index.html
- package.json
- vite.config.js
```

## Key Systems

### Input

`src/systems/input.js` exposes a device-agnostic `getMovement()` API that merges keyboard and pointer drag into normalized movement intent:

- `moveX`
- `moveY`
- `isSteering`

The input layer applies:

- drag normalization by viewport size
- deadzone filtering
- smoothing via `lerp`
- separate drag and keyboard sensitivity
- optional center-control mode behind a flag

### Spawning

`src/systems/spawnSystem.js` uses randomized forward spawn frontiers for coins and hazards. Difficulty increases tighten spawn gaps and raise object pressure over time.

### Audio

`src/systems/audioSystem.js` uses a native `Audio` object with a temporary web-hosted coin pickup clip. Playback is rate-limited and hard-capped to a short duration.

Current events:

- coin pickup

## Local Development

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

Open the local URL printed by Vite, usually `http://localhost:5173`.

### Production build

```bash
npm run build
npm run preview
```

## Mirage Asset Notes

The Mirage player model is loaded from:

- `public/models/mirage/Miragej.gltf`
- `public/models/mirage/Miragej.bin`
- `public/models/mirage/Combined.png`

`Miragej.bin` is tracked with Git LFS:

```txt
public/models/mirage/Miragej.bin filter=lfs diff=lfs merge=lfs -text
```

If Git LFS is not available during deployment, the model will usually fail to load and the game may fall back to the lightweight placeholder ship.

## Vercel Deployment

When deploying from Git:

1. Import the repository into Vercel
2. Keep the standard Vite settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Enable Git LFS in the project Git settings
4. Redeploy after enabling LFS

Without Git LFS enabled, `Miragej.bin` may be served as an LFS pointer instead of the real binary asset.

## Temporary Audio Notes

The current coin sound uses a temporary remote URL referenced from `src/systems/audioSystem.js`.

Implications:

- The game still runs if audio fails to load
- Some browsers may block playback until the player interacts with the page
- If a deployment blocks the remote audio URL, coin pickup will simply be silent until a local asset replaces it

## Recommended Next Improvements

- Replace temporary remote audio URLs with local, versioned audio assets
- Add fairer spawn shaping or lane-aware hazard spacing
- Tune combo feedback and audio balance in-browser
- Add a lightweight settings panel for volume and effect intensity
