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
  game.input.set(action, false);
  pressed.delete(pointerId);
  const stillHeld = [...pressed.values()].includes(action);
  if (!stillHeld) actionButtons.find((button) => button.dataset.action === action)?.classList.remove('is-pressed');
}
actionButtons.forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    pressed.set(event.pointerId, button.dataset.action);
    button.classList.add('is-pressed');
    game.input.set(button.dataset.action, true);
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

const keyMap = { a:'left', arrowleft:'left', d:'right', arrowright:'right', w:'jump', arrowup:'jump', s:'crouch', arrowdown:'crouch', j:'lightAttack', k:'mediumAttack', l:'heavyAttack', u:'kick' };
const keys = new Set();
window.addEventListener('keydown', (event) => {
  const action = keyMap[event.key.toLowerCase()];
  if (!action) return;
  event.preventDefault();
  keys.add(event.key);
  game.input.set(action, true);
});
window.addEventListener('keyup', (event) => {
  const action = keyMap[event.key.toLowerCase()];
  if (!action) return;
  keys.delete(event.key);
  game.input.set(action, [...keys].some((key) => keyMap[key.toLowerCase()] === action));
});
window.addEventListener('blur', () => { keys.clear(); game.input.clear(); });

document.querySelector('#reset').addEventListener('click', () => game.reset());
