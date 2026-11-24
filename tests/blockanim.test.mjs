/**
 * Animação de block: reação ÚNICA por bloqueio bem-sucedido.
 *
 * Contrato (decisão 2026-11-23 — "não deve existir bloqueio sem levar golpe"):
 *  - sem impacto não existe visual de block: segurar para trás (o input de
 *    block É caminhar para trás) mostra 'walk'/'idle' — vale para TODOS os
 *    personagens, pois `getState` é compartilhado no Fighter;
 *  - bloqueio bem-sucedido dispara a reação 'block' uma única vez: células
 *    2→9 da sheet (primeiro sprite com o escudo já formado → último), 8
 *    frames a 6 fps = BLOCK_ANIM_TIME, sem repetir;
 *  - a reação tem prioridade sobre andar/correr/agachar até terminar;
 *  - atacar, pular ou levar dano cortam a reação (sem retomar); agachar NÃO
 *    corta — a guarda baixa só volta quando o play termina;
 *  - um novo bloqueio no meio do play re-arma do frame 0 (`blockAnimPulse`,
 *    consumido pelo Game.js via `SpriteAnimator.rewind()`).
 *
 * Números: BLOCK_ANIM_TIME = frames / fps do estado `block` em Plasmo.js.
 * A simulação não muda: estes testes cobrem só a SELEÇÃO de estado visual.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mk, step, resolve, ATTACKS, DT } from './helpers.mjs';
import { SpriteAnimator } from '../src/rendering/SpriteAnimator.js';
import { PLASMO_DATA } from '../src/characters/Plasmo.js';

const BLOCK_ANIM_TIME = 8 / 6; // frames 2→9 (8) a 6 fps — Plasmo.js

/** Termina o golpe em curso do atacante (para poder disparar outro). */
const finishAttack = (a, d) => { while (a.attack) step(a, {}, d); };

/** Dispara `atk` e resolve o contato com o defensor segurando para trás. */
function blockNext(a, d, atk) {
  step(a, { [atk]: true }, d);
  const frames = Math.round(ATTACKS[atk].activeStart / DT);
  for (let i = 0; i < frames; i++) { step(a, {}, d); step(d, { right: true }, a); }
  d.x = a.x + 40; // reaproxima (setup de teste: o recuo já afastou)
  step(a, {}, d); // frame do contato
}

describe('block sem golpe = andar (nenhum personagem mostra guard parado)', () => {
  it('segurar para trás sem impacto mostra walk, não block', () => {
    const a = mk(300), d = mk(330);
    for (let i = 0; i < 10; i++) { step(a, {}, d); step(d, { right: true }, a); }
    assert.equal(d.blocking, true);    // recuo ativo (input de block)...
    assert.equal(d.blockAnimTimer, 0); // ...mas sem reação
    assert.equal(d.getState(), 'walk');
  });

  it('parado sem input mostra idle, não block', () => {
    const a = mk(300), d = mk(330);
    for (let i = 0; i < 5; i++) { step(a, {}, d); step(d, {}, a); }
    assert.equal(d.getState(), 'idle');
  });
});

describe('reação de block (uma vez por bloqueio)', () => {
  it('bloqueio em pé ativa a reação com o timer cheio', () => {
    const { d } = resolve('mediumAttack', { right: true });
    assert.ok(d.blockTimer > 0); // blockstun
    assert.ok(Math.abs(d.blockAnimTimer - BLOCK_ANIM_TIME) < 1e-9);
    assert.equal(d.getState(), 'block');
  });

  it('dura BLOCK_ANIM_TIME e depois volta a andar (sem repetição)', () => {
    const { a, d } = resolve('mediumAttack', { right: true });
    const total = Math.ceil(BLOCK_ANIM_TIME / DT) + 2;
    for (let i = 0; i < total; i++) step(d, { right: true }, a);
    assert.equal(d.blockAnimTimer, 0);
    assert.equal(d.getState(), 'walk'); // segurando para trás = andar
    // segue segurando o recuo: não reativa sozinho (sem repetição)
    for (let i = 0; i < 30; i++) step(d, { right: true }, a);
    assert.equal(d.blockAnimTimer, 0);
    assert.equal(d.getState(), 'walk');
  });

  it('tem prioridade sobre andar enquanto dura', () => {
    const { a, d } = resolve('mediumAttack', { right: true });
    for (let i = 0; i < 30; i++) step(d, { right: true }, a); // ~0,5 s
    assert.ok(d.blockAnimTimer > 0);
    assert.equal(d.walking, true); // anda mecanicamente...
    assert.equal(d.getState(), 'block'); // ...mas a reação vence o visual
  });

  it('um novo bloqueio reinicia a reação (jogada nova = play novo)', () => {
    const { a, d } = resolve('mediumAttack', { right: true });
    for (let i = 0; i < 20; i++) step(d, { right: true }, a); // 0,33 s
    const t1 = d.blockAnimTimer;
    assert.ok(t1 > 0 && t1 < BLOCK_ANIM_TIME);
    finishAttack(a, d);
    blockNext(a, d, 'mediumAttack'); // segundo golpe bloqueado
    assert.ok(d.blockTimer > 0);
    assert.ok(Math.abs(d.blockAnimTimer - BLOCK_ANIM_TIME) < 1e-9);
    assert.ok(d.blockAnimTimer > t1, 'reiniciou cheia');
    assert.equal(d.getState(), 'block');
  });
});

