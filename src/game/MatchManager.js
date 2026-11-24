/**
 * MatchManager — regras da campanha de 5 fases.
 *
 * Mantém o estado de rounds, cronômetro e pontuação SEM conhecer DOM,
 * canvas ou `Fighter`. O `Game` informa a vida atual nos snapshots e reage
 * aos eventos (`roundStart`, `fight`, `roundEnd`, `phaseEnd`,
 * `campaignEnd`) para resetar posições, trocar o oponente e montar o HUD.
 */
import {
  PHASES, ROUNDS_TO_WIN, MATCH_TIMINGS, SCORE_RULES,
} from '../config/match.js';

const EMPTY_STATS = Object.freeze({
  roundsWon: 0,
  roundsLost: 0,
  perfects: 0,
  kos: 0,
  phasesWon: 0,
  damageDealt: 0,
});

export class MatchManager {
  /**
   * @param {object} [options]
   * @param {Array} [options.phases=PHASES] fases da campanha
   * @param {number} [options.roundsToWin=ROUNDS_TO_WIN] rounds para vencer uma fase
   * @param {(event: object) => void} [options.onEvent] callback de eventos
   */
  constructor({ phases = PHASES, roundsToWin = ROUNDS_TO_WIN, onEvent = null } = {}) {
    this.phases = phases;
    this.roundsToWin = roundsToWin;
    this.onEvent = onEvent;

    /** idle | roundIntro | fighting | roundEnd | phaseEnd | campaignEnd */
    this.state = 'idle';
    this.phaseIndex = 0;
    this.phase = null;
    this.roundNumber = 0;
    this.playerWins = 0;
    this.enemyWins = 0;
    this.timeLeft = 0;
    this.timer = 0;
    this.score = 0;
    this.phaseStartScore = 0;
    this.lastRound = null;
    this.lastPhase = null;
    this.stats = { ...EMPTY_STATS };
    this.phaseStartStats = { ...EMPTY_STATS };
  }

  get phaseCount() { return this.phases.length; }
  get isLastPhase() { return this.phaseIndex >= this.phases.length - 1; }
  get isActive() { return this.state !== 'idle'; }

  emit(type, payload = {}) {
    this.onEvent?.({ type, ...payload });
  }

  /** Snapshot padrão quando o Game não passa a vida atual. */
  normalizeSnapshot(snapshot = {}) {
    return {
      playerHealth: snapshot.playerHealth ?? 100,
      enemyHealth: snapshot.enemyHealth ?? 100,
      playerMaxHealth: snapshot.playerMaxHealth ?? 100,
      enemyMaxHealth: snapshot.enemyMaxHealth ?? 100,
    };
  }

  /** Começa a campanha do zero (fase 1, pontuação zerada). */
  startCampaign() {
    this.score = 0;
    this.stats = { ...EMPTY_STATS };
    this.phaseIndex = 0;
    this.startPhase(0);
  }

  /** Entra em uma fase; o Game configura o oponente no evento `phaseStart`. */
  startPhase(index = this.phaseIndex) {
    if (!this.phases[index]) return;
    this.phaseIndex = index;
    this.phase = this.phases[index];
    this.playerWins = 0;
    this.enemyWins = 0;
    this.roundNumber = 0;
    this.lastPhase = null;
    this.phaseStartScore = this.score;
    this.phaseStartStats = { ...this.stats };
    this.emit('phaseStart', {
      phase: this.phase,
      phaseIndex: this.phaseIndex,
      phaseCount: this.phaseCount,
      score: this.score,
    });
    this.startRound();
  }

  /** Inicia o próximo round da fase atual. */
  startRound() {
    if (!this.phase) return;
    this.roundNumber += 1;
    this.timeLeft = this.phase.timeLimit;
    this.lastRound = null;
    this.state = 'roundIntro';
    this.timer = MATCH_TIMINGS.roundIntro;
    this.emit('roundStart', {
      phase: this.phase,
      phaseIndex: this.phaseIndex,
      phaseCount: this.phaseCount,
      roundNumber: this.roundNumber,
      playerWins: this.playerWins,
      enemyWins: this.enemyWins,
      timeLeft: this.timeLeft,
    });
  }

