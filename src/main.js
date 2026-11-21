import './styles/main.css';
import { Game } from './game/Game.js';
import { KEY_MAP, DIFFICULTY_SHORTCUTS, MENU_SHORTCUT } from './config/controls.js';
import { TouchControls } from './ui/TouchControls.js';
import { FullscreenToggle } from './ui/FullscreenToggle.js';

// Captura de erros globais para depuração no celular
window.onerror = (msg, url, line, col, error) => {
  console.error('[Universe Showdown] JS error:', msg, { url, line, col, error });
  // Mostra o overlay de erro no celular (index.html expõe window.__showAppError).
  if (typeof window.__showAppError === 'function') {
    window.__showAppError(
      msg,
      url,
      line,
      col,
      error ? error.stack : '(sem stack)'
    );
  }
  return false;
};

window.onunhandledrejection = (event) => {
  console.error('[Universe Showdown] Promise rejection unhandled:', event.reason);
};

const canvas = document.querySelector('#arena');
const game = new Game(canvas);
game.start();

// ── Controles touchscreen (Pointer Events multi-touch) ──
const touch = new TouchControls(document.querySelector('#touch-controls'), game.input);

document.querySelector('#reset').addEventListener('click', () => game.reset());
new FullscreenToggle(document.querySelector('#fullscreen'));
// Mesmo toggle dentro do menu de início (visível antes da partida começar).
new FullscreenToggle(document.querySelector('#fullscreen-menu'));

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
  touch.setSpectator(game.mode === 'cvc');
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
document.querySelector('#menu-close').addEventListener('click', () => {
  menuOverlay.classList.remove('is-open');
  game.closeMenu();
  syncModeUI();
});

// ── Teclado: ações + atalhos de menu/dificuldade ──
game.input.bindKeyboard(window, KEY_MAP, {
  onShortcut: (raw) => {
    // 1/2/3 = dificuldade; M = abrir menu (quando fechado).
    const diff = DIFFICULTY_SHORTCUTS[raw];
    if (diff) {
      selectedDiff = diff;
      selectDiffButton(diff);
      game.setDifficulty(diff);
      return true;
    }
    if (raw === MENU_SHORTCUT && !menuOverlay.classList.contains('is-open')) {
      openMenu();
      return true;
    }
    if (raw.toLowerCase() === 'f') {
      const fsButton = document.querySelector('#fullscreen');
      if (fsButton && !fsButton.hidden) fsButton.click();
      return true;
    }
    return false;
  },
});