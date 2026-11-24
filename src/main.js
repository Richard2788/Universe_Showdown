import './styles/main.css';
import { Game } from './game/Game.js';
import { PHASES, formatScore } from './config/match.js';
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
window.__game = game; // TEMP: verificação manual no navegador

// ── Controles touchscreen (Pointer Events multi-touch) ──
const touch = new TouchControls(document.querySelector('#touch-controls'), game.input);

document.querySelector('#reset').addEventListener('click', () => game.reset());
new FullscreenToggle(document.querySelector('#fullscreen'));
// Mesmo toggle dentro do menu de início (visível antes da partida começar).
new FullscreenToggle(document.querySelector('#fullscreen-menu'));

// ── Menu de início: campanha, dificuldade e modos ──
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

// Chips das 5 fases da campanha (fonte: src/config/match.js).
const phasesBox = document.querySelector('#menu-phases');
if (phasesBox) {
  phasesBox.innerHTML = PHASES.map((phase, i) => (
    `<span${i === PHASES.length - 1 ? ' class="is-boss"' : ''}><b>${i + 1} · ${phase.name}</b>${phase.title}</span>`
  )).join('');
}

// ── Tela de resultado da fase/campanha ──
const resultOverlay = document.querySelector('#result-overlay');
const resultCard = resultOverlay.querySelector('.result-card');
const resultKicker = document.querySelector('#result-kicker');
const resultTitle = document.querySelector('#result-title');
const resultSub = document.querySelector('#result-sub');
const resultStats = document.querySelector('#result-stats');
const resultScore = document.querySelector('#result-score');
const resultPrimary = document.querySelector('#result-primary');
let resultAction = null;

function showResult(event) {
  const final = event.type === 'campaignEnd';
  const won = final || Boolean(event.won);
  const phaseNo = (event.phaseIndex ?? 0) + 1;
  const total = event.phaseCount ?? PHASES.length;
  const phaseName = event.phase?.name ?? 'OPONENTE';

  resultCard.classList.toggle('is-win', won);
  resultCard.classList.toggle('is-loss', !won);
  resultKicker.textContent = final
    ? 'CAMPANHA CONCLUÍDA'
    : `FASE ${phaseNo}/${total} · ${won ? 'CONCLUÍDA' : 'FALHOU'}`;
  resultTitle.textContent = final ? 'CAMPEÃO DO UNIVERSO' : won ? 'VITÓRIA' : 'DERROTA';
  resultSub.textContent = final
    ? `${phaseName} derrotado · 5 fases concluídas`
    : `${phaseName} · ${event.playerWins} × ${event.enemyWins} rounds`;

  const rows = [
    ['BÔNUS DE FASE', `+${event.bonus ?? 0}`],
    ['ROUNDS', `${event.playerWins} × ${event.enemyWins}`],
    ['PERFEITO', event.perfect ? 'SIM' : 'NÃO'],
    ['ROUNDS VENCIDOS', event.stats?.roundsWon ?? 0],
    ['NOCAUTES', event.stats?.kos ?? 0],
  ];
  if (final) rows.push(['FASES VENCIDAS', event.stats?.phasesWon ?? 0]);
  resultStats.innerHTML = rows
    .map(([key, value]) => `<div><span>${key}</span><b>${value}</b></div>`)
    .join('');

  resultScore.textContent = formatScore(event.score ?? 0);
  resultPrimary.textContent = final ? 'JOGAR NOVAMENTE' : won ? 'PRÓXIMA FASE' : 'TENTAR NOVAMENTE';
  resultAction = final ? 'restart' : won ? 'continue' : 'retry';
  resultOverlay.classList.add('is-open');
}

game.onMatchEvent = (event) => {
  if (event.type === 'phaseEnd' || event.type === 'campaignEnd') showResult(event);
};

resultPrimary.addEventListener('click', () => {
  const action = resultAction;
  resultAction = null;
  resultOverlay.classList.remove('is-open');
  if (action === 'continue') game.continueCampaign();
  else if (action === 'retry') game.retryPhase();
  else if (action === 'restart') game.restartCampaign();
});

document.querySelector('#result-menu').addEventListener('click', () => {
  resultAction = null;
  resultOverlay.classList.remove('is-open');
  game.abandonCampaign();
  menuOverlay.classList.add('is-open');
  syncModeUI();
});

function syncModeUI() {
  // No modo espectador (CPU vs CPU) os controles de touch ficam ocultos.
  touch.setSpectator(game.mode === 'cvc');
}

function closeMenuAndStart(mode) {
  resultOverlay.classList.remove('is-open');
  menuOverlay.classList.remove('is-open');
  game.startMatch(mode);
  syncModeUI();
}

function openMenu() {
  // Enquanto o resultado da fase está aberto, ele tem prioridade sobre o menu.
  if (resultOverlay.classList.contains('is-open')) return;
  menuOverlay.classList.add('is-open');
  game.openMenu();
}

document.querySelector('#start-campaign').addEventListener('click', () => closeMenuAndStart('campanha'));
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