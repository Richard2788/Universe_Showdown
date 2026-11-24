/**
 * Pulo travado: direção e velocidade fixadas no impulso.
 *
 * Contrato (decisão 2026-11-24 — "não dá para mudar a direção nem a
 * velocidade depois de pular"):
 *   - a direção escolhida no impulso é travada: segurar o lado oposto no ar
 *     não muda o arco nem acelera;
 *   - a velocidade é a do voo: andar → metade da caminhada (62,5 px/s);
 *     corrida antes do pulo → impulso de 250 px/s mantido;
 *   - sem direção (ou com as duas) no impulso, o pulo é reto;
 *   - o impulso encerra no pouso.
 * Medidas a partir do frame APÓS o impulso: o frame do impulso ainda aplica o
 * passo de chão (a caminhada/corrida acontece antes da física do pulo).
 * O pulo atravessar o oponente continua válido quando a direção aponta
 * para ele (locomotion.test.mjs cobre a separação condicionada ao ar).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Fighter } from '../src/fighters/Fighter.js';
import { WALK_SPEED, RUN_SPEED } from '../src/config/game.js';

const DT = 1 / 60;
const AIR_JUMP_SPEED = WALK_SPEED / 2;
const mk = (x) => new Fighter(x, '#fff', 1, { hurtboxHalfWidth: 35 });

describe('pulo travado (impulso define direção e velocidade)', () => {
  it('impulso para direita: anda AIR_JUMP_SPEED por frame, mesmo com input contrário', () => {
    const f = mk(300);
    const o = mk(500);
    f.update(DT, { jump: true, right: true }, o); // impulso p/ direita
    assert.equal(f.jumpDir, 1);
    assert.ok(f.y > 0); // no ar
    const x0 = f.x;
    for (let i = 0; i < 12; i++) f.update(DT, { left: true }, o); // tenta reverter
    const dx = f.x - x0;
    assert.ok(Math.abs(dx - AIR_JUMP_SPEED * DT * 12) < 1e-9,
      `12 frames no ar: esperava ${AIR_JUMP_SPEED * DT * 12}, obteve ${dx}`);
    assert.equal(f.jumpDir, 1); // direção continua a mesma
  });

  it('sem direção no impulso: pulo reto (não desloca no ar)', () => {
    const f = mk(300);
    const o = mk(500);
    f.update(DT, { jump: true }, o);
    assert.equal(f.jumpDir, 0);
    for (let i = 0; i < 20; i++) f.update(DT, { right: true }, o);
    assert.equal(f.x, 300);
  });

  it('dois direcionais no impulso = pulo reto (sem deslocar)', () => {
    const f = mk(300);
    const o = mk(500);
    f.update(DT, { jump: true, left: true, right: true }, o);
    assert.equal(f.jumpDir, 0);
    for (let i = 0; i < 20; i++) f.update(DT, {}, o);
    assert.equal(f.x, 300);
  });

  it('andando no impulso usa a velocidade fixa do ar (metade da caminhada)', () => {
    const f = mk(300);
    const o = mk(500);
    f.update(DT, { jump: true, right: true }, o);
    assert.equal(f.jumpSpeed, AIR_JUMP_SPEED);
    assert.equal(AIR_JUMP_SPEED, 62.5);
  });

  it('corrida antes do pulo mantém o impulso de 250 px/s no ar', () => {
    const f = mk(300); // face 1: corre para a direita
    const o = mk(500);
    f.update(DT, { jump: true, right: true, run: true }, o);
    assert.equal(f.jumpSpeed, RUN_SPEED);
    const x0 = f.x;
    f.update(DT, {}, o); // ar sem input: só o impulso
    const dx = f.x - x0;
    assert.ok(Math.abs(dx - RUN_SPEED * DT) < 1e-9,
      `esperava ${RUN_SPEED * DT}, obteve ${dx}`);
  });

  it('o impulso encerra no pouso (jumpDir/jumpSpeed zeram)', () => {
    const f = mk(300);
    const o = mk(500);
    f.update(DT, { jump: true, right: true }, o);
    for (let i = 0; i < 60; i++) f.update(DT, {}, o); // espera o pouso
    assert.equal(f.y, 0);
    assert.equal(f.jumpDir, 0);
    assert.equal(f.jumpSpeed, 0);
  });
});

describe('sem controle no ar (pulo travado)', () => {
  it('no ar não agacha, não ataca e não bloqueia', () => {
    const f = mk(300);
    const o = mk(500);
    f.update(DT, { jump: true, right: true }, o);
    assert.ok(f.y > 0); // no ar
    for (let i = 0; i < 8; i++) {
      f.update(DT, { left: true, crouch: true, lightAttack: true }, o);
    }
    assert.ok(f.y > 0);
    assert.equal(f.crouch, false);   // agachar não vale no ar
    assert.equal(f.attack, null);    // atacar só no chão
    assert.equal(f.blocking, false); // bloquear só no chão
  });

  it('no chão (y = 0) continua valendo agachar e bloquear', () => {
    const f = mk(500);
    const o = mk(300); // oponente à esquerda → recuo é para a direita
    f.update(DT, { right: true, crouch: true }, o);
    assert.equal(f.crouch, true);
    assert.equal(f.blocking, true); // recuo = defesa tradicional
    assert.equal(f.x, 500);         // agachado não anda (só o empurrão)
  });

  it('no chão continua andando com o input', () => {
    const f = mk(500);
    const o = mk(300);
    f.update(DT, { right: true }, o);
    assert.ok(f.x > 500);
  });
});
