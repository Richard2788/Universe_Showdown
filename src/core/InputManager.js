/**
 * Entrada unificada.
 *
 * Guarda o estado das ações e QUEM as segura (fonte: 'keyboard', 'touch',
 * 'gamepad', ...). Uma ação só fica inativa quando nenhuma fonte a segura —
 * exatamente a regra que estava embutida no `Game.js`.
 *
 * Este módulo não interpreta combate: apenas responde "a ação está ativa?".
 */
export class InputManager {
  constructor() {
    this.actions = Object.create(null);
    this.sources = new Map();
  }

  /**
   * Liga/desliga uma ação para uma fonte.
   * @param {string} action
   * @param {boolean} value
   * @param {string} [source='default']
   */
  set(action, value, source = 'default') {
    if (!this.sources.has(action)) this.sources.set(action, new Set());
    const active = this.sources.get(action);
    if (value) active.add(source); else active.delete(source);
    this.actions[action] = active.size > 0;
  }

  /** Solta todas as ações e fontes (reset de partida, blur, visibility). */
  clear() {
    this.actions = Object.create(null);
    this.sources.clear();
  }

  /**
   * Liga o teclado ao InputManager.
   *
   * Preserva o comportamento do `main.js` anterior:
   * - atalhos (menu/dificuldade) são consultados ANTES do mapa de ações e não
   *   chamam `preventDefault`;
   * - `keydown` adiciona `event.key` ao conjunto e liga a ação;
   * - `keyup` só desliga a ação se nenhuma outra tecla mapeada para ela
   *   continua pressionada (ex.: A + ←);
   * - `blur` solta as teclas e limpa o input.
   *
   * @param {Window|HTMLElement} target
   * @param {Record<string, string>} keyMap tecla minúscula → ação
   * @param {{ onShortcut?: (raw: string, event: KeyboardEvent) => boolean }} [options]
   * @returns {() => void} função para remover os listeners
   */
  bindKeyboard(target, keyMap, { onShortcut } = {}) {
    const keys = new Set();

    const handleKeyDown = (event) => {
      const raw = event.key.toLowerCase();
      if (onShortcut?.(raw, event)) return;
      const action = keyMap[raw];
      if (!action) return;
      event.preventDefault();
      keys.add(event.key);
      this.set(action, true, 'keyboard');
    };

    const handleKeyUp = (event) => {
      const action = keyMap[event.key.toLowerCase()];
      if (!action) return;
      keys.delete(event.key);
      this.set(action, [...keys].some((key) => keyMap[key.toLowerCase()] === action), 'keyboard');
    };

    const handleBlur = () => {
      keys.clear();
      this.clear();
    };

    target.addEventListener('keydown', handleKeyDown);
    target.addEventListener('keyup', handleKeyUp);
    target.addEventListener('blur', handleBlur);

    return () => {
      target.removeEventListener('keydown', handleKeyDown);
      target.removeEventListener('keyup', handleKeyUp);
      target.removeEventListener('blur', handleBlur);
    };
  }
}
