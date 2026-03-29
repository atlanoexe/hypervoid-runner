function cardTemplate(title, bodyHtml) {
  const panel = document.createElement('div');
  panel.className = 'panel hidden';
  panel.innerHTML = `<section class="card"><h2>${title}</h2>${bodyHtml}</section>`;
  return panel;
}

export function createStartScreen(root) {
  const panel = cardTemplate('Hypervoid Runner', '<p>Race the tunnel, collect K coins, and dodge hazards.</p><input id="name" maxlength="24" placeholder="Enter username" /><button id="start">Start Game</button>');
  root.appendChild(panel);

  const input = panel.querySelector('#name');
  const button = panel.querySelector('#start');

  return {
    onStart(cb) {
      button.onclick = () => {
        const name = (input.value || 'Pilot').trim().slice(0, 24);
        cb(name || 'Pilot');
      };
    },
    setName(name) { input.value = name; },
    show() { panel.classList.remove('hidden'); },
    hide() { panel.classList.add('hidden'); }
  };
}

export function createGameOverScreen(root) {
  const panel = cardTemplate('Run Failed', '<p id="score"></p><p id="best"></p><button id="restart">Restart</button>');
  root.appendChild(panel);

  const scoreText = panel.querySelector('#score');
  const bestText = panel.querySelector('#best');
  const button = panel.querySelector('#restart');

  return {
    show({ score, best }) {
      scoreText.textContent = `Score: ${score} K`;
      bestText.textContent = `Best: ${best} K`;
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
  hud.innerHTML = '<span id="score">K Coins: 0</span><span id="speed">Speed: 1.0x</span>';
  root.appendChild(hud);

  const score = hud.querySelector('#score');
  const speed = hud.querySelector('#speed');

  return {
    update(nextScore, nextSpeed) {
      score.textContent = `K Coins: ${nextScore}`;
      speed.textContent = `Speed: ${nextSpeed.toFixed(2)}x`;
    },
    show() { hud.classList.remove('hidden'); },
    hide() { hud.classList.add('hidden'); }
  };
}
