/**
 * Contrato da campanha: 5 fases escalonadas, rounds, cronômetro e pontuação.
 * O MatchManager é puro (sem DOM), então roda direto no Node.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MatchManager } from '../src/game/MatchManager.js';
import { DIFFICULTIES } from '../src/ai/CPUController.js';
import {
  PHASES, PHASE_COUNT, ROUNDS_TO_WIN, MATCH_TIMINGS, SCORE_RULES,
  formatTime, formatScore,
} from '../src/config/match.js';

const SNAP = {
  playerHealth: 100,
  enemyHealth: 0,
  playerMaxHealth: 100,
  enemyMaxHealth: 100,
};

function begin() {
  const events = [];
  const match = new MatchManager({ onEvent: (event) => events.push(event) });
  match.startCampaign();
  match.update(MATCH_TIMINGS.roundIntro + 0.01, SNAP);
  assert.equal(match.state, 'fighting');
  return { match, events };
}

function nextRound(match) {
  match.update(MATCH_TIMINGS.roundEnd + 0.01, SNAP);
  if (match.state === 'roundIntro') match.update(MATCH_TIMINGS.roundIntro + 0.01, SNAP);
}

describe('configuração da campanha', () => {
  it('tem 5 fases com personagens e dificuldade escalonada', () => {
    assert.equal(PHASE_COUNT, 5);
    assert.equal(PHASES.length, 5);
    assert.deepEqual(PHASES.map((phase) => phase.ai),
      ['facil', 'medio', 'dificil', 'elite', 'lendario']);
    assert.equal(new Set(PHASES.map((phase) => phase.name)).size, 5);
    assert.equal(new Set(PHASES.map((phase) => phase.color)).size, 5);
    for (const phase of PHASES) assert.ok(DIFFICULTIES[phase.ai], phase.ai);
    for (let i = 1; i < PHASES.length; i++) {
      assert.ok(PHASES[i].health >= PHASES[i - 1].health);
      assert.ok(PHASES[i].timeLimit <= PHASES[i - 1].timeLimit);
    }
  });

  it('formata relógio e pontuação', () => {
    assert.equal(formatTime(60), '60');
    assert.equal(formatTime(9.2), '10');
    assert.equal(formatTime(0), '00');
    assert.equal(formatScore(450), '000450');
    assert.equal(formatScore(1234567), '1234567');
  });
});

describe('MatchManager — rounds e cronômetro', () => {
  it('começa na fase 1, round 1, em introdução, e libera a luta', () => {
    const events = [];
    const match = new MatchManager({ onEvent: (event) => events.push(event) });
    match.startCampaign();
    assert.equal(match.state, 'roundIntro');
    assert.equal(match.phaseIndex, 0);
    assert.equal(match.roundNumber, 1);
    assert.equal(match.timeLeft, PHASES[0].timeLimit);
    assert.deepEqual(events.map((event) => event.type), ['phaseStart', 'roundStart']);
    match.update(MATCH_TIMINGS.roundIntro + 0.01, SNAP);
    assert.equal(match.state, 'fighting');
    assert.equal(events.at(-1).type, 'fight');
  });

  it('cronômetro decrementa no passo fixo e fecha o round no zero', () => {
    const { match } = begin();
    match.update(1.25, { playerHealth: 80, enemyHealth: 40 });
    assert.equal(match.state, 'fighting');
    assert.ok(match.timeLeft < PHASES[0].timeLimit);
    match.timeLeft = 0.01;
    match.update(0.02, { playerHealth: 30, enemyHealth: 70 });
    assert.equal(match.state, 'roundEnd');
    assert.equal(match.lastRound.winner, 'enemy');
    assert.equal(match.lastRound.ko, false);
  });

  it('vitória por nocaute pontua vida, tempo, KO e round perfeito', () => {
    const { match } = begin();
    match.timeLeft = 40;
    const round = match.notifyKO('player', SNAP);
    const expected = SCORE_RULES.roundWin
      + 100 * SCORE_RULES.healthPoint
      + 40 * SCORE_RULES.timePoint
      + SCORE_RULES.koBonus
      + SCORE_RULES.perfectRound;
    assert.equal(round.winner, 'player');
    assert.equal(round.perfect, true);
    assert.equal(round.points, expected);
    assert.equal(match.score, expected);
    assert.equal(match.playerWins, 1);
    assert.equal(match.state, 'roundEnd');
  });

  it('melhor de 3: duas vitórias fecham a fase e dão bônus', () => {
    const { match } = begin();
    match.notifyKO('player', SNAP);
    nextRound(match);
    assert.equal(match.roundNumber, 2);
    match.notifyKO('player', SNAP);
    match.update(MATCH_TIMINGS.roundEnd + 0.01, SNAP);

    assert.equal(match.state, 'phaseEnd');
    assert.equal(match.lastPhase.won, true);
    assert.equal(match.lastPhase.perfect, true);
    assert.equal(match.lastPhase.playerWins, ROUNDS_TO_WIN);
    assert.equal(match.lastPhase.bonus,
      SCORE_RULES.phaseClear + SCORE_RULES.phasePerfect);
  });

  it('derrota na fase permite repetir restaurando a pontuação do início', () => {
    const { match } = begin();
    match.notifyKO('player', SNAP); // 1 × 0
    nextRound(match);
    match.notifyKO('enemy', { ...SNAP, playerHealth: 0, enemyHealth: 100 });
    nextRound(match);
    match.notifyKO('enemy', { ...SNAP, playerHealth: 0, enemyHealth: 100 });
    match.update(MATCH_TIMINGS.roundEnd + 0.01, SNAP);

    assert.equal(match.state, 'phaseEnd');
    assert.equal(match.lastPhase.won, false);
    const scoreAtLoss = match.score;
    assert.ok(scoreAtLoss > 0);

    assert.equal(match.continuePhase(), true);
    assert.equal(match.phaseIndex, 0);
    assert.equal(match.score, 0); // pontuação da fase perdida é descartada
    assert.equal(match.state, 'roundIntro');
  });

  it('fase vencida avança para a próxima mantendo a pontuação', () => {
    const { match } = begin();
    match.notifyKO('player', SNAP);
    nextRound(match);
    match.notifyKO('player', SNAP);
    match.update(MATCH_TIMINGS.roundEnd + 0.01, SNAP);
    const score = match.score;

    assert.equal(match.continuePhase(), true);
    assert.equal(match.phaseIndex, 1);
    assert.equal(match.phase.name, PHASES[1].name);
    assert.equal(match.score, score);
    assert.equal(match.state, 'roundIntro');
  });

  it('a última fase vencida encerra a campanha', () => {
    const { match } = begin();
    match.phaseIndex = PHASES.length - 1;
    match.phase = PHASES.at(-1);
    match.playerWins = ROUNDS_TO_WIN;
    match.enemyWins = 0;
    match.state = 'roundEnd';
    match.timer = 0;
    match.update(0.01, SNAP);
    assert.equal(match.state, 'campaignEnd');
    assert.equal(match.lastPhase.won, true);
    assert.equal(match.lastPhase.isLastPhase, true);
  });

  it('empate no tempo dá o round aos dois e evita loop infinito', () => {
    const { match } = begin();
    match.timeLeft = 0.01;
    match.update(0.02, { playerHealth: 50, enemyHealth: 50 });
    assert.equal(match.lastRound.winner, 'draw');
    assert.equal(match.playerWins, 1);
    assert.equal(match.enemyWins, 1);
    assert.equal(match.lastRound.points, SCORE_RULES.drawRound);
  });
});
