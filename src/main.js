import { createGame } from './systems/gameLoop.js';
import { createStartScreen, createGameOverScreen, createHud, createFeedbackLayer, createLoadingScreen } from './ui/screens.js';
import { loadUsername, saveUsername } from './utils/storage.js';

const app = document.getElementById('app');

const hud = createHud(app);
const feedback = createFeedbackLayer(app);
const startScreen = createStartScreen(app);
const gameOverScreen = createGameOverScreen(app);
const loadingScreen = createLoadingScreen(app);
let currentUsername = 'Pilot';
let launchingRun = false;

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

async function launchRun(username) {
  if (launchingRun) return;
  launchingRun = true;
  loadingScreen.setProgress(0);
  loadingScreen.show();
  hud.hide();

  const stopProgress = game.onLoadProgress((progress) => {
    loadingScreen.setProgress(progress);
  });

  try {
    await game.ready();
    loadingScreen.setProgress(1);
    loadingScreen.hide();
    hud.show();
    game.start(username);
  } finally {
    stopProgress();
    launchingRun = false;
  }
}

startScreen.onStart(async (username) => {
  currentUsername = username;
  saveUsername(username);
  gameOverScreen.hide();
  startScreen.hide();
  await launchRun(username);
});

gameOverScreen.onRestart(async () => {
  gameOverScreen.hide();
  startScreen.hide();
  await launchRun(currentUsername);
});
