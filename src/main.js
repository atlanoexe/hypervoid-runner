import { createGame } from './systems/gameLoop.js';
import { createStartScreen, createGameOverScreen, createHud, createFeedbackLayer } from './ui/screens.js';
import { loadUsername, saveUsername } from './utils/storage.js';

const app = document.getElementById('app');

const hud = createHud(app);
const feedback = createFeedbackLayer(app);
const startScreen = createStartScreen(app);
const gameOverScreen = createGameOverScreen(app);
let currentUsername = 'Pilot';

const game = createGame(app, {
  onScore: (state) => hud.update(state),
  onFeedback: (kind) => feedback.pulse(kind),
  onGameOver: ({ score, coins, time, username }) => {
    currentUsername = username;
    hud.hide();
    gameOverScreen.show({ username, score, coins, time });
  }
});

const initialName = loadUsername() ?? '';
startScreen.setName(initialName);
startScreen.show();

startScreen.onStart((username) => {
  currentUsername = username;
  saveUsername(username);
  gameOverScreen.hide();
  startScreen.hide();
  hud.show();
  game.start(username);
});

gameOverScreen.onRestart(() => {
  gameOverScreen.hide();
  startScreen.hide();
  hud.show();
  game.start(currentUsername);
});
