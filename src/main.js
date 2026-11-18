import './styles/main.css';
import { Game } from './game/Game.js';

const canvas = document.querySelector('#arena');
const game = new Game(canvas);
game.start();

const pressed = new Map();
const controls = document.querySelector('#touch-controls');
const actionButtons = [...controls.querySelectorAll('[data-action]')];

function releasePointer(pointerId) {
  const action = pressed.get(pointerId);
  if (!action) return;
  pressed.delete(pointerId);
  const stillHeld = [...pressed.values()].includes(action);
  game.input.set(action, stillHeld, 'touch');
  if (!stillHeld) actionButtons.find((button) => button.dataset.action === action)?.classList.remove('is-pressed');
}
actionButtons.forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    pressed.set(event.pointerId, button.dataset.action);
    button.classList.add('is-pressed');
    game.input.set(button.dataset.action, true, 'touch');
  });
  button.addEventListener('pointerup', (event) => releasePointer(event.pointerId));
  button.addEventListener('pointercancel', (event) => releasePointer(event.pointerId));
  button.addEventListener('lostpointercapture', (event) => releasePointer(event.pointerId));
});
function clearTouch() {
  for (const pointerId of [...pressed.keys()]) releasePointer(pointerId);
}
window.addEventListener('blur', clearTouch);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearTouch(); });
window.addEventListener('pagehide', clearTouch);

const keyMap = { a:'left', arrowleft:'left', d:'right', arrowright:'right', w:'jump', arrowup:'jump', ' ':'jump', s:'crouch', arrowdown:'crouch', j:'lightAttack', k:'mediumAttack', l:'heavyAttack', u:'kick' };
const keys = new Set();
window.addEventListener('keydown', (event) => {
  const raw = event.key.toLowerCase();
  // ── Atalhos do menu/IA: 1/2/3 = dificuldade, M = abrir menu ──
  if (raw === '1' || raw === '2' || raw === '3') {
    const diff = ['facil', 'medio', 'dificil'][Number(raw) - 1];
    selectedDiff = diff;
    selectDiffButton(diff);
    game.setDifficulty(diff);
    return;
  }
  if (raw === 'm' && !menuOverlay.classList.contains('is-open')) {
    openMenu();
    return;
  }
  const action = keyMap[raw];
  if (!action) return;
  event.preventDefault();
  keys.add(event.key);
  game.input.set(action, true, 'keyboard');
});
window.addEventListener('keyup', (event) => {
  const action = keyMap[event.key.toLowerCase()];
  if (!action) return;
  keys.delete(event.key);
  game.input.set(action, [...keys].some((key) => keyMap[key.toLowerCase()] === action), 'keyboard');
});
window.addEventListener('blur', () => { keys.clear(); game.input.clear(); });

document.querySelector('#reset').addEventListener('click', () => game.reset());

// ── Menu de início: dificuldade da CPU + modo (jogar vs CPU / CPU vs CPU) ──
const menuOverlay = document.querySelector('#menu-overlay');
const diffButtons = [...menuOverlay.querySelectorAll('[data-diff]')];
// Pré-seleção: ?diff=... na URL; padrão FÁCIL (game.difficulty já valida).
let selectedDiff = game.difficulty;

function selectDiffButton(name) {
  diffButtons.forEach((button) => button.classList.toggle('is-selected', button.dataset.diff === name));
}
selectDiffButton(selectedDiff);

diffButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedDiff = button.dataset.diff;
    selectDiffButton(selectedDiff);
    game.setDifficulty(selectedDiff);
  });
});

function syncModeUI() {
  // No modo espectador (CPU vs CPU) os controles de touch ficam ocultos.
  const spectator = game.mode === 'cvc';
  document.querySelector('#touch-controls').classList.toggle('is-hidden', spectator);
}

function closeMenuAndStart(mode) {
  menuOverlay.classList.remove('is-open');
  game.startMatch(mode);
  syncModeUI();
}

function openMenu() {
  menuOverlay.classList.add('is-open');
  game.openMenu();
}

document.querySelector('#start-pvc').addEventListener('click', () => closeMenuAndStart('pvc'));
document.querySelector('#start-cvc').addEventListener('click', () => closeMenuAndStart('cvc'));
document.querySelector('#menu').addEventListener('click', openMenu);
