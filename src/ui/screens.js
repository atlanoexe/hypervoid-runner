function formatTime(seconds) {
  const whole = Math.floor(seconds);
  const mins = String(Math.floor(whole / 60)).padStart(2, '0');
  const secs = String(whole % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function cardTemplate(title, bodyHtml) {
  const panel = document.createElement('div');
  panel.className = 'panel hidden';
  panel.innerHTML = `<section class="card"><h2>${title}</h2>${bodyHtml}</section>`;
  return panel;
}

export function createStartScreen(root) {
  const panel = cardTemplate(
    'Hypervoid Runner',
    '<p class="lede">Thread the digital tunnel, collect K coins, and dodge shifting hazards.</p><label class="field"><span>Pilot</span><input id="name" maxlength="24" placeholder="Enter username" /></label><div class="hint-list"><span>Desktop: A / D / W / S or Arrow Keys</span><span>Mobile: drag in any direction for direct movement</span></div><button id="start">Launch Run</button>'
  );
  root.appendChild(panel);

  const input = panel.querySelector('#name');
  const button = panel.querySelector('#start');

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
    setName(name) { input.value = name; },
    show() {
      panel.classList.remove('hidden');
      requestAnimationFrame(() => input.focus());
    },
    hide() { panel.classList.add('hidden'); }
  };
}

export function createGameOverScreen(root) {
  const panel = cardTemplate(
    'Run Failed',
    '<p class="lede">The tunnel collapsed around your ship.</p><div class="results"><p id="pilot"></p><p id="score"></p><p id="coins"></p><p id="time"></p></div><button id="restart">Restart</button>'
  );
  root.appendChild(panel);

  const pilotText = panel.querySelector('#pilot');
  const scoreText = panel.querySelector('#score');
  const coinsText = panel.querySelector('#coins');
  const timeText = panel.querySelector('#time');
  const button = panel.querySelector('#restart');

  return {
    show({ username, score, coins, time }) {
      pilotText.textContent = `Pilot: ${username}`;
      scoreText.textContent = `Final Score: ${score.toLocaleString()}`;
      coinsText.textContent = `K Coins: ${coins}`;
      timeText.textContent = `Survival Time: ${formatTime(time)}`;
      panel.classList.remove('hidden');
    },
    hide() { panel.classList.add('hidden'); },
    onRestart(cb) { button.onclick = cb; }
  };
}

export function createHud(root) {
  const hud = document.createElement('div');
  hud.id = 'hud';
  hud.className = 'hidden';
  hud.innerHTML = '<section class="hud-chip"><span class="hud-label">Pilot</span><strong id="username" class="hud-value">Pilot</strong></section><section class="hud-chip"><span class="hud-label">Score</span><strong id="score" class="hud-value">0</strong></section><section class="hud-chip"><span class="hud-label">Timer</span><strong id="timer" class="hud-value">00:00</strong></section><section class="hud-chip"><span class="hud-label">K Coins</span><strong id="coins" class="hud-value">0</strong></section>';
  root.appendChild(hud);

  const username = hud.querySelector('#username');
  const score = hud.querySelector('#score');
  const timer = hud.querySelector('#timer');
  const coins = hud.querySelector('#coins');

  return {
    update(nextState) {
      username.textContent = nextState.username;
      score.textContent = nextState.score.toLocaleString();
      timer.textContent = formatTime(nextState.time);
      coins.textContent = String(nextState.coins);
    },
    show() { hud.classList.remove('hidden'); },
    hide() { hud.classList.add('hidden'); }
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
