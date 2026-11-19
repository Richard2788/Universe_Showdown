/**
 * Botão de tela cheia para dispositivos móveis.
 *
 * - Só aparece se o navegador suportar Fullscreen API (iPhone Safari não suporta).
 * - Ao entrar: tenta travar orientação em paisagem (best-effort, try/catch).
 * - Ao sair: libera a travas de orientação.
 * - Sincroniza aria-pressed / aria-label / data-fullscreen nos eventos
 *   fullscreenchange e fullscreenerror.
 * O botão deve conter dois ícones visíveis via CSS:
 *   [data-fullscreen="false"] .fs-enter  (entrar)
 *   [data-fullscreen="true"]  .fs-exit   (sair)
 */
export class FullscreenToggle {
  /**
   * @param {HTMLElement} button botão #fullscreen
   * @param {Element} [target] elemento a colocar em fullscreen (padrão: document.documentElement)
   */
  constructor(button, target = document.documentElement) {
    this.button = button;
    this.target = target;
    this.enabled = this._supportsFullscreen();
    if (!this.enabled) {
      this.button.hidden = true;
      return;
    }
    this._bind();
    this.sync();
  }

  _supportsFullscreen() {
    const d = document;
    return !!(
      d.fullscreenEnabled ||
      d.webkitFullscreenEnabled ||
      d.msFullscreenEnabled
    );
  }

  _request() {
    const t = this.target;
    const fn =
      t.requestFullscreen ||
      t.webkitRequestFullscreen ||
      t.msRequestFullscreen;
    if (!fn) return;
    const promise = fn.call(t, { navigationUI: 'hide' });
    if (promise && typeof promise.then === 'function') {
      promise.catch(() => {}); // silencia recusa do navegador
    }
    this._tryLockLandscape();
  }

  _tryLockLandscape() {
    if (typeof screen === 'undefined' || !screen.orientation) return;
    try {
      screen.orientation.lock('landscape');
    } catch (_) {
      // navegador não permite travar (ex.: desktop) — segue sem travar
    }
  }

  _exit() {
    const d = document;
    const fn = d.exitFullscreen || d.webkitExitFullscreen || d.msExitFullscreen;
    if (!fn) return;
    const promise = fn.call(d);
    if (promise && typeof promise.then === 'function') {
      promise.catch(() => {});
    }
    this._unlockOrientation();
  }

  _unlockOrientation() {
    if (typeof screen === 'undefined' || !screen.orientation) return;
    try {
      if (screen.orientation.type !== 'default') screen.orientation.unlock();
    } catch (_) {
      // ignora
    }
  }

  _bind() {
    this.button.addEventListener('click', (event) => {
      event.preventDefault();
      const isFull = this._isFullscreen();
      if (isFull) this._exit(); else this._request();
    });

    const onChange = () => this.sync();
    for (const event of [
      'fullscreenchange',
      'webkitfullscreenchange',
      'msfullscreenchange',
      'fullscreenerror',
      'webkitfullscreenerror',
      'msfullscreenerror',
    ]) {
      document.addEventListener(event, onChange);
    }
  }

  _isFullscreen() {
    const d = document;
    return !!(
      d.fullscreenElement ||
      d.webkitFullscreenElement ||
      d.msFullscreenElement
    );
  }

  sync() {
    if (!this.button) return;
    const full = this._isFullscreen();
    this.button.setAttribute('aria-pressed', String(full));
    this.button.setAttribute('data-fullscreen', String(full));
    this.button.setAttribute(
      'aria-label',
      full ? 'Sair da tela cheia' : 'Tela cheia'
    );
  }
}
