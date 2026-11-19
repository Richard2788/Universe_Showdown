/**
 * Locomotion: velocidade de caminhada e atravessamento no pulo.
 *
 * 6 checks. Contrato de regressão do WALK_SPEED (125 px/s) e da
 * separação condicionada ao chão (permite pular por cima).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Fighter } from '../src/fighters/Fighter.js';
import { WALK_SPEED } from '../src/config/game.js';
import { separateBodies, updateFaces } from '../src/game/physics.js';

const DT = 1 / 60;
const mk = (x) => new Fighter(x, '#fff', 1, { hurtboxHalfWidth: 35 });

describe('velocidade de caminhada', () => {
  it('WALK_SPEED é 125 px/s (metade do valor original 250)', () => {
    assert.equal(WALK_SPEED, 125);
  });

  it('anda 125 px em 1 s segurando right', () => {
    const f = mk(100);
    const opponent = mk(500);
    for (let i = 0; i < 60; i++) f.update(DT, { right: true }, opponent);
    assert.ok(Math.abs(f.x - 225) < 1, `esperava ~225, obteve ${f.x}`);
  });
});

describe('atravessar o oponente no pulo', () => {
  it('ambos no chão: corpos separam (não se atravessam)', () => {
    const a = mk(100);
    const b = mk(130); // 30px de distância < 70 de separação
    separateBodies(a, b);
    const distance = Math.abs(b.x - a.x);
    assert.ok(distance >= 69.9, `esperava ≥70, obteve ${distance}`);
  });

  it('um no ar: permite sobreposição (pulo atravessa)', () => {
    const a = mk(100);
    a.y = 50; // no ar
    const b = mk(130);
    const before = Math.abs(b.x - a.x);
    separateBodies(a, b);
    const after = Math.abs(b.x - a.x);
    assert.equal(before, after); // não separam
  });

  it('ambos no ar: permite sobreposição', () => {
    const a = mk(100);
    a.y = 40;
    const b = mk(130);
    b.y = 30;
    const before = Math.abs(b.x - a.x);
    separateBodies(a, b);
    const after = Math.abs(b.x - a.x);
    assert.equal(before, after);
  });

  it('face vira para encarar o oponente ao cruzar', () => {
    const player = mk(100);
    const enemy = mk(200);
    updateFaces(player, enemy);
    assert.equal(player.face, 1); // oponente à direita → face direita
    // Player cruza para a direita do oponente:
    player.x = 300;
    updateFaces(player, enemy);
    assert.equal(player.face, -1); // inverte → encara o oponente
    assert.equal(enemy.face, 1);   // oponente também vira
  });
});
