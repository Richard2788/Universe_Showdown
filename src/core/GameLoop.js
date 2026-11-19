/**
 * Loop de jogo com timestep fixo.
 *
 * Extraído do `Game.js` sem mudança de comportamento:
 * - `requestAnimationFrame` agenda o próximo frame;
 * - o delta é limitado a `maxDelta` (0,1 s) para evitar espiral da morte;
 * - a simulação roda em passos fixos (`step`) enquanto houver acumulador;
 * - o render roda uma vez por frame, na taxa variável do navegador;
 * - exceções em update/render são registradas, mas NÃO interrompem o loop.
 *
 * O loop não conhece regras de jogo: recebe `update` e `render` prontos.
 */
export class GameLoop {
  /**
   * @param {object} options
   * @param {(dt: number) => void} options.update passo fixo da simulação
   * @param {() => void} options.render desenho na taxa do navegador
   * @param {number} [options.step=1/60]
   * @param {number} [options.maxDelta=0.1]
   * @param {(error: unknown) => void} [options.onError]
   */
  constructor({ update, render, step = 1 / 60, maxDelta = 0.1, onError }) {
    this.update = update;
    this.render = render;
    this.step = step;
    this.maxDelta = maxDelta;
    this.onError = onError ?? ((error) => console.error('[Universe Showdown] erro no loop:', error));
    this.lastTime = 0;
    this.accumulator = 0;
    this.running = false;
    this.frame = this.frame.bind(this);
  }

  /** Inicia o loop (idempotente: chamadas extras não duplicam o rAF). */
  start() {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(this.frame);
  }

  /** Para de agendar novos frames. */
  stop() {
    this.running = false;
  }

  /** Um frame de rAF: simula em passos fixos e renderiza uma vez. */
  frame(time) {
    if (!this.running) return;
    try {
      const delta = Math.min((time - (this.lastTime || time)) / 1000, this.maxDelta);
      this.lastTime = time;
      this.accumulator += delta;
      while (this.accumulator >= this.step) {
        this.update(this.step);
        this.accumulator -= this.step;
      }
      this.render();
    } catch (error) {
      this.onError(error);
    }
    if (this.running) requestAnimationFrame(this.frame);
  }
}
