/**
 * HUD em DOM (não em Canvas).
 *
 * Centraliza TODA a escrita de estado da partida nos elementos de interface,
 * que antes estava espalhada no `Game.js` (render/startMatch/setDifficulty).
 * O renderer desenha apenas a arena; a interface é responsabilidade daqui.
 *
 * O HUD só LÊ o estado recebido e escreve no DOM — não simula nada.
 */
import { formatScore, formatTime } from '../config/match.js';

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
    // Elementos da campanha (rounds/tempo/pontuação).
    this.roundInfo = root.querySelector('.round-info');
    this.roundLabel = root.querySelector('#round-label');
    this.timer = root.querySelector('#timer');
    this.score = root.querySelector('#score');
    this.setCampaign(false);
  }

  /**
   * Sincroniza vida e status (chamado a cada render, como antes).
   * A barra usa a vida MÁXIMA do lutador: fases com oponentes mais fortes
   * continuam mostrando 100% quando estão cheios.
   * @param {{ health: number, maxHealth?: number }} player
   * @param {{ health: number, maxHealth?: number }} enemy
   */
  sync(player, enemy) {
    this.playerHealth.style.width = this.percent(player) + '%';
    this.enemyHealth.style.width = this.percent(enemy) + '%';
    this.playerHealthLabel.textContent = Math.ceil(player.health);
    this.enemyHealthLabel.textContent = Math.ceil(enemy.health);
    this.status.textContent = player.health <= 0 || enemy.health <= 0 ? 'ROUND END' : 'READY';
  }

  /** Vida em % da vida máxima (limitada a 0–100). */
  percent(fighter) {
    const max = fighter.maxHealth ?? 100;
    const pct = max > 0 ? (fighter.health / max) * 100 : 0;
    return Math.max(0, Math.min(100, pct));
  }

  /**
   * Liga/desliga o bloco de campanha (cronômetro + pontuação).
   * Na partida rápida o relógio fica oculto e o centro mostra só ROUND/status.
   * @param {boolean} active
   */
  setCampaign(active) {
    this.campaign = active;
    if (this.roundLabel) this.roundLabel.textContent = active ? 'FASE 1/5' : 'ROUND';
    if (this.timer) {
      this.timer.hidden = !active;
      if (!active) this.timer.textContent = '';
    }
    if (this.score) {
      this.score.hidden = !active;
      if (!active) this.score.textContent = '';
    }
    this.roundInfo?.classList?.remove('is-urgent');
  }

  /**
   * Rótulos ao iniciar uma fase da campanha.
   * @param {{ name: string }} phase
   * @param {number} phaseIndex índice 0-based
   * @param {number} phaseCount
   */
  setCampaignLabels(phase, phaseIndex, phaseCount) {
    this.playerLabel.textContent = 'PLAYER 01';
    this.enemyLabel.textContent = phase.name;
    if (this.roundLabel) {
      this.roundLabel.textContent = `FASE ${phaseIndex + 1}/${phaseCount}`;
    }
  }

  /** Escreve o relógio do round (segundos inteiros, 2 dígitos). */
  setTimer(seconds) {
    if (!this.timer) return;
    this.timer.hidden = false;
    this.timer.textContent = formatTime(seconds);
    const urgent = seconds <= 10;
    this.roundInfo?.classList?.toggle('is-urgent', urgent);
  }

  /** Escreve a pontuação total (zeros à esquerda). */
  setScore(score) {
    if (!this.score) return;
    this.score.hidden = false;
    this.score.textContent = formatScore(score);
  }

  /** Texto de status derivado do estado da campanha. */
  matchStatus(match) {
    switch (match.state) {
      case 'roundIntro': return 'PREPARE-SE';
      case 'fighting': return match.timeLeft <= 10 ? 'TEMPO!' : 'LUTE';
      case 'roundEnd': return match.lastRound?.ko ? 'K.O.' : 'TEMPO';
      case 'phaseEnd': return match.lastPhase?.won ? 'FASE CONCLUÍDA' : 'FASE FALHOU';
      case 'campaignEnd': return 'CAMPEÃO';
      default: return 'READY';
    }
  }

  /**
   * Sincroniza o bloco central com o MatchManager (campanha).
   * Chamado depois de `sync()` no render — por isso sobrescreve o status.
   * @param {import('../game/MatchManager.js').MatchManager} match
   */
  syncMatch(match) {
    if (!match || !match.isActive) return;
    if (this.roundLabel) {
      this.roundLabel.textContent = `FASE ${match.phaseIndex + 1}/${match.phaseCount} · R${match.roundNumber}`;
    }
    this.setTimer(match.timeLeft);
    this.setScore(match.score);
    this.status.textContent = this.matchStatus(match);
  }

  /**
   * Rótulos ao iniciar uma partida rápida (modo e dificuldade da CPU).
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
   * @param {'menu'|'pvc'|'cvc'|'campanha'} mode
   * @param {string} difficultyLabel
   */
  setDifficultyLabel(mode, difficultyLabel) {
    if (mode === 'menu') return;
    this.enemyLabel.textContent = mode === 'cvc' ? `CPU 02 · ${difficultyLabel}` : `CPU · ${difficultyLabel}`;
    if (mode === 'cvc') this.playerLabel.textContent = `CPU 01 · ${difficultyLabel}`;
  }
}
