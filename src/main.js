import { createGame } from './systems/gameLoop.js';
import { createStartScreen, createGameOverScreen, createHud } from './ui/screens.js';
import { loadUsername, saveUsername, saveBestScore, loadBestScore } from './utils/storage.js';

const app = document.getElementById('app');

const hud = createHud(app);
const startScreen = createStartScreen(app);
const gameOverScreen = createGameOverScreen(app);

const game = createGame(app, {
  onScore: (score, speed) => hud.update(score, speed),
  onGameOver: ({ score, username }) => {
    hud.hide();
    const best = loadBestScore(username);
    if (score > best) saveBestScore(username, score);
    gameOverScreen.show({ score, best: loadBestScore(username) });
  }
});

const initialName = loadUsername() ?? '';
startScreen.setName(initialName);
startScreen.show();

startScreen.onStart((username) => {
  saveUsername(username);
  gameOverScreen.hide();
  startScreen.hide();
  hud.show();
  game.start(username);
});

gameOverScreen.onRestart(() => {
  startScreen.show();
});