describe('interrupções: cortes da reação (sem retomar)', () => {
  it('agachar NÃO corta a reação: o play termina e só então volta a crouch', () => {
    const { a, d } = resolve('mediumAttack', { right: true });
    for (let i = 0; i < 15; i++) step(d, { right: true }, a); // passa o blockstun
    assert.ok(d.blockAnimTimer > 0);
    step(d, { right: true, crouch: true }, a);
    assert.ok(d.blockAnimTimer > 0);    // agachar não cancela...
    assert.equal(d.getState(), 'block'); // ...e a reação vence a guarda baixa
    const total = Math.ceil(BLOCK_ANIM_TIME / DT) + 2;
    for (let i = 0; i < total; i++) step(d, { right: true, crouch: true }, a);
    assert.equal(d.blockAnimTimer, 0);
    assert.equal(d.getState(), 'crouch'); // guarda baixa só depois do play
  });

  it('atacar corta a reação', () => {
    const { a, d } = resolve('mediumAttack', { right: true });
    for (let i = 0; i < 15; i++) step(d, { right: true }, a);
    assert.ok(d.blockAnimTimer > 0);
    step(d, { lightAttack: true }, a);
    assert.equal(d.blockAnimTimer, 0);
    assert.equal(d.getState(), 'lightAttack');
  });

  it('pular corta a reação', () => {
    const { a, d } = resolve('mediumAttack', { right: true });
    for (let i = 0; i < 15; i++) step(d, { right: true }, a);
    assert.ok(d.blockAnimTimer > 0);
    step(d, { jump: true }, a);
    assert.equal(d.blockAnimTimer, 0);
    assert.equal(d.getState(), 'jump');
  });

  it('golpe que fura o block corta a reação', () => {
    const { a, d } = resolve('mediumAttack', { right: true });
    for (let i = 0; i < 15; i++) step(d, { right: true }, a);
    assert.ok(d.blockAnimTimer > 0);
    finishAttack(a, d);
    blockNext(a, d, 'kick'); // chute FURA o block em pé
    assert.equal(d.health, 88);
    assert.equal(d.blockAnimTimer, 0);
    assert.equal(d.getState(), 'hit');
  });
});

describe('block agachado', () => {
  it('joga a reação inteira (todos os sprites) e só então volta a crouch', () => {
    const { a, d } = resolve('mediumAttack', { right: true, crouch: true });
    assert.ok(d.blockTimer > 0); // blockstun
    assert.ok(Math.abs(d.blockAnimTimer - BLOCK_ANIM_TIME) < 1e-9);
    assert.equal(d.getState(), 'block'); // a reação vence o crouch
    const total = Math.ceil(BLOCK_ANIM_TIME / DT) + 2;
    for (let i = 0; i < total; i++) step(d, { right: true, crouch: true }, a);
    assert.equal(d.blockAnimTimer, 0);
    assert.equal(d.getState(), 'crouch'); // guarda baixa de volta
    // segue agachado: não reativa sozinha (sem repetição)
    for (let i = 0; i < 30; i++) step(d, { right: true, crouch: true }, a);
    assert.equal(d.blockAnimTimer, 0);
    assert.equal(d.getState(), 'crouch');
  });
});

describe('re-arm: novo bloqueio DURANTE o play anterior', () => {
  it('o impacto sinaliza blockAnimPulse e o play rebobina do frame 0', () => {
    const { a, d } = resolve('mediumAttack', { right: true });
    assert.equal(d.blockAnimPulse, true); // sinal consumido pelo Game.js
    // Animador do defensor, montado como o Game.js faz:
    const anim = new SpriteAnimator({}, PLASMO_DATA);
    anim.setState('block');
    for (let i = 0; i < 45; i++) anim.update(DT); // 0,75 s → frame 4
    assert.equal(anim.frameIndex, 4);
    assert.equal(anim.finished, false);
    // Segundo golpe bloqueado no meio do play (situação comum em combo):
    finishAttack(a, d);
    blockNext(a, d, 'mediumAttack');
    assert.ok(Math.abs(d.blockAnimTimer - BLOCK_ANIM_TIME) < 1e-9); // timer cheio
    assert.equal(d.blockAnimPulse, true);
    // Wiring do Game.js (re-arm + consumo do pulso):
    if (d.blockAnimPulse && d.getState() === 'block' && anim.stateName === 'block') anim.rewind();
    d.blockAnimPulse = false;
    assert.equal(anim.frameIndex, 0); // rebobinou do primeiro sprite
    assert.equal(anim.finished, false);
    // E a sequência completa roda do início até o último sprite, sem repetir:
    const total = Math.ceil(BLOCK_ANIM_TIME / DT) + 2;
    for (let i = 0; i < total; i++) anim.update(DT);
    assert.equal(anim.frameIndex, PLASMO_DATA.states.block.frames - 1);
    assert.equal(anim.finished, true);
  });
});