  /**
   * Avança o relógio/transições da campanha.
   * @param {number} dt passo fixo (s)
   * @param {object} [snapshot] vida atual dos lutadores
   */
  update(dt, snapshot = {}) {
    if (this.state === 'roundIntro') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.state = 'fighting';
        this.emit('fight', {
          phase: this.phase,
          roundNumber: this.roundNumber,
          timeLeft: this.timeLeft,
        });
      }
      return;
    }

    if (this.state === 'fighting') {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft <= 0) {
        this.resolveRound('timeout', false, snapshot);
      }
      return;
    }

    if (this.state === 'roundEnd') {
      this.timer -= dt;
      if (this.timer > 0) return;
      if (this.isPhaseDecided()) this.endPhase();
      else this.startRound();
    }
  }

  /** Chamado pelo Game quando uma vida chega a zero. */
  notifyKO(winner, snapshot = {}) {
    if (this.state !== 'fighting') return null;
    return this.resolveRound(winner, true, snapshot);
  }

  isPhaseDecided() {
    return this.playerWins >= this.roundsToWin || this.enemyWins >= this.roundsToWin;
  }

  /**
   * Fecha o round, aplica a pontuação e agenda a transição.
   * @param {'player'|'enemy'|'draw'|'timeout'} winner
   * @param {boolean} ko vitória por nocaute?
   * @param {object} snapshot vida atual
   */
  resolveRound(winner, ko, snapshot = {}) {
    if (this.state !== 'fighting') return null;
    const s = this.normalizeSnapshot(snapshot);

    if (winner === 'timeout') {
      winner = s.playerHealth > s.enemyHealth ? 'player'
        : s.enemyHealth > s.playerHealth ? 'enemy'
          : 'draw';
    }

    const playerWon = winner === 'player';
    const perfect = playerWon && s.playerHealth >= s.playerMaxHealth;
    const damageDealt = Math.max(0, s.enemyMaxHealth - s.enemyHealth);
    let points = 0;

    if (winner === 'draw') {
      // Empate no tempo: os dois levam o round. Evita loop infinito de
      // rounds sem vencedor; se ambos chegarem ao alvo, a fase é perdida
      // (o jogador precisa vencer com margem para avançar).
      points = SCORE_RULES.drawRound;
      this.playerWins += 1;
      this.enemyWins += 1;
    } else if (playerWon) {
      points = SCORE_RULES.roundWin
        + Math.round(s.playerHealth * SCORE_RULES.healthPoint)
        + Math.ceil(this.timeLeft * SCORE_RULES.timePoint)
        + (ko ? SCORE_RULES.koBonus : SCORE_RULES.timeoutBonus)
        + (perfect ? SCORE_RULES.perfectRound : 0);
      this.playerWins += 1;
      this.stats.roundsWon += 1;
      if (perfect) this.stats.perfects += 1;
      if (ko) this.stats.kos += 1;
    } else {
      points = SCORE_RULES.roundLoss
        + Math.round(damageDealt * SCORE_RULES.damagePoint);
      this.enemyWins += 1;
      this.stats.roundsLost += 1;
    }

    this.stats.damageDealt += damageDealt;
    this.score += points;
    this.lastRound = {
      phase: this.phase,
      phaseIndex: this.phaseIndex,
      roundNumber: this.roundNumber,
      winner,
      ko,
      perfect,
      points,
      score: this.score,
      timeLeft: this.timeLeft,
      playerHealth: s.playerHealth,
      enemyHealth: s.enemyHealth,
      playerMaxHealth: s.playerMaxHealth,
      enemyMaxHealth: s.enemyMaxHealth,
      playerWins: this.playerWins,
      enemyWins: this.enemyWins,
    };
    this.state = 'roundEnd';
    this.timer = MATCH_TIMINGS.roundEnd;
    this.emit('roundEnd', this.lastRound);
    return this.lastRound;
  }

  /** Encerra a fase: aplica bônus e emite `phaseEnd` ou `campaignEnd`. */
  endPhase() {
    const won = this.playerWins > this.enemyWins;
    const perfect = won && this.enemyWins === 0;
    let bonus = 0;
    if (won) {
      bonus = SCORE_RULES.phaseClear
        + this.phaseIndex * SCORE_RULES.phaseStep
        + (perfect ? SCORE_RULES.phasePerfect : 0);
      this.score += bonus;
      this.stats.phasesWon += 1;
    }

    this.lastPhase = {
      phase: this.phase,
      phaseIndex: this.phaseIndex,
      phaseCount: this.phaseCount,
      isLastPhase: this.isLastPhase,
      won,
      perfect,
      bonus,
      playerWins: this.playerWins,
      enemyWins: this.enemyWins,
      score: this.score,
      stats: { ...this.stats },
    };

    if (won && this.isLastPhase) {
      this.state = 'campaignEnd';
      this.emit('campaignEnd', this.lastPhase);
    } else {
      this.state = 'phaseEnd';
      this.emit('phaseEnd', this.lastPhase);
    }
    return this.lastPhase;
  }

  /**
   * Avança após o overlay de resultado:
   * - fase vencida → próxima fase;
   * - fase perdida → repete a fase (pontuação volta ao início dela).
   */
  continuePhase() {
    if (this.state !== 'phaseEnd' || !this.lastPhase) return false;
    if (this.lastPhase.won) {
      if (this.isLastPhase) return false;
      this.startPhase(this.phaseIndex + 1);
    } else {
      this.restartPhase();
    }
    return true;
  }

  /** Repete a fase atual restaurando a pontuação do início dela. */
  restartPhase() {
    if (!this.phase) return false;
    this.score = this.phaseStartScore;
    this.stats = { ...this.phaseStartStats };
    this.startPhase(this.phaseIndex);
    return true;
  }

  /** Repete a fase perdida (atalho semântico para a tela de derrota). */
  retryPhase() {
    return this.restartPhase();
  }

  /** Reinicia a campanha inteira. */
  restartCampaign() {
    this.startCampaign();
  }

  /** Abandona a campanha (o Game volta ao menu). */
  abort() {
    this.state = 'idle';
    this.phase = null;
    this.lastRound = null;
    this.lastPhase = null;
  }
}
