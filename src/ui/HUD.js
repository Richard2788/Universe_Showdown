/**
 * HUD em DOM (não em Canvas).
 *
 * Centraliza TODA a escrita de estado da partida nos elementos de interface,
 * que antes estava espalhada no `Game.js` (render/startMatch/setDifficulty).
 * O renderer desenha apenas a arena; a interface é responsabilidade daqui.
 *
 * O HUD só LÊ o estado recebido e escreve no DOM — não simula nada.
 */
export class HUD {
  /** @param {Document|HTMLElement} [root=document] */
  constructor(root = document) {
    this.playerHealth = root.querySelector('#player-health');
    this.enemyHealth = root.querySelector('#enemy-health');
    this.playerHealthLabel = root.querySelector('#player-health-label');
    this.enemyHealthLabel = root.querySelector('#enemy-health-label');
    this.status = root.querySelector('#status');
    this.playerLabel = root.querySelector('#player-label');
    this.enemyLabel = root.querySelector('#enemy-label');
  }

  /**
   * Sincroniza vida e status (chamado a cada render, como antes).
   * @param {{ health: number }} player
   * @param {{ health: number }} enemy
   */
  sync(player, enemy) {
    this.playerHealth.style.width = player.health + '%';
    this.enemyHealth.style.width = enemy.health + '%';
    this.playerHealthLabel.textContent = Math.ceil(player.health);
    this.enemyHealthLabel.textContent = Math.ceil(enemy.health);
    this.status.textContent = player.health <= 0 || enemy.health <= 0 ? 'ROUND END' : 'READY';
  }

  /**
   * Rótulos ao iniciar uma partida (modo e dificuldade da CPU).
   * @param {'pvc'|'cvc'} mode
   * @param {string} difficultyLabel
   */
  setMatchLabels(mode, difficultyLabel) {
    const cvc = mode === 'cvc';
    this.playerLabel.textContent = cvc ? `CPU 01 · ${difficultyLabel}` : 'PLAYER 01';
    this.enemyLabel.textContent = cvc ? `CPU 02 · ${difficultyLabel}` : `CPU · ${difficultyLabel}`;
  }

  /**
   * Atualiza só o rótulo da dificuldade em partida (atalhos 1/2/3).
   * No menu, nada é escrito (mesmo comportamento anterior).
   * @param {'menu'|'pvc'|'cvc'} mode
   * @param {string} difficultyLabel
   */
  setDifficultyLabel(mode, difficultyLabel) {
    if (mode === 'menu') return;
    this.enemyLabel.textContent = mode === 'cvc' ? `CPU 02 · ${difficultyLabel}` : `CPU · ${difficultyLabel}`;
    if (mode === 'cvc') this.playerLabel.textContent = `CPU 01 · ${difficultyLabel}`;
  }
}
