/**
 * RunDetector — duplo-toque na direção para acionar a corrida.
 *
 * Interpreta ações de direção (left/right) vindas do InputManager (teclado
 * ou touch) e devolve `true` enquanto a SEGUNDA pressão da mesma direção
 * estiver mantida. É puro: recebe o objeto de ações e o passo fixo, sem
 * depender de DOM/canvas — testável em `tests/run.test.mjs`.
 *
 * Regras:
 *   - um toque simples não corre (só arma na segunda pressão dentro da
 *     janela `RUN_TAP_WINDOW`);
 *   - soltar a direção desarma (o jogador precisa tocar de novo);
 *   - toques em direções diferentes não se misturam (esquerda arma
 *     somente para a esquerda);
 *   - o Shift (desktop) chega como `actions.run` e é ORado por fora,
 *     aqui no Game.update — este módulo não o vê.
 */
export const RUN_TAP_WINDOW = 0.28; // s entre toques que contam como duplo-toque

export class RunDetector {
  constructor(window = RUN_TAP_WINDOW) {
    this.window = window;
    this.time = 0;
    this.lastTap = { left: -Infinity, right: -Infinity };
    this.armed = { left: false, right: false };
    this.prev = { left: false, right: false };
  }

  /** Zera o tempo e o estado (reset de partida/round). */
  reset() {
    this.time = 0;
    this.lastTap = { left: -Infinity, right: -Infinity };
    this.armed = { left: false, right: false };
    this.prev = { left: false, right: false };
  }

  /**
   * Avança um passo fixo e devolve se a corrida está ativa.
   * @param {{left?: boolean, right?: boolean}} actions ações atuais
   * @param {number} dt passo fixo da simulação (s)
   * @returns {boolean}
   */
  update(actions, dt) {
    this.time += dt;
    let run = false;
    for (const dir of ['left', 'right']) {
      const pressed = Boolean(actions[dir]);
      if (pressed && !this.prev[dir]) {
        // Borda de subida: se a última pressão desta direção foi recente,
        // o duplo-toque vale e a corrida fica armada até soltar.
        if (this.time - this.lastTap[dir] <= this.window) this.armed[dir] = true;
        this.lastTap[dir] = this.time;
      }
      if (!pressed) this.armed[dir] = false; // soltar cancela
      if (this.armed[dir]) run = true;
      this.prev[dir] = pressed;
    }
    return run;
  }
}
