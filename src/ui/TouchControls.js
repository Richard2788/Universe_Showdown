/**
 * Controles touchscreen (Pointer Events multi-touch).
 *
 * Extraído do `main.js` sem mudança de comportamento:
 * - um `pointerId` só pode segurar um botão por vez (`pressed`);
 * - dois dedos no MESMO botão mantêm a ação ativa até o último soltar;
 * - `pointerup`, `pointercancel` e `lostpointercapture` liberam o dedo;
 * - blur, `visibilitychange` (oculto) e `pagehide` soltam tudo.
 */
export class TouchControls {
  /**
   * @param {HTMLElement} container elemento `#touch-controls`
   * @param {import('../core/InputManager.js').InputManager} input
   */
  constructor(container, input) {
    this.container = container;
    this.input = input;
    this.pressed = new Map();
    this.actionButtons = [...container.querySelectorAll('[data-action]')];
    this.listeners = [];
    this.bind();
  }

  bind() {
    for (const button of this.actionButtons) {
      const down = (event) => this.press(button, event);
      const up = (event) => this.releasePointer(event.pointerId);
      this.addListener(button, 'pointerdown', down);
      this.addListener(button, 'pointerup', up);
      this.addListener(button, 'pointercancel', up);
      this.addListener(button, 'lostpointercapture', up);
    }
    this.addListener(window, 'blur', () => this.clear());
    this.addListener(window, 'pagehide', () => this.clear());
    this.addListener(document, 'visibilitychange', () => {
      if (document.hidden) this.clear();
    });
  }

  addListener(target, type, handler) {
    target.addEventListener(type, handler);
    this.listeners.push([target, type, handler]);
  }

  press(button, event) {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    this.pressed.set(event.pointerId, button.dataset.action);
    button.classList.add('is-pressed');
    this.input.set(button.dataset.action, true, 'touch');
  }

  releasePointer(pointerId) {
    const action = this.pressed.get(pointerId);
    if (!action) return;
    this.pressed.delete(pointerId);
    const stillHeld = [...this.pressed.values()].includes(action);
    this.input.set(action, stillHeld, 'touch');
    if (!stillHeld) {
      this.actionButtons.find((button) => button.dataset.action === action)?.classList.remove('is-pressed');
    }
  }

  /** Solta todos os dedos ativos (blur, aba oculta, saída da página). */
  clear() {
    for (const pointerId of [...this.pressed.keys()]) this.releasePointer(pointerId);
  }

  /** No modo espectador (CPU vs CPU) os controles ficam ocultos. */
  setSpectator(spectator) {
    this.container.classList.toggle('is-hidden', spectator);
  }

  destroy() {
    this.clear();
    for (const [target, type, handler] of this.listeners) target.removeEventListener(type, handler);
    this.listeners = [];
  }
}
