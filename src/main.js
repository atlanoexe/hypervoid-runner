import { createGame } from './systems/gameLoop.js';
import { createStartScreen, createGameOverScreen, createHud, createFeedbackLayer } from './ui/screens.js';
import { loadUsername, saveUsername } from './utils/storage.js';

const app = document.getElementById('app');

const hud = createHud(app);
const feedback = createFeedbackLayer(app);
const startScreen = createStartScreen(app);
const gameOverScreen = createGameOverScreen(app);

const game = createGame(app, {
  onScore: (state) => hud.update(state),
  onFeedback: (kind) => feedback.pulse(kind),
  onGameOver: ({ score, coins, time, username }) => {
    hud.hide();
    gameOverScreen.show({ username, score, coins, time });
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
