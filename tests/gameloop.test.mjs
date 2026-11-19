/**
 * Contrato do GameLoop com timestep fixo (extraído do `Game.js`).
 *
 * `requestAnimationFrame` é substituído por um stub para controlar os frames
 * manualmente. Valida: primeiro frame sem delta, passo fixo, clamp de 0,1 s e
 * continuidade após exceção.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GameLoop } from '../src/core/GameLoop.js';

// Stub global: o GameLoop agenda o próximo frame no fim de `frame()`.
globalThis.requestAnimationFrame = () => 0;

function makeLoop() {
  const updates = [];
  const renders = [];
  const errors = [];
  const loop = new GameLoop({
    step: 1 / 60,
    maxDelta: 0.1,
    update: (dt) => updates.push(dt),
    render: () => renders.push(loop.lastTime),
    onError: (error) => errors.push(error),
  });
  loop.running = true; // simula start() sem depender do stub de rAF
  return { loop, updates, renders, errors };
}

describe('GameLoop', () => {
  it('primeiro frame não simula (delta 0) e renderiza 1 vez', () => {
    const { loop, updates, renders } = makeLoop();
    loop.frame(1000);
    assert.equal(updates.length, 0);
    assert.equal(renders.length, 1);
  });

  it('delta de 1 frame (17 ms) = 1 passo fixo', () => {
    const { loop, updates } = makeLoop();
    loop.frame(1000);
    loop.frame(1000 + 17);
    assert.equal(updates.length, 1);
  });

  it('clamp de 0,1 s = no máximo 6 passos por frame', () => {
    const { loop, updates } = makeLoop();
    loop.frame(1000);
    loop.frame(6000); // 5 s de aba em segundo plano
    assert.equal(updates.length, 6);
  });

  it('exceção no update é reportada e o loop continua agendando', () => {
    const { loop, errors } = makeLoop();
    loop.frame(1000); // inicializa lastTime (delta 0)
    loop.update = () => { throw new Error('boom'); };
    loop.frame(1000 + 17); // agora há 1 passo fixo
    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, 'boom');
    loop.running = false;
  });
});
