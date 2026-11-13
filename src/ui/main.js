import { GAME } from '../engine/vocab.js';

const STAGE_W = 1920;
const STAGE_H = 1080;

document.title = GAME.title;
document.getElementById('game-title').textContent = GAME.title;

const stage = document.getElementById('stage');

// Scale the fixed 1920×1080 stage to fit the window, keeping its aspect ratio.
function fitStage() {
  const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

window.addEventListener('resize', fitStage);
fitStage();
