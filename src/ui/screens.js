import { mountStartScreenPreviews } from '../visuals/itemPreview.js';

function formatTime(seconds) {
  const whole = Math.floor(seconds);
  const mins = String(Math.floor(whole / 60)).padStart(2, '0');
  const secs = String(whole % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function formatComboMultiplier(combo) {
  const multiplier = 1 + Math.min(combo, 12) * 0.08;
  return `x${multiplier.toFixed(2)}`;
}

function cardTemplate(title, bodyHtml, className = '') {
  const panel = document.createElement('div');
  panel.className = `panel hidden ${className}`.trim();
  panel.innerHTML = `<section class="card"><h2>${title}</h2>${bodyHtml}</section>`;
  return panel;
}

export function createHomeScreen(root) {
  const panel = cardTemplate(
    'Hypervoid Runner',
    '<p class="lede">Thread the digital tunnel, collect K coins, and dodge shifting hazards.</p><section class="home-layout"><div class="home-main"><section class="intro-grid" aria-label="Run guide"><article class="intro-card intro-card-grab"><div class="intro-preview"><canvas id="coin-preview" class="intro-canvas" aria-hidden="true"></canvas></div><div class="intro-copy"><span class="intro-kicker">Grab This</span><h3>K Coin</h3><p>Snag these pickups to build score and keep your combo climbing.</p></div></article><article class="intro-card intro-card-avoid"><div class="intro-preview"><canvas id="obstacle-preview" class="intro-canvas" aria-hidden="true"></canvas></div><div class="intro-copy"><span class="intro-kicker">Avoid This</span><h3>Void Hazard</h3><p>Slip past these floating blockers or the run ends on impact.</p></div></article></section><label class="field"><span>Pilot</span><input id="name" maxlength="24" placeholder="Enter username" /></label><div class="hint-list"><span>Desktop: A / D / W / S or Arrow Keys</span><span>Mobile: drag in any direction for direct movement</span></div><button id="start">Launch Run</button></div><aside class="leaderboard-panel leaderboard-panel-preview"><div class="leaderboard-head"><span class="leaderboard-kicker">Leaderboard</span><strong>Top 30 Pilots</strong></div><p class="leaderboard-empty">The ranked home preview will live here once online leaderboard sync is added.</p><div class="leaderboard-placeholder" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div></aside></section>',
    'panel-home'
  );
  root.appendChild(panel);

  const input = panel.querySelector('#name');
  const button = panel.querySelector('#start');
  const coinCanvas = panel.querySelector('#coin-preview');
  const obstacleCanvas = panel.querySelector('#obstacle-preview');

  mountStartScreenPreviews({ coinCanvas, obstacleCanvas });

  return {
    onStart(cb) {
      const start = () => {
        const name = (input.value || 'Pilot').trim().slice(0, 24);
        cb(name || 'Pilot');
      };

      button.onclick = start;
      input.onkeydown = (event) => {
        if (event.key === 'Enter') start();
      };
    },
    setName(name) {
      input.value = name;
    },
    show() {
      panel.classList.remove('hidden');
      requestAnimationFrame(() => input.focus());
    },
    hide() {
      panel.classList.add('hidden');
    }
  };
}

export function createScoreScreen(root) {
  const panel = cardTemplate(
    'Run Report',
    '<p class="lede">Your latest run is locked in. Full ranking data will appear here once the leaderboard system goes live.</p><section class="score-layout"><div class="score-main"><div class="results results-emphasis"><p id="pilot"></p><p id="score"></p><p id="coins"></p><p id="time"></p><p id="combo"></p><p id="rank"></p></div><button id="home">Return Home</button></div><aside class="leaderboard-panel leaderboard-panel-score"><div class="leaderboard-head"><span class="leaderboard-kicker">Leaderboard</span><strong>Top 200 Pilots</strong></div><p class="leaderboard-empty">This expanded ranking board is reserved for the future online leaderboard rollout.</p><div class="leaderboard-placeholder leaderboard-placeholder-long" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div></aside></section>',
    'panel-score'
  );
  root.appendChild(panel);

  const pilotText = panel.querySelector('#pilot');
  const scoreText = panel.querySelector('#score');
  const coinsText = panel.querySelector('#coins');
  const timeText = panel.querySelector('#time');
  const comboText = panel.querySelector('#combo');
  const rankText = panel.querySelector('#rank');
  const button = panel.querySelector('#home');

  return {
    show({ username, score, coins, time, combo = 0, bestCombo = combo }) {
      pilotText.textContent = `Pilot: ${username}`;
      scoreText.textContent = `Final Score: ${score.toLocaleString()}`;
      coinsText.textContent = `K Coins: ${coins}`;
      timeText.textContent = `Survival Time: ${formatTime(time)}`;
      comboText.textContent = `Best Combo: ${formatComboMultiplier(bestCombo)}`;
      rankText.textContent = 'Rank: Pending leaderboard sync';
      panel.classList.remove('hidden');
    },
    hide() {
      panel.classList.add('hidden');
    },
    onReturnHome(cb) {
      button.onclick = cb;
    }
  };
}

export function createLoadingScreen(root) {
  const panel = cardTemplate(
    'Preparing Hypervoid',
    '<p class="lede">Loading models, audio, and core game files...</p><div class="loading-stack"><div class="progress-shell"><div id="progress-fill" class="progress-fill"></div></div><p id="progress-text" class="progress-text">0%</p></div>'
  );
  root.appendChild(panel);

  const progressFill = panel.querySelector('#progress-fill');
  const progressText = panel.querySelector('#progress-text');

  return {
    show() {
      panel.classList.remove('hidden');
    },
    hide() {
      panel.classList.add('hidden');
    },
    setProgress(value) {
      const progress = Math.round(Math.min(100, Math.max(0, value * 100)));
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `${progress}%`;
    }
  };
}

export function createHud(root) {
  const hud = document.createElement('div');
  hud.id = 'hud';
  hud.className = 'hidden';
  hud.innerHTML =
    '<section class="hud-chip"><span class="hud-label">Pilot</span><strong id="username" class="hud-value">Pilot</strong></section><section class="hud-chip"><span class="hud-label">Score</span><strong id="score" class="hud-value">0</strong></section><section class="hud-chip"><span class="hud-label">Timer</span><strong id="timer" class="hud-value">00:00</strong></section><section class="hud-chip"><span class="hud-label">K Coins</span><strong id="coins" class="hud-value">0</strong></section><section class="hud-chip hud-chip-combo"><span class="hud-label">Combo</span><strong id="combo" class="hud-value">x1.00</strong></section>';
  root.appendChild(hud);

  const username = hud.querySelector('#username');
  const score = hud.querySelector('#score');
  const timer = hud.querySelector('#timer');
  const coins = hud.querySelector('#coins');
  const combo = hud.querySelector('#combo');

  return {
    update(nextState) {
      username.textContent = nextState.username;
      score.textContent = nextState.score.toLocaleString();
      timer.textContent = formatTime(nextState.time);
      coins.textContent = String(nextState.coins);
      combo.textContent = formatComboMultiplier(nextState.combo);
    },
    show() {
      hud.classList.remove('hidden');
    },
    hide() {
      hud.classList.add('hidden');
    }
  };
}

export function createFeedbackLayer(root) {
  const layer = document.createElement('div');
  layer.id = 'feedback-layer';
  root.appendChild(layer);

  let timeoutId = null;

  return {
    pulse(kind = 'coin') {
      layer.className = kind;
      layer.classList.remove('active');
      void layer.offsetWidth;
      layer.classList.add('active');

      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => layer.classList.remove('active'), kind === 'collision' ? 260 : 180);
    }
  };
}
