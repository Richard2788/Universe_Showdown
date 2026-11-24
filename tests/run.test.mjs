/**
 * Corrida: duplo-toque (RunDetector), RUN_SPEED no Fighter e corrida da CPU.
 *
 * 12 checks. Contrato das decisões do plano:
 *   - duplo-toque na direção (janela 0,28 s) arma a corrida; soltar desarma;
 *   - Shift chega como `actions.run` (OR por fora, no Game.update);
 *   - 250 px/s SÓ para frente — recuar continua a 125 px/s e bloqueando;
 *   - CPU corre quando longe (runDistance por dificuldade).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RunDetector, RUN_TAP_WINDOW } from '../src/core/RunDetector.js';
import { Fighter } from '../src/fighters/Fighter.js';
import { RUN_SPEED, WALK_SPEED } from '../src/config/game.js';
import { CPUController, DIFFICULTIES } from '../src/ai/CPUController.js';

const DT = 1 / 60;
const mk = (x) => new Fighter(x, '#fff', 1, { hurtboxHalfWidth: 35 });

describe('RunDetector — duplo-toque na direção', () => {
  it('RUN_TAP_WINDOW é 0,28 s', () => {
    assert.equal(RUN_TAP_WINDOW, 0.28);
  });

  it('toque simples não corre (nem segurando)', () => {
    const d = new RunDetector();
    assert.equal(d.update({ right: true }, DT), false);
    assert.equal(d.update({ right: true }, DT), false);
  });

  it('segundo toque dentro da janela arma a corrida até soltar', () => {
    const d = new RunDetector();
    d.update({ right: true }, DT); // 1º toque
    d.update({}, DT);              // soltou
    d.update({ right: true }, DT); // 2º toque (dentro de 0,28 s)
    assert.equal(d.update({ right: true }, DT), true); // segurando → corre
    assert.equal(d.update({}, DT), false);             // soltar desarma
  });

  it('toque após a janela não corre', () => {
    const d = new RunDetector();
    d.update({ right: true }, DT);
    d.update({}, DT);
    for (let i = 0; i < 30; i++) d.update({}, DT); // > 0,28 s
    assert.equal(d.update({ right: true }, DT), false);
  });

  it('direções não se misturam (esquerda só arma esquerda)', () => {
    const d = new RunDetector();
    d.update({ right: true }, DT);
    d.update({}, DT);
    d.update({ right: true }, DT); // arma a direita
    assert.equal(d.update({ left: true }, DT), false); // esquerda não armada
  });
});

describe('corrida no Fighter (250 px/s, só para frente)', () => {
  it('RUN_SPEED é 250 px/s (dobro do WALK_SPEED)', () => {
    assert.equal(RUN_SPEED, 250);
    assert.equal(WALK_SPEED, 125);
    assert.equal(RUN_SPEED, WALK_SPEED * 2);
  });

  it('corre 250 px em 1 s segurando frente + run (estado "run")', () => {
    const f = mk(100);
    f.face = 1; // encara o oponente à direita
    const opponent = mk(500);
    for (let i = 0; i < 60; i++) f.update(DT, { right: true, run: true }, opponent);
    assert.ok(Math.abs(f.x - 350) < 1, `esperava ~350, obteve ${f.x}`);
    assert.equal(f.running, true);
    assert.equal(f.getState(), 'run');
  });

  it('não corre para trás: recuar com run pedido continua a 125 px/s', () => {
    const f = mk(500);
    f.face = -1; // encara o oponente à esquerda
    const opponent = mk(100);
    for (let i = 0; i < 60; i++) f.update(DT, { right: true, run: true }, opponent);
    assert.ok(Math.abs(f.x - 625) < 1, `esperava ~625, obteve ${f.x}`);
    assert.equal(f.running, false);
  });

  it('recuar continua bloqueando mesmo com corrida solicitada', () => {
    const f = mk(500);
    f.face = -1;
    const opponent = mk(100);
    f.update(DT, { right: true, run: true }, opponent);
    assert.equal(f.blocking, true);
  });
});

describe('CPU corre quando longe', () => {
  it('runDistance por perfil: 200 / 130 / 130 px', () => {
    // 2026-11-23 — limites reduzidos (antes 300 / 220 / 170) a pedido: a CPU
    // precisa caminhar mais perto do oponente para que hitboxes menores
    // (ex.: golpe fraco do Knight) alcancem a hurtbox no limite de proximidade.
    assert.equal(DIFFICULTIES.facil.runDistance, 200);
    assert.equal(DIFFICULTIES.medio.runDistance, 130);
    assert.equal(DIFFICULTIES.dificil.runDistance, 130);
  });

  it('aproximando de longe (400 px) a CPU pede run', () => {
    const f = mk(100), o = mk(500);
    const cpu = new CPUController(f, o, 'facil');
    cpu.intent = 'approach'; // força a intenção (evita o sorteio do think)
    cpu.thinkTimer = 10;
    const a = cpu.update(DT);
    assert.equal(a.right, true);
    assert.equal(a.run, true); // 400 > runDistance 200
  });

  it('perto (150 px) a CPU aproxima sem correr', () => {
    const f = mk(100), o = mk(250);
    const cpu = new CPUController(f, o, 'facil');
    cpu.intent = 'approach';
    cpu.thinkTimer = 10;
    const a = cpu.update(DT);
    assert.equal(a.right, true);
    assert.equal(a.run, false); // 150 < runDistance 200
  });
});
