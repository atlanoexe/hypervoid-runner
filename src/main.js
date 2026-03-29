import { createGame } from './systems/gameLoop.js';
import {
  createHomeScreen,
  createScoreScreen,
  createHud,
  createFeedbackLayer,
  createLoadingScreen
} from './ui/screens.js';
import { loadUsername, saveUsername } from './utils/storage.js';

const app = document.getElementById('app');

const hud = createHud(app);
const feedback = createFeedbackLayer(app);
const homeScreen = createHomeScreen(app);
const scoreScreen = createScoreScreen(app);
const loadingScreen = createLoadingScreen(app);
let currentUsername = 'Pilot';
let launchingRun = false;

const game = createGame(app, {
  onScore: (state) => hud.update(state),
  onFeedback: (kind) => feedback.pulse(kind),
  onGameOver: ({ score, coins, time, username, combo, bestCombo }) => {
    currentUsername = username;
    hud.hide();
    scoreScreen.show({ username, score, coins, time, combo, bestCombo });
  }
});

const initialName = loadUsername() ?? '';
homeScreen.setName(initialName);
homeScreen.show();

async function launchRun(username) {
  if (launchingRun) return;
  launchingRun = true;
  loadingScreen.setProgress(0);
  loadingScreen.show();
  hud.hide();
  scoreScreen.hide();
  homeScreen.hide();

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

homeScreen.onStart(async (username) => {
  currentUsername = username;
  saveUsername(username);
  await launchRun(username);
});

scoreScreen.onReturnHome(() => {
  scoreScreen.hide();
  homeScreen.setName(currentUsername);
  homeScreen.show();
});
