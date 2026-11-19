/**
 * Mapeamento de controles: teclado → ações unificadas.
 *
 * As ações são a linguagem comum entre teclado, touch e (futuro) gamepad.
 * O debounce de borda de subida continua no `Fighter` — aqui só traduzimos
 * teclas para nomes de ação, como o `main.js` já fazia.
 */

/** Tecla (minúscula) → ação. `event.key` de espaço é ' '. */
export const KEY_MAP = Object.freeze({
  a: 'left', arrowleft: 'left',
  d: 'right', arrowright: 'right',
  w: 'jump', arrowup: 'jump', ' ': 'jump',
  s: 'crouch', arrowdown: 'crouch',
  j: 'lightAttack', k: 'mediumAttack', l: 'heavyAttack', u: 'kick',
  shift: 'run',
});

/** Atalhos 1/2/3 de dificuldade (menu e em partida). */
export const DIFFICULTY_SHORTCUTS = Object.freeze({
  1: 'facil',
  2: 'medio',
  3: 'dificil',
});

/** Atalho M: abre o menu de início. */
export const MENU_SHORTCUT = 'm';
